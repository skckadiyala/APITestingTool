import { useState } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';

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
}

export default function CollectionRunnerDialog({
  collectionName,
  onClose,
  onRun,
}: CollectionRunnerDialogProps) {
  const { environments } = useEnvironmentStore();
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [iterations, setIterations] = useState(1);
  const [delay, setDelay] = useState(0);
  const [stopOnError, setStopOnError] = useState(false);

  const handleRun = () => {
    const options: RunOptions = {
      environmentId: selectedEnvironmentId || undefined,
      iterations,
      delay,
      stopOnError,
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

          {/* Iterations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Iterations
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Number of times to run the collection (1-100)
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
    </div>
  );
}
