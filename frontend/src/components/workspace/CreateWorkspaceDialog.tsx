import { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore, type Workspace } from '../../stores/workspaceStore';

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (workspace: Workspace) => void;
}

export default function CreateWorkspaceDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createWorkspace } = useWorkspaceStore();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      setIsSubmitting(false);
      // Auto-focus input when dialog opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  // Real-time validation
  const validateName = (value: string): string => {
    if (!value || value.trim().length === 0) {
      return 'Workspace name is required';
    }
    if (value.length > 100) {
      return 'Workspace name must be 100 characters or less';
    }
    return '';
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    
    // Clear error if user is typing and name becomes valid
    if (error && !validateName(value)) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const workspace = await createWorkspace(name.trim());
      
      if (workspace) {
        // Success - close dialog and call callback
        onClose();
        if (onSuccess) {
          onSuccess(workspace);
        }
      } else {
        // createWorkspace returns null on error and shows toast
        setError('Failed to create workspace. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const isValid = name.trim().length > 0 && name.length <= 100;

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleCancel}
        aria-labelledby="create-workspace-title"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Container */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="create-workspace-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Create New Workspace
            </h2>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Organize your API collections and environments
              </p>

              {/* Name Input */}
              <div>
                <label
                  htmlFor="workspace-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Workspace Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={inputRef}
                  id="workspace-name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  disabled={isSubmitting}
                  placeholder="My API Project"
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    error
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'name-error' : 'name-help'}
                  autoComplete="off"
                />
                
                {/* Character count */}
                <div className="flex items-center justify-between mt-1">
                  <div>
                    {error ? (
                      <p id="name-error" className="text-xs text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    ) : (
                      <p id="name-help" className="text-xs text-gray-500 dark:text-gray-400">
                        Required field
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {name.length}/100
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
