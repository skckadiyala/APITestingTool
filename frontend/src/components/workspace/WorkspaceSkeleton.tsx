export default function WorkspaceSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Collections skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        
        {/* Collection items */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            </div>
            
            {/* Request items */}
            <div className="ml-6 space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Environments skeleton */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        {[1, 2].map((i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  );
}
