import { useState, useEffect } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import type { EnvironmentVariable } from '../../services/environmentService';
import toast from 'react-hot-toast';

interface EnvironmentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  environmentId?: string | null;
}

export default function EnvironmentEditor({ isOpen, onClose, environmentId }: EnvironmentEditorProps) {
  const { environments, createEnvironment, updateEnvironment, deleteEnvironment, duplicateEnvironment } = useEnvironmentStore();
  const { currentWorkspaceId } = useCollectionStore();
  const { canEdit, isViewer } = useWorkspacePermission(currentWorkspaceId);
  
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(environmentId || null);
  const [environmentName, setEnvironmentName] = useState('');
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [isCreating, setIsCreating] = useState(!environmentId);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [bulkEditText, setBulkEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);

  useEffect(() => {
    if (environmentId) {
      setSelectedEnvironmentId(environmentId);
      setIsCreating(false);
    }
  }, [environmentId]);

  useEffect(() => {
    if (selectedEnvironmentId) {
      const env = environments.find((e) => e.id === selectedEnvironmentId);
      if (env) {
        setEnvironmentName(env.name);
        setVariables(env.variables || []);
      }
    } else if (!isCreating) {
      setEnvironmentName('');
      setVariables([]);
    }
  }, [selectedEnvironmentId, environments, isCreating]);

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedEnvironmentId(null);
    setEnvironmentName('New Environment');
    setVariables([{ key: '', value: '', type: 'default', enabled: true, description: '' }]);
  };

  const handleSelectEnvironment = (id: string) => {
    setIsCreating(false);
    setSelectedEnvironmentId(id);
  };

  const handleSave = async () => {
    if (!environmentName.trim()) {
      toast.error('Environment name is required');
      return;
    }

    if (isCreating) {
      const created = await createEnvironment(currentWorkspaceId, environmentName, variables);
      if (created) {
        setIsCreating(false);
        setSelectedEnvironmentId(created.id);
      }
    } else if (selectedEnvironmentId) {
      await updateEnvironment(selectedEnvironmentId, {
        name: environmentName,
        variables,
      });
    }
  };

  const handleDelete = async () => {
    if (selectedEnvironmentId && confirm(`Are you sure you want to delete "${environmentName}"?`)) {
      await deleteEnvironment(selectedEnvironmentId);
      setSelectedEnvironmentId(null);
      setEnvironmentName('');
      setVariables([]);
      setIsCreating(false);
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

  const toggleBulkEdit = () => {
    if (!isBulkEdit) {
      // Convert to bulk edit format
      const text = variables
        .map((v) => `${v.key}=${v.value}`)
        .join('\n');
      setBulkEditText(text);
    } else {
      // Parse bulk edit text
      const lines = bulkEditText.split('\n').filter((line) => line.trim());
      const parsed: EnvironmentVariable[] = lines.map((line) => {
        const [key, ...valueParts] = line.split('=');
        return {
          key: key.trim(),
          value: valueParts.join('=').trim(),
          type: 'default',
          enabled: true,
          description: '',
        };
      });
      setVariables(parsed);
    }
    setIsBulkEdit(!isBulkEdit);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          // Check if it's a Postman environment format
          if (data.values && Array.isArray(data.values)) {
            // Postman environment format
            if (data.name && !isCreating && !selectedEnvironmentId) {
              setEnvironmentName(data.name);
            }
            setVariables(data.values.map((v: any) => ({
              key: v.key || '',
              value: v.value || '',
              type: v.type || 'default',
              enabled: v.enabled !== false,
              description: v.description || '',
            })));
            toast.success(`Imported ${data.values.length} variables from Postman environment`);
          } else if (Array.isArray(data)) {
            // Array of variables
            setVariables(data.map((v: any) => ({
              key: v.key || '',
              value: v.value || '',
              type: v.type || 'default',
              enabled: v.enabled !== false,
              description: v.description || '',
            })));
            toast.success('Variables imported successfully');
          } else if (typeof data === 'object') {
            // Plain key-value object
            const imported = Object.entries(data).map(([key, value]) => ({
              key,
              value: String(value),
              type: 'default' as const,
              enabled: true,
              description: '',
            }));
            setVariables(imported);
            toast.success('Variables imported successfully');
          }
        } catch (error) {
          toast.error('Failed to parse JSON file');
        }
      }
    };
    input.click();
  };

  const handleImportEnv = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.env';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const lines = text.split('\n').filter((line: string) => line.trim() && !line.startsWith('#'));
          const imported: EnvironmentVariable[] = lines.map((line: string) => {
            const [key, ...valueParts] = line.split('=');
            return {
              key: key.trim(),
              value: valueParts.join('=').trim().replace(/^["']|["']$/g, ''),
              type: 'default',
              enabled: true,
              description: '',
            };
          });
          setVariables(imported);
          toast.success('Variables imported from .env file');
        } catch (error) {
          toast.error('Failed to parse .env file');
        }
      }
    };
    input.click();
  };

  const handleExport = () => {
    const data = {
      name: environmentName,
      variables: variables,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${environmentName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Environment exported');
  };

  const filteredVariables = variables.filter((v) =>
    v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Sidebar - Environment List */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Environments
            </h3>
            {canEdit ? (
              <button
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Environment
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Read-Only Access
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => handleSelectEnvironment(env.id)}
                className={`w-full px-4 py-3 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  env.id === selectedEnvironmentId && !isCreating
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-600'
                    : ''
                }`}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                  {env.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {env.variables?.length || 0} variables
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <input
                type="text"
                value={environmentName}
                onChange={(e) => setEnvironmentName(e.target.value)}
                disabled={isViewer}
                placeholder="Environment Name"
                className="text-xl font-semibold bg-transparent border-none focus:outline-none text-gray-900 dark:text-gray-100 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isCreating && (
                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                  New
                </span>
              )}
              {isViewer && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Read-Only
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Action Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
            {canEdit ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </button>

                {!isCreating && selectedEnvironmentId && (
                  <>
                    <button
                      onClick={handleDuplicate}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Duplicate
                    </button>

                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                      Delete
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded">
                You have read-only access to this environment
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isImportDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsImportDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          handleImportJSON();
                          setIsImportDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Import JSON
                      </button>
                      <button
                        onClick={() => {
                          handleImportEnv();
                          setIsImportDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Import .env File
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>

              <button
                onClick={toggleBulkEdit}
                className={`px-4 py-2 text-sm border rounded flex items-center gap-2 ${
                  isBulkEdit
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bulk Edit
              </button>
            </div>
          </div>

          {/* Variables Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search variables..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                onClick={addVariable}
                className="ml-4 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Variable
              </button>
            </div>

            {/* Variables Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isBulkEdit ? (
                <textarea
                  value={bulkEditText}
                  onChange={(e) => setBulkEditText(e.target.value)}
                  placeholder="KEY=value&#10;ANOTHER_KEY=another value"
                  className="w-full h-full p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 px-2 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded">
                    <div className="col-span-1 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="col-span-2">KEY</div>
                    <div className="col-span-1">TYPE</div>
                    <div className="col-span-2">INITIAL VALUE</div>
                    <div className="col-span-2">CURRENT VALUE</div>
                    <div className="col-span-3">DESCRIPTION</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Variables List */}
                  {filteredVariables.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">No variables yet</p>
                      <button
                        onClick={addVariable}
                        className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                      >
                        Add your first variable
                      </button>
                    </div>
                  ) : (
                    filteredVariables.map((variable, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 px-2 py-2 items-center border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        {/* Enabled Toggle */}
                        <div className="col-span-1 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={variable.enabled}
                            onChange={(e) => updateVariable(index, 'enabled', e.target.checked)}
                            disabled={isViewer}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Key */}
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={variable.key}
                            onChange={(e) => updateVariable(index, 'key', e.target.value)}
                            disabled={isViewer}
                            placeholder="key"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
                          />
                        </div>

                        {/* Type */}
                        <div className="col-span-1">
                          <select
                            value={variable.type}
                            onChange={(e) => updateVariable(index, 'type', e.target.value as 'default' | 'secret')}
                            disabled={isViewer}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
                          >
                            <option value="default">Default</option>
                            <option value="secret">Secret</option>
                          </select>
                        </div>

                        {/* Initial Value */}
                        <div className="col-span-2">
                          <input
                            type={variable.type === 'secret' ? 'password' : 'text'}
                            value={variable.value}
                            onChange={(e) => updateVariable(index, 'value', e.target.value)}
                            disabled={isViewer}
                            placeholder="value"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
                          />
                        </div>

                        {/* Current Value */}
                        <div className="col-span-2">
                          <input
                            type={variable.type === 'secret' ? 'password' : 'text'}
                            value={variable.value}
                            readOnly
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>

                        {/* Description */}
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={variable.description || ''}
                            onChange={(e) => updateVariable(index, 'description', e.target.value)}
                            disabled={isViewer}
                            placeholder="description"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="col-span-1 flex justify-end">
                          {!isViewer && (
                            <button
                              onClick={() => removeVariable(index)}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
