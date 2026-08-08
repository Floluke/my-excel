import { useRef } from 'react';
import { useExcelConfig } from './hooks/useExcelConfig';
import FileUpload from './components/FileUpload';
import ColumnConfig from './components/ColumnConfig';
import { HeaderStyleEditor, CellStyleEditor } from './components/StyleEditor';
import HeaderTextEditor from './components/HeaderTextEditor';
import ChartConfigEditor from './components/ChartConfigEditor';
import ExportPreview from './components/ExportPreview';
import ExportButton from './components/ExportButton';

export default function App() {
  const chartRef = useRef(null);

  const {
    state,
    setJsonData,
    toggleColumn,
    renameColumn,
    updateCell,
    addRow,
    deleteRow,
    setHeaderStyle,
    setCellStyle,
    setAlternateRow,
    setHeaderText,
    setChartConfig,
    reset,
  } = useExcelConfig();

  const {
    jsonData, fileName, columns,
    headerStyle, cellStyle, alternateRow, alternateRowColor,
    headerText, chartConfig,
  } = state;

  const hasData = jsonData !== null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
              C
            </span>
            CEXCEL
          </h1>
          <span className="text-sm text-gray-400">JSON → Custom .xlsx</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <FileUpload onJsonParsed={setJsonData} hasData={hasData} />

        {hasData && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">File:</span>
                <span className="text-sm font-medium text-gray-700">{fileName}.json</span>
                <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                  {jsonData.length} rows
                </span>
              </div>
              <button
                onClick={reset}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="space-y-4">
                <ColumnConfig columns={columns} onToggle={toggleColumn} onRename={renameColumn} />
                <HeaderTextEditor headerText={headerText} onChange={setHeaderText} />
                <ChartConfigEditor chartConfig={chartConfig} columns={columns} onChange={setChartConfig} />
              </div>
              <div className="space-y-4">
                <HeaderStyleEditor style={headerStyle} onChange={setHeaderStyle} />
                <CellStyleEditor
                  style={cellStyle}
                  onChange={setCellStyle}
                  alternateRow={alternateRow}
                  alternateRowColor={alternateRowColor}
                  onAlternateChange={setAlternateRow}
                />
              </div>
              <div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Export</h3>
                  <ExportButton config={state} chartRef={chartRef} />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Preview</h2>
                <ExportPreview
                  columns={columns}
                  jsonData={jsonData}
                  onUpdateCell={updateCell}
                  onAddRow={addRow}
                  onDeleteRow={deleteRow}
                headerStyle={headerStyle}
                cellStyle={cellStyle}
                alternateRow={alternateRow}
                alternateRowColor={alternateRowColor}
                headerText={headerText}
                chartConfig={chartConfig}
                chartRef={chartRef}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
