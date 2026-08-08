export default function ChartConfigEditor({ chartConfig, columns, onChange }) {
  const enabledFields = columns.filter((c) => c.enabled);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Chart</h3>
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={chartConfig.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enable chart</span>
        </label>

        {chartConfig.enabled && (
          <>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Chart Type</label>
              <select
                value={chartConfig.type}
                onChange={(e) => onChange({ type: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
              >
                <option value="column">Column</option>
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="pie">Pie</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Chart Title</label>
              <input
                type="text"
                value={chartConfig.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Chart title..."
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">X-Axis (Category)</label>
              <select
                value={chartConfig.xField}
                onChange={(e) => onChange({ xField: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
              >
                <option value="">-- Select --</option>
                {enabledFields.map((col) => (
                  <option key={col.field} value={col.field}>
                    {col.header}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Y-Axis (Value)</label>
              <select
                value={chartConfig.yField}
                onChange={(e) => onChange({ yField: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
              >
                <option value="">-- Select --</option>
                {enabledFields.map((col) => (
                  <option key={col.field} value={col.field}>
                    {col.header}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
