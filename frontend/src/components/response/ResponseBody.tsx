import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';

interface ResponseBodyProps {
  response: any;
}

type ViewType = 'pretty' | 'raw' | 'json' | 'xml' | 'html' | 'preview';

const detectContentType = (response: any) => {
  if (!response || !response.headers) return 'text';
  const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
  if (contentType.includes('application/json')) return 'json';
  if (contentType.includes('text/html')) return 'html';
  if (contentType.includes('image')) return 'image';
  if (contentType.includes('application/xml') || contentType.includes('text/xml')) return 'xml';
  return 'text';
};

const getDefaultView = (contentType: string): ViewType => {
  if (contentType === 'json') return 'json';
  if (contentType === 'xml') return 'xml';
  if (contentType === 'html') return 'html';
  return 'pretty';
};

// JSON tree component for collapsible sections
const JsonTree: React.FC<{ data: any; level?: number }> = ({ data, level = 0 }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (typeof data !== 'object' || data === null) {
    return <span className="text-blue-400">{JSON.stringify(data)}</span>;
  }

  const isArray = Array.isArray(data);
  const entries = Object.entries(data);

  return (
    <div className="ml-4">
      {entries.map(([key, value], idx) => {
        const isObject = typeof value === 'object' && value !== null;
        const isCollapsed = collapsed[key];
        return (
          <div key={idx} className="my-1">
            {isObject && (
              <span
                onClick={() => toggleCollapse(key)}
                className="cursor-pointer text-gray-400 hover:text-gray-200 mr-1"
              >
                {isCollapsed ? '▶' : '▼'}
              </span>
            )}
            <span className="text-purple-400">{isArray ? `[${key}]` : `"${key}"`}</span>
            <span className="text-gray-500">: </span>
            {isObject && !isCollapsed && <JsonTree data={value} level={level + 1} />}
            {isObject && isCollapsed && <span className="text-gray-500">{Array.isArray(value) ? '[...]' : '{...}'}</span>}
            {!isObject && <span className="text-blue-400">{JSON.stringify(value)}</span>}
          </div>
        );
      })}
    </div>
  );
};

const ResponseBody: React.FC<ResponseBodyProps> = ({ response }) => {
  const contentType = detectContentType(response);
  const [view, setView] = useState<ViewType>(getDefaultView(contentType));
  const body = response?.body || '';

  // Auto-detect and set view when response changes
  useEffect(() => {
    setView(getDefaultView(contentType));
  }, [response, contentType]);

  // Search feature
  const [search, setSearch] = useState('');

  // Copy to clipboard
  const copyToClipboard = () => {
    const textToCopy = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard!');
  };

  // JSON view with syntax highlighting (formatted JSON)
  const renderJSON = () => {
    try {
      const json = typeof body === 'string' ? JSON.parse(body) : body;
      const formatted = JSON.stringify(json, null, 2);
      return (
        <SyntaxHighlighter language="json" style={vscDarkPlus} wrapLongLines customStyle={{ maxHeight: '70vh', fontSize: '12px' }}>
          {formatted}
        </SyntaxHighlighter>
      );
    } catch {
      return <div className="text-xs text-red-500 dark:text-red-400">Invalid JSON</div>;
    }
  };

  // XML view with syntax highlighting (only for XML content)
  const renderXML = () => {
    if (contentType !== 'xml') {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      return <pre className="whitespace-pre-wrap break-words text-xs">{bodyString}</pre>;
    }
    return (
      <SyntaxHighlighter language="xml" style={vscDarkPlus} wrapLongLines customStyle={{ maxHeight: '70vh', fontSize: '12px' }}>
        {body}
      </SyntaxHighlighter>
    );
  };

  // HTML view with syntax highlighting (only for HTML content)
  const renderHTML = () => {
    if (contentType !== 'html') {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      return <pre className="whitespace-pre-wrap break-words text-xs">{bodyString}</pre>;
    }
    return (
      <SyntaxHighlighter language="html" style={vscDarkPlus} wrapLongLines customStyle={{ maxHeight: '70vh', fontSize: '12px' }}>
        {body}
      </SyntaxHighlighter>
    );
  };

  // Pretty view - auto-detect content type with collapsible tree for JSON
  const renderPretty = () => {
    if (contentType === 'json') {
      try {
        const json = typeof body === 'string' ? JSON.parse(body) : body;
        return (
          <div className="font-mono text-sm">
            <JsonTree data={json} />
          </div>
        );
      } catch {
        return <div className="text-xs text-red-500 dark:text-red-400">Invalid JSON</div>;
      }
    }
    if (contentType === 'xml') return renderXML();
    if (contentType === 'html') return renderHTML();
    return <pre className="whitespace-pre-wrap break-words text-xs">{body}</pre>;
  };

  // Raw view - continuous word-wrapped text without line breaks
  const renderRaw = () => {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const displayBody = search
      ? bodyString.split('\n').filter((line: string) => line.toLowerCase().includes(search.toLowerCase())).join(' ')
      : bodyString;
    return <div className="text-xs break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>{displayBody}</div>;
  };

  // Preview for HTML and images
  const renderPreview = () => {
    if (contentType === 'html') {
      return <iframe title="HTML Preview" srcDoc={body} className="w-full h-96 border" sandbox="allow-same-origin" />;
    }
    if (contentType === 'image') {
      return <img src={`data:${response.headers['content-type']};base64,${body}`} alt="Response" className="max-w-full max-h-96" />;
    }
    return <div className="text-xs text-gray-500 dark:text-gray-400">Preview not available for this content type.</div>;
  };

  // Get available view options - always show all options
  const getViewOptions = (): { value: ViewType; label: string }[] => {
    return [
      { value: 'pretty' as ViewType, label: 'Pretty' },
      { value: 'raw' as ViewType, label: 'Raw' },
      { value: 'json' as ViewType, label: 'JSON' },
      { value: 'xml' as ViewType, label: 'XML' },
      { value: 'html' as ViewType, label: 'HTML' },
      { value: 'preview' as ViewType, label: 'Preview' },
    ];
  };

  return (
    <div className="flex flex-col h-full text-left">
      <div className="flex items-center gap-2 mb-3">
        {/* View Dropdown - Left Side */}
        <select
          value={view}
          onChange={(e) => setView(e.target.value as ViewType)}
          className="px-3 py-1.5 rounded text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {getViewOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Search Input - Center (only for raw view) */}
        {view === 'raw' && (
          <input
            type="text"
            placeholder="Search response..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-2 py-1.5 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        )}
        
        {/* Copy Button - Right Side */}
        <button 
          onClick={copyToClipboard} 
          className="ml-auto p-1.5 rounded text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title="Copy to clipboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 rounded">
        {view === 'pretty' && renderPretty()}
        {view === 'raw' && renderRaw()}
        {view === 'json' && renderJSON()}
        {view === 'xml' && renderXML()}
        {view === 'html' && renderHTML()}
        {view === 'preview' && renderPreview()}
      </div>
    </div>
  );
};

export default ResponseBody;
