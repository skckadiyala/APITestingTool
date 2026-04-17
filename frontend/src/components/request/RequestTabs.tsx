import { useState, useEffect } from 'react';
import KeyValueEditor, { type KeyValuePair } from './KeyValueEditor';
import BodyEditor, { type BodyType } from './BodyEditor';
import Editor from '@monaco-editor/react';
import GraphQLQueryPanel from './GraphQLQueryPanel';
import GraphQLSchemaViewer from './GraphQLSchemaViewer';
import type { GraphQLSchema, RequestType, PathParam } from '../../types/request.types';
import type { AuthConfig } from '../../types';
import { configureScriptIntelliSense } from '../../utils/scriptIntelliSense';

type TabType = 'params' | 'headers' | 'body' | 'query' | 'schema' | 'auth' | 'pre-request' | 'tests';
type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2' | 'none';

interface RequestTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  requestType?: RequestType;
  pathParams: PathParam[];
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: BodyType;
  bodyContent: string;
  formData?: Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>;
  authType: AuthType;
  authConfig?: AuthConfig;
  preRequestScript: string;
  testScript: string;
  // GraphQL-specific props
  graphqlQuery?: string;
  graphqlVariables?: Record<string, any>;
  graphqlSchema?: GraphQLSchema;
  schemaUrl?: string;
  schemaLastFetched?: Date;
  schemaLoading?: boolean;
  onPathParamsChange: (pathParams: PathParam[]) => void;
  onParamsChange: (params: KeyValuePair[]) => void;
  onHeadersChange: (headers: KeyValuePair[]) => void;
  onBodyTypeChange: (type: BodyType) => void;
  onBodyContentChange: (content: string) => void;
  onFormDataChange?: (formData: Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>) => void;
  onAuthTypeChange: (type: AuthType) => void;
  onAuthConfigChange?: (config: AuthConfig) => void;
  onPreRequestScriptChange: (script: string) => void;
  onTestScriptChange: (script: string) => void;
  // GraphQL handlers
  onGraphqlQueryChange?: (query: string) => void;
  onGraphqlVariablesChange?: (variables: Record<string, any>) => void;
  onFetchSchema?: () => void;
  onRefreshSchema?: () => void;
  onInsertField?: (field: string) => void;
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

