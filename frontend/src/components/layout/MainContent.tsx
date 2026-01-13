import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import URLBar from '../request/URLBar';
import RequestTabs from '../request/RequestTabs';
import RequestTabBar from '../request/RequestTabBar';
import ResponseViewer from '../response/ResponseViewer';
import CollectionViewer from '../collections/CollectionViewer';
import { type KeyValuePair } from '../request/KeyValueEditor';
import { type BodyType } from '../request/BodyEditor';
import { requestService, type ExecutionResult } from '../../services/requestService';
import { fetchHistoryDetail, type HistoryEntry } from '../../services/historyService';
import { useCollectionStore } from '../../stores/collectionStore';
import { useTabStore } from '../../stores/tabStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import type { Collection } from '../../services/collectionService';

type TabType = 'params' | 'headers' | 'body' | 'auth' | 'pre-request' | 'tests';
type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';

export interface MainContentRef {
  restoreFromHistory: (entry: HistoryEntry) => Promise<void>;
  loadRequest: (requestData: {
    method: string;
    url: string;
    params?: Array<{ key: string; value: string; enabled?: boolean }>;
    headers?: Array<{ key: string; value: string }>;
    body?: { type: string; content: any };
    auth?: { type: string };
    testScript?: string;
    preRequestScript?: string;
  }) => void;
  getConsoleLogs: () => Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>;
  clearConsoleLogs: () => void;
}

interface MainContentProps {
  selectedCollection?: Collection | null;
  onDeselectCollection?: () => void;
}

