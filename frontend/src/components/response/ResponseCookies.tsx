import React from 'react';

interface ResponseCookiesProps {
  response: any;
}

const ResponseCookies: React.FC<ResponseCookiesProps> = ({ response }) => {
  const cookies = response?.cookies || [];

  return (
    <div className="flex flex-col gap-2 text-left">
      <span className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Cookies</span>
      {cookies.length === 0 ? (
        <div className="text-sm text-gray-500">No cookies in response.</div>
      ) : (
        <div className="space-y-2">
          {cookies.map((cookie: any, idx: number) => (
            <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">{cookie.name}</div>
              <div className="text-xs text-gray-700 dark:text-gray-300">Value: {cookie.value}</div>
              {cookie.domain && <div className="text-xs">Domain: {cookie.domain}</div>}
              {cookie.path && <div className="text-xs">Path: {cookie.path}</div>}
              {cookie.expires && <div className="text-xs">Expires: {cookie.expires}</div>}
              {cookie.httpOnly && <div className="text-xs">HttpOnly</div>}
              {cookie.secure && <div className="text-xs">Secure</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponseCookies;