const AUTH_TYPE_COLORS: Record<string, string> = {
  noauth: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  bearer: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  basic: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  apikey: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  oauth2: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

export default function RequestTabs({
  activeTab,
  onTabChange,
  requestType = 'REST',
  pathParams,
  params,
  headers,
  bodyType,
  bodyContent,
  formData = [],
  authType,
  authConfig: parentAuthConfig,
  preRequestScript,
  testScript,
  graphqlQuery = '',
  graphqlVariables = {},
  graphqlSchema,
  schemaUrl,
  schemaLastFetched,
  schemaLoading = false,
  onPathParamsChange,
  onParamsChange,
  onHeadersChange,
  onBodyTypeChange,
  onBodyContentChange,
  onFormDataChange,
  onAuthTypeChange,
  onAuthConfigChange,
  onPreRequestScriptChange,
  onTestScriptChange,
  onGraphqlQueryChange,
  onGraphqlVariablesChange,
  onFetchSchema,
  onRefreshSchema,
  onInsertField,
}: RequestTabsProps) {
  // Local state for auth configuration UI
  const [authConfig, setAuthConfig] = useState({
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    apiKeyName: 'X-API-Key',
    apiKeyValue: '',
    apiKeyLocation: 'header' as 'header' | 'query',
  });

  // Initialize local auth state from parent's authConfig
  useEffect(() => {
    if (parentAuthConfig) {
      if (parentAuthConfig.type === 'bearer') {
        setAuthConfig(prev => ({ ...prev, bearerToken: parentAuthConfig.token || '' }));
      } else if (parentAuthConfig.type === 'basic') {
        setAuthConfig(prev => ({
          ...prev,
          basicUsername: parentAuthConfig.username || '',
          basicPassword: parentAuthConfig.password || ''
        }));
      } else if (parentAuthConfig.type === 'apikey') {
        setAuthConfig(prev => ({
          ...prev,
          apiKeyName: parentAuthConfig.key || 'X-API-Key',
          apiKeyValue: parentAuthConfig.value || '',
          apiKeyLocation: parentAuthConfig.in || 'header'
        }));
      }
    }
  }, [parentAuthConfig?.type]);

  // Configure Monaco Editor IntelliSense for script editing
  useEffect(() => {
    configureScriptIntelliSense();
  }, []);

  const TabButton = ({ tab, label, count }: { tab: TabType; label: string; count?: number }) => (
    <button
      onClick={() => onTabChange(tab)}
      className={`px-2 py-1 text-xs font-medium border-b-2 transition-colors ${
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
        <div className="flex gap-1 px-1.5">
          {/* Hide Params tab for GraphQL - GraphQL doesn't use query parameters */}
          {requestType !== 'GRAPHQL' && (
            <TabButton tab="params" label="Params" count={params.filter(p => p.enabled).length} />
          )}
          <TabButton tab="headers" label="Headers" count={headers.filter(h => h.enabled).length} />
          {requestType === 'GRAPHQL' ? (
            <>
              <TabButton tab="query" label="Query" />
              <TabButton tab="schema" label="Schema" />
            </>
          ) : (
            <TabButton tab="body" label="Body" />
          )}
          <TabButton tab="auth" label="Auth" />
          <TabButton tab="pre-request" label="Pre-request Script" />
          <TabButton tab="tests" label="Tests" />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-1.5">
        {/* Params Tab */}
        {activeTab === 'params' && (
          <div className="space-y-4">
            {/* Query Parameters Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Query Parameters
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {params.filter(p => p.enabled).length} active
                </span>
              </div>
              <KeyValueEditor
                pairs={params}
                onChange={onParamsChange}
                placeholder={{ key: 'key', value: 'value' }}
                showDescription={true}
                bulkEditMode={true}
              />
            </div>

            {/* Path Parameters Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Path Parameters
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {pathParams.length} variable{pathParams.length !== 1 ? 's' : ''}
                </span>
                {/* Info Icon with Tooltip */}
                <div className="relative group ml-auto">
                  <button
                    onClick={() => window.open('https://github.com/APITestingTool/docs/blob/main/features/path-parameters.md', '_blank')}
                    className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    title="Learn more about path parameters"
                  >
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                      <div className="font-semibold mb-1">Path Parameters vs Query Parameters</div>
                      <div className="text-left space-y-1">
                        <div>• Path: <code className="text-blue-300 dark:text-blue-600">/users/:id</code> - Resource identifier</div>
                        <div>• Query: <code className="text-blue-300 dark:text-blue-600">?status=active</code> - Filters/options</div>
                      </div>
                      <div className="mt-2 text-blue-300 dark:text-blue-600 underline">Click for full documentation</div>
                      {/* Arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                    </div>
                  </div>
                </div>
              </div>
              {pathParams.length > 0 ? (
                <>
                  {/* Validation Warnings */}
                  {(() => {
                    const warnings: Array<{ param: string; message: string; type: 'error' | 'warning' }> = [];
                    
                    // Check for empty values
                    pathParams.forEach(p => {
                      if (!p.value || p.value.trim() === '') {
                        warnings.push({
                          param: p.key,
                          message: `Path parameter ':${p.key}' has no value`,
                          type: 'error'
                        });
                      }
                    });
                    
                    // Check for duplicate param names
                    const paramNames = pathParams.map(p => p.key);
                    const duplicates = paramNames.filter((name, index) => paramNames.indexOf(name) !== index);
                    const uniqueDuplicates = [...new Set(duplicates)];
                    uniqueDuplicates.forEach(dup => {
                      warnings.push({
                        param: dup,
                        message: `Duplicate path parameter ':${dup}' - same value will be used for all occurrences`,
                        type: 'warning'
                      });
                    });
                    
                    // Check for special characters
                    pathParams.forEach(p => {
                      if (p.value && p.value.includes('/')) {
                        warnings.push({
                          param: p.key,
                          message: `Path parameter ':${p.key}' contains '/' character - this may be a mistake`,
                          type: 'warning'
                        });
                      }
                    });
                    
                    if (warnings.length === 0) return null;
                    
                    return (
                      <div className="px-4 py-2 space-y-1 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                        {warnings.map((warning, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-start gap-2 text-xs ${
                              warning.type === 'error' 
                                ? 'text-red-700 dark:text-red-400' 
                                : 'text-yellow-700 dark:text-yellow-400'
                            }`}
                          >
                            <svg 
                              className="w-4 h-4 flex-shrink-0 mt-0.5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              {warning.type === 'error' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              )}
                            </svg>
                            <span>{warning.message}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  
                  <KeyValueEditor
                    pairs={pathParams.map((p, idx) => ({ 
                      id: String(idx + 1), 
                      key: p.key, 
                      value: p.value, 
                      description: p.description || '',
                      enabled: true 
                    }))}
                    onChange={(pairs) => {
                      // Filter out empty rows (KeyValueEditor auto-adds them, but we don't want them for path params)
                      const updated = pairs
                        .filter(p => p.key.trim() !== '') // Only keep rows with actual path param names
                        .map(p => ({ key: p.key, value: p.value, description: p.description }));
                      onPathParamsChange(updated);
                    }}
                    placeholder={{ key: 'param', value: 'value' }}
                    showDescription={true}
                    bulkEditMode={true}
                  />
                </>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No path parameters detected in URL. Use <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">:paramName</code> or <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{'{paramName}'}</code> in the URL.
                </div>
              )}
            </div>
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

        {/* Query Tab (GraphQL) */}
        {activeTab === 'query' && requestType === 'GRAPHQL' && (
          <div className="h-full">
            <GraphQLQueryPanel
              query={graphqlQuery}
              variables={graphqlVariables}
              schema={graphqlSchema}
              schemaLoading={schemaLoading}
              onQueryChange={onGraphqlQueryChange || (() => {})}
              onVariablesChange={onGraphqlVariablesChange || (() => {})}
              onInsertField={onInsertField}
            />
          </div>
        )}

        {/* Schema Tab (GraphQL) */}
        {activeTab === 'schema' && requestType === 'GRAPHQL' && (
          <div className="h-full">
            <GraphQLSchemaViewer
              schema={graphqlSchema}
              schemaUrl={schemaUrl}
              lastFetched={schemaLastFetched}
              loading={schemaLoading}
              onFetchSchema={onFetchSchema || (() => {})}
              onRefreshSchema={onRefreshSchema || (() => {})}
              onInsertField={onInsertField || (() => {})}
            />
          </div>
        )}

        {/* Auth Tab */}
        {activeTab === 'auth' && (
          <div className="flex h-full">
            {/* Left Panel - Auth Type Selector */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
              <h3 className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Auth Type
              </h3>
              <select
                value={authType}
                onChange={(e) => onAuthTypeChange(e.target.value as AuthType)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  AUTH_TYPE_COLORS[authType] || 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <option value="noauth">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
                <option value="oauth2">OAuth 2.0</option>
              </select>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
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
                      <p className="text-[12px] text-gray-700 dark:text-gray-300">
                        This request does not use any authorization. The request will be sent without authentication headers.
                      </p>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
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
                      <label className="w-32 text-[12px] font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Token
                      </label>
                      <input
                        type="text"
                        value={authConfig.bearerToken}
                        onChange={(e) => {
                          const newToken = e.target.value;
                          setAuthConfig({ ...authConfig, bearerToken: newToken });
                          if (onAuthConfigChange) {
                            onAuthConfigChange({ type: 'bearer', token: newToken });
                          }
                        }}
                        placeholder="Enter your bearer token"
                        className="w-96 px-4 py-2.5 text-[12px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
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
                      <label className="w-32 text-[12px] font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Username
                      </label>
                      <input
                        type="text"
                        value={authConfig.basicUsername}
                        onChange={(e) => {
                          const newUsername = e.target.value;
                          setAuthConfig({ ...authConfig, basicUsername: newUsername });
                          if (onAuthConfigChange) {
                            onAuthConfigChange({
                              type: 'basic',
                              username: newUsername,
                              password: authConfig.basicPassword
                            });
                          }
                        }}
                        placeholder="Username"
                        className="w-96 px-4 py-2.5 text-[12px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="w-32 text-[12px] font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Password
                      </label>
                      <input
                        type="password"
                        value={authConfig.basicPassword}
                        onChange={(e) => {
                          const newPassword = e.target.value;
                          setAuthConfig({ ...authConfig, basicPassword: newPassword });
                          if (onAuthConfigChange) {
                            onAuthConfigChange({
                              type: 'basic',
                              username: authConfig.basicUsername,
                              password: newPassword
                            });
                          }
                        }}
                        placeholder="Password"
                        className="w-96 px-4 py-2.5 text-[12px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
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
                      <label className="w-32 text-[12px] font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Key Name
                      </label>
                      <input
                        type="text"
                        value={authConfig.apiKeyName}
                        onChange={(e) => {
                          const newKeyName = e.target.value;
                          setAuthConfig({ ...authConfig, apiKeyName: newKeyName });
                          if (onAuthConfigChange) {
                            onAuthConfigChange({
                              type: 'apikey',
                              key: newKeyName,
                              value: authConfig.apiKeyValue,
                              in: authConfig.apiKeyLocation
                            });
                          }
                        }}
                        placeholder="e.g., X-API-Key"
                        className="w-96 px-4 py-2.5 text-[12px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="w-32 text-[12px] font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Value
                      </label>
                      <input
                        type="text"
                        value={authConfig.apiKeyValue}
                        onChange={(e) => {
                          const newKeyValue = e.target.value;
                          setAuthConfig({ ...authConfig, apiKeyValue: newKeyValue });
                          if (onAuthConfigChange) {
                            onAuthConfigChange({
                              type: 'apikey',
                              key: authConfig.apiKeyName,
                              value: newKeyValue,
                              in: authConfig.apiKeyLocation
                            });
                          }
                        }}
                        placeholder="Your API key"
                        className="w-96 px-4 py-2.5 text-[12px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="w-32 text-[12px] font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        Add To
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            checked={authConfig.apiKeyLocation === 'header'}
                            onChange={() => {
                              setAuthConfig({ ...authConfig, apiKeyLocation: 'header' });
                              if (onAuthConfigChange) {
                                onAuthConfigChange({
                                  type: 'apikey',
                                  key: authConfig.apiKeyName,
                                  value: authConfig.apiKeyValue,
                                  in: 'header'
                                });
                              }
                            }}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-[12px] text-gray-700 dark:text-gray-300">Header</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            checked={authConfig.apiKeyLocation === 'query'}
                            onChange={() => {
                              setAuthConfig({ ...authConfig, apiKeyLocation: 'query' });
                              if (onAuthConfigChange) {
                                onAuthConfigChange({
                                  type: 'apikey',
                                  key: authConfig.apiKeyName,
                                  value: authConfig.apiKeyValue,
                                  in: 'query'
                                });
                              }
                            }}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-[12px] text-gray-700 dark:text-gray-300">Query Params</span>
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
                        <h4 className="text-[12px] font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          OAuth 2.0 Coming Soon
                        </h4>
                        <p className="text-[12px] text-blue-800 dark:text-blue-200 mb-3">
                          Full OAuth 2.0 configuration support will be available in an upcoming release.
                        </p>
                        <p className="text-[12px] text-blue-700 dark:text-blue-300">
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
              <code className="block">pm.request.pathParams.userId = "123"</code>
              <code className="block">pm.environment.set("key", "value")</code>
              <code className="block">pm.collectionVariables.set("key", "value")</code>
              <code className="block">pm.variables.get("key")</code>
              <div className="mt-2 text-xs text-gray-500">
                💡 Tip: Type <code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">pm.</code> to see all available methods
              </div>
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
              <code className="block mt-2">pm.test("Path param was used correctly", () =&gt; {"{"}</code>
              <code className="block ml-4">const userId = pm.request.pathParams.userId;</code>
              <code className="block ml-4">pm.expect(userId).to.equal("123");</code>
              <code className="block">{"}"})</code>
              <div className="mt-2 text-xs text-gray-500">
                💡 Tip: Type <code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">pm.</code> to see all available methods
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
