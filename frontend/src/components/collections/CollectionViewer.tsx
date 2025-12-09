import { useState } from 'react';
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
  const collectionAuth = collection.auth || {};
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
          type: 'default'
        }));

      await collectionService.updateCollection(collection.id, {
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

  const renderAuthorizationContent = () => {
    return (
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value as AuthType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="noauth">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="apikey">API Key</option>
            <option value="oauth2">OAuth 2.0</option>
          </select>
        </div>

        {authType === 'bearer' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token
            </label>
            <input
              type="text"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              placeholder="Enter bearer token"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {authType === 'basic' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={basicUsername}
                onChange={(e) => setBasicUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={basicPassword}
                onChange={(e) => setBasicPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {authType === 'apikey' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key
              </label>
              <input
                type="text"
                value={apiKeyKey}
                onChange={(e) => setApiKeyKey(e.target.value)}
                placeholder="e.g., X-API-Key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Value
              </label>
              <input
                type="text"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="Enter API key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add to
              </label>
              <select
                value={apiKeyAddTo}
                onChange={(e) => setApiKeyAddTo(e.target.value as 'header' | 'query')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="header">Header</option>
                <option value="query">Query Params</option>
              </select>
            </div>
          </div>
        )}

        {authType === 'noauth' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This collection does not use any authorization. You can still configure authorization for individual requests.
          </p>
        )}

        {authType === 'oauth2' && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">OAuth 2.0 configuration will be available in a future update.</p>
            <p>For now, you can use Bearer Token with a manually obtained access token.</p>
          </div>
        )}
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {collection.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Collection Settings
            </p>
          </div>
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
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
