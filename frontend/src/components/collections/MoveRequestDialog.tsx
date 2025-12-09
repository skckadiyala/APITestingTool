import { useState } from 'react';
import type { Collection } from '../../services/collectionService';

interface MoveRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetCollectionId: string) => void;
  collections: Collection[];
  currentCollectionId: string;
}

export default function MoveRequestDialog({
  isOpen,
  onClose,
  onMove,
  collections,
  currentCollectionId,
}: MoveRequestDialogProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const handleMove = () => {
    if (selectedTargetId && selectedTargetId !== currentCollectionId) {
      onMove(selectedTargetId);
      onClose();
    }
  };

  const renderCollectionTree = (collection: Collection, level = 0) => {
    const isExpanded = expandedFolders.has(collection.id);
    const hasChildren = collection.childFolders && collection.childFolders.length > 0;
    const isSelected = selectedTargetId === collection.id;
    const isCurrent = currentCollectionId === collection.id;

    return (
      <div key={collection.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded ${
            isSelected
              ? 'bg-primary-100 dark:bg-primary-900'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => !isCurrent && setSelectedTargetId(collection.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(collection.id);
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <svg
                className={`w-3 h-3 text-gray-600 dark:text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collection.type === 'COLLECTION' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            )}
          </svg>
          
          <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
            {collection.name}
            {isCurrent && <span className="text-xs text-gray-500 ml-2">(current)</span>}
          </span>
        </div>

        {isExpanded && collection.childFolders && (
          <div>
            {collection.childFolders.map((folder) => renderCollectionTree(folder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-full mx-4 max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Move Request to Folder
        </h2>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select a collection or folder to move this request to:
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded mb-4">
          {collections.map((collection) => renderCollectionTree(collection))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={!selectedTargetId || selectedTargetId === currentCollectionId}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
