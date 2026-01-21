import { useState } from 'react';
import KeyValueEditor, { type KeyValuePair } from './KeyValueEditor';
import BodyEditor, { type BodyType } from './BodyEditor';
import Editor from '@monaco-editor/react';

type TabType = 'params' | 'headers' | 'body' | 'auth' | 'pre-request' | 'tests';
type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2' | 'none';

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
      className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
        activeTab === tab
          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 px-2">
          <TabButton tab="params" label="Params" count={params.filter(p => p.enabled).length} />
          <TabButton tab="headers" label="Headers" count={headers.filter(h => h.enabled).length} />
          <TabButton tab="body" label="Body" />
          <TabButton tab="auth" label="Auth" />
          <TabButton tab="pre-request" label="Pre-request Script" />
          <TabButton tab="tests" label="Tests" />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-2">
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
          <div className="flex h-full">
            {/* Left Panel - Auth Type Selector */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Auth Type
              </h3>
              <select
                value={authType}
                onChange={(e) => onAuthTypeChange(e.target.value as AuthType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="noauth">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
                <option value="oauth2">OAuth 2.0</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {authType === 'noauth' && 'No authorization required'}
                {authType === 'bearer' && 'Token-based authentication'}
                {authType === 'basic' && 'Username and password'}
                {authType === 'apikey' && 'Key-based authentication'}
                {authType === 'oauth2' && 'OAuth 2.0 protocol'}
              </p>
            </div>

            {/* Right Panel - Auth Configuration */}
            <div className="flex-1 p-8 overflow-auto bg-white dark:bg-gray-800">
              {/* No Auth */}
              {authType === 'noauth' && (
                <div className="max-w-2xl">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        This request does not use any authorization. The request will be sent without authentication headers.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        You can configure authorization for this request using any of the auth types above.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bearer Token */}
              {authType === 'bearer' && (
                <div className="max-w-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Token
                      </label>
                      <input
                        type="text"
                        value={authConfig.bearerToken}
                        onChange={(e) => setAuthConfig({ ...authConfig, bearerToken: e.target.value })}
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

              {/* Basic Auth */}
              {authType === 'basic' && (
                <div className="max-w-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Username
                      </label>
                      <input
                        type="text"
                        value={authConfig.basicUsername}
                        onChange={(e) => setAuthConfig({ ...authConfig, basicUsername: e.target.value })}
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
                        value={authConfig.basicPassword}
                        onChange={(e) => setAuthConfig({ ...authConfig, basicPassword: e.target.value })}
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

              {/* API Key */}
              {authType === 'apikey' && (
                <div className="max-w-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Key Name
                      </label>
                      <input
                        type="text"
                        value={authConfig.apiKeyName}
                        onChange={(e) => setAuthConfig({ ...authConfig, apiKeyName: e.target.value })}
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
                        value={authConfig.apiKeyValue}
                        onChange={(e) => setAuthConfig({ ...authConfig, apiKeyValue: e.target.value })}
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
                            checked={authConfig.apiKeyLocation === 'header'}
                            onChange={() => setAuthConfig({ ...authConfig, apiKeyLocation: 'header' })}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Header</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            checked={authConfig.apiKeyLocation === 'query'}
                            onChange={() => setAuthConfig({ ...authConfig, apiKeyLocation: 'query' })}
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
                      <span>The API key will be added to {authConfig.apiKeyLocation === 'header' ? 'request headers' : 'query parameters'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* OAuth 2.0 */}
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
