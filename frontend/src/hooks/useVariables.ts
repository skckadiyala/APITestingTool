import { useMemo } from 'react';
import { useEnvironmentStore } from '../stores/environmentStore';
import { useCollectionStore } from '../stores/collectionStore';
import { useTabStore } from '../stores/tabStore';

export interface Variable {
  key: string;
  value: string;
  type?: 'default' | 'secret';
  source: 'environment' | 'collection' | 'global';
}

/**
 * Hook to get all available variables from environment, collection, and global scope
 */
export function useVariables() {
  const { environments, activeEnvironmentId } = useEnvironmentStore();
  const { collections, selectedRequest } = useCollectionStore();
  const { tabs, activeTabId } = useTabStore();

  const allVariables = useMemo(() => {
    const variables: Variable[] = [];

    // Get environment variables
    if (activeEnvironmentId) {
      const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
      if (activeEnv?.variables) {
        activeEnv.variables.forEach((v) => {
          if (v.enabled && v.key) {
            variables.push({
              key: v.key,
              value: v.value || '',
              type: v.type,
              source: 'environment',
            });
          }
        });
      }
    }

    // Get collection variables
    // First try to get from active tab
    const activeTab = tabs.find((t) => t.id === activeTabId);
    let collectionId = activeTab?.collectionId;

    // If no collection in tab, try to get from selected request
    if (!collectionId && selectedRequest) {
      const collection = collections.find((c) => 
        c.requests?.some((r) => r.id === selectedRequest.id)
      );
      collectionId = collection?.id;
    }

    // Find the collection and add its variables
    if (collectionId) {
      // Recursively find collection/folder by ID and get root collection
      const findCollectionAndRoot = (
        cols: typeof collections, 
        id: string, 
        root?: typeof collections[0]
      ): { item: typeof collections[0] | null; root: typeof collections[0] | null } => {
        for (const col of cols) {
          // Set root to top-level collection if not set
          const currentRoot = root || col;
          
          if (col.id === id) {
            return { item: col, root: currentRoot };
          }
          
          if (col.childFolders) {
            const found = findCollectionAndRoot(col.childFolders, id, currentRoot);
            if (found.item) return found;
          }
        }
        return { item: null, root: null };
      };

      const { item: collection, root: rootCollection } = findCollectionAndRoot(collections, collectionId);
      
      // Use root collection's variables if current item is a folder or has no variables
      const collectionToUse = (collection?.type === 'FOLDER' || !collection?.variables?.length) && rootCollection
        ? rootCollection
        : collection;
      
      if (collectionToUse?.variables && Array.isArray(collectionToUse.variables)) {
        collectionToUse.variables.forEach((v: any) => {
          if (v.enabled !== false && v.key) {
            variables.push({
              key: v.key,
              value: v.value || '',
              type: v.type || 'default',
              source: 'collection',
            });
          }
        });
      }
    }

    // TODO: Add global variables when implemented

    return variables;
  }, [environments, activeEnvironmentId, collections, selectedRequest, tabs, activeTabId]);

  /**
   * Resolve a variable value by name
   */
  const resolveVariable = (variableName: string): string | undefined => {
    const variable = allVariables.find((v) => v.key === variableName);
    return variable?.value;
  };

  /**
   * Replace all {{variable}} placeholders in a string with their values
   */
  const replaceVariables = (text: string): string => {
    if (!text) return text;
    
    return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedName = varName.trim();
      const value = resolveVariable(trimmedName);
      return value !== undefined ? value : match;
    });
  };

  /**
   * Extract variable names from a string (finds all {{variable}} patterns)
   */
  const extractVariables = (text: string): string[] => {
    if (!text) return [];
    
    const matches = text.matchAll(/\{\{([^}]+)\}\}/g);
    return Array.from(matches, (m) => m[1].trim());
  };

  /**
   * Check if a variable is defined
   */
  const isVariableDefined = (variableName: string): boolean => {
    return allVariables.some((v) => v.key === variableName);
  };

  return {
    allVariables,
    resolveVariable,
    replaceVariables,
    extractVariables,
    isVariableDefined,
  };
}
