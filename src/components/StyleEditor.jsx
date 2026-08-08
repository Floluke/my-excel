const BORDER_OPTIONS = ['none', 'thin', 'medium', 'thick', 'dotted', 'dashed', 'double'];

function ColorInput({ label, value, onChange, prefix }) {
  const inputId = `${prefix}-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={inputId} className="text-xs text-gray-500 w-20">{label}</label>
      <input
        id={inputId}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 p-0.5 border border-gray-300 rounded cursor-pointer"
      />
      <span className="text-xs text-gray-400 font-mono">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FontSection({ style, onChange, prefix }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Font</label>
        <select
          value={style.fontName}
          onChange={(e) => onChange({ fontName: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
        >
          {['Calibri', 'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma'].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Size</label>
        <input
          type="number"
          min={8}
          max={72}
          value={style.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
        />
      </div>
      <ColorInput prefix={prefix} label="Font Color" value={style.fontColor} onChange={(v) => onChange({ fontColor: v })} />
      <ColorInput prefix={prefix} label="Fill Color" value={style.fillColor} onChange={(v) => onChange({ fillColor: v })} />
    </div>
  );
}

function BorderSection({ style, onChange, prefix }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Border Style</label>
        <select
          value={style.borderStyle}
          onChange={(e) => onChange({ borderStyle: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400"
        >
          {BORDER_OPTIONS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>
      <ColorInput prefix={prefix} label="Border Color" value={style.borderColor} onChange={(v) => onChange({ borderColor: v })} />
    </div>
  );
}

export function HeaderStyleEditor({ style, onChange }) {
  return (
    <Section title="Header Style">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={style.bold}
          onChange={(e) => onChange({ bold: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Bold</span>
      </label>
      <FontSection prefix="header" style={style} onChange={onChange} />
      <BorderSection prefix="header" style={style} onChange={onChange} />
    </Section>
  );
}

export function CellStyleEditor({ style, onChange, alternateRow, alternateRowColor, onAlternateChange }) {
  return (
    <Section title="Cell Style">
      <FontSection prefix="cell" style={style} onChange={onChange} />
      <BorderSection prefix="cell" style={style} onChange={onChange} />
      <div className="border-t border-gray-100 pt-3 mt-2">
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={alternateRow}
            onChange={(e) => onAlternateChange(e.target.checked, alternateRowColor)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Alternate row color</span>
        </label>
        {alternateRow && (
          <ColorInput
            prefix="cell-alternate"
            label="Alt Color"
            value={alternateRowColor}
            onChange={(v) => onAlternateChange(true, v)}
          />
        )}
      </div>
    </Section>
  );
}
