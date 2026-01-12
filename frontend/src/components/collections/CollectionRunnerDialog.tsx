import { useState, useEffect } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Upload, FileText, Eye } from 'lucide-react';
import dataFileService, { type DataFile } from '../../services/dataFileService';
import DataFileUpload from './DataFileUpload';
import DataFilePreview from './DataFilePreview';

interface CollectionRunnerDialogProps {
  collectionId: string;
  collectionName: string;
  onClose: () => void;
  onRun: (options: RunOptions) => void;
}

export interface RunOptions {
  environmentId?: string;
  iterations: number;
  delay: number;
  stopOnError: boolean;
  folderId?: string;
  dataFileId?: string;
}

export default function CollectionRunnerDialog({
  collectionName,
  onClose,
  onRun,
}: CollectionRunnerDialogProps) {
  const { environments } = useEnvironmentStore();
  const { currentWorkspace } = useWorkspaceStore();
  const currentWorkspaceId = currentWorkspace?.id;
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [iterations, setIterations] = useState(1);
  const [delay, setDelay] = useState(0);
  const [stopOnError, setStopOnError] = useState(false);
  const [dataFiles, setDataFiles] = useState<DataFile[]>([]);
  const [selectedDataFileId, setSelectedDataFileId] = useState<string>('');
  const [selectedDataFile, setSelectedDataFile] = useState<DataFile | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadDataFiles();
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (selectedDataFileId) {
      const file = dataFiles.find((f) => f.id === selectedDataFileId);
      setSelectedDataFile(file || null);
    } else {
      setSelectedDataFile(null);
    }
  }, [selectedDataFileId, dataFiles]);

  const loadDataFiles = async () => {
    if (!currentWorkspaceId) return;
    try {
      setLoading(true);
      const files = await dataFileService.getDataFiles(currentWorkspaceId);
      setDataFiles(files);
    } catch (error) {
      console.error('Failed to load data files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (dataFile: DataFile) => {
    setDataFiles([dataFile, ...dataFiles]);
    setSelectedDataFileId(dataFile.id);
  };

  const handleRun = () => {
    const options: RunOptions = {
      environmentId: selectedEnvironmentId || undefined,
      iterations: selectedDataFile ? selectedDataFile.rowCount : iterations,
      delay,
      stopOnError,
      dataFileId: selectedDataFileId || undefined,
    };
    onRun(options);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Run Collection
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Collection
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
              {collectionName}
            </div>
          </div>

          {/* Environment Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Environment
            </label>
            <select
              value={selectedEnvironmentId}
              onChange={(e) => setSelectedEnvironmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">No Environment</option>
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data File (Optional)
            </label>
            <div className="flex gap-2">
              <select
                value={selectedDataFileId}
                onChange={(e) => setSelectedDataFileId(e.target.value)}
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              >
                <option value="">No Data File</option>
                {dataFiles.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name} ({file.rowCount} rows)
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!currentWorkspaceId) {
                    alert('Please select a workspace first');
                    return;
                  }
                  setShowUploadDialog(true);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                title="Upload new data file"
              >
                <Upload className="w-4 h-4" />
              </button>
              {selectedDataFile && (
                <button
                  onClick={() => setShowPreviewDialog(true)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  title="Preview data file"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
            {selectedDataFile ? (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Using {selectedDataFile.rowCount} rows from {selectedDataFile.name}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Upload CSV or JSON file for data-driven testing
              </p>
            )}
          </div>

          {/* Iterations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Iterations
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={selectedDataFile ? selectedDataFile.rowCount : iterations}
              onChange={(e) => setIterations(parseInt(e.target.value) || 1)}
              disabled={!!selectedDataFile}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {selectedDataFile
                ? 'Iterations set by data file row count'
                : 'Number of times to run the collection (1-100)'}
            </p>
          </div>

          {/* Delay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delay (ms)
            </label>
            <input
              type="number"
              min="0"
              max="10000"
              step="100"
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Delay between requests in milliseconds
            </p>
          </div>

          {/* Stop on Error */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="stopOnError"
              checked={stopOnError}
              onChange={(e) => setStopOnError(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label
              htmlFor="stopOnError"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Stop run on error
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Run Collection
          </button>
        </div>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        currentWorkspaceId ? (
          <DataFileUpload
            isOpen={showUploadDialog}
            onClose={() => setShowUploadDialog(false)}
            workspaceId={currentWorkspaceId}
            onUploadSuccess={handleUploadSuccess}
          />
        ) : (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Workspace Required
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Please select a workspace before uploading data files.
              </p>
              <button
                onClick={() => setShowUploadDialog(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full"
              >
                Close
              </button>
            </div>
          </div>
        )
      )}

      {/* Preview Dialog */}
      {showPreviewDialog && (
        <DataFilePreview
          isOpen={showPreviewDialog}
          onClose={() => setShowPreviewDialog(false)}
          dataFile={selectedDataFile}
        />
      )}
    </div>
  );
}
