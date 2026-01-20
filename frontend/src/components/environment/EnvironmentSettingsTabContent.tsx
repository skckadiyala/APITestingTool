import { useState, useEffect, useRef } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useCollectionStore } from '../../stores/collectionStore';
import type { EnvironmentVariable } from '../../services/environmentService';
import toast from 'react-hot-toast';

export default function EnvironmentSettingsTabContent() {
  const { environments, createEnvironment, updateEnvironment, deleteEnvironment, duplicateEnvironment, activeEnvironmentId, setActiveEnvironment } = useEnvironmentStore();
  const { currentWorkspaceId } = useCollectionStore();
  
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [environmentName, setEnvironmentName] = useState('');
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedEnvironmentId) {
      const env = environments.find((e) => e.id === selectedEnvironmentId);
      if (env) {
        setEnvironmentName(env.name);
        setVariables(env.variables || []);
      }
    }
  }, [selectedEnvironmentId, environments]);

  const filteredEnvironments = environments.filter((env) =>
    env.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedEnvironmentId(null);
    setEnvironmentName('');
    setVariables([]);
  };

  const handleSelectEnvironment = (id: string) => {
    setIsCreating(false);
    setSelectedEnvironmentId(id);
  };

  const handleSave = async () => {
    if (!environmentName.trim()) {
      toast.error('Environment name cannot be empty');
      return;
    }

    if (isCreating) {
      await createEnvironment(currentWorkspaceId, environmentName, variables);
      setIsCreating(false);
      toast.success('Environment created successfully');
    } else if (selectedEnvironmentId) {
      await updateEnvironment(selectedEnvironmentId, {
        name: environmentName,
        variables,
      });
      toast.success('Environment updated successfully');
    }
  };

  const handleStartDelete = (env: any) => {
    setDeleteConfirmId(env.id);
    setDeleteConfirmName('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    const env = environments.find((e) => e.id === deleteConfirmId);
    if (!env) return;

    if (deleteConfirmName !== env.name) {
      toast.error('Environment name does not match');
      return;
    }

    await deleteEnvironment(deleteConfirmId);
    setDeleteConfirmId(null);
    setDeleteConfirmName('');
    if (selectedEnvironmentId === deleteConfirmId) {
      setSelectedEnvironmentId(null);
      setEnvironmentName('');
      setVariables([]);
    }
    toast.success('Environment deleted successfully');
  };

  const handleDuplicate = async (id: string) => {
    await duplicateEnvironment(id);
    toast.success('Environment duplicated successfully');
  };

  const handleExport = () => {
    if (!selectedEnvironmentId) return;
    
    const env = environments.find((e) => e.id === selectedEnvironmentId);
    if (!env) return;

    // Create export data - exclude secret values for security
    const exportData = {
      name: env.name,
      variables: env.variables.map(v => ({
        ...v,
        value: v.type === 'secret' ? '' : v.value, // Don't export secret values
      })),
      _meta: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${env.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_environment.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Environment exported successfully (secret values excluded)');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the JSON structure
      if (!data.name) {
        toast.error('Invalid environment file format. Missing "name" field');
        return;
      }

      // Support both Postman format (values) and our format (variables)
      let variables: EnvironmentVariable[] = [];
      
      if (Array.isArray(data.values)) {
        // Postman environment format
        variables = data.values.map((v: any) => ({
          key: v.key || '',
          value: v.value || '',
          type: v.type === 'secret' ? 'secret' : 'default',
          enabled: v.enabled !== false,
          description: v.description || '',
        }));
      } else if (Array.isArray(data.variables)) {
        // Our format
        variables = data.variables;
      } else {
        toast.error('Invalid environment file format. Expected "values" or "variables" array');
        return;
      }

      // Create environment with imported data
      await createEnvironment(currentWorkspaceId, data.name, variables);
      toast.success(`Environment "${data.name}" imported successfully with ${variables.length} variable${variables.length !== 1 ? 's' : ''}`);
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON file');
      } else {
        toast.error('Failed to import environment');
      }
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addVariable = () => {
    setVariables([
      ...variables,
      { key: '', value: '', type: 'default', enabled: true, description: '' },
    ]);
  };

  const updateVariable = (index: number, field: keyof EnvironmentVariable, value: any) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Environment List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
          {/* Search Bar with Actions */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search environments..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={handleImport}
                className="p-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                title="Import environment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
              <button
                onClick={handleCreateNew}
                className="p-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                title="New environment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {filteredEnvironments.length} environment{filteredEnvironments.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Environment List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
              </div>
            ) : filteredEnvironments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'No environments found' : 'No environments yet'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleCreateNew}
                    className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Create your first environment
                  </button>
                )}
              </div>
            ) : (
              filteredEnvironments.map((env) => (
                <div
                  key={env.id}
                  onClick={() => handleSelectEnvironment(env.id)}
                  className={`
                    px-4 py-3 cursor-pointer border-l-4 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors
                    ${selectedEnvironmentId === env.id 
                      ? 'border-l-primary-500 bg-white dark:bg-gray-700' 
                      : 'border-l-transparent'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {env.name}
                    </span>
                    {activeEnvironmentId === env.id && (
                      <span className="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{env.variables?.length || 0} variables</span>
                    {env.createdAt && <span>{formatDate(env.createdAt)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content - Environment Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {(isCreating || selectedEnvironmentId) ? (
            <>
              {/* Environment Name & Actions */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={environmentName}
                    onChange={(e) => setEnvironmentName(e.target.value)}
                    placeholder="Environment name (e.g., Development, Staging, Production)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex gap-2">
                    {!isCreating && (
                      <>
                        <button
                          onClick={() => setActiveEnvironment(selectedEnvironmentId)}
                          className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                            activeEnvironmentId === selectedEnvironmentId
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 cursor-default'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }`}
                          disabled={activeEnvironmentId === selectedEnvironmentId}
                        >
                          {activeEnvironmentId === selectedEnvironmentId ? 'Active' : 'Set Active'}
                        </button>
                        <button
                          onClick={() => selectedEnvironmentId && handleDuplicate(selectedEnvironmentId)}
                          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Duplicate
                        </button>
                        <button
                          onClick={handleExport}
                          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export
                        </button>
                        <button
                          onClick={() => handleStartDelete(environments.find(e => e.id === selectedEnvironmentId))}
                          className="px-4 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={!environmentName.trim()}
                      className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? 'Create' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Variables Section */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Variables</h3>
                  <button
                    onClick={addVariable}
                    className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Variable
                  </button>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Key</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Value</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Enabled</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {variables.map((variable, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={variable.key}
                                onChange={(e) => updateVariable(index, 'key', e.target.value)}
                                placeholder="Variable key"
                                className="w-full min-w-[150px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type={variable.type === 'secret' ? 'password' : 'text'}
                                value={variable.value}
                                onChange={(e) => updateVariable(index, 'value', e.target.value)}
                                placeholder="Variable value"
                                className="w-full min-w-[200px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={variable.type}
                                onChange={(e) => updateVariable(index, 'type', e.target.value as 'default' | 'secret')}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="default">Default</option>
                                <option value="secret">Secret</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={variable.description || ''}
                                onChange={(e) => updateVariable(index, 'description', e.target.value)}
                                placeholder="Description"
                                className="w-full min-w-[150px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={variable.enabled}
                                onChange={(e) => updateVariable(index, 'enabled', e.target.checked)}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => removeVariable(index)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Remove variable"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {variables.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                              <p className="mb-2">No variables yet</p>
                              <button
                                onClick={addVariable}
                                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                              >
                                Click "Add Variable" to create one
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <p className="text-lg mb-2">Select an environment to edit</p>
                <p className="text-sm">or create a new one to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Environment
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will permanently delete the environment and all its variables. This action cannot be undone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type <span className="font-semibold">{environments.find((e) => e.id === deleteConfirmId)?.name}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter environment name"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirmName !== environments.find((e) => e.id === deleteConfirmId)?.name}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Environment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
