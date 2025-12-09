import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';

interface ResponseBodyProps {
  response: any;
}

const detectContentType = (response: any) => {
  if (!response || !response.headers) return 'text';
  const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
  if (contentType.includes('application/json')) return 'json';
  if (contentType.includes('text/html')) return 'html';
  if (contentType.includes('image')) return 'image';
  if (contentType.includes('application/xml') || contentType.includes('text/xml')) return 'xml';
  return 'text';
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
  const [view, setView] = useState<'pretty' | 'raw' | 'preview'>('pretty');
  const contentType = detectContentType(response);
  const body = response?.body || '';

  // Search feature
  const [search, setSearch] = useState('');

  // Copy to clipboard
  const copyToClipboard = () => {
    const textToCopy = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard!');
  };

  // Download response
  const downloadResponse = () => {
    const textToDownload = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response_${Date.now()}.${contentType === 'json' ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Response downloaded!');
  };

  // Pretty JSON viewer with collapsible sections
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
        return <div className="text-red-500">Invalid JSON</div>;
      }
    }
    if (contentType === 'xml') {
      return (
        <SyntaxHighlighter language="xml" style={vscDarkPlus} wrapLongLines customStyle={{ maxHeight: '70vh' }}>
          {body}
        </SyntaxHighlighter>
      );
    }
    if (contentType === 'html') {
      return (
        <SyntaxHighlighter language="html" style={vscDarkPlus} wrapLongLines customStyle={{ maxHeight: '70vh' }}>
          {body}
        </SyntaxHighlighter>
      );
    }
    return <pre className="whitespace-pre-wrap break-words text-sm">{body}</pre>;
  };

  // Raw view
  const renderRaw = () => {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    const displayBody = search
      ? bodyString.split('\n').filter((line: string) => line.toLowerCase().includes(search.toLowerCase())).join('\n')
      : bodyString;
    return <pre className="whitespace-pre-wrap break-words text-sm">{displayBody}</pre>;
  };

  // HTML preview
  const renderPreview = () => {
    if (contentType === 'html') {
      return <iframe title="HTML Preview" srcDoc={body} className="w-full h-96 border" sandbox="allow-same-origin" />;
    }
    if (contentType === 'image') {
      return <img src={`data:${response.headers['content-type']};base64,${body}`} alt="Response" className="max-w-full max-h-96" />;
    }
    return <div className="text-gray-500">Preview not available for this content type.</div>;
  };

  return (
    <div className="flex flex-col h-full text-left">
      <div className="flex gap-2 mb-2 flex-wrap">
        <button onClick={() => setView('pretty')} className={`px-2 py-1 rounded text-sm ${view === 'pretty' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Pretty</button>
        <button onClick={() => setView('raw')} className={`px-2 py-1 rounded text-sm ${view === 'raw' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Raw</button>
        {(contentType === 'html' || contentType === 'image') && (
          <button onClick={() => setView('preview')} className={`px-2 py-1 rounded text-sm ${view === 'preview' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Preview</button>
        )}
        <button onClick={copyToClipboard} className="px-2 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
          Copy
        </button>
        <button onClick={downloadResponse} className="px-2 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
          Download
        </button>
        {view === 'raw' && (
          <input
            type="text"
            placeholder="Search response..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-auto px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800"
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 rounded">
        {view === 'pretty' && renderPretty()}
        {view === 'raw' && renderRaw()}
        {view === 'preview' && renderPreview()}
      </div>
    </div>
  );
};

export default ResponseBody;