const MainContent = forwardRef<MainContentRef, MainContentProps>(({ selectedCollection }, ref) => {
  // Stores
  const { collections, addRequestToCollection, updateRequestInCollection } = useCollectionStore();
  const { tabs, activeTabId, updateTab } = useTabStore();
  const { activeEnvironmentId, getActiveEnvironment, loadEnvironments } = useEnvironmentStore();
  
  // Request state
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveRequestName, setSaveRequestName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('params');
  
  // Request configuration state
  const [params, setParams] = useState<KeyValuePair[]>([
    { id: '1', key: 'page', value: '1', enabled: true },
    { id: '2', key: 'limit', value: '10', enabled: false },
  ]);
  
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    { id: '2', key: 'Accept', value: 'application/json', enabled: true },
  ]);
  
  const [bodyType, setBodyType] = useState<BodyType>('json');
  const [bodyContent, setBodyContent] = useState('');
  const [formData, setFormData] = useState<Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>>([]);
  
  const [authType, setAuthType] = useState<AuthType>('noauth');
  const [validateSSL, setValidateSSL] = useState(true);
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

  // Wrapper functions to update both local and tab state
  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    if (activeTabId) {
      updateTab(activeTabId, { method: newMethod });
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (activeTabId) {
      updateTab(activeTabId, { url: newUrl });
    }
  };

  const handleParamsChange = (newParams: KeyValuePair[]) => {
    setParams(newParams);
    
    // Update URL to reflect query parameters
    const enabledParams = newParams.filter(p => p.enabled);
    const baseUrl = url.split('?')[0]; // Get URL without query params
    
    if (enabledParams.length > 0) {
      // Build query string manually to preserve {{variables}}
      const queryString = enabledParams
        .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
        .join('&');
      
      const newUrl = `${baseUrl}?${queryString}`;
      setUrl(newUrl);
      
      if (activeTabId) {
        updateTab(activeTabId, { params: newParams, url: newUrl });
      }
    } else {
      // No enabled params, remove query string from URL
      setUrl(baseUrl);
      if (activeTabId) {
        updateTab(activeTabId, { params: newParams, url: baseUrl });
      }
    }
  };

  const handleHeadersChange = (newHeaders: KeyValuePair[]) => {
    setHeaders(newHeaders);
    if (activeTabId) {
      updateTab(activeTabId, { headers: newHeaders });
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
    
    if (activeTabId) {
      const content = (newBodyType === 'x-www-form-urlencoded' || newBodyType === 'form-data') 
        ? JSON.stringify(formData)
        : bodyContent;
      updateTab(activeTabId, { body: { type: newBodyType, content } });
      
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
          updateTab(activeTabId, { headers: updatedHeaders });
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
    if (activeTabId) {
      updateTab(activeTabId, { body: { type: bodyType, content: newContent } });
    }
  };

  const handleFormDataChange = (newFormData: Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>) => {
    setFormData(newFormData);
    if (activeTabId) {
      updateTab(activeTabId, { body: { type: bodyType, content: JSON.stringify(newFormData) } });
    }
  };

  const handleAuthTypeChange = (newAuthType: AuthType) => {
    setAuthType(newAuthType);
    if (activeTabId) {
      updateTab(activeTabId, { auth: { type: newAuthType } });
    }
  };

  const handlePreRequestScriptChange = (newScript: string) => {
    setPreRequestScript(newScript);
    if (activeTabId) {
      updateTab(activeTabId, { preRequestScript: newScript });
    }
  };

  const handleTestScriptChange = (newScript: string) => {
    setTestScript(newScript);
    if (activeTabId) {
      updateTab(activeTabId, { testScript: newScript });
    }
  };

  // Sync active tab data to component state when tab changes
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab) {
      setMethod(activeTab.method);
      setUrl(activeTab.url);
      setParams(activeTab.params?.map((p, idx) => ({
        id: String(idx + 1),
        key: p.key,
        value: p.value,
        enabled: p.enabled !== false,
      })) || []);
      setHeaders(activeTab.headers?.map((h, idx) => ({
        id: String(idx + 1),
        key: h.key,
        value: h.value,
        enabled: true,
      })) || []);
      setBodyType((activeTab.body?.type as BodyType) || 'json');
      const bodyTypeValue = (activeTab.body?.type as BodyType) || 'json';
      const content = typeof activeTab.body?.content === 'string' 
        ? activeTab.body.content 
        : JSON.stringify(activeTab.body?.content || '', null, 2);
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
      
      setAuthType((activeTab.auth?.type as AuthType) || 'noauth');
      setTestScript(activeTab.testScript || '');
      setPreRequestScript(activeTab.preRequestScript || '');
      setHasResponse(false);
      setExecutionResult(null);
      setConsoleLogs([]);
    }
  }, [activeTabId]);

  // Restore request from history
  const restoreFromHistory = async (entry: HistoryEntry) => {
    try {
      // Fetch full history details including request/response bodies
      const historyDetail = await fetchHistoryDetail(entry.id);

      // Restore method and URL
      setMethod(historyDetail.method);
      setUrl(historyDetail.url);

      // Restore headers
      if (historyDetail.requestBody?.headers) {
        const restoredHeaders: KeyValuePair[] = historyDetail.requestBody.headers.map(
          (h, index) => ({
            id: String(index + 1),
            key: h.key,
            value: h.value,
            enabled: true,
          })
        );
        setHeaders(restoredHeaders);
      }

      // Restore body
      if (historyDetail.requestBody?.body) {
        const body = historyDetail.requestBody.body;
        setBodyType(body.type as BodyType);
        // If content is a JSON object, stringify it for the editor
        const content = typeof body.content === 'string' 
          ? body.content 
          : JSON.stringify(body.content, null, 2);
        setBodyContent(content);
      }

      // Restore auth
      if (historyDetail.requestBody?.auth) {
        setAuthType(historyDetail.requestBody.auth.type as AuthType);
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
    headers?: Array<{ key: string; value: string }>;
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
      setParams([
        { id: '1', key: 'page', value: '1', enabled: true },
        { id: '2', key: 'limit', value: '10', enabled: false },
      ]);
    }

    // Load headers
    if (requestData.headers) {
      const loadedHeaders: KeyValuePair[] = requestData.headers.map(
        (h, index) => ({
          id: String(index + 1),
          key: h.key,
          value: h.value,
          enabled: true,
        })
      );
      setHeaders(loadedHeaders);
    } else {
      setHeaders([
        { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
        { id: '2', key: 'Accept', value: 'application/json', enabled: true },
      ]);
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
      // Parse body content for x-www-form-urlencoded and form-data to ensure variable resolution works
      let bodyContentForExecution = bodyContent;
      if ((bodyType === 'x-www-form-urlencoded' || bodyType === 'form-data') && bodyContent) {
        try {
          bodyContentForExecution = JSON.parse(bodyContent);
        } catch {
          // If parsing fails, keep as string
        }
      }
      
      // Get collectionId from active tab for variable resolution
      const activeTab = tabs.find((t) => t.id === activeTabId);
      const collectionId = activeTab?.collectionId;
      
      const result = await requestService.execute({
        method: method as any,
        url: url.trim(),
        params,
        headers,
        body: {
          type: bodyType as any,
          content: bodyContentForExecution,
        },
        auth: {
          type: authType,
        },
        timeout: 30000,
        followRedirects: true,
        maxRedirects: 5,
        validateSSL: validateSSL,
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
        if (result.testResults.logs && result.testResults.logs.length > 0) {
          result.testResults.logs.forEach((output: string) => {
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
        if (activeEnvironmentId && result.testResults?.consoleOutput?.some((msg: string) => msg.includes('Environment variable'))) {
          // Get the current workspace ID from environment store
          const { currentWorkspaceId } = useEnvironmentStore.getState();
          if (currentWorkspaceId) {
            // Reload all environments to get the updated values
            loadEnvironments(currentWorkspaceId);
          }
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
    
    // Check if this is an existing request with changes
    if (activeTab?.requestId && activeTab?.isDirty) {
      // Update existing request
      handleUpdateExistingRequest();
    } else {
      // Save as new request
      setShowSaveDialog(true);
      // Generate default name from URL
      const defaultName = `${method} ${new URL(url).pathname}`;
      setSaveRequestName(defaultName);
    }
  };

  const handleUpdateExistingRequest = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab?.requestId) return;

    try {
      await updateRequestInCollection(activeTab.requestId, {
        name: activeTab.name,
        method,
        url,
        params,
        headers,
        body: bodyContent ? { type: bodyType, content: bodyContent } : undefined,
        auth: { type: authType },
        testScript: testScript.trim() || undefined,
        preRequestScript: preRequestScript.trim() || undefined,
      });
      
      // Mark tab as saved
      updateTab(activeTab.id, { isDirty: false });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      toast.error('Failed to update request');
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
      await addRequestToCollection(
        selectedCollectionId,
        saveRequestName.trim(),
        method,
        url,
        undefined,
        testScript.trim() || undefined,
        undefined,
        params
      );
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
      
      {selectedCollection ? (
        <CollectionViewer collection={selectedCollection} />
      ) : !activeTabId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-lg">No request selected</p>
            <p className="text-sm mt-2">Create a new request or select one from a collection</p>
          </div>
        </div>
      ) : (
        <>
          <URLBar
            method={method}
            url={url}
            onMethodChange={handleMethodChange}
            onUrlChange={handleUrlChange}
            onSend={handleSend}
            onSave={handleSave}
            isLoading={isLoading}
            isSaved={isSaved}
            isExistingRequest={!!tabs.find(t => t.id === activeTabId)?.requestId}
            isDirty={!!tabs.find(t => t.id === activeTabId)?.isDirty}
            validateSSL={validateSSL}
            onValidateSSLChange={setValidateSSL}
          />

          <div className="flex-1 overflow-hidden">
            <RequestTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              params={params}
              headers={headers}
              bodyType={bodyType}
              bodyContent={bodyContent}
              formData={formData}
              authType={authType}
              preRequestScript={preRequestScript}
              testScript={testScript}
              onParamsChange={handleParamsChange}
              onHeadersChange={handleHeadersChange}
              onBodyTypeChange={handleBodyTypeChange}
              onBodyContentChange={handleBodyContentChange}
              onFormDataChange={handleFormDataChange}
              onAuthTypeChange={handleAuthTypeChange}
              onPreRequestScriptChange={handlePreRequestScriptChange}
              onTestScriptChange={handleTestScriptChange}
            />
          </div>

          {hasResponse && executionResult && (
            <div className="h-80 border-t-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex flex-col">
              <ResponseViewer 
                response={executionResult.response}
                testResults={executionResult.testResults}
                consoleLogs={consoleLogs}
              />
            </div>
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
