import { useState } from 'react';

export default function ColumnConfig({ columns, onToggle, onRename, onFormat, onAdd, onDelete }) {
  const [newColumn, setNewColumn] = useState('');
  const safeColumns = columns || [];

  const enabledCount = safeColumns.filter((c) => c.enabled).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">
        Columns
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({enabledCount}/{safeColumns.length} enabled)
        </span>
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {safeColumns.map((col) => (
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
            <select
              value={col.format || 'general'}
              onChange={(event) => onFormat(col.field, event.target.value)}
              className="w-24 text-xs border border-gray-200 rounded px-1.5 py-1 outline-none focus:border-blue-400"
              aria-label={`Format ${col.header}`}
            >
              <option value="general">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
            <button type="button" onClick={() => onDelete(col.field)} className="text-xs text-red-500 hover:text-red-700" aria-label={`Delete ${col.header}`}>
              ×
            </button>
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2 border-t border-gray-100 pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          const field = newColumn.trim();
          if (!field || safeColumns.some((column) => column.field === field)) return;
          onAdd(field);
          setNewColumn('');
        }}
      >
        <input
          value={newColumn}
          onChange={(event) => setNewColumn(event.target.value)}
          placeholder="New column"
          className="min-w-0 flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
        />
        <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
          Add
        </button>
      </form>
    </div>
  );
}
