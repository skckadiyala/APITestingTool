import { useState, useRef, useEffect } from 'react';
import VariableInput from '../common/VariableInput';

interface URLBarProps {
  method: string;
  url: string;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onSave: () => void;
  isLoading?: boolean;
  isSaved?: boolean;
  isExistingRequest?: boolean;
  isDirty?: boolean;
  validateSSL?: boolean;
  onValidateSSLChange?: (value: boolean) => void;
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
  onMethodChange,
  onUrlChange,
  onSend,
  onSave,
  isLoading = false,
  isSaved = false,
  isExistingRequest = false,
  isDirty = false,
  validateSSL = true,
  onValidateSSLChange,
}: URLBarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [urlHistory] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettings]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSend();
    }
  };

  const filteredHistory = urlHistory.filter((historyUrl) =>
    historyUrl.toLowerCase().includes(url.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex gap-2 items-center">
        {/* Method Dropdown */}
        <div className="relative">
          <select
            value={method}
            onChange={(e) => onMethodChange(e.target.value)}
            className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[100px] ${
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

        {/* URL Input with Variable Support */}
        <div className="flex-1 relative">
          <div className="relative">
            <VariableInput
              value={url}
              onChange={(newUrl) => {
                onUrlChange(newUrl);
                setShowHistory(newUrl.length > 0);
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter request URL (use {{variable}} for variables)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            
            {/* SSL Verification Disabled Badge */}
            {!validateSSL && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                SSL Off
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showHistory && filteredHistory.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredHistory.map((historyUrl, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onUrlChange(historyUrl);
                    setShowHistory(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">{historyUrl}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings Button */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            title="Request Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Request Settings</h3>
                
                {/* SSL Certificate Verification */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      SSL Certificate Verification
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Disable for self-signed certificates
                    </p>
                  </div>
                  <button
                    onClick={() => onValidateSSLChange?.(!validateSSL)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      validateSSL ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        validateSSL ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {!validateSSL && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                    <div className="flex gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Warning: Disabling SSL verification can expose you to security risks. Only use for development.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={isLoading || !url}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Send
            </>
          )}
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={!url}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title={isExistingRequest ? 'Save changes to this request' : 'Save as new request to collection'}
        >
          {isSaved ? (
            <>
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Saved
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd> to send
      </div>
    </div>
  );
}
