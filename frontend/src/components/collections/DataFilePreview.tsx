import React from 'react';
import { X, Table, FileText } from 'lucide-react';
import { type DataFile } from '../../services/dataFileService';

interface DataFilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  dataFile: DataFile | null;
  onSelect?: (dataFile: DataFile) => void;
}

const DataFilePreview: React.FC<DataFilePreviewProps> = ({
  isOpen,
  onClose,
  dataFile,
  onSelect,
}) => {
  if (!isOpen || !dataFile) return null;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(dataFile);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {dataFile.fileType === 'CSV' ? (
              <Table className="w-5 h-5 text-green-500" />
            ) : (
              <FileText className="w-5 h-5 text-blue-500" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {dataFile.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {dataFile.rowCount} rows • {dataFile.columns.length} columns •{' '}
                {(dataFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Columns */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variables ({dataFile.columns.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {dataFile.columns.map((column) => (
                <span
                  key={column}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-mono"
                >
                  {'{{'}{column}{'}}'}
                </span>
              ))}
            </div>
          </div>

          {/* Data Preview */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview (first 10 rows)
            </h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    {dataFile.columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dataFile.preview.map((row, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </td>
                      {dataFile.columns.map((column) => (
                        <td
                          key={column}
                          className="px-4 py-2 text-sm text-gray-900 dark:text-white font-mono"
                        >
                          {row[column] !== undefined && row[column] !== null
                            ? String(row[column])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dataFile.rowCount > 10 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Showing 10 of {dataFile.rowCount} rows
              </p>
            )}
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to use:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>
                Each row will be used as one iteration in the collection run
              </li>
              <li>
                Variables can be referenced in requests using{' '}
                <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded font-mono">
                  {'{{'}{dataFile.columns[0] || 'columnName'}{'}}'}
                </code>
              </li>
              <li>Variables will override environment variables with the same name</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Close
          </button>
          {onSelect && (
            <button
              onClick={handleSelect}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Use This File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataFilePreview;
