import { useEffect, useRef } from 'react';
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
    setColumnFormat,
    addColumn,
    deleteColumn,
    updateCell,
    addRow,
    deleteRow,
    setHeaderStyle,
    setCellStyle,
    setAlternateRow,
    setHeaderText,
    setChartConfig,
    setFreezeHeader,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useExcelConfig();

  const {
    jsonData, fileName, columns,
    headerStyle, cellStyle, alternateRow, alternateRowColor,
    headerText, chartConfig,
    freezeHeader,
  } = state;

  const hasData = jsonData !== null;

  useEffect(() => {
    const handleShortcut = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        undo();
      } else if (key === 'y' || (event.shiftKey && key === 'z')) {
        event.preventDefault();
        redo();
      } else if (key === 'f') {
        event.preventDefault();
        document.querySelector('[data-grid-search]')?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [undo, redo]);

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
          <span className="text-sm text-gray-400">Turn data into a ready-to-share .xlsx report</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <FileUpload onJsonParsed={setJsonData} hasData={hasData} />

        {hasData && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">File:</span>
                <span className="text-sm font-medium text-gray-700">{fileName}</span>
                <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                  {jsonData.length} rows - {columns.length} columns
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={undo} disabled={!canUndo} className="text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300">
                  Undo
                </button>
                <button type="button" onClick={redo} disabled={!canRedo} className="text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300">
                  Redo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset this report? Your current data and formatting will be removed.')) reset();
                  }}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-blue-900">
                <span className="text-sm font-semibold">Build your report</span>
                <span className="text-blue-700">1. Review columns</span>
                <span className="text-blue-700">2. Check preview</span>
                <span className="text-blue-700">3. Export</span>
              </div>
              <p className="mt-1 text-xs text-blue-700">Formatting and charts are optional. Start with the data you want to include.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <ColumnConfig
                  columns={columns}
                  onToggle={toggleColumn}
                  onRename={renameColumn}
                  onFormat={setColumnFormat}
                  onAdd={addColumn}
                  onDelete={deleteColumn}
                />
                <details className="group rounded-xl border border-gray-200 bg-white">
                  <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-gray-800 marker:hidden">
                    <span className="flex items-center justify-between">Report title <span className="text-xs font-normal text-gray-400 group-open:hidden">Optional</span></span>
                  </summary>
                  <div className="border-t border-gray-100 p-4">
                    <HeaderTextEditor headerText={headerText} onChange={setHeaderText} />
                  </div>
                </details>
                <details className="group rounded-xl border border-gray-200 bg-white">
                  <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-gray-800 marker:hidden">
                    <span className="flex items-center justify-between">Chart <span className="text-xs font-normal text-gray-400 group-open:hidden">Optional</span></span>
                  </summary>
                  <div className="border-t border-gray-100 p-4">
                    <ChartConfigEditor chartConfig={chartConfig} columns={columns} onChange={setChartConfig} />
                  </div>
                </details>
              </div>
              <div>
                <div className="sticky top-4 space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">Export report</h3>
                    <p className="text-sm text-gray-500 mb-4">Review the table below, then download the finished workbook.</p>
                    <ExportButton config={state} chartRef={chartRef} />
                  </div>
                  <details className="group rounded-xl border border-gray-200 bg-white">
                    <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-gray-800 marker:hidden">
                      <span className="flex items-center justify-between">Formatting <span className="text-xs font-normal text-gray-400 group-open:hidden">Optional</span></span>
                    </summary>
                    <div className="space-y-4 border-t border-gray-100 p-4">
                      <HeaderStyleEditor style={headerStyle} onChange={setHeaderStyle} />
                      <CellStyleEditor
                        style={cellStyle}
                        onChange={setCellStyle}
                        alternateRow={alternateRow}
                        alternateRowColor={alternateRowColor}
                        onAlternateChange={setAlternateRow}
                      />
                    </div>
                  </details>
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
                  freezeHeader={freezeHeader}
                  onFreezeHeader={setFreezeHeader}
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
