import { useEffect, useState } from 'react';

interface WorkspaceSwitchingOverlayProps {
  isVisible: boolean;
  workspaceName?: string;
}

export default function WorkspaceSwitchingOverlay({
  isVisible,
  workspaceName,
}: WorkspaceSwitchingOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShowOverlay(true);
    } else {
      // Delay hiding to allow fade out animation
      const timer = setTimeout(() => setShowOverlay(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!showOverlay) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 dark:bg-gray-950/70 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Switching Workspace
            </h3>
            {workspaceName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading <span className="font-medium text-primary-600">{workspaceName}</span>
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Please wait while we load your data...
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-primary-600 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>

      {/* Add custom animation for progress bar */}
      <style>{`
        @keyframes progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 50%;
            margin-left: 25%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
