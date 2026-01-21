import { useState, useEffect } from 'react';
import { type Collection } from '../../services/collectionService';
import collectionService from '../../services/collectionService';
import Editor from '@monaco-editor/react';
import KeyValueEditor, { type KeyValuePair } from '../request/KeyValueEditor';
import toast from 'react-hot-toast';
import { useCollectionStore } from '../../stores/collectionStore';

type CollectionTab = 'authorization' | 'pre-request' | 'tests' | 'variables';
type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';

interface CollectionViewerProps {
  collection: Collection;
  onUpdate?: (updates: Partial<Collection>) => void;
}

export default function CollectionViewer({ collection, onUpdate }: CollectionViewerProps) {
  const { loadCollections, currentWorkspaceId } = useCollectionStore();
  const [activeTab, setActiveTab] = useState<CollectionTab>('authorization');
  
  // Initialize from collection data
  // Note: collection.auth may use different structure than TypeScript types
  // TODO: Migrate to strongly-typed AuthConfig structure
  const collectionAuth = (collection.auth as any) || {};
  const authTypeFromCollection = collectionAuth.type || 'noauth';
  
  const [authType, setAuthType] = useState<AuthType>(authTypeFromCollection);
  const [bearerToken, setBearerToken] = useState(collectionAuth.bearer?.[0]?.value || '');
  const [basicUsername, setBasicUsername] = useState(collectionAuth.basic?.username || '');
  const [basicPassword, setBasicPassword] = useState(collectionAuth.basic?.password || '');
  const [apiKeyKey, setApiKeyKey] = useState(collectionAuth.apikey?.key || '');
  const [apiKeyValue, setApiKeyValue] = useState(collectionAuth.apikey?.value || '');
  const [apiKeyAddTo, setApiKeyAddTo] = useState<'header' | 'query'>(collectionAuth.apikey?.in || 'header');
  
  const [preRequestScript, setPreRequestScript] = useState(
    collection.preRequestScript || 
    `// Collection-level Pre-request Script
// This script runs before every request in this collection

pm.environment.set("collectionTimestamp", Date.now());
console.log("Running collection pre-request script");`
  );

  const [testScript, setTestScript] = useState(
    collection.testScript || 
    `// Collection-level Test Script
// This script runs after every request in this collection

pm.test("Collection: Response time is acceptable", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});`
  );

  const [variables, setVariables] = useState<KeyValuePair[]>(
    collection.variables && collection.variables.length > 0
      ? collection.variables.map((v: any, idx: number) => ({
          id: String(idx + 1),
          key: v.key || '',
          value: String(v.value || ''),
          enabled: v.enabled !== false
        }))
      : [{ id: '1', key: '', value: '', enabled: true }]
  );

  const [isSaving, setIsSaving] = useState(false);

  // Reset state when collection changes (e.g., switching between tabs)
  useEffect(() => {
    if (!collection) return;

    const collectionAuth = (collection.auth as any) || {};
    const authTypeFromCollection = collectionAuth.type || 'noauth';

    setAuthType(authTypeFromCollection);
    setBearerToken(collectionAuth.bearer?.[0]?.value || '');
    setBasicUsername(collectionAuth.basic?.username || '');
    setBasicPassword(collectionAuth.basic?.password || '');
    setApiKeyKey(collectionAuth.apikey?.key || '');
    setApiKeyValue(collectionAuth.apikey?.value || '');
    setApiKeyAddTo(collectionAuth.apikey?.in || 'header');

    setPreRequestScript(
      collection.preRequestScript || 
      `// Collection-level Pre-request Script
// This script runs before every request in this collection

pm.environment.set("collectionTimestamp", Date.now());
console.log("Running collection pre-request script");`
    );

    setTestScript(
      collection.testScript || 
      `// Collection-level Test Script
// This script runs after every request in this collection

pm.test("Collection: Response time is acceptable", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});`
    );

    setVariables(
      collection.variables && collection.variables.length > 0
        ? collection.variables.map((v: any, idx: number) => ({
            id: String(idx + 1),
            key: v.key || '',
            value: String(v.value || ''),
            enabled: v.enabled !== false
          }))
        : [{ id: '1', key: '', value: '', enabled: true }]
    );
  }, [collection?.id]); // Re-run when collection ID changes

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Build auth object based on type
      let authData: any = { type: authType };
      
      if (authType === 'bearer') {
        authData.bearer = [{ key: 'token', value: bearerToken, type: 'string' }];
      } else if (authType === 'basic') {
        authData.basic = { username: basicUsername, password: basicPassword };
      } else if (authType === 'apikey') {
        authData.apikey = { key: apiKeyKey, value: apiKeyValue, in: apiKeyAddTo };
      }

      // Convert KeyValuePair to simple variable format
      const variablesData = variables
        .filter(v => v.key.trim())
        .map(v => ({
          key: v.key,
          value: v.value,
          enabled: v.enabled,
          type: v.type === 'secret' ? 'secret' : 'default' as 'default' | 'secret'
        }));

      await collectionService.updateCollection(collection.id, currentWorkspaceId, {
        variables: variablesData,
        preRequestScript,
        testScript,
        auth: authData
      });

      await loadCollections(currentWorkspaceId);
      toast.success('Collection settings saved successfully');
      onUpdate?.({
        variables: variablesData,
        preRequestScript,
        testScript,
        auth: authData
      });
    } catch (error) {
      console.error('Failed to save collection settings:', error);
      toast.error('Failed to save collection settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'authorization' as const, label: 'Authorization' },
    { id: 'pre-request' as const, label: 'Pre-request Script' },
    { id: 'tests' as const, label: 'Tests' },
    { id: 'variables' as const, label: 'Variables' },
  ];

  const authTypes = [
    { id: 'noauth' as const, label: 'No Auth', description: 'No authorization required' },
    { id: 'bearer' as const, label: 'Bearer Token', description: 'Token-based authentication' },
    { id: 'basic' as const, label: 'Basic Auth', description: 'Username and password' },
    { id: 'apikey' as const, label: 'API Key', description: 'Key-based authentication' },
    { id: 'oauth2' as const, label: 'OAuth 2.0', description: 'OAuth 2.0 protocol' },
  ];

  const renderAuthorizationContent = () => {
    return (
      <div className="flex h-full">
        {/* Left Panel - Auth Type Selector */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Auth Type
          </h3>
          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value as AuthType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {authTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {authTypes.find(t => t.id === authType)?.description}
          </p>
        </div>

        {/* Right Panel - Auth Configuration */}
        <div className="flex-1 p-8 overflow-auto bg-white dark:bg-gray-800">
          {authType === 'noauth' && (
            <div className="max-w-2xl">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    This collection does not use any authorization. Requests in this collection will be sent without authentication headers.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    You can still configure authorization for individual requests if needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {authType === 'bearer' && (
            <div className="max-w-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    Token
                  </label>
                  <input
                    type="text"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    placeholder="Enter your bearer token"
                    className="w-96 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg ml-38">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The token will be sent in the Authorization header as <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-xs font-mono">Bearer {'{token}'}</code></span>
                </div>
              </div>
            </div>
          )}

          {authType === 'basic' && (
            <div className="max-w-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    Username
                  </label>
                  <input
                    type="text"
                    value={basicUsername}
                    onChange={(e) => setBasicUsername(e.target.value)}
                    placeholder="Username"
                    className="w-96 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    Password
                  </label>
                  <input
                    type="password"
                    value={basicPassword}
                    onChange={(e) => setBasicPassword(e.target.value)}
                    placeholder="Password"
                    className="w-96 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg ml-38">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Credentials will be Base64 encoded and sent in the Authorization header</span>
                </div>
              </div>
            </div>
          )}

          {authType === 'apikey' && (
            <div className="max-w-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={apiKeyKey}
                    onChange={(e) => setApiKeyKey(e.target.value)}
                    placeholder="e.g., X-API-Key"
                    className="w-96 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    Value
                  </label>
                  <input
                    type="text"
                    value={apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    placeholder="Your API key"
                    className="w-96 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    Add To
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="apiKeyLocation"
                        value="header"
                        checked={apiKeyAddTo === 'header'}
                        onChange={(e) => setApiKeyAddTo(e.target.value as 'header' | 'query')}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Header</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="apiKeyLocation"
                        value="query"
                        checked={apiKeyAddTo === 'query'}
                        onChange={(e) => setApiKeyAddTo(e.target.value as 'header' | 'query')}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Query Params</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg ml-38">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The API key will be added to {apiKeyAddTo === 'header' ? 'request headers' : 'query parameters'}</span>
                </div>
              </div>
            </div>
          )}

          {authType === 'oauth2' && (
            <div className="max-w-2xl">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      OAuth 2.0 Coming Soon
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Full OAuth 2.0 configuration support will be available in an upcoming release.
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      In the meantime, you can use <span className="font-medium">Bearer Token</span> authentication with a manually obtained access token.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Collection Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {collection.name}
          </h2>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-1 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
        {activeTab === 'authorization' && renderAuthorizationContent()}
        
        {activeTab === 'pre-request' && (
          <div className="h-full p-4">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={preRequestScript}
              onChange={(value) => setPreRequestScript(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        )}
        
        {activeTab === 'tests' && (
          <div className="h-full p-4">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={testScript}
              onChange={(value) => setTestScript(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        )}
        
        {activeTab === 'variables' && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collection Variables
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Variables defined here are available to all requests in this collection.
              </p>
            </div>
            <KeyValueEditor
              pairs={variables}
              onChange={setVariables}
              placeholder={{ key: 'variable_name', value: 'value' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
