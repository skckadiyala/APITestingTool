import { useState } from 'react';
import toast from 'react-hot-toast';
import collectionService from '../../services/collectionService';

interface ExportDialogProps {
  collectionId: string;
  collectionName: string;
  onClose: () => void;
}

export default function ExportDialog({ collectionId, collectionName, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<'postman' | 'curl' | 'openapi' | 'zip'>('postman');
  const [includeEnvironmentVariables, setIncludeEnvironmentVariables] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const blob = await collectionService.exportCollection(
        collectionId,
        format,
        includeEnvironmentVariables
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      let filename = collectionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      switch (format) {
        case 'postman':
          filename += '.postman_collection.json';
          break;
        case 'curl':
          filename += '.curl.sh';
          break;
        case 'openapi':
          filename += '.openapi.json';
          break;
        case 'zip':
          filename += '.zip';
          break;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Collection exported as ${format.toUpperCase()}`, {
        icon: '📥',
        duration: 3000,
      });

      onClose();
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export collection');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export Collection
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Collection: <span className="font-medium text-gray-900 dark:text-gray-100">{collectionName}</span>
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('postman')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                format === 'postman'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.527.099C6.955-.744.942 3.9.099 10.473c-.843 6.572 3.8 12.584 10.373 13.428 6.573.843 12.587-3.801 13.428-10.374C24.744 6.955 20.101.943 13.527.099zm2.471 7.485a.855.855 0 0 0-.593.25l-4.453 4.453-.307-.307-.643-.643c4.389-4.376 5.18-4.418 5.996-3.753zm-4.863 4.861l4.44-4.44a.62.62 0 1 1 .847.903l-4.699 4.125-.588-.588zm.33.694l-1.1.238a.06.06 0 0 1-.067-.032.06.06 0 0 1 .01-.073l.645-.645.512.512zm-2.803-.459l1.172-1.172.879.878-1.979.426a.074.074 0 0 1-.085-.039.072.072 0 0 1 .013-.093zm-3.646 6.058a.076.076 0 0 1-.069-.083.077.077 0 0 1 .022-.046h.002l.946-.946 1.222 1.222-2.123-.147zm2.425-1.256a.228.228 0 0 0-.117.256l.203.865a.125.125 0 0 1-.211.117h-.003l-.934-.934-.294-.295 3.762-3.758 1.82 1.82-4.226.929z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Postman</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">v2.1 format</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setFormat('curl')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                format === 'curl'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">cURL</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Shell commands</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setFormat('openapi')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                format === 'openapi'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">OpenAPI</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">v3.0 spec</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setFormat('zip')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                format === 'zip'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">ZIP Archive</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">All formats</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Options */}
        {(format === 'postman' || format === 'zip') && (
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeEnvironmentVariables}
                onChange={(e) => setIncludeEnvironmentVariables(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include environment variables
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
