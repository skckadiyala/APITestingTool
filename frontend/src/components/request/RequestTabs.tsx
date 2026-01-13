import { useState } from 'react';
import KeyValueEditor, { type KeyValuePair } from './KeyValueEditor';
import BodyEditor, { type BodyType } from './BodyEditor';
import Editor from '@monaco-editor/react';

type TabType = 'params' | 'headers' | 'body' | 'auth' | 'pre-request' | 'tests';
type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';

interface RequestTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: BodyType;
  bodyContent: string;
  formData?: Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>;
  authType: AuthType;
  preRequestScript: string;
  testScript: string;
  onParamsChange: (params: KeyValuePair[]) => void;
  onHeadersChange: (headers: KeyValuePair[]) => void;
  onBodyTypeChange: (type: BodyType) => void;
  onBodyContentChange: (content: string) => void;
  onFormDataChange?: (formData: Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>) => void;
  onAuthTypeChange: (type: AuthType) => void;
  onPreRequestScriptChange: (script: string) => void;
  onTestScriptChange: (script: string) => void;
}

const COMMON_HEADERS = [
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Authorization',
  'Cache-Control',
  'Content-Type',
  'Cookie',
  'Host',
  'Origin',
  'Referer',
  'User-Agent',
  'X-API-Key',
  'X-Requested-With',
];

export default function RequestTabs({
  activeTab,
  onTabChange,
  params,
  headers,
  bodyType,
  bodyContent,
  formData = [],
  authType,
  preRequestScript,
  testScript,
  onParamsChange,
  onHeadersChange,
  onBodyTypeChange,
  onBodyContentChange,
  onFormDataChange,
  onAuthTypeChange,
  onPreRequestScriptChange,
  onTestScriptChange,
}: RequestTabsProps) {
  const [authConfig, setAuthConfig] = useState({
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    apiKeyName: 'X-API-Key',
    apiKeyValue: '',
    apiKeyLocation: 'header' as 'header' | 'query',
  });

  const TabButton = ({ tab, label, count }: { tab: TabType; label: string; count?: number }) => (
    <button
      onClick={() => onTabChange(tab)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === tab
          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 px-4">
          <TabButton tab="params" label="Params" count={params.filter(p => p.enabled).length} />
          <TabButton tab="headers" label="Headers" count={headers.filter(h => h.enabled).length} />
          <TabButton tab="body" label="Body" />
          <TabButton tab="auth" label="Auth" />
          <TabButton tab="pre-request" label="Pre-request Script" />
          <TabButton tab="tests" label="Tests" />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-4">
        {/* Params Tab */}
        {activeTab === 'params' && (
          <div>
            <KeyValueEditor
              pairs={params}
              onChange={onParamsChange}
              placeholder={{ key: 'Parameter', value: 'Value' }}
              showDescription={true}
              bulkEditMode={true}
            />
          </div>
        )}

        {/* Headers Tab */}
        {activeTab === 'headers' && (
          <div>
            <KeyValueEditor
              pairs={headers}
              onChange={onHeadersChange}
              placeholder={{ key: 'Header', value: 'Value' }}
              suggestions={COMMON_HEADERS}
              showDescription={true}
              bulkEditMode={true}
            />
          </div>
        )}

        {/* Body Tab */}
        {activeTab === 'body' && (
          <div>
            <BodyEditor
              type={bodyType}
              content={bodyContent}
              onTypeChange={onBodyTypeChange}
              onContentChange={onBodyContentChange}
              formData={formData}
              onFormDataChange={onFormDataChange}
            />
          </div>
        )}

        {/* Auth Tab */}
        {activeTab === 'auth' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auth Type
              </label>
              <select
                value={authType}
                onChange={(e) => onAuthTypeChange(e.target.value as AuthType)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="noauth">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
                <option value="oauth2">OAuth 2.0</option>
              </select>
            </div>

            {/* Bearer Token */}
            {authType === 'bearer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token
                </label>
                <input
                  type="text"
                  value={authConfig.bearerToken}
                  onChange={(e) => setAuthConfig({ ...authConfig, bearerToken: e.target.value })}
                  placeholder="Enter bearer token"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Token will be included in the Authorization header as: Bearer {'{token}'}
                </p>
              </div>
            )}

            {/* Basic Auth */}
            {authType === 'basic' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={authConfig.basicUsername}
                    onChange={(e) => setAuthConfig({ ...authConfig, basicUsername: e.target.value })}
                    placeholder="Enter username"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={authConfig.basicPassword}
                    onChange={(e) => setAuthConfig({ ...authConfig, basicPassword: e.target.value })}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Credentials will be Base64 encoded and sent in the Authorization header
                </p>
              </div>
            )}

            {/* API Key */}
            {authType === 'apikey' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={authConfig.apiKeyName}
                    onChange={(e) => setAuthConfig({ ...authConfig, apiKeyName: e.target.value })}
                    placeholder="X-API-Key"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={authConfig.apiKeyValue}
                    onChange={(e) => setAuthConfig({ ...authConfig, apiKeyValue: e.target.value })}
                    placeholder="Enter API key"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add to
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={authConfig.apiKeyLocation === 'header'}
                        onChange={() => setAuthConfig({ ...authConfig, apiKeyLocation: 'header' })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Header</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={authConfig.apiKeyLocation === 'query'}
                        onChange={() => setAuthConfig({ ...authConfig, apiKeyLocation: 'query' })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Query Params</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* OAuth 2.0 */}
            {authType === 'oauth2' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  OAuth 2.0 configuration will be implemented in Phase 5
                </p>
              </div>
            )}

            {/* No Auth */}
            {authType === 'noauth' && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                This request does not use any authentication
              </div>
            )}
          </div>
        )}

        {/* Pre-request Script Tab */}
        {activeTab === 'pre-request' && (
          <div>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={preRequestScript}
                onChange={(value) => onPreRequestScriptChange(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            </div>
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-xs text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">Available APIs:</p>
              <code className="block">pm.environment.set("key", "value")</code>
              <code className="block">pm.request.headers.add({'{'}key: "value"{'}'})</code>
              <code className="block">pm.variables.get("key")</code>
            </div>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={testScript}
                onChange={(value) => onTestScriptChange(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            </div>
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-xs text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">Example tests:</p>
              <code className="block">pm.test("Status code is 200", () =&gt; {"{"}</code>
              <code className="block ml-4">pm.response.to.have.status(200);</code>
              <code className="block">{"}"})</code>
              <code className="block mt-2">pm.test("Response has users array", () =&gt; {"{"}</code>
              <code className="block ml-4">pm.expect(pm.response.json()).to.have.property("users");</code>
              <code className="block">{"}"})</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
