export default function WorkspaceLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Loading Workspaces
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we fetch your workspaces...
        </p>
      </div>
    </div>
  );
}
