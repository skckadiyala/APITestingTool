import { useState, useRef, useEffect } from 'react';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import BottomPanel from './BottomPanel';
import { HistorySidebar } from '../history/HistorySidebar';
import { NoWorkspaceScreen } from '../workspace/NoWorkspaceScreen';
import WorkspaceSwitchingOverlay from '../workspace/WorkspaceSwitchingOverlay';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useWorkspaceSwitch } from '../../hooks/useWorkspaceSwitch';


export default function Layout() {
  // const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mainContentRef = useRef<any>(null);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>>([]);
  const { workspaces, currentWorkspace, isLoading, fetchWorkspaces } = useWorkspaceStore();
  const { isSwitching } = useWorkspaceSwitch();

  // Fetch workspaces on component mount (only once)
  useEffect(() => {
    // Don't fetch if already loading or if workspaces already exist
    if (!isLoading && workspaces.length === 0) {
      fetchWorkspaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Set workspace ID in collection store when current workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      const collectionStore = useCollectionStore.getState();
      const environmentStore = useEnvironmentStore.getState();
      
      // Only update if workspace ID actually changed
      if (collectionStore.currentWorkspaceId !== currentWorkspace.id) {
        collectionStore.setWorkspaceId(currentWorkspace.id);
      }
      
      // Only load environments if workspace ID changed
      if (environmentStore.currentWorkspaceId !== currentWorkspace.id) {
        environmentStore.loadEnvironments(currentWorkspace.id);
      }
    }
  }, [currentWorkspace?.id]); // Depend on the ID, not the whole object

  // Poll for console logs from MainContent
  useEffect(() => {
    const interval = setInterval(() => {
      if (mainContentRef.current?.getConsoleLogs) {
        const logs = mainContentRef.current.getConsoleLogs();
        setConsoleLogs(logs);
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = () => {
    if (mainContentRef.current?.clearConsoleLogs) {
      mainContentRef.current.clearConsoleLogs();
      setConsoleLogs([]);
    }
  };

  // Show loading state while fetching workspaces
  if (isLoading && workspaces.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  // Show "No Workspace" screen if user has no workspaces
  if (!isLoading && workspaces.length === 0) {
    return <NoWorkspaceScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <TopNavbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar 
          mainContentRef={mainContentRef}
        />

        {/* Main Content + Bottom Panel */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${
          isSwitching ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}>
          <MainContent 
            ref={mainContentRef}
          />
          <BottomPanel consoleLogs={consoleLogs} onClear={handleClearLogs} />
        </div>

        {/* History Sidebar */}
        <HistorySidebar
          onRestoreRequest={(entry) => {
            if (mainContentRef.current?.restoreFromHistory) {
              mainContentRef.current.restoreFromHistory(entry);
            }
          }}
        />

        {/* Workspace Switching Overlay */}
        <WorkspaceSwitchingOverlay
          isVisible={isSwitching}
          workspaceName={currentWorkspace?.name}
        />
      </div>
    </div>
  );
}
