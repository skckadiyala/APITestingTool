import { useState, useEffect, useRef } from 'react';
import { useCollectionStore } from '../../stores/collectionStore';
import { useTabStore } from '../../stores/tabStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import type { Collection, CollectionRequest } from '../../services/collectionService';
import type { MainContentRef } from './MainContent';
import ExportDialog from '../collections/ExportDialog';
import ImportDialog from '../collections/ImportDialog';
import MoveRequestDialog from '../collections/MoveRequestDialog';
import CollectionRunnerDialog, { type RunOptions } from '../collections/CollectionRunnerDialog';
import RunnerResults from '../collections/RunnerResults';
import collectionRunnerService, { type CollectionRunResult } from '../../services/collectionRunnerService';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SidebarProps {
  mainContentRef?: React.RefObject<MainContentRef>;
  onCollectionSelect?: (collection: Collection) => void;
  selectedCollectionId?: string;
  onDeselectCollection?: () => void;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 280;

export default function Sidebar({ mainContentRef, onCollectionSelect, selectedCollectionId, onDeselectCollection }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportingCollectionId, setExportingCollectionId] = useState<string>('');
  const [exportingCollectionName, setExportingCollectionName] = useState<string>('');
  const [activeRequest, setActiveRequest] = useState<CollectionRequest | null>(null);
  const [showRunnerDialog, setShowRunnerDialog] = useState(false);
  const [runnerCollectionId, setRunnerCollectionId] = useState<string>('');
  const [runnerCollectionName, setRunnerCollectionName] = useState<string>('');
  const [showRunnerResults, setShowRunnerResults] = useState(false);
  const [runResults, setRunResults] = useState<CollectionRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const { collections, loading, loadCollections, createCollection, currentWorkspaceId, moveRequest, reorderItems } = useCollectionStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        // Save to localStorage
        localStorage.setItem('sidebarWidth', width.toString());
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width]);

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) {
        setWidth(parsedWidth);
      }
    }
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current;
    if (dragData?.type === 'request') {
      setActiveRequest(dragData.request);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRequest(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'request' && overData) {
      const activeRequest = activeData.request as CollectionRequest;
      const activeCollectionId = activeData.collectionId as string;

      // Dropping on another request - reorder within same collection or move to different collection
      if (overData.type === 'request') {
        const overRequest = overData.request as CollectionRequest;
        const overCollectionId = overData.collectionId as string;

        if (activeCollectionId === overCollectionId) {
          // Reorder within same collection
          const collection = findCollectionById(collections, activeCollectionId);
          if (collection?.requests) {
            const sortedRequests = [...collection.requests].sort((a, b) => a.orderIndex - b.orderIndex);
            const oldIndex = sortedRequests.findIndex((r) => r.id === activeRequest.id);
            const newIndex = sortedRequests.findIndex((r) => r.id === overRequest.id);

            if (oldIndex !== newIndex) {
              const reorderedRequests = [...sortedRequests];
              const [removed] = reorderedRequests.splice(oldIndex, 1);
              reorderedRequests.splice(newIndex, 0, removed);

              const updates = reorderedRequests.map((req, index) => ({
                id: req.id,
                orderIndex: index,
              }));

              await reorderItems(activeCollectionId, updates);
            }
          }
        } else {
          // Move to different collection
          await moveRequest(activeRequest.id, overCollectionId, overRequest.orderIndex);
        }
      }
      // Dropping on a folder - move to that folder
      else if (overData.type === 'folder') {
        const targetFolderId = overData.folderId as string;
        if (activeCollectionId !== targetFolderId) {
          await moveRequest(activeRequest.id, targetFolderId);
        }
      }
    }
  };

  const findCollectionById = (collections: Collection[], id: string): Collection | null => {
    for (const collection of collections) {
      if (collection.id === id) return collection;
      if (collection.childFolders) {
        const found = findCollectionById(collection.childFolders, id);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    // Load collections when workspace changes
    loadCollections(currentWorkspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspaceId]); // Only reload when workspace changes, not when loadCollections function changes

  // Filter collections based on search query
  const filterCollections = (collections: Collection[]): Collection[] => {
    if (!searchQuery) return collections;

    const filterRecursive = (collection: Collection): Collection | null => {
      let matchedRequests = collection.requests || [];
      let matchedFolders: Collection[] = [];

      // Filter requests
      if (collection.requests) {
        matchedRequests = collection.requests.filter((request) => {
          const matchesSearch = !searchQuery || 
            request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.url.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesSearch;
        });
      }

      // Filter child folders recursively
      if (collection.childFolders) {
        matchedFolders = collection.childFolders
          .map(filterRecursive)
          .filter((f): f is Collection => f !== null);
      }

      // Check if collection name matches search
      const collectionNameMatches = !searchQuery || 
        collection.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Include collection if it matches, has matching requests, or has matching folders
      if (collectionNameMatches || matchedRequests.length > 0 || matchedFolders.length > 0) {
        return {
          ...collection,
          requests: matchedRequests,
          childFolders: matchedFolders,
        };
      }

      return null;
    };

    return collections
      .map(filterRecursive)
      .filter((c): c is Collection => c !== null);
  };

  const filteredCollections = filterCollections(collections);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      await createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowNewCollectionDialog(false);
    }
  };

  const handleRunCollection = (collectionId: string, collectionName: string) => {
    setRunnerCollectionId(collectionId);
    setRunnerCollectionName(collectionName);
    setShowRunnerDialog(true);
  };

  const handleStartRun = async (options: RunOptions) => {
    setShowRunnerDialog(false);
    setIsRunning(true);
    
    try {
      const result = await collectionRunnerService.runCollection(runnerCollectionId, options);
      setRunResults(result);
      setShowRunnerResults(true);
    } catch (error) {
      console.error('Failed to run collection:', error);
      alert('Failed to run collection. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportResults = (format: 'json' | 'html') => {
    if (!runResults) return;
    
    if (format === 'json') {
      collectionRunnerService.exportResultsAsJSON(runResults);
    } else {
      collectionRunnerService.exportResultsAsHTML(runResults);
    }
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: isCollapsed ? '48px' : `${width}px` }}
      className="transition-all duration-300 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col relative"
    >
      {/* Sidebar Header */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3">
        {!isCollapsed && (
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Collections</h3>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 pl-8 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setShowNewCollectionDialog(true)}
                  className="w-[100px] flex-shrink-0 px-2 py-2 text-sm font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900 dark:hover:text-primary-400 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="whitespace-nowrap">New</span>
                </button>
                <button 
                  onClick={() => setShowImportDialog(true)}
                  className="w-[100px] flex-shrink-0 px-2 py-2 text-sm font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900 dark:hover:text-primary-400 flex items-center justify-center gap-1.5 transition-colors"
                  title="Import Collection"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="whitespace-nowrap">Import</span>
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  Loading collections...
                </div>
              )}

              {/* Collections List */}
              {!loading && collections.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  No collections yet. Create one to get started!
                </div>
              )}

              {/* No Results State */}
              {!loading && collections.length > 0 && filteredCollections.length === 0 && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No matches found</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}

              {!loading && filteredCollections.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="space-y-1">
                    {filteredCollections.map((collection) => (
                      <CollectionItem 
                        key={collection.id} 
                        collection={collection} 
                        mainContentRef={mainContentRef}
                        onCollectionSelect={onCollectionSelect}
                        onDeselectCollection={onDeselectCollection}
                        isSelected={selectedCollectionId === collection.id}
                        onExport={(id, name) => {
                          setExportingCollectionId(id);
                          setExportingCollectionName(name);
                          setShowExportDialog(true);
                        }}
                        onRunCollection={handleRunCollection}
                      />
                    ))}
                  </div>
                  <DragOverlay>
                    {activeRequest ? (
                      <div className="bg-white dark:bg-gray-800 shadow-lg rounded px-2 py-1.5 border border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{activeRequest.name}</span>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </div>
        </>
      )}

      {/* New Collection Dialog */}
      {showNewCollectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create New Collection
            </h3>
            <form onSubmit={handleCreateCollection}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter collection name"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCollectionDialog(false);
                    setNewCollectionName('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim()}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && exportingCollectionId && (
        <ExportDialog
          collectionId={exportingCollectionId}
          collectionName={exportingCollectionName}
          onClose={() => {
            setShowExportDialog(false);
            setExportingCollectionId('');
            setExportingCollectionName('');
          }}
        />
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog
          workspaceId={currentWorkspaceId}
          onClose={() => setShowImportDialog(false)}
          onImportComplete={() => {
            loadCollections(currentWorkspaceId);
            useWorkspaceStore.getState().fetchWorkspaces(); // Refresh workspace counts
          }}
        />
      )}

      {/* Collection Runner Dialog */}
      {showRunnerDialog && (
        <CollectionRunnerDialog
          collectionId={runnerCollectionId}
          collectionName={runnerCollectionName}
          onClose={() => setShowRunnerDialog(false)}
          onRun={handleStartRun}
        />
      )}

      {/* Runner Results */}
      {showRunnerResults && runResults && (
        <RunnerResults
          result={runResults}
          onClose={() => {
            setShowRunnerResults(false);
            setRunResults(null);
          }}
          onExport={handleExportResults}
        />
      )}

      {/* Loading Overlay */}
      {isRunning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Running Collection</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Executing requests...</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
            isResizing ? 'bg-blue-500' : 'bg-transparent'
          } transition-colors`}
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}

function CollectionItem({
  collection, 
  mainContentRef,
  onExport,
  onRunCollection,
  onCollectionSelect,
  onDeselectCollection,
  isSelected
}: { 
  collection: Collection; 
  mainContentRef?: React.RefObject<MainContentRef>;
  onExport: (id: string, name: string) => void;
  onRunCollection: (id: string, name: string) => void;
  onCollectionSelect?: (collection: Collection) => void;
  onDeselectCollection?: () => void;
  isSelected?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const { createFolder, deleteCollection, duplicateCollection } = useCollectionStore();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await createFolder(collection.id, newFolderName.trim());
      setNewFolderName('');
      setShowFolderDialog(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      await deleteCollection(collection.id);
    }
    setShowMenu(false);
  };

  const handleDuplicate = async () => {
    await duplicateCollection(collection.id);
    setShowMenu(false);
  };

  return (
    <>
      <div>
        <div
          className="flex items-start gap-1 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group relative"
        >
          <svg
            className={`w-3 h-3 text-gray-500 transform ${expanded ? 'rotate-90' : ''} mt-0.5`}
            fill="currentColor"
            viewBox="0 0 20 20"
            onClick={() => setExpanded(!expanded)}
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <svg className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span 
            className={`text-sm text-left flex-1 cursor-pointer ${
              isSelected 
                ? 'text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-900 dark:text-gray-100'
            }`}
            onClick={() => onCollectionSelect?.(collection)}
          >
            {collection.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Context Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10 py-1 min-w-[180px]">
              <button
                onClick={() => {
                  // TODO: Implement Add Request dialog
                  alert('Add Request functionality coming soon!');
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Request
              </button>
              <button
                onClick={() => {
                  setShowFolderDialog(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Add Folder
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                onClick={() => {
                  // TODO: Implement Rename functionality
                  alert('Rename functionality coming soon!');
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Rename
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                onClick={() => {
                  onExport(collection.id, collection.name);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button
                onClick={() => {
                  onRunCollection(collection.id, collection.name);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Collection
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                onClick={handleDelete}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
        {expanded && (
          <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2 mt-1 space-y-1">
            {collection.childFolders && collection.childFolders.map((folder) => (
              <FolderItem key={folder.id} folder={folder} mainContentRef={mainContentRef} onDeselectCollection={onDeselectCollection} />
            ))}
            {collection.requests && collection.requests.length > 0 && (
              <SortableContext
                items={collection.requests.map((r) => `request-${r.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {collection.requests.map((request) => (
                  <RequestItem key={request.id} request={request} collectionId={collection.id} onDeselectCollection={onDeselectCollection || (() => {})} />
                ))}
              </SortableContext>
            )}
          </div>
        )}
      </div>

      {/* New Folder Dialog */}
      {showFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create New Folder
            </h3>
            <form onSubmit={handleCreateFolder}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter folder name"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderDialog(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function FolderItem({ folder, mainContentRef, onDeselectCollection }: { folder: Collection; mainContentRef?: React.RefObject<MainContentRef>; onDeselectCollection?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { deleteCollection } = useCollectionStore();
  const { setNodeRef, isOver } = useSortable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folderId: folder.id,
    },
  });

  const handleDeleteFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      await deleteCollection(folder.id);
    }
  };
  
  return (
    <div ref={setNodeRef}>
      <div
        className={`flex items-start gap-1 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group ${
          isOver ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500' : ''
        }`}
      >
        <svg
          className={`w-3 h-3 text-gray-500 transform ${expanded ? 'rotate-90' : ''} mt-0.5`}
          fill="currentColor"
          viewBox="0 0 20 20"
          onClick={() => setExpanded(!expanded)}
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <svg className="w-4 h-4 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" onClick={() => setExpanded(!expanded)}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="text-sm text-left text-gray-900 dark:text-gray-100 flex-1" onClick={() => setExpanded(!expanded)}>{folder.name}</span>
        <button
          onClick={handleDeleteFolder}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900"
          title="Delete folder"
        >
          <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2 mt-1 space-y-1">
          {folder.childFolders && folder.childFolders.map((child) => (
            <FolderItem key={child.id} folder={child} mainContentRef={mainContentRef} onDeselectCollection={onDeselectCollection} />
          ))}
          {folder.requests && folder.requests.length > 0 && (
            <SortableContext
              items={folder.requests.map((r) => `request-${r.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {folder.requests.map((request) => (
                <RequestItem key={request.id} request={request} collectionId={folder.id} onDeselectCollection={onDeselectCollection || (() => {})} />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

function RequestItem({ request, collectionId, onDeselectCollection }: { request: CollectionRequest; collectionId: string; onDeselectCollection: () => void }) {
  const { deleteRequest, selectRequest, selectedRequest, moveRequest, collections } = useCollectionStore();
  const { loadRequestInTab } = useTabStore();
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `request-${request.id}`,
    data: {
      type: 'request',
      request,
      collectionId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const isSelected = selectedRequest?.id === request.id;
  
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${request.name}"?`)) {
      await deleteRequest(request.id);
    }
  };

  const handleClick = () => {
    // Deselect collection when a request is clicked
    onDeselectCollection?.();
    
    // Select request in store
    selectRequest(request);
    
    // Load request into a tab
    loadRequestInTab(request);
  };

  const handleMoveRequest = async (targetCollectionId: string) => {
    await moveRequest(request.id, targetCollectionId);
    setShowMoveDialog(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={handleClick}
        className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer group ${
          isSelected 
            ? 'bg-primary-100 dark:bg-primary-900 ring-1 ring-primary-500' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover:opacity-100 mt-0.5"
          title="Drag to reorder"
        >
          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${methodColors[request.method] || 'bg-gray-100 text-gray-700'}`}>
          {request.method}
        </span>
        <span className="text-sm text-left text-gray-900 dark:text-gray-100 flex-1">{request.name}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveDialog(true);
            }}
            className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
            title="Move to folder"
          >
            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900"
            title="Delete request"
          >
            <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>      <MoveRequestDialog
        isOpen={showMoveDialog}
        onClose={() => setShowMoveDialog(false)}
        onMove={handleMoveRequest}
        collections={collections}
        currentCollectionId={collectionId}
      />
    </>
  );
}
