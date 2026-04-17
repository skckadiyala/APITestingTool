import { useState, useRef, useEffect, useMemo } from 'react';
import VariableInput from '../common/VariableInput';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useCollectionStore } from '../../stores/collectionStore';
import type { RequestType, PathParam } from '../../types/request.types';
import { REQUEST_TYPE_CONFIG, getRequestTypeLabel } from '../../utils/requestTypeConfig';
import { extractPathParams } from '../../utils/urlHelpers';

interface URLBarProps {
  method: string;
  url: string;
  requestType?: RequestType;
  requestName?: string;
  pathParams?: PathParam[];
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onRequestTypeChange?: (type: RequestType) => void;
  onRequestNameChange?: (name: string) => void;
  onSend: () => void;
  onSave: () => void;
  onViewPathParams?: () => void;
  isLoading?: boolean;
  isSaved?: boolean;
  isExistingRequest?: boolean;
  isDirty?: boolean;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  HEAD: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  OPTIONS: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

export default function URLBar({
  method,
  url,
  requestType = 'REST',
  requestName = 'Untitled Request',
  pathParams = [],
  onMethodChange,
  onUrlChange,
  onRequestTypeChange,
  onRequestNameChange,
  onSend,
  onSave,
  onViewPathParams,
  isLoading = false,
  isSaved = false,
  isExistingRequest = false,
  isDirty = false,
}: URLBarProps) {
  const [showRequestTypeMenu, setShowRequestTypeMenu] = useState(false);
  const [showUrlPreview, setShowUrlPreview] = useState(false);
  const requestTypeRef = useRef<HTMLDivElement>(null);
  const { currentWorkspaceId } = useCollectionStore();
  const { canEdit } = useWorkspacePermission(currentWorkspaceId);

  // Detect path parameters from URL
  const detectedPathParams = useMemo(() => {
    return extractPathParams(url);
  }, [url]);

  // Check which path params have empty values
  const emptyPathParams = useMemo(() => {
    return pathParams.filter(p => !p.value || p.value.trim() === '');
  }, [pathParams]);

  const hasEmptyPathParams = emptyPathParams.length > 0;

  // Render URL with syntax highlighting for path params
  const renderHighlightedUrl = (url: string) => {
    const parts = url.split(/(:[\w]+|\{[\w]+\})/g);
    return parts.map((part, i) => {
      if (part.match(/^:[\w]+$/) || part.match(/^\{[\w]+\}$/)) {
        const paramKey = part.replace(/^:|^\{|\}$/g, '');
        const paramValue = pathParams.find(p => p.key === paramKey);
        const isEmpty = !paramValue?.value || paramValue.value.trim() === '';
        
        return (
          <span
            key={i}
            className={`font-semibold px-1 rounded ${
              isEmpty
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
            }`}
            title={isEmpty ? `Path parameter '${part}' has no value` : `${part} = ${paramValue?.value}`}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Close request type menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (requestTypeRef.current && !requestTypeRef.current.contains(event.target as Node)) {
        setShowRequestTypeMenu(false);
      }
    };

    if (showRequestTypeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRequestTypeMenu]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSend();
    }
  };

  // Get URL placeholder based on request type
  const getUrlPlaceholder = () => {
    switch (requestType) {
      case 'GRAPHQL':
        return 'Enter GraphQL endpoint (use {{variable}} for variables)';
      case 'WEBSOCKET':
        return 'Enter WebSocket URL (use {{variable}} for variables)';
      default:
        return 'Enter request URL (use {{variable}} for variables)';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Request Name and Type Selector Row */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 relative -ml-px">
        <div className="flex gap-3 items-center">
          {/* Request Type Selector with Postman-style dropdown */}
          <div className="relative" ref={requestTypeRef}>
            <button
              onClick={() => setShowRequestTypeMenu(!showRequestTypeMenu)}
              disabled={!onRequestTypeChange}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 min-w-[110px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-primary-600 dark:text-primary-400">
                {(() => {
                  const IconComponent = REQUEST_TYPE_CONFIG[requestType].icon;
                  return <IconComponent className="w-3.5 h-3.5" />;
                })()}
              </span>
              <span className="text-xs font-medium">{getRequestTypeLabel(requestType)}</span>
              <svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Request Type Dropdown Menu */}
            {showRequestTypeMenu && onRequestTypeChange && (
              <div className="absolute top-full left-0 mt-1 w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50">
                {(['REST', 'GRAPHQL', 'WEBSOCKET'] as const).map((type) => {
                  const config = REQUEST_TYPE_CONFIG[type];
                  const IconComponent = config.icon;
                  const colorClasses = {
                    REST: 'text-primary-600 dark:text-primary-400',
                    GRAPHQL: 'text-pink-600 dark:text-pink-400',
                    WEBSOCKET: 'text-orange-600 dark:text-orange-400',
                  };
                  
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        onRequestTypeChange(type);
                        setShowRequestTypeMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        requestType === type ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <span className={colorClasses[type]}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs text-gray-900 dark:text-gray-100">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Editable Request Name */}
          <input
            type="text"
            value={requestName}
            onChange={(e) => onRequestNameChange?.(e.target.value)}
            placeholder="Untitled Request"
            className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 rounded-md focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* URL Bar Row */}
      <div className="px-4 py-2">
        <div className="flex gap-2 items-center">
        {/* Method Dropdown (REST only) or POST Badge (GraphQL) */}
        {requestType === 'REST' ? (
          <div className="relative">
            <select
              value={method}
              onChange={(e) => onMethodChange(e.target.value)}
              className={`px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[90px] ${
                METHOD_COLORS[method] || 'bg-white dark:bg-gray-700'
              }`}
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        ) : requestType === 'GRAPHQL' ? (
          <div
            className="px-2 py-1.5 rounded-md font-semibold text-xs min-w-[90px] text-center bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
            title="GraphQL requests always use POST method"
          >
            POST
          </div>
        ) : (
          <div
            className="px-2 py-1.5 rounded-md font-semibold text-xs min-w-[90px] text-center bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
            title="WebSocket connection"
          >
            WS
          </div>
        )}

        {/* URL Input with Variable Support */}
        <div className="flex-1 relative">
          <div className="relative">
            {showUrlPreview && detectedPathParams.length > 0 ? (
              <div
                onClick={() => setShowUrlPreview(false)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[34px] flex items-center cursor-text"
                title="Click to edit URL"
              >
                {renderHighlightedUrl(url)}
              </div>
            ) : (
              <VariableInput
                value={url}
                onChange={onUrlChange}
                onKeyDown={handleKeyPress}
                onBlur={() => detectedPathParams.length > 0 && setShowUrlPreview(true)}
                placeholder={getUrlPlaceholder()}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
            {/* Path Parameters Badge */}
            {detectedPathParams.length > 0 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {/* View Path Params Button */}
                {onViewPathParams && (
                  <button
                    onClick={onViewPathParams}
                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                    title="View path parameters in Params tab"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Params
                  </button>
                )}
                {/* Path Params Count Badge */}
                <div
                  onClick={onViewPathParams}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    hasEmptyPathParams
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50'
                  } transition-colors`}
                  title={
                    hasEmptyPathParams
                      ? `${emptyPathParams.length} path parameter(s) missing value: ${emptyPathParams.map(p => ':' + p.key).join(', ')}. Click to fill.`
                      : `Path parameters detected: ${detectedPathParams.map(p => ':' + p).join(', ')}. Click to view.`
                  }
                >
                  {hasEmptyPathParams ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  )}
                  <span>{detectedPathParams.length} param{detectedPathParams.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Send Button */}
        <div className="relative group">
          <button
            onClick={onSend}
            disabled={isLoading || !url}
            title="Send request (Ctrl+Enter or ⌘+Enter)"
            className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 min-w-[80px] justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>

        {/* Save Button */}
        {canEdit && (
          <button
            onClick={onSave}
            disabled={!url || (isExistingRequest && !isDirty)}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
            title={
              isExistingRequest 
                ? (isDirty ? 'Save changes to this request' : 'No changes to save')
                : 'Save as new request to collection'
            }
          >
            {isSaved ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                {isExistingRequest ? 'Save' : 'Save As'}
              </>
          )}
        </button>
      )}
        </div>
      </div>
    </div>
  );
}
