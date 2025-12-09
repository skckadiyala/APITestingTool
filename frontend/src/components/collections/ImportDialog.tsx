import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import collectionService, { type ImportResult } from '../../services/collectionService';

interface ImportDialogProps {
  workspaceId: string;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
}

export default function ImportDialog({ workspaceId, onClose, onImportComplete }: ImportDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'auto' | 'postman' | 'openapi' | 'insomnia' | 'curl'>('auto');
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);

    // Try to detect format from file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Auto-detect format
        if (data.info && data.info.schema && data.info.schema.includes('postman')) {
          setFormat('postman');
          setImportPreview({
            name: data.info.name,
            itemCount: data.item?.length || 0,
            type: 'Postman Collection v2.1'
          });
        } else if (data.openapi || data.swagger) {
          setFormat('openapi');
          setImportPreview({
            name: data.info?.title || 'API',
            itemCount: Object.keys(data.paths || {}).length,
            type: 'OpenAPI 3.0'
          });
        } else if (data.resources && data._type === 'export') {
          setFormat('insomnia');
          const requests = data.resources.filter((r: any) => r._type === 'request');
          setImportPreview({
            name: data.resources.find((r: any) => r._type === 'workspace')?.name || 'Workspace',
            itemCount: requests.length,
            type: 'Insomnia Collection'
          });
        }
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    } else if (ext === 'sh' || file.name.includes('curl')) {
      setFormat('curl');
      const text = await file.text();
      const curlCount = (text.match(/curl /g) || []).length;
      setImportPreview({
        name: 'cURL Commands',
        itemCount: curlCount,
        type: 'cURL Commands'
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setIsImporting(true);
      
      const result = await collectionService.importCollection(
        selectedFile,
        workspaceId,
        format === 'auto' ? undefined : format
      );

      toast.success(
        `Imported ${result.requestsCount} request${result.requestsCount !== 1 ? 's' : ''} ` +
        `and ${result.foldersCount} folder${result.foldersCount !== 1 ? 's' : ''}`,
        {
          icon: '📤',
          duration: 4000,
        }
      );

      onImportComplete(result);
      onClose();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.response?.data?.details || 'Failed to import collection');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Import Collection
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

        {/* File Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.sh"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-3">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setImportPreview(null);
                  setFormat('auto');
                }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Drag and drop your file here, or
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  browse to select a file
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports: Postman, OpenAPI, Insomnia, cURL
              </p>
            </div>
          )}
        </div>

        {/* Import Preview */}
        {importPreview && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Preview
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Format:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{importPreview.type}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Name:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{importPreview.name}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Items:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{importPreview.itemCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Format Selector */}
        {selectedFile && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="auto">Auto-detect</option>
              <option value="postman">Postman Collection v2.1</option>
              <option value="openapi">OpenAPI 3.0</option>
              <option value="insomnia">Insomnia Collection</option>
              <option value="curl">cURL Commands</option>
            </select>
          </div>
        )}

        {/* Supported Formats Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Supported Formats:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Postman Collection v2.1 (.json)</li>
                <li>OpenAPI 3.0 Specification (.json)</li>
                <li>Insomnia Collection (.json)</li>
                <li>cURL Commands (.sh or .txt)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
