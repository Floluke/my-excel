import { useMemo, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const BORDER_MAP = {
  none: 'none',
  thin: '1px solid',
  medium: '2px solid',
  thick: '3px solid',
  dotted: '1px dotted',
  dashed: '1px dashed',
  double: '3px double',
};

function previewBorder(borderStyle, borderColor) {
  const css = BORDER_MAP[borderStyle];
  if (!css || borderStyle === 'none') return 'none';
  return `${css} ${borderColor}`;
}

function buildChartData(jsonData, xField, yField) {
  if (!xField || !yField) return null;
  const labels = jsonData.map((item) => String(item[xField] ?? ''));
  const values = jsonData.map((item) => Number(item[yField]) || 0);
  return { labels, values };
}

function ChartPreview({ chartConfig, jsonData, chartRef }) {
  if (!chartConfig.enabled || !chartConfig.xField || !chartConfig.yField) return null;

  const data = buildChartData(jsonData, chartConfig.xField, chartConfig.yField);
  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: chartConfig.yField,
        data: data.values,
        backgroundColor: chartConfig.type === 'pie'
          ? ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47', '#264478', '#9B59B6']
          : '#4472C4',
        borderColor: '#4472C4',
        borderWidth: 1,
      },
    ],
  };

  const commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: chartConfig.type === 'pie' },
      title: {
        display: !!chartConfig.title,
        text: chartConfig.title,
      },
    },
  };

  let isHorizontal = false;
  let ChartComponent;
  switch (chartConfig.type) {
    case 'bar':
      ChartComponent = Bar;
      isHorizontal = true;
      break;
    case 'line':
      ChartComponent = Line;
      break;
    case 'pie':
      ChartComponent = Pie;
      break;
    default:
      ChartComponent = Bar;
  }

  const options = {
    ...commonOpts,
    indexAxis: isHorizontal ? 'y' : undefined,
  };

  return (
    <div className="mt-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div style={{ height: '300px' }}>
          <ChartComponent ref={chartRef} data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}

export default function ExportPreview({ columns, jsonData, onUpdateCell, onAddRow, onDeleteRow, onRenameColumn, onAddColumn, onDeleteColumn, freezeHeader, onFreezeHeader, headerStyle, cellStyle, alternateRow, alternateRowColor, headerText, chartConfig, chartRef }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState({ field: '', direction: 'asc' });
  const visibleRows = useMemo(() => {
    if (!jsonData) return [];
    const query = searchTerm.trim().toLowerCase();
    const rows = jsonData
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !query || Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(query)));
    if (!sort.field) return rows.slice(0, 50);
    return rows.sort(({ item: left }, { item: right }) => {
      const a = left[sort.field] ?? '';
      const b = right[sort.field] ?? '';
      const result = typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    }).slice(0, 50);
  }, [jsonData, searchTerm, sort]);

  if (!jsonData || !columns) return null;

  const enabledCols = columns.filter((c) => c.enabled);
  if (enabledCols.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No columns selected — enable columns in the panel
      </div>
    );
  }

  return (
    <div>
      {headerText.text && (
        <div
          className="px-4 py-3 mb-2 rounded-xl border border-gray-200 bg-white"
          style={{
            fontFamily: headerText.fontName,
            fontSize: `${headerText.fontSize}px`,
            color: headerText.fontColor,
            fontWeight: headerText.bold ? 700 : 400,
          }}
        >
          {headerText.text}
        </div>
      )}
      <div className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 items-center gap-2 text-sm text-gray-500">
          <span className="sr-only">Search rows</span>
          <input
            type="search"
            data-grid-search
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search rows..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          <input type="checkbox" checked={freezeHeader} onChange={(event) => onFreezeHeader(event.target.checked)} />
          Freeze header
        </label>
        <span className="text-xs text-gray-400">{visibleRows.length} shown / {jsonData.length} total</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className={freezeHeader ? 'sticky top-0 z-10' : ''}>
            <tr>
              {enabledCols.map((col) => (
                <th
                  key={col.field}
                  style={{
                    fontFamily: headerStyle.fontName,
                    fontSize: `${headerStyle.fontSize}px`,
                    color: headerStyle.fontColor,
                    backgroundColor: headerStyle.fillColor,
                    fontWeight: headerStyle.bold ? 700 : 400,
                    border: previewBorder(headerStyle.borderStyle, headerStyle.borderColor),
                  }}
                  className="px-4 py-2.5 text-left whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <input
                      value={col.header}
                      onChange={(event) => onRenameColumn(col.field, event.target.value)}
                      className="min-w-20 flex-1 bg-transparent font-semibold outline-none focus:ring-1 focus:ring-white"
                      aria-label={`Rename ${col.header}`}
                    />
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setSort((current) => ({
                        field: col.field,
                        direction: current.field === col.field && current.direction === 'asc' ? 'desc' : 'asc',
                      }))}
                      aria-label={`Sort ${col.header}`}
                    >
                      {sort.field === col.field ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                    <button type="button" onClick={() => onDeleteColumn(col.field)} className="text-xs opacity-70 hover:opacity-100" aria-label={`Delete ${col.header}`}>
                      ×
                    </button>
                  </div>
                </th>
              ))}
              <th className="bg-gray-50 px-2 py-2 text-left text-xs font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ item, index: rowIdx }) => {
              const isAlt = alternateRow && rowIdx % 2 === 1;
              const bgColor = isAlt ? alternateRowColor : cellStyle.fillColor;

              return (
                <tr key={rowIdx}>
                  {enabledCols.map((col) => (
                    <td
                      key={col.field}
                      style={{
                        fontFamily: cellStyle.fontName,
                        fontSize: `${cellStyle.fontSize}px`,
                        color: cellStyle.fontColor,
                        backgroundColor: bgColor,
                        border: previewBorder(cellStyle.borderStyle, cellStyle.borderColor),
                      }}
                      className="px-4 py-2 whitespace-nowrap"
                    >
                      <input
                        aria-label={`${col.header}, row ${rowIdx + 1}`}
                        value={item[col.field] instanceof Date ? item[col.field].toISOString().slice(0, 10) : item[col.field] ?? ''}
                        onChange={(event) => onUpdateCell(rowIdx, col.field, event.target.value)}
                        className="w-full min-w-24 bg-transparent outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 bg-white">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(rowIdx)}
                      className="text-xs text-red-600 hover:text-red-800"
                      aria-label={`Delete row ${rowIdx + 1}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {jsonData.length > 50 && (
          <div className="text-center py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-200">
            Showing 50 of {jsonData.length} rows
          </div>
        )}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-500">{jsonData.length} rows</span>
          <button type="button" onClick={onAddRow} className="text-sm font-medium text-blue-600 hover:text-blue-800">
            + Add row
          </button>
        </div>
        <button type="button" onClick={() => onAddColumn()} className="w-full border-t border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50">
          + Add column
        </button>
      </div>
      <ChartPreview chartConfig={chartConfig} jsonData={jsonData} chartRef={chartRef} />
    </div>
  );
}
