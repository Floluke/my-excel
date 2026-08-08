import { useState } from 'react';
import { generateExcel } from '../services/excelGenerator';

function base64WithoutHeader(dataUrl) {
  const idx = dataUrl.indexOf(',');
  return idx === -1 ? dataUrl : dataUrl.slice(idx + 1);
}

export default function ExportButton({ config, chartRef }) {
  const [loading, setLoading] = useState(false);

  const { jsonData, columns, headerStyle, cellStyle, alternateRow, alternateRowColor, fileName, headerText, chartConfig, freezeHeader } = config;

  const enabledCount = columns.filter((c) => c.enabled).length;

  const handleExport = async () => {
    if (!jsonData || enabledCount === 0) return;
    setLoading(true);
    try {
      let chartImageBase64 = null;
      if (chartConfig.enabled && chartRef?.current) {
        const dataUrl = chartRef.current.toBase64Image('image/png', 1);
        chartImageBase64 = base64WithoutHeader(dataUrl);
      }

      await generateExcel({
        columns,
        jsonData,
        headerStyle,
        cellStyle,
        alternateRow,
        alternateRowColor,
        fileName,
        headerText: headerText.text ? headerText : null,
        chartImageBase64,
        freezeHeader,
      });
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-end">
      <button
        onClick={handleExport}
        disabled={loading || !jsonData || enabledCount === 0}
        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg
          hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export .xlsx
          </>
        )}
      </button>
    </div>
  );
}
