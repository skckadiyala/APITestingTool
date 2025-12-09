import { useState, useRef, useEffect } from 'react';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import BottomPanel from './BottomPanel';
import { HistorySidebar } from '../history/HistorySidebar';
import type { Collection } from '../../services/collectionService';

export default function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mainContentRef = useRef<any>(null);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

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

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <TopNavbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          mainContentRef={mainContentRef} 
          onCollectionSelect={setSelectedCollection}
          onDeselectCollection={() => setSelectedCollection(null)}
          selectedCollectionId={selectedCollection?.id}
        />

        {/* Main Content + Bottom Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MainContent 
            ref={mainContentRef} 
            selectedCollection={selectedCollection}
            onDeselectCollection={() => setSelectedCollection(null)}
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
      </div>
    </div>
  );
}
