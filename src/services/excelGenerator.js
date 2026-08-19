import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function toArgb(hex) {
  if (!hex || hex === 'transparent') return 'FF000000';
  const c = hex.replace('#', '');
  return `FF${c}`;
}

function buildBorderStyle(style, color) {
  if (!style || style === 'none') return {};
  return {
    style: style,
    color: { argb: toArgb(color) },
  };
}

function imageExtension(value, contentType = '') {
  const type = contentType || value.match(/^data:image\/(png|jpeg|jpg|gif|webp);/i)?.[1];
  if (type) return type.toLowerCase() === 'jpg' ? 'jpeg' : type.toLowerCase();
  return value.match(/\.(png|jpe?g|gif|webp)(?:\?|$)/i)?.[1].toLowerCase().replace('jpg', 'jpeg') || 'png';
}

function base64FromArrayBuffer(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function loadImage(value) {
  if (typeof value !== 'string' || !value) return null;

  if (value.startsWith('data:image/')) {
    const match = value.match(/^data:image\/[^;]+;base64,(.+)$/i);
    return match ? { base64: match[1], extension: imageExtension(value) } : null;
  }

  if (!/^https?:\/\//i.test(value)) return null;
  try {
    const response = await fetch(value);
    if (!response.ok) return null;
    return {
      base64: base64FromArrayBuffer(await response.arrayBuffer()),
      extension: imageExtension(value, response.headers.get('content-type')?.split(';')[0]),
    };
  } catch {
    return null;
  }
}

function isImageColumn(column, rows) {
  return column.format === 'image' || rows.some((row) => typeof row[column.field] === 'string' && (
    row[column.field].startsWith('data:image/') || /^https?:\/\/[^\s]+\.(png|jpe?g|gif|webp)(\?[^\s]*)?$/i.test(row[column.field])
  ));
}

export async function generateExcel({
  columns,
  jsonData,
  headerStyle,
  cellStyle,
  alternateRow,
  alternateRowColor,
  fileName,
  headerText,
  chartImageBase64,
  freezeHeader,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CEXCEL';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Sheet1');

  const enabledCols = columns.filter((c) => c.enabled);
  const totalCols = enabledCols.length;

  const excelCols = enabledCols.map((col) => ({
    header: col.header,
    key: col.field,
    width: Math.max(col.header.length * 2 + 4, col.format === 'image' ? 18 : 14),
    style: col.format === 'number'
      ? { numFmt: '#,##0.00' }
      : col.format === 'date' ? { numFmt: 'yyyy-mm-dd' } : undefined,
  }));
  worksheet.columns = excelCols;
  if (freezeHeader) worksheet.views = [{ state: 'frozen', ySplit: 1 + (headerText?.text ? 1 : 0) }];

  let rowOffset = 0;

  if (headerText && headerText.text) {
    worksheet.insertRow(1, []);
    const textRow = worksheet.getRow(1);
    textRow.height = Math.max(22, Number(headerText.fontSize) + 10);

    textRow.getCell(1).value = headerText.text;
    if (totalCols > 1) {
      worksheet.mergeCells(1, 1, 1, totalCols);
    }

    textRow.getCell(1).font = {
      name: headerText.fontName || 'Calibri',
      size: Number(headerText.fontSize) || 16,
      color: { argb: toArgb(headerText.fontColor) },
      bold: headerText.bold !== false,
    };
    textRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    rowOffset = 1;
  }

  const headerRowNum = 1 + rowOffset;
  const firstDataRowNum = 2 + rowOffset;

  const headerRow = worksheet.getRow(headerRowNum);
  headerRow.height = 22;

  const hasBorder = headerStyle.borderStyle && headerStyle.borderStyle !== 'none';

  headerRow.eachCell((cell) => {
    cell.font = {
      name: headerStyle.fontName || 'Calibri',
      size: Number(headerStyle.fontSize) || 11,
      color: { argb: toArgb(headerStyle.fontColor) },
      bold: headerStyle.bold !== false,
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: toArgb(headerStyle.fillColor) },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    if (hasBorder) {
      cell.border = {
        top: buildBorderStyle(headerStyle.borderStyle, headerStyle.borderColor),
        bottom: buildBorderStyle(headerStyle.borderStyle, headerStyle.borderColor),
        left: buildBorderStyle(headerStyle.borderStyle, headerStyle.borderColor),
        right: buildBorderStyle(headerStyle.borderStyle, headerStyle.borderColor),
      };
    }
  });

  const cellHasBorder = cellStyle.borderStyle && cellStyle.borderStyle !== 'none';

  const rows = jsonData.map((item) => {
    const row = {};
    enabledCols.forEach((col) => {
      const value = item[col.field];
      if (value === undefined || value === null || value === '') {
        row[col.field] = '';
      } else if (col.format === 'number' && Number.isFinite(Number(value))) {
        row[col.field] = Number(value);
      } else if (col.format === 'date' && !Number.isNaN(Date.parse(value))) {
        row[col.field] = new Date(value);
      } else {
        row[col.field] = value;
      }
    });
    return row;
  });
  worksheet.addRows(rows);

  rows.forEach((_, index) => {
    const rowNum = firstDataRowNum + index;
    const excelRow = worksheet.getRow(rowNum);
    if (enabledCols.some((col) => col.format === 'image')) excelRow.height = 60;

    const isAlternate = alternateRow && index % 2 === 1;
    const bgColor = isAlternate ? alternateRowColor : cellStyle.fillColor;

    excelRow.eachCell((cell) => {
      cell.font = {
        name: cellStyle.fontName || 'Calibri',
        size: Number(cellStyle.fontSize) || 11,
        color: { argb: toArgb(cellStyle.fontColor) },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: toArgb(bgColor) },
      };
      cell.alignment = { vertical: 'middle' };

      if (cellHasBorder) {
        cell.border = {
          top: buildBorderStyle(cellStyle.borderStyle, cellStyle.borderColor),
          bottom: buildBorderStyle(cellStyle.borderStyle, cellStyle.borderColor),
          left: buildBorderStyle(cellStyle.borderStyle, cellStyle.borderColor),
          right: buildBorderStyle(cellStyle.borderStyle, cellStyle.borderColor),
        };
      }
    });
  });

  const imageJobs = [];
  enabledCols.forEach((column, columnIndex) => {
    if (!isImageColumn(column, rows)) return;
    rows.forEach((row, rowIndex) => {
      imageJobs.push(loadImage(row[column.field]).then((image) => {
        if (!image) return;
        const imageId = workbook.addImage(image);
        worksheet.addImage(imageId, {
          tl: { col: columnIndex + 0.15, row: firstDataRowNum - 1 + rowIndex + 0.1 },
          ext: { width: 52, height: 52 },
        });
        worksheet.getCell(firstDataRowNum + rowIndex, columnIndex + 1).value = '';
      }));
    });
  });
  await Promise.all(imageJobs);

  if (chartImageBase64) {
    try {
      const imageId = workbook.addImage({
        base64: chartImageBase64,
        extension: 'png',
      });

      const lastDataRow = firstDataRowNum + rows.length - 1;
      const imageRow = lastDataRow + 2;

      worksheet.addImage(imageId, {
        tl: { col: 0, row: imageRow },
        ext: { width: 600, height: 350 },
      });
    } catch (e) {
      console.warn('Chart embed failed:', e);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName || 'export'}.xlsx`);
}
