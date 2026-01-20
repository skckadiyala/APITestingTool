import { useState, useEffect, useRef } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTabStore } from '../../stores/tabStore';
import { Upload, Eye } from 'lucide-react';
import dataFileService, { type DataFile } from '../../services/dataFileService';
import collectionRunnerService from '../../services/collectionRunnerService';
import DataFileUpload from './DataFileUpload';
import DataFilePreview from './DataFilePreview';

interface CollectionRunnerTabProps {
  collectionId: string;
  collectionName: string;
}

interface RunOptions {
  environmentId?: string;
  iterations: number;
  delay: number;
  stopOnError: boolean;
  folderId?: string;
  dataFileId?: string;
}

interface RunResult {
  requestId: string;
  requestName: string;
  method: string;
  url: string;
  status: 'passed' | 'failed' | 'skipped';
  statusCode?: number;
  responseTime?: number;
  testResults?: {
    passed: number;
    failed: number;
    tests: Array<{ name: string; passed: boolean; error?: string }>;
  };
  error?: string;
  timestamp: Date;
}

interface IterationResult {
  iteration: number;
  results: RunResult[];
  passed: number;
  failed: number;
  totalTime: number;
  dataRow?: any;
}

export default function CollectionRunnerTab({ collectionId, collectionName }: CollectionRunnerTabProps) {
  const { environments, activeEnvironmentId } = useEnvironmentStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { tabs, activeTabId, updateTab } = useTabStore();
  const currentWorkspaceId = currentWorkspace?.id;
  const currentTab = tabs.find(t => t.id === activeTabId);

  // Get persisted runner state from tab or use defaults
  const runnerState = currentTab?.runnerState || {
    isRunning: false,
    hasResults: false,
    runResults: null,
    selectedIteration: 0,
    selectedRequest: null,
    statusFilter: 'all' as const,
  };

  // View state - use tab store
  const isRunning = runnerState.isRunning;
  const hasResults = runnerState.hasResults;
  const runResults = runnerState.runResults;
  const selectedIteration = runnerState.selectedIteration;
  const selectedRequest = runnerState.selectedRequest;
  const statusFilter = runnerState.statusFilter;

  // Helper to update runner state in tab store
  const updateRunnerState = (updates: Partial<typeof runnerState>) => {
    if (activeTabId) {
      const currentTab = tabs.find(t => t.id === activeTabId);
      const currentRunnerState = currentTab?.runnerState || {
        isRunning: false,
        hasResults: false,
        runResults: null,
        selectedIteration: 0,
        selectedRequest: null,
        statusFilter: 'all' as const,
      };
      updateTab(activeTabId, {
        runnerState: { ...currentRunnerState, ...updates },
      });
    }
  };
  
  // Configuration state
  const [iterations, setIterations] = useState(1);
  const [delay, setDelay] = useState(0);
  const [stopOnError, setStopOnError] = useState(false);
  const [dataFiles, setDataFiles] = useState<DataFile[]>([]);
  const [selectedDataFileId, setSelectedDataFileId] = useState<string>('');
  const [selectedDataFile, setSelectedDataFile] = useState<DataFile | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // UI state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

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

  const handleRun = async () => {
    const options: RunOptions = {
      environmentId: activeEnvironmentId || undefined,
      iterations: selectedDataFile ? selectedDataFile.rowCount : iterations,
      delay,
      stopOnError,
      dataFileId: selectedDataFileId || undefined,
    };

    updateRunnerState({ isRunning: true, hasResults: false });

    try {
      const result = await collectionRunnerService.runCollection(collectionId, options);
      updateRunnerState({ 
        runResults: result, 
        hasResults: true,
        isRunning: false 
      });
    } catch (error) {
      console.error('Failed to run collection:', error);
      alert('Failed to run collection. Please try again.');
      updateRunnerState({ isRunning: false });
    }
  };

  const handleConfigureNewRun = () => {
    updateRunnerState({
      hasResults: false,
      isRunning: false,
      runResults: null,
      selectedIteration: 0,
      selectedRequest: null,
    });
  };

  const handleExportResults = (format: 'json' | 'html') => {
    if (!runResults) return;
    
    if (format === 'json') {
      collectionRunnerService.exportResultsAsJSON(runResults);
    } else {
      collectionRunnerService.exportResultsAsHTML(runResults);
    }
    setShowExportMenu(false);
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      POST: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      PUT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    return colors[method] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  const currentIteration = runResults?.iterations[selectedIteration];
  const successRate = runResults && runResults.totalRequests > 0 
    ? ((runResults.totalPassed / runResults.totalRequests) * 100).toFixed(1)
    : '0';

  // Split View Layout
  return (
    <div className="flex-1 flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Left Panel - Configuration (Fixed Width) - Only show when no results */}
      {!hasResults && (
        <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              Run Collection
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {collectionName}
            </p>
          </div>

          {/* Configuration Form */}
          <div className="space-y-5">
            
            {/* Active Environment Display */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                    Active Environment: {activeEnvironmentId ? environments.find(e => e.id === activeEnvironmentId)?.name || 'Unknown' : 'None'}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                    {activeEnvironmentId ? 'Variables from this environment will be used' : 'No environment selected. Use the environment selector in the top bar.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Data File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data File (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedDataFileId}
                  onChange={(e) => setSelectedDataFileId(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={loading || isRunning}
                >
                  <option value="">No Data File</option>
                  {dataFiles.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name} ({file.rowCount} rows)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowUploadDialog(true)}
                  disabled={isRunning}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload new data file"
                >
                  <Upload className="w-4 h-4" />
                </button>
                {selectedDataFile && (
                  <button
                    onClick={() => setShowPreviewDialog(true)}
                    className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center gap-1.5"
                    title="Preview data file"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
              {selectedDataFile ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Will run {selectedDataFile.rowCount} iterations
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Upload CSV/JSON to iterate with data
                </p>
              )}
            </div>

            {/* Iterations (only if no data file) */}
            {!selectedDataFile && (
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isRunning}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Number of times to run the collection
                </p>
              </div>
            )}

            {/* Delay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Delay Between Requests (ms)
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                step="100"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isRunning}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Wait time between requests
              </p>
            </div>

            {/* Stop on Error */}
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Stop on Error
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Stop if a request fails
                </p>
              </div>
              <button
                onClick={() => setStopOnError(!stopOnError)}
                disabled={isRunning}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  stopOnError ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    stopOnError ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {!hasResults && !isRunning && (
              <button
                onClick={handleRun}
                className="w-full px-4 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Collection
              </button>
            )}
            {hasResults && !isRunning && (
              <button
                onClick={handleConfigureNewRun}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset & Run Again
              </button>
            )}
          </div>
        </div>

        {/* Upload Dialog */}
        {showUploadDialog && currentWorkspaceId && (
          <DataFileUpload
            isOpen={showUploadDialog}
            workspaceId={currentWorkspaceId}
            onClose={() => setShowUploadDialog(false)}
            onUploadSuccess={handleUploadSuccess}
          />
        )}

        {/* Preview Dialog */}
        {showPreviewDialog && selectedDataFile && (
          <DataFilePreview
            isOpen={showPreviewDialog}
            dataFile={selectedDataFile}
            onClose={() => setShowPreviewDialog(false)}
          />
        )}
        </div>
      )}
      {/* Right Panel - Results */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasResults && !isRunning && (
          // Empty State
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                Ready to Run
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure your collection settings and click "Run Collection"
              </p>
            </div>
          </div>
        )}

        {isRunning && (
          // Running State
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin h-16 w-16 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div className="font-medium text-base text-gray-900 dark:text-gray-100 mb-2">Running Collection</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{collectionName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Executing requests...</div>
            </div>
          </div>
        )}

        {hasResults && !isRunning && runResults && (
          // Results View
          <>
            {/* Results Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Results
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {activeEnvironmentId ? environments.find(e => e.id === activeEnvironmentId)?.name || 'No Environment' : 'No Environment'}
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {runResults?.iterations.length} {runResults?.iterations.length === 1 ? 'Iteration' : 'Iterations'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConfigureNewRun}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Rerun
                  </button>
                  
                  {/* Export Dropdown */}
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export
                    </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                      <button
                        onClick={() => handleExportResults('json')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExportResults('html')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as HTML
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={() => updateRunnerState({ statusFilter: 'all' })}
                  className={`bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-2.5 text-left transition-all hover:shadow-md ${
                    statusFilter === 'all' ? 'ring-2 ring-gray-500 dark:ring-gray-400 shadow-md' : ''
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Total ({runResults.totalRequests})
                  </div>
                </button>
                <button
                  onClick={() => updateRunnerState({ statusFilter: 'passed' })}
                  className={`bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2.5 text-left transition-all hover:shadow-md ${
                    statusFilter === 'passed' ? 'ring-2 ring-green-500 dark:ring-green-400 shadow-md' : ''
                  }`}
                >
                  <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                    Passed ({runResults.totalPassed})
                  </div>
                </button>
                <button
                  onClick={() => updateRunnerState({ statusFilter: 'failed' })}
                  className={`bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2.5 text-left transition-all hover:shadow-md ${
                    statusFilter === 'failed' ? 'ring-2 ring-red-500 dark:ring-red-400 shadow-md' : ''
                  }`}
                >
                  <div className="text-sm font-semibold text-red-700 dark:text-red-300">
                    Failed ({runResults.totalFailed})
                  </div>
                </button>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-2.5">
                  <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Success ({successRate}%)
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-2.5">
                  <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    Time ({runResults.totalTime}ms)
                  </div>
                </div>
              </div>
            </div>

            {/* Results Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Iterations Sidebar */}
              <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Iterations ({runResults.iterations.length})
                  </h3>
                  <div className="space-y-2">
                    {runResults.iterations.map((iteration: IterationResult, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          updateRunnerState({ selectedIteration: index, selectedRequest: null });
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedIteration === index
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Iteration {iteration.iteration}</span>
                          <span className="text-xs">{iteration.totalTime}ms</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600 dark:text-green-400">{iteration.passed} passed</span>
                          {iteration.failed > 0 && (
                            <span className="text-red-600 dark:text-red-400">{iteration.failed} failed</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Request Results */}
              <div className="flex-1 flex overflow-hidden">
                {/* Request List */}
                <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Requests ({currentIteration?.results.filter((r: RunResult) => 
                        statusFilter === 'all' || r.status === statusFilter
                      ).length || 0})
                    </h3>
                    <div className="space-y-2">
                      {currentIteration?.results.filter((r: RunResult) => 
                        statusFilter === 'all' || r.status === statusFilter
                      ).map((result: RunResult, index: number) => (
                        <button
                          key={index}
                          onClick={() => updateRunnerState({ selectedRequest: result })}
                          className={`w-full text-left p-3 rounded-md text-sm transition-colors border ${
                            selectedRequest === result
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodColor(result.method)}`}>
                              {result.method}
                            </span>
                            <span className={`text-xs font-medium ${
                              result.status === 'passed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {result.status === 'passed' ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                            {result.requestName}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            {result.statusCode && <span>Status: {result.statusCode}</span>}
                            {result.responseTime && <span>• {result.responseTime}ms</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
                  {selectedRequest ? (
                    <div className="p-6">
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 text-sm font-medium rounded ${getMethodColor(selectedRequest.method)}`}>
                            {selectedRequest.method}
                          </span>
                          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                            {selectedRequest.requestName}
                          </h2>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded">
                          {selectedRequest.url}
                        </div>
                      </div>

                      {/* Status */}
                      <div className={`p-4 rounded-lg mb-6 ${
                        selectedRequest.status === 'passed' 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {selectedRequest.status === 'passed' ? (
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={`font-semibold ${
                            selectedRequest.status === 'passed' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                          }`}>
                            {selectedRequest.status === 'passed' ? 'Request Passed' : 'Request Failed'}
                          </span>
                        </div>
                        {selectedRequest.statusCode && (
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Status Code:</span>{' '}
                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.statusCode}</span>
                          </div>
                        )}
                        {selectedRequest.responseTime && (
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Response Time:</span>{' '}
                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.responseTime}ms</span>
                          </div>
                        )}
                      </div>

                      {/* Error */}
                      {selectedRequest.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Error</h3>
                          <pre className="text-xs text-red-700 dark:text-red-400 font-mono whitespace-pre-wrap">
                            {selectedRequest.error}
                          </pre>
                        </div>
                      )}

                      {/* Test Results */}
                      {selectedRequest.testResults && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Test Results ({selectedRequest.testResults.passed} passed, {selectedRequest.testResults.failed} failed)
                          </h3>
                          <div className="space-y-2">
                            {selectedRequest.testResults.tests.map((test: { name: string; passed: boolean; error?: string }, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border ${
                                  test.passed
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {test.passed ? (
                                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${
                                      test.passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                                    }`}>
                                      {test.name}
                                    </div>
                                    {test.error && (
                                      <div className="text-xs text-red-700 dark:text-red-400 mt-1 font-mono">
                                        {test.error}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400 dark:text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">Select a request to view details</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
