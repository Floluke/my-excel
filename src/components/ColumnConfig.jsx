export default function ColumnConfig({ columns, onToggle, onRename }) {
  if (!columns || columns.length === 0) return null;

  const enabledCount = columns.filter((c) => c.enabled).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">
        Columns
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({enabledCount}/{columns.length} enabled)
        </span>
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {columns.map((col) => (
          <div key={col.field} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={col.enabled}
              onChange={() => onToggle(col.field)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
            />
            <span className="text-sm text-gray-500 font-mono w-1/3 truncate" title={col.field}>
              {col.field}
            </span>
            <span className="text-gray-300 shrink-0">→</span>
            <input
              type="text"
              value={col.header}
              onChange={(e) => onRename(col.field, e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
              placeholder="Header name"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
