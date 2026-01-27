import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import URLBar from '../request/URLBar';
import RequestTabs from '../request/RequestTabs';
import RequestTabBar from '../request/RequestTabBar';
import ResponseViewer from '../response/ResponseViewer';
import CollectionViewer from '../collections/CollectionViewer';
import CollectionRunnerTab from '../collections/CollectionRunnerTab';
import WorkspaceSettingsTabContent from '../workspace/WorkspaceSettingsTabContent';
import ProfileSettingsTabContent from '../profile/ProfileSettingsTabContent';
import EnvironmentSettingsTabContent from '../environment/EnvironmentSettingsTabContent';
import { type KeyValuePair } from '../request/KeyValueEditor';
import { type BodyType } from '../request/BodyEditor';
import { requestService, type ExecutionResult } from '../../services/requestService';
import { fetchHistoryDetail, type HistoryEntry } from '../../services/historyService';
import { useCollectionStore } from '../../stores/collectionStore';
import { useTabStore } from '../../stores/tabStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useVariables } from '../../hooks/useVariables';
import type { AuthConfig } from '../../types';


type TabType = 'params' | 'headers' | 'body' | 'query' | 'schema' | 'auth' | 'pre-request' | 'tests';
type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2' | 'none';

export interface MainContentRef {
  restoreFromHistory: (entry: HistoryEntry) => Promise<void>;
  loadRequest: (requestData: {
    method: string;
    url: string;
    params?: Array<{ key: string; value: string; enabled?: boolean }>;
    headers?: Array<{ key: string; value: string; enabled?: boolean }>;
    body?: { type: string; content: any };
    auth?: { type: string };
    testScript?: string;
    preRequestScript?: string;
  }) => void;
  getConsoleLogs: () => Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>;
  clearConsoleLogs: () => void;
}

interface MainContentProps {
  // Props kept for backward compatibility but collections now use tab system
}

