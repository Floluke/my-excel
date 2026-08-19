import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ExcelJS from 'exceljs';
import { extractEmbeddedImages } from '../services/xlsxImages';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && text[index + 1] === '"' && quoted) {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map((header, index) => header.trim() || `Column${index + 1}`);
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
}

async function parseXlsx(file) {
  const buffer = await file.arrayBuffer();
  const embeddedImages = extractEmbeddedImages(buffer);
  let workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (loadError) {
    if (!loadError.message.includes("reading 'anchors'")) throw loadError;

    // Some Excel drawing files contain anchors that ExcelJS cannot reconcile.
    // Ignore only the broken drawing relationship so the worksheet data survives.
    workbook = new ExcelJS.Workbook();
    const xlsx = workbook.xlsx;
    const reconcile = xlsx.reconcile;
    xlsx.reconcile = function reconcileWithoutBrokenDrawings(model, options) {
      model.drawings = {};
      model.drawingRels = {};
      model.worksheets.forEach((sheet) => {
        sheet.drawing = undefined;
      });
      return reconcile.call(this, model, options);
    };
    await xlsx.load(buffer);
  }
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const getCellValue = (value, emptyValue = '-') => {
    if (value && typeof value === 'object') {
      if ('result' in value) return value.result ?? emptyValue;
      if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
      if ('text' in value) return value.text ?? emptyValue;
      return emptyValue;
    }
    return value === null || value === undefined || value === '' ? emptyValue : value;
  };

  const rowValues = (rowNumber, emptyValue = '-') => Array.from(
    { length: worksheet.columnCount },
    (_, index) => getCellValue(worksheet.getRow(rowNumber).getCell(index + 1).value, emptyValue)
  );
  let headerRowNumber = 1;
  const firstRow = rowValues(1, '').filter((value) => value !== '');
  if (new Set(firstRow.map(String)).size <= 1) {
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const values = rowValues(rowNumber, '').filter((value) => value !== '');
      if (new Set(values.map(String)).size > 1) {
        headerRowNumber = rowNumber;
        break;
      }
    }
  }

  const headers = rowValues(headerRowNumber, '').map((value, index) => String(value || `Column${index + 1}`));
  const data = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const values = rowValues(rowNumber);
    const item = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    embeddedImages
      .filter((image) => image.row === rowNumber - 1)
      .forEach((image) => { item[headers[image.col]] = image.src; });
    if (Object.values(item).some((value) => value !== '-')) data.push(item);
  });
  return data;
}

export default function FileUpload({ onJsonParsed, hasData }) {
  const [error, setError] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setError('');

      try {
          let data;
          const extension = file.name.toLowerCase();
          if (extension.endsWith('.xlsx')) {
             data = await parseXlsx(file);
          } else {
            const text = await file.text();
            data = extension.endsWith('.csv') ? parseCsv(text) : JSON.parse(text);
          }
          if (!Array.isArray(data) || data.length === 0) {
            setError('The file must contain at least one data row.');
            return;
          }
          if (data.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
            setError('Every item in the JSON array must be an object.');
            return;
          }
          if (data.some((item) => Object.values(item).some((value) => value !== null && typeof value === 'object' && !(value instanceof Date)))) {
            setError('Nested objects and arrays are not supported yet. Flatten the data and try again.');
            return;
          }
          const name = file.name.replace(/\.(json|csv|xlsx)$/i, '');
          onJsonParsed(data, name);
      } catch (parseError) {
        setError(`Could not read file: ${parseError.message}`);
      }
    },
    [onJsonParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  if (hasData) return null;

  return (
    <div className="mb-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop file here' : 'Drop JSON, CSV, or XLSX file here'}
          </p>
           <p className="text-sm text-gray-500">or click to browse - JSON arrays, CSV, and XLSX are supported</p>
           <p className="max-w-md text-xs text-gray-400">JSON files must contain a flat array of objects. Nested objects and arrays need to be flattened first.</p>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
