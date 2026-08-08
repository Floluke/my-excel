export default function HeaderTextEditor({ headerText, onChange }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Report title</h3>
      <div className="space-y-3">
        <label htmlFor="report-title" className="text-xs text-gray-500">Title</label>
        <input
          id="report-title"
          type="text"
          value={headerText.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Report title..."
          className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="report-title-font" className="text-xs text-gray-500 block mb-1">Font</label>
            <select
              id="report-title-font"
              value={headerText.fontName}
              onChange={(e) => onChange({ fontName: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
            >
              {['Calibri', 'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma'].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-title-size" className="text-xs text-gray-500 block mb-1">Size</label>
            <input
              type="number"
              id="report-title-size"
              min={8}
              max={72}
              value={headerText.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="report-title-color" className="text-xs text-gray-500">Color</label>
            <input
              id="report-title-color"
              type="color"
              value={headerText.fontColor}
              onChange={(e) => onChange({ fontColor: e.target.value })}
              className="w-8 h-8 p-0.5 border border-gray-300 rounded cursor-pointer"
            />
            <span className="text-xs text-gray-400 font-mono">{headerText.fontColor}</span>
          </div>
          <label className="flex items-center gap-2 self-end pb-1">
            <input
              type="checkbox"
              checked={headerText.bold}
              onChange={(e) => onChange({ bold: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Bold</span>
          </label>
        </div>
      </div>
    </div>
  );
}