const MainContent = forwardRef<MainContentRef, MainContentProps>((_, ref) => {
  
  // Stores
  const { collections, addRequestToCollection, updateRequestInCollection } = useCollectionStore();
  const { tabs, activeTabId, updateTab } = useTabStore();
  const currentTab = tabs.find(t => t.id === activeTabId);
  const { activeEnvironmentId, getActiveEnvironment, loadEnvironments } = useEnvironmentStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { replaceVariables } = useVariables();
  
  // Request state
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [requestType, setRequestType] = useState<'REST' | 'GRAPHQL' | 'WEBSOCKET'>('REST');
  const [requestName, setRequestName] = useState('New Request');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveRequestName, setSaveRequestName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('params');
  
  // Wrapper to update active tab in both local state and tab store
  const handleActiveTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    if (activeTabId) {
      updateTab(activeTabId, { activeSubTab: newTab });
    }
  };
  
  // Request configuration state
  const [params, setParams] = useState<KeyValuePair[]>([]);
  
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  
  const [bodyType, setBodyType] = useState<BodyType>('json');
  const [bodyContent, setBodyContent] = useState('');
  const [formData, setFormData] = useState<Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>>([]);
  
  // GraphQL-specific state
  const [graphqlQuery, setGraphqlQuery] = useState(`query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}`);
  const [graphqlVariables, setGraphqlVariables] = useState<Record<string, any>>({});
  const [graphqlSchema, setGraphqlSchema] = useState<any>(undefined);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaUrl, setSchemaUrl] = useState<string>('');
  
  const [authType, setAuthType] = useState<AuthType>('noauth');
  const [preRequestScript, setPreRequestScript] = useState(`// Pre-request script
// Execute code before sending the request

pm.environment.set("timestamp", Date.now());
console.log("Request will be sent to:", pm.request.url);`);
  
  const [testScript, setTestScript] = useState(`// Test script
// Validate the response

pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("success");
  pm.expect(jsonData.data).to.be.an("array");
});`);

  // Response state
  const [hasResponse, setHasResponse] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>>([]);
  
  // Response panel resize state
  const [responseHeight, setResponseHeight] = useState(320); // Default 320px (h-80)
  const [isResizing, setIsResizing] = useState(false);
  const [isResponseCollapsed, setIsResponseCollapsed] = useState(false);
  
  // Track when we're syncing state from tab to prevent isDirty updates
  const isSyncingFromTab = useRef(false);

  // Handle response panel resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('.flex-1.flex.flex-col.bg-gray-50');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      
      // Min height: 150px, Max height: 80% of container
      const minHeight = 150;
      const maxHeight = containerRect.height * 0.8;
      
      setResponseHeight(Math.max(minHeight, Math.min(newHeight, maxHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const toggleResponseCollapse = () => {
    setIsResponseCollapsed(!isResponseCollapsed);
  };

  // Wrapper functions to update both local and tab state
  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { method: newMethod, isDirty: true });
    }
  };

  const handleRequestTypeChange = (newType: 'REST' | 'GRAPHQL' | 'WEBSOCKET') => {
    setRequestType(newType);
    
    // Auto-set method to POST for GraphQL
    if (newType === 'GRAPHQL') {
      setMethod('POST');
      // Switch to Query tab when switching to GraphQL
      if (activeTab === 'body' || activeTab === 'params') {
        setActiveTab('query');
      }
      if (activeTabId) {
        updateTab(activeTabId, { method: 'POST', requestType: newType });
      }
    }
    // Switch back to body tab when switching from GraphQL to REST
    else if (newType === 'REST' && (activeTab === 'query' || activeTab === 'schema')) {
      setActiveTab('body');
    }
    
    if (activeTabId) {
      updateTab(activeTabId, { isDirty: true, requestType: newType });
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { url: newUrl, isDirty: true });
    }
  };

  const handleRequestNameChange = (newName: string) => {
    setRequestName(newName);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { name: newName, isDirty: true });
    }
  };

  const handleParamsChange = (newParams: KeyValuePair[]) => {
    setParams(newParams);
    
    // Only update URL if we have a current URL to work with
    // This prevents overwriting the URL when loading from a tab
    if (!url) {
      return;
    }
    
    // Helper function to encode URI component while preserving {{variable}} patterns
    const encodePreservingVariables = (str: string): string => {
      // Split by variable pattern, encode non-variable parts
      const parts = str.split(/(\{\{[^}]+\}\})/g);
      return parts.map(part => {
        // Keep variable patterns as-is (odd indices in split result)
        if (part.startsWith('{{') && part.endsWith('}}')) {
          return part;
        }
        // Encode other parts
        return encodeURIComponent(part);
      }).join('');
    };
    
    // Update URL to reflect query parameters
    const enabledParams = newParams.filter(p => p.enabled && p.key.trim() !== '');
    const baseUrl = url.split('?')[0]; // Get URL without query params
    
    if (enabledParams.length > 0) {
      // Build query string manually to preserve {{variables}}
      const queryString = enabledParams
        .map(param => `${encodePreservingVariables(param.key)}=${encodePreservingVariables(param.value)}`)
        .join('&');
      
      const newUrl = `${baseUrl}?${queryString}`;
      setUrl(newUrl);
      
      if (activeTabId && !isSyncingFromTab.current) {
        updateTab(activeTabId, { params: newParams, url: newUrl, isDirty: true });
      }
    } else {
      // No enabled params, keep base URL
      setUrl(baseUrl);
      if (activeTabId && !isSyncingFromTab.current) {
        updateTab(activeTabId, { params: newParams, url: baseUrl, isDirty: true });
      }
    }
  };

  const handleHeadersChange = (newHeaders: KeyValuePair[]) => {
    setHeaders(newHeaders);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { headers: newHeaders, isDirty: true });
    }
  };

  const handleBodyTypeChange = (newBodyType: BodyType) => {
    setBodyType(newBodyType);
    
    // When switching to x-www-form-urlencoded or form-data, try to parse existing content
    if ((newBodyType === 'x-www-form-urlencoded' || newBodyType === 'form-data') && bodyContent) {
      try {
        const parsed = JSON.parse(bodyContent);
        if (Array.isArray(parsed)) {
          setFormData(parsed);
        }
      } catch {
        // If parsing fails, keep the existing formData
      }
    }
    
    if (activeTabId && !isSyncingFromTab.current) {
      const content = (newBodyType === 'x-www-form-urlencoded' || newBodyType === 'form-data') 
        ? JSON.stringify(formData)
        : bodyContent;
      updateTab(activeTabId, { body: { type: newBodyType, content }, isDirty: true });
      
      // Auto-update Content-Type header based on body type
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab && (activeTab.method === 'POST' || activeTab.method === 'PUT' || activeTab.method === 'PATCH')) {
        const currentHeaders = activeTab.headers || [];
        const contentTypeIndex = currentHeaders.findIndex(h => 
          h.key.toLowerCase() === 'content-type'
        );
        
        let newContentType = '';
        if (newBodyType === 'json') {
          newContentType = 'application/json';
        } else if (newBodyType === 'x-www-form-urlencoded') {
          newContentType = 'application/x-www-form-urlencoded';
        } else if (newBodyType === 'raw') {
          newContentType = 'text/plain';
        }
        
        if (newContentType) {
          const updatedHeaders = [...currentHeaders];
          if (contentTypeIndex >= 0) {
            // Update existing Content-Type header
            updatedHeaders[contentTypeIndex] = {
              ...updatedHeaders[contentTypeIndex],
              value: newContentType
            };
          } else {
            // Add new Content-Type header
            updatedHeaders.push({
              key: 'Content-Type',
              value: newContentType
            });
          }
          // Update tab state (which uses simpler header format)
          if (!isSyncingFromTab.current) {
            updateTab(activeTabId, { headers: updatedHeaders, isDirty: true });
          }
          // Update local state (which uses KeyValuePair format)
          setHeaders(updatedHeaders.map((h: any, idx) => ({
            id: h.id || `header-${idx}`,
            key: h.key,
            value: h.value,
            enabled: h.enabled !== false,
            description: h.description || ''
          })));
        }
      }
    }
  };

  const handleBodyContentChange = (newContent: string) => {
    setBodyContent(newContent);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { body: { type: bodyType, content: newContent }, isDirty: true });
    }
  };

  const handleFormDataChange = (newFormData: Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>) => {
    setFormData(newFormData);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { body: { type: bodyType, content: JSON.stringify(newFormData) }, isDirty: true });
    }
  };

  const handleAuthTypeChange = (newAuthType: AuthType) => {
    setAuthType(newAuthType);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { auth: { type: newAuthType } as AuthConfig, isDirty: true });
    }
  };

  const handlePreRequestScriptChange = (newScript: string) => {
    setPreRequestScript(newScript);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { preRequestScript: newScript, isDirty: true });
    }
  };

  const handleTestScriptChange = (newScript: string) => {
    setTestScript(newScript);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { testScript: newScript, isDirty: true });
    }
  };

  const handleGraphqlQueryChange = (newQuery: string) => {
    setGraphqlQuery(newQuery);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { graphqlQuery: newQuery, isDirty: true });
    }
  };

  const handleGraphqlVariablesChange = (newVariables: Record<string, any>) => {
    setGraphqlVariables(newVariables);
    if (activeTabId && !isSyncingFromTab.current) {
      updateTab(activeTabId, { graphqlVariables: newVariables, isDirty: true });
    }
  };

  const handleFetchSchema = async () => {
    if (!url) {
      toast.error('Please enter a GraphQL endpoint URL');
      return;
    }

    // Resolve environment variables in the URL
    const resolvedUrl = replaceVariables(url);
    
    // Check if URL still contains unresolved variables
    if (resolvedUrl.includes('{{')) {
      toast.error('URL contains unresolved variables. Please check your environment settings.');
      return;
    }

    setSchemaLoading(true);
    try {
      const result = await requestService.introspectGraphQL(
        resolvedUrl,
        headers,
        currentTab?.requestId || undefined
      );

      if (result.success && result.data?.schema) {
        setGraphqlSchema(result.data.schema);
        setSchemaUrl(resolvedUrl);
        toast.success('Schema loaded successfully');
        
        // Update tab with schema info
        if (currentTab) {
          updateTab(currentTab.id, {
            ...currentTab,
            graphqlSchema: result.data.schema,
            schemaUrl: resolvedUrl,
          });
        }
      } else {
        toast.error(result.message || 'Failed to load schema');
      }
    } catch (error: any) {
      console.error('Schema introspection error:', error);
      toast.error(error.message || 'Failed to load schema');
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleRefreshSchema = () => {
    // Refresh schema by calling fetch again
    handleFetchSchema();
  };

  const handleInsertField = (field: string) => {
    // TODO: Implement field insertion into query
    console.log('Inserting field:', field);
  };

  // Auto-fetch schema when URL changes for GraphQL requests
  useEffect(() => {
    // Only auto-fetch if:
    // 1. Request type is GraphQL
    // 2. URL is not empty
    // 3. URL has changed from schemaUrl
    // 4. Not currently loading
    // 5. URL doesn't contain unresolved variables
    const resolvedUrl = url ? replaceVariables(url) : '';
    const hasUnresolvedVars = resolvedUrl.includes('{{');
    
    if (requestType === 'GRAPHQL' && url && url !== schemaUrl && !schemaLoading && !hasUnresolvedVars) {
      // Debounce schema fetching
      const timer = setTimeout(() => {
        handleFetchSchema();
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timer);
    }
  }, [url, requestType]);

  // Sync active tab data to component state when tab changes
  useEffect(() => {
    if (!currentTab) {
      return;
    }

    // Set flag to prevent isDirty updates during sync
    isSyncingFromTab.current = true;

    // Set all state from the active tab
    setMethod(currentTab.method || 'GET');
    setUrl(currentTab.url || '');
    setRequestType(currentTab.requestType || 'REST');
    setRequestName(currentTab.name || 'New Request');
    setParams(currentTab.params?.map((p, idx) => ({
      id: String(idx + 1),
      key: p.key,
      value: p.value,
      enabled: p.enabled !== false,
    })) || []);
    setHeaders(currentTab.headers?.map((h, idx) => ({
      id: String(idx + 1),
      key: h.key,
      value: h.value,
      enabled: h.enabled !== false,
    })) || []);
    setBodyType((currentTab.body?.type as BodyType) || 'json');
    const bodyTypeValue = (currentTab.body?.type as BodyType) || 'json';
    const content = typeof currentTab.body?.content === 'string' 
      ? currentTab.body.content 
      : JSON.stringify(currentTab.body?.content || '', null, 2);
    setBodyContent(content);
    
    // Parse formData for x-www-form-urlencoded and form-data types
    if ((bodyTypeValue === 'x-www-form-urlencoded' || bodyTypeValue === 'form-data') && content) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const formDataWithIds = parsed.map((item, index) => ({
            ...item,
            id: item.id || `${Date.now()}-${index}`,
            enabled: item.enabled !== false,
          }));
          setFormData(formDataWithIds);
        }
      } catch {
        setFormData([]);
      }
    } else {
      setFormData([]);
    }
    
    // Restore GraphQL-specific state
    if (currentTab.requestType === 'GRAPHQL') {
      setGraphqlQuery(currentTab.graphqlQuery || '');
      setGraphqlVariables(currentTab.graphqlVariables || {});
      setGraphqlSchema(currentTab.graphqlSchema);
      setSchemaUrl(currentTab.schemaUrl || '');
    }
    
    // Restore active subtab if previously set, otherwise use defaults
    if (currentTab.activeSubTab) {
      setActiveTab(currentTab.activeSubTab as TabType);
    } else if (currentTab.requestType === 'GRAPHQL') {
      // Default to Query tab for GraphQL requests
      setActiveTab('query');
    } else {
      // Default to Headers tab for REST requests
      setActiveTab('headers');
    }
    
    setAuthType((currentTab.auth?.type as AuthType) || 'noauth');
    setTestScript(currentTab.testScript || '');
    setPreRequestScript(currentTab.preRequestScript || '');
    setHasResponse(false);
    setExecutionResult(null);
    setConsoleLogs([]);

    // Clear the flag after a longer delay to allow all child components to mount
    const timer = setTimeout(() => {
      isSyncingFromTab.current = false;
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentTab?.id, currentTab?.url, currentTab?.method, currentTab?.requestId]);

  // Restore request from history
  const restoreFromHistory = async (entry: HistoryEntry) => {
    try {
      // Fetch full history details including request/response bodies
      const historyDetail = await fetchHistoryDetail(entry.id);

      // Create a new tab or use existing active tab
      const { tabs, activeTabId, createTab, updateTab } = useTabStore.getState();
      
      let targetTabId = activeTabId;
      const activeTab = tabs.find(t => t.id === activeTabId);
      
      // If no active tab or active tab has been modified/has content, create a new tab
      if (!activeTabId || activeTab?.isDirty || activeTab?.url) {
        const pathname = historyDetail.url.includes('://') 
          ? new URL(historyDetail.url).pathname 
          : historyDetail.url.split('?')[0];
        
        createTab({
          name: `${historyDetail.method} ${pathname}`,
          method: historyDetail.method,
          url: historyDetail.url,
          isUntitled: false,
        });
        targetTabId = useTabStore.getState().activeTabId;
      }

      // Restore method and URL
      setMethod(historyDetail.method);
      setUrl(historyDetail.url);

      // Restore headers
      const restoredHeaders: KeyValuePair[] = historyDetail.requestBody?.headers?.map(
        (h, index) => ({
          id: String(index + 1),
          key: h.key,
          value: h.value,
          enabled: true,
        })
      ) || [];
      setHeaders(restoredHeaders);

      // Restore body
      let restoredBodyType: BodyType = 'json';
      let restoredBodyContent = '';
      
      if (historyDetail.requestBody?.body) {
        const body = historyDetail.requestBody.body;
        restoredBodyType = body.type as BodyType;
        setBodyType(restoredBodyType);
        // If content is a JSON object, stringify it for the editor
        const content = typeof body.content === 'string' 
          ? body.content 
          : JSON.stringify(body.content, null, 2);
        restoredBodyContent = content;
        setBodyContent(content);
      }

      // Restore auth
      const restoredAuth = historyDetail.requestBody?.auth || { type: 'noauth' as const };
      setAuthType(restoredAuth.type as AuthType);

      // Update the tab with all restored data
      if (targetTabId) {
        updateTab(targetTabId, {
          method: historyDetail.method,
          url: historyDetail.url,
          headers: restoredHeaders,
          body: {
            type: restoredBodyType,
            content: restoredBodyContent
          },
          auth: restoredAuth as AuthConfig,
          isDirty: false,
        });
      }

      // Clear response if any
      setHasResponse(false);
      setExecutionResult(null);
      setConsoleLogs([]);

      toast.success('Request restored from history', {
        icon: '🔄',
        duration: 2000,
      });
    } catch (error: any) {
      console.error('Failed to restore from history:', error);
      toast.error('Failed to restore request from history');
    }
  };

  // Load request from collection
  const loadRequest = (requestData: {
    method: string;
    url: string;
    params?: Array<{ key: string; value: string; enabled?: boolean }>;
    headers?: Array<{ key: string; value: string; enabled?: boolean }>;
    body?: { type: string; content: any };
    auth?: { type: string };
    testScript?: string;
    preRequestScript?: string;
  }) => {
    // Load method and URL
    setMethod(requestData.method);
    setUrl(requestData.url);

    // Load params
    if (requestData.params) {
      const loadedParams: KeyValuePair[] = requestData.params.map(
        (p, index) => ({
          id: String(index + 1),
          key: p.key,
          value: p.value,
          enabled: p.enabled !== false,
        })
      );
      setParams(loadedParams);
    } else {
      setParams([]);
    }

    // Load headers
    if (requestData.headers) {
      const loadedHeaders: KeyValuePair[] = requestData.headers.map(
        (h, index) => ({
          id: String(index + 1),
          key: h.key,
          value: h.value,
          enabled: h.enabled !== false,
        })
      );
      setHeaders(loadedHeaders);
    } else {
      setHeaders([]);
    }

    // Load body
    if (requestData.body) {
      const bodyTypeValue = requestData.body.type as BodyType;
      setBodyType(bodyTypeValue);
      const content = typeof requestData.body.content === 'string' 
        ? requestData.body.content 
        : JSON.stringify(requestData.body.content, null, 2);
      setBodyContent(content);
      
      // Parse formData for x-www-form-urlencoded and form-data types
      if ((bodyTypeValue === 'x-www-form-urlencoded' || bodyTypeValue === 'form-data') && content) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            // Ensure each item has an id field
            const formDataWithIds = parsed.map((item, index) => ({
              ...item,
              id: item.id || `${Date.now()}-${index}`,
              enabled: item.enabled !== false,
            }));
            setFormData(formDataWithIds);
          }
        } catch {
          setFormData([]);
        }
      } else {
        setFormData([]);
      }
    } else {
      setBodyContent('');
      setFormData([]);
    }

    // Load auth
    if (requestData.auth) {
      setAuthType(requestData.auth.type as AuthType);
    } else {
      setAuthType('noauth');
    }

    // Load test scripts
    if (requestData.testScript) {
      setTestScript(requestData.testScript);
    }

    // Clear response
    setHasResponse(false);
    setExecutionResult(null);
    setConsoleLogs([]);

    toast.success('Request loaded from collection', {
      icon: '📂',
      duration: 2000,
    });
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    restoreFromHistory,
    loadRequest,
    getConsoleLogs: () => consoleLogs,
    clearConsoleLogs: () => setConsoleLogs([]),
  }));

  const handleSend = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setHasResponse(false);
    
    // Initialize console logs
    const logs: Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }> = [];
    const timestamp = Date.now();

    // Log request details
    const enabledParams = params.filter(p => p.enabled);
    const enabledHeaders = headers.filter(h => h.enabled);
    
    if (enabledParams.length > 0) {
      logs.push({
        type: 'info',
        message: `Query Params: ${JSON.stringify(enabledParams.map(p => ({ [p.key]: p.value })), null, 2)}`,
        timestamp
      });
    }
    
    if (enabledHeaders.length > 0) {
      logs.push({
        type: 'info',
        message: `Headers: ${JSON.stringify(Object.fromEntries(enabledHeaders.map(h => [h.key, h.value])), null, 2)}`,
        timestamp
      });
    }
    
    if (activeEnvironmentId) {
      const activeEnv = getActiveEnvironment();
      logs.push({
        type: 'info',
        message: `Using Environment: ${activeEnv?.name || 'Unknown'}`,
        timestamp
      });
    }

    try {
      // For x-www-form-urlencoded and form-data, use the formData state (most current)
      // For other types, use bodyContent
      let bodyContentForExecution = bodyContent;
      if (bodyType === 'x-www-form-urlencoded' || bodyType === 'form-data') {
        bodyContentForExecution = JSON.stringify(formData);
      }
      
      // Get collectionId from active tab for variable resolution
      const activeTab = tabs.find((t) => t.id === activeTabId);
      const collectionId = activeTab?.collectionId;
      
      const result = await requestService.execute({
        method: method as any,
        url: url.trim(),
        requestType: requestType, // Include request type
        params: requestType === 'GRAPHQL' ? [] : params, // GraphQL doesn't use query params
        headers,
        body: {
          type: bodyType as any,
          content: bodyContentForExecution,
        },
        // GraphQL-specific fields
        graphqlQuery: requestType === 'GRAPHQL' ? graphqlQuery : undefined,
        graphqlVariables: requestType === 'GRAPHQL' ? graphqlVariables : undefined,
        auth: {
          type: authType,
        },
        timeout: 30000,
        followRedirects: true,
        maxRedirects: 5,
        validateSSL: currentWorkspace?.settings?.validateSSL ?? false,
        testScript: testScript || undefined,
        preRequestScript: preRequestScript || undefined,
      }, 'demo-user', undefined, activeEnvironmentId, collectionId); // Pass environmentId and collectionId for variable resolution

      // Log the resolved URL from the request
      logs.unshift({
        type: 'request',
        message: `${result.request.method} ${result.request.url}`,
        timestamp
      });

      // Log resolved body (after variable substitution)
      if (result.request.body && bodyType !== 'none') {
        let bodyPreview = '';
        try {
          if (typeof result.request.body === 'object') {
            bodyPreview = `Body (${bodyType}): ${JSON.stringify(result.request.body, null, 2)}`;
          } else {
            const bodyStr = String(result.request.body);
            bodyPreview = `Body (${bodyType}): ${bodyStr.substring(0, 500)}${bodyStr.length > 500 ? '...' : ''}`;
          }
        } catch {
          bodyPreview = `Body (${bodyType}): ${String(result.request.body).substring(0, 500)}`;
        }
        logs.push({
          type: 'info',
          message: bodyPreview,
          timestamp
        });
      }

      // Log response
      logs.push({
        type: 'response',
        message: `Status: ${result.response?.status || 'Unknown'} ${result.response?.statusText || ''}`,
        timestamp: Date.now()
      });
      
      logs.push({
        type: 'response',
        message: `Time: ${result.response?.timing?.total || 0}ms`,
        timestamp: Date.now()
      });
      
      logs.push({
        type: 'response',
        message: `Size: ${result.response?.size?.body || 0} bytes`,
        timestamp: Date.now()
      });
      
      // Log test results if available
      if (result.testResults) {
        logs.push({
          type: 'info',
          message: `Tests: ${result.testResults.passed} passed, ${result.testResults.failed} failed`,
          timestamp: Date.now()
        });
        
        // Add test script console output
        if (result.testResults.consoleOutput && result.testResults.consoleOutput.length > 0) {
          result.testResults.consoleOutput.forEach((output: string) => {
            logs.push({
              type: 'info',
              message: `[Test Script] ${output}`,
              timestamp: Date.now()
            });
          });
        }
      }

      setExecutionResult(result);
      setHasResponse(true);
      setConsoleLogs(logs);

      if (result.success) {
        const timing = result.response?.timing.total || 0;
        
        // Refresh history after successful request
        if (result.historyId) {
          // Dynamically import to avoid circular dependencies
          import('../../stores/historyStore').then(({ useHistoryStore }) => {
            const { loadHistory } = useHistoryStore.getState();
            loadHistory(true);
          });
        }

        // Refresh environment if test scripts updated variables
        if (activeEnvironmentId && result.testResults?.environmentUpdates && Object.keys(result.testResults.environmentUpdates).length > 0) {
          // Get the current workspace ID from environment store
          const { currentWorkspaceId } = useEnvironmentStore.getState();
          if (currentWorkspaceId) {
            // Reload all environments to get the updated values
            loadEnvironments(currentWorkspaceId);
          }
        }

        // Refresh collections if test scripts updated collection variables
        if (result.testResults?.collectionUpdates && Object.keys(result.testResults.collectionUpdates).length > 0) {
          // Reload collections to get the updated variables
          import('../../stores/collectionStore').then(({ useCollectionStore }) => {
            const { loadCollections } = useCollectionStore.getState();
            const { currentWorkspaceId } = useEnvironmentStore.getState();
            if (currentWorkspaceId) {
              loadCollections(currentWorkspaceId);
            }
          });
        }
        
        toast.success(`Request completed in ${timing}ms`, {
          icon: '✅',
          duration: 3000,
        });
      } else {
        toast.error(result.error?.message || 'Request failed', {
          icon: '❌',
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('Request error:', error);
      
      // Log error
      logs.push({
        type: 'error',
        message: `Error: ${error.message || 'Failed to execute request'}`,
        timestamp: Date.now()
      });
      
      if (error.stack) {
        logs.push({
          type: 'error',
          message: `Stack Trace:\n${error.stack}`,
          timestamp: Date.now()
        });
      }
      
      setConsoleLogs(logs);
      
      toast.error(error.message || 'Failed to execute request', {
        icon: '❌',
        duration: 5000,
      });
      setExecutionResult({
        success: false,
        request: {
          method: method as any,
          url: url.trim(),
          headers: {},
        },
        error: {
          message: error.message || 'Failed to execute request',
        },
        executedAt: new Date().toISOString(),
      });
      setHasResponse(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    // Check if this is an existing request (part of a collection)
    if (activeTab?.requestId) {
      // Update existing request
      handleUpdateExistingRequest();
    } else {
      // Save as new request
      setShowSaveDialog(true);
      // Generate default name from URL
      try {
        const defaultName = url ? `${method} ${new URL(url).pathname}` : `${method} Request`;
        setSaveRequestName(defaultName);
      } catch {
        setSaveRequestName(`${method} Request`);
      }
    }
  };

  const handleUpdateExistingRequest = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab?.requestId) return;

    try {
      // For x-www-form-urlencoded and form-data, serialize formData array
      let bodyContentToSave = bodyContent;
      if (bodyType === 'x-www-form-urlencoded' || bodyType === 'form-data') {
        bodyContentToSave = JSON.stringify(formData);
      }

      // Filter out params and headers with empty keys
      const paramsToSave = params.filter(p => p.key.trim() !== '');
      const headersToSave = headers.filter(h => h.key.trim() !== '');

      // Use currentTab state as source of truth for GraphQL data
      const graphqlQueryToSave = requestType === 'GRAPHQL' ? (currentTab?.graphqlQuery || graphqlQuery) : undefined;
      const graphqlVariablesToSave = requestType === 'GRAPHQL' ? (currentTab?.graphqlVariables || graphqlVariables) : undefined;
      const graphqlSchemaToSave = requestType === 'GRAPHQL' ? (currentTab?.graphqlSchema || graphqlSchema) : undefined;

      await updateRequestInCollection(activeTab.requestId, {
        name: requestName,
        method,
        url,
        requestType, // Include request type
        params: paramsToSave,
        headers: headersToSave,
        body: (bodyContentToSave || bodyType !== 'none') ? { type: bodyType, content: bodyContentToSave } : undefined,
        auth: { type: authType } as AuthConfig,
        testScript: testScript.trim() || undefined,
        preRequestScript: preRequestScript.trim() || undefined,
        // GraphQL-specific fields
        graphqlQuery: graphqlQueryToSave,
        graphqlVariables: graphqlVariablesToSave,
        graphqlSchema: graphqlSchemaToSave,
      });
      
      // Update the tab with the saved data (using filtered data)
      updateTab(activeTab.id, {
        name: requestName,
        method,
        url,
        params: paramsToSave,
        headers: headersToSave,
        body: (bodyContentToSave || bodyType !== 'none') ? { type: bodyType, content: bodyContentToSave } : undefined,
        auth: { type: authType } as AuthConfig,
        testScript: testScript.trim() || undefined,
        preRequestScript: preRequestScript.trim() || undefined,
        isDirty: false,
      });
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      // Error toast is already shown by the store
    }
  };

  // Helper function to flatten collections and folders for dropdown
  const getFlattenedCollections = (collections: any[], level = 0): { id: string; name: string; level: number }[] => {
    const result: { id: string; name: string; level: number }[] = [];
    
    collections.forEach((collection) => {
      result.push({
        id: collection.id,
        name: collection.name,
        level,
      });
      
      if (collection.childFolders && collection.childFolders.length > 0) {
        result.push(...getFlattenedCollections(collection.childFolders, level + 1));
      }
    });
    
    return result;
  };

  const handleSaveToCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveRequestName.trim() || !selectedCollectionId) {
      toast.error('Please enter a request name and select a collection');
      return;
    }

    try {
      // For x-www-form-urlencoded and form-data, serialize formData array
      let bodyContentToSave = bodyContent;
      if (bodyType === 'x-www-form-urlencoded' || bodyType === 'form-data') {
        bodyContentToSave = JSON.stringify(formData);
      }

      // Filter out params and headers with empty keys
      const paramsToSave = params.filter(p => p.key.trim() !== '');
      const headersToSave = headers.filter(h => h.key.trim() !== '');

      // Use currentTab state as source of truth since it's kept in sync via handleGraphqlQueryChange
      const graphqlQueryToSave = requestType === 'GRAPHQL' ? (currentTab?.graphqlQuery || graphqlQuery) : undefined;
      const graphqlVariablesToSave = requestType === 'GRAPHQL' ? (currentTab?.graphqlVariables || graphqlVariables) : undefined;
      const graphqlSchemaToSave = requestType === 'GRAPHQL' ? (currentTab?.graphqlSchema || graphqlSchema) : undefined;

      const savedRequest = await addRequestToCollection(
        selectedCollectionId,
        saveRequestName.trim(),
        method,
        url,
        undefined, // requestBodyId
        testScript.trim() || undefined,
        preRequestScript.trim() || undefined,
        paramsToSave,
        headersToSave,
        (bodyContentToSave || bodyType !== 'none') ? { type: bodyType, content: bodyContentToSave } : undefined,
        { type: authType } as AuthConfig,
        requestType, // Pass request type
        graphqlQueryToSave, // GraphQL query from tab state (source of truth)
        graphqlVariablesToSave, // GraphQL variables from tab state
        graphqlSchemaToSave // GraphQL schema from tab state
      );
      
      // Update the tab with saved request information
      if (savedRequest && activeTabId) {
        updateTab(activeTabId, {
          requestId: savedRequest.id,
          collectionId: savedRequest.collectionId,
          requestType: savedRequest.requestType || requestType,
          name: savedRequest.name,
          isUntitled: false,
          isDirty: false,
        });
      }
      
      setIsSaved(true);
      setShowSaveDialog(false);
      setSaveRequestName('');
      setSelectedCollectionId('');
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      toast.error('Failed to save request');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          },
        }}
      />
      
      {/* Request Tabs */}
      <RequestTabBar />
      
      {!activeTabId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-lg">No request selected</p>
            <p className="text-sm mt-2">Create a new request or select one from a collection</p>
          </div>
        </div>
      ) : tabs.find(t => t.id === activeTabId)?.type === 'workspace-settings' ? (
        <WorkspaceSettingsTabContent />
      ) : tabs.find(t => t.id === activeTabId)?.type === 'profile-settings' ? (
        <ProfileSettingsTabContent />
      ) : tabs.find(t => t.id === activeTabId)?.type === 'environment-settings' ? (
        <EnvironmentSettingsTabContent />
      ) : tabs.find(t => t.id === activeTabId)?.type === 'collection' ? (
        <CollectionViewer collection={tabs.find(t => t.id === activeTabId)?.collectionData!} />
      ) : tabs.find(t => t.id === activeTabId)?.type === 'collection-runner' ? (
        <CollectionRunnerTab 
          collectionId={tabs.find(t => t.id === activeTabId)?.collectionId || ''} 
          collectionName={tabs.find(t => t.id === activeTabId)?.collectionData?.name || 'Collection'} 
        />
      ) : (
        <>
          {/* Request Type Selector and Request Name Input */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-3">
            <select
              value={requestType}
              onChange={(e) => handleRequestTypeChange(e.target.value as 'REST' | 'GRAPHQL' | 'WEBSOCKET')}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="Select request type"
            >
              <option value="REST">REST</option>
              <option value="GRAPHQL">GraphQL</option>
              <option value="WEBSOCKET">WebSocket</option>
            </select>
            <input
              type="text"
              value={requestName}
              onChange={(e) => handleRequestNameChange(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm font-semibold border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-primary-500 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none transition-colors"
              placeholder="Request Name"
            />
          </div>

          <URLBar
            method={method}
            url={url}
            requestType={requestType}
            onMethodChange={handleMethodChange}
            onUrlChange={handleUrlChange}
            onSend={handleSend}
            onSave={handleSave}
            isLoading={isLoading}
            isSaved={isSaved}
            isExistingRequest={!!tabs.find(t => t.id === activeTabId)?.requestId}
            isDirty={!!tabs.find(t => t.id === activeTabId)?.isDirty}
          />

          <div className="flex-1 overflow-hidden">
            <RequestTabs
              activeTab={activeTab}
              onTabChange={handleActiveTabChange}
              requestType={requestType}
              params={params}
              headers={headers}
              bodyType={bodyType}
              bodyContent={bodyContent}
              formData={formData}
              authType={authType}
              preRequestScript={preRequestScript}
              testScript={testScript}
              graphqlQuery={graphqlQuery}
              graphqlVariables={graphqlVariables}
              graphqlSchema={graphqlSchema}
              schemaUrl={url}
              schemaLoading={schemaLoading}
              onParamsChange={handleParamsChange}
              onHeadersChange={handleHeadersChange}
              onBodyTypeChange={handleBodyTypeChange}
              onBodyContentChange={handleBodyContentChange}
              onFormDataChange={handleFormDataChange}
              onAuthTypeChange={handleAuthTypeChange}
              onPreRequestScriptChange={handlePreRequestScriptChange}
              onTestScriptChange={handleTestScriptChange}
              onGraphqlQueryChange={handleGraphqlQueryChange}
              onGraphqlVariablesChange={handleGraphqlVariablesChange}
              onFetchSchema={handleFetchSchema}
              onRefreshSchema={handleRefreshSchema}
              onInsertField={handleInsertField}
            />
          </div>

          {hasResponse && executionResult && (
            <>
              {/* Resizable Divider */}
              <div
                className={`relative border-t-2 ${
                  isResizing 
                    ? 'border-primary-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } group`}
                style={{ height: isResponseCollapsed ? 'auto' : `${responseHeight}px` }}
              >
                {/* Drag Handle */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 -mt-1 cursor-ns-resize z-10 ${
                    isResizing 
                      ? 'bg-primary-500' 
                      : 'bg-transparent hover:bg-primary-400 dark:hover:bg-primary-600'
                  } transition-colors`}
                  onMouseDown={handleResizeStart}
                  title="Drag to resize"
                />
                
                {/* Collapse/Expand Button */}
                <button
                  onClick={toggleResponseCollapse}
                  className="absolute top-2 right-2 z-20 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  title={isResponseCollapsed ? 'Expand response' : 'Collapse response'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isResponseCollapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Response Content */}
                {!isResponseCollapsed && (
                  <div className="h-full bg-white dark:bg-gray-800 flex flex-col">
                    <ResponseViewer 
                      response={executionResult.response}
                      testResults={executionResult.testResults}
                      consoleLogs={consoleLogs}
                    />
                  </div>
                )}
                
                {/* Collapsed State */}
                {isResponseCollapsed && (
                  <div className="bg-white dark:bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className={`font-medium ${
                        executionResult.response?.status && executionResult.response.status >= 200 && executionResult.response.status < 300
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {executionResult.response?.status || 'N/A'} {executionResult.response?.statusText || ''}
                      </span>
                      <span>•</span>
                      <span>{executionResult.response?.timing?.total || 0}ms</span>
                      <span>•</span>
                      <span>{executionResult.response?.size?.body || 0} bytes</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Save to Collection Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Save Request to Collection
            </h3>
            <form onSubmit={handleSaveToCollection}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Name
                </label>
                <input
                  type="text"
                  value={saveRequestName}
                  onChange={(e) => setSaveRequestName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter request name"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection or Folder
                </label>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a collection or folder</option>
                  {getFlattenedCollections(collections).map((item) => (
                    <option key={item.id} value={item.id}>
                      {'  '.repeat(item.level)}
                      {item.level > 0 ? '└─ ' : ''}
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveRequestName('');
                    setSelectedCollectionId('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!saveRequestName.trim() || !selectedCollectionId}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

MainContent.displayName = 'MainContent';

export default MainContent;
