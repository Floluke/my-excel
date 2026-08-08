import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUpload({ onJsonParsed, hasData }) {
  const [error, setError] = useState('');

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setError('');

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const data = JSON.parse(text);
          if (!Array.isArray(data) || data.length === 0) {
            setError('JSON must be a non-empty array of objects.');
            return;
          }
          if (data.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
            setError('Every item in the JSON array must be an object.');
            return;
          }
          if (data.some((item) => Object.values(item).some((value) => value !== null && typeof value === 'object'))) {
            setError('Nested objects and arrays are not supported yet. Flatten the data and try again.');
            return;
          }
          const name = file.name.replace(/\.json$/i, '');
          onJsonParsed(data, name);
        } catch {
          setError('Invalid JSON file. Check the file format and try again.');
        }
      };
      reader.readAsText(file);
    },
    [onJsonParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
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
            {isDragActive ? 'Drop JSON here' : 'Drop a JSON file here'}
          </p>
          <p className="text-sm text-gray-500">or click to browse — array of objects format</p>
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
