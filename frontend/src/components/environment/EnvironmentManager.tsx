import { useState, useEffect } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useCollectionStore } from '../../stores/collectionStore';
import type { EnvironmentVariable } from '../../services/environmentService';

interface EnvironmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnvironmentManager({ isOpen, onClose }: EnvironmentManagerProps) {
  const { environments, createEnvironment, updateEnvironment, deleteEnvironment, duplicateEnvironment, activeEnvironmentId, setActiveEnvironment } = useEnvironmentStore();
  const { currentWorkspaceId } = useCollectionStore();
  
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [environmentName, setEnvironmentName] = useState('');
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (selectedEnvironmentId) {
      const env = environments.find((e) => e.id === selectedEnvironmentId);
      if (env) {
        setEnvironmentName(env.name);
        setVariables(env.variables || []);
      }
    }
  }, [selectedEnvironmentId, environments]);

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
      return;
    }

    if (isCreating) {
      await createEnvironment(currentWorkspaceId, environmentName, variables);
      setIsCreating(false);
    } else if (selectedEnvironmentId) {
      await updateEnvironment(selectedEnvironmentId, {
        name: environmentName,
        variables,
      });
    }
  };

  const handleDelete = async () => {
    if (selectedEnvironmentId && confirm('Are you sure you want to delete this environment?')) {
      await deleteEnvironment(selectedEnvironmentId);
      setSelectedEnvironmentId(null);
      setEnvironmentName('');
      setVariables([]);
    }
  };

  const handleDuplicate = async () => {
    if (selectedEnvironmentId) {
      await duplicateEnvironment(selectedEnvironmentId);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Manage Environments
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Environment List */}
          <div className="w-64 border-r border-gray-300 dark:border-gray-700 flex flex-col">
            <div className="p-4">
              <button
                onClick={handleCreateNew}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Environment
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {environments.map((env) => (
                <div
                  key={env.id}
                  onClick={() => handleSelectEnvironment(env.id)}
                  className={`
                    px-4 py-3 cursor-pointer border-l-4 hover:bg-gray-100 dark:hover:bg-gray-700
                    ${selectedEnvironmentId === env.id 
                      ? 'border-l-primary-500 bg-gray-100 dark:bg-gray-700' 
                      : 'border-l-transparent'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {env.name}
                    </span>
                    {activeEnvironmentId === env.id && (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {env.variables?.length || 0} variables
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Environment Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {(isCreating || selectedEnvironmentId) ? (
              <>
                {/* Environment Name */}
                <div className="p-4 border-b border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={environmentName}
                      onChange={(e) => setEnvironmentName(e.target.value)}
                      placeholder="Environment name (e.g., Development, Staging, Production)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {!isCreating && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveEnvironment(selectedEnvironmentId)}
                          className={`px-3 py-2 text-sm rounded ${
                            activeEnvironmentId === selectedEnvironmentId
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }`}
                        >
                          {activeEnvironmentId === selectedEnvironmentId ? 'Active' : 'Set Active'}
                        </button>
                        <button
                          onClick={handleDuplicate}
                          className="px-3 py-2 text-sm bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={handleDelete}
                          className="px-3 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variables Table */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Variables</h3>
                    <button
                      onClick={addVariable}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                      Add Variable
                    </button>
                  </div>

                  <div className="border border-gray-300 dark:border-gray-700 rounded overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Key</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Value</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Description</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Enabled</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {variables.map((variable, index) => (
                          <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={variable.key}
                                onChange={(e) => updateVariable(index, 'key', e.target.value)}
                                placeholder="Variable key"
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type={variable.type === 'secret' ? 'password' : 'text'}
                                value={variable.value}
                                onChange={(e) => updateVariable(index, 'value', e.target.value)}
                                placeholder="Variable value"
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={variable.type}
                                onChange={(e) => updateVariable(index, 'type', e.target.value as 'default' | 'secret')}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              >
                                <option value="default">Default</option>
                                <option value="secret">Secret</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={variable.description || ''}
                                onChange={(e) => updateVariable(index, 'description', e.target.value)}
                                placeholder="Description"
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={variable.enabled}
                                onChange={(e) => updateVariable(index, 'enabled', e.target.checked)}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => removeVariable(index)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {variables.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              No variables yet. Click "Add Variable" to create one.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!environmentName.trim()}
                    className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Create' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Select an environment or create a new one
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
