import { useState, useEffect } from 'react';
import workspaceMemberService from '../../services/workspaceMemberService';
import type { UserSearchResult } from '../../types/workspace.types';
import { WorkspaceRole } from '../../types/workspace.types';
import toast from 'react-hot-toast';

interface AddMemberDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberDialog({ workspaceId, isOpen, onClose, onSuccess }: AddMemberDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(WorkspaceRole.VIEWER);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedRole(WorkspaceRole.VIEWER);
      setShowDropdown(false);
      setError(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = async () => {
    try {
      setSearching(true);
      setError(null);
      const results = await workspaceMemberService.searchUsers(searchTerm);
      setSearchResults(results);
      setShowDropdown(true);
    } catch (error: any) {
      setError('Failed to search users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchTerm(user.email);
    setShowDropdown(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await workspaceMemberService.addMember(workspaceId, selectedUser.id, selectedRole);
      toast.success(`${selectedUser.name || selectedUser.email} added as ${selectedRole}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add member';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return '??';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add Member
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search User
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedUser && e.target.value !== selectedUser.email) {
                    setSelectedUser(null);
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                placeholder="Search by email or name..."
                disabled={submitting}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              {/* Search Results Dropdown */}
              {showDropdown && !selectedUser && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 text-sm font-medium">
                          {getInitials(user.name, user.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name || user.email}
                          </div>
                          {user.name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
            {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Type at least 2 characters to search
              </p>
            )}
          </div>

          {/* Selected User Display */}
          {selectedUser && (
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium">
                  {getInitials(selectedUser.name, selectedUser.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedUser.name || selectedUser.email}
                  </div>
                  {selectedUser.name && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {selectedUser.email}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchTerm('');
                  }}
                  type="button"
                  disabled={submitting}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                  title="Clear selection"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Role
            </label>
            <div className="space-y-2">
              <label className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value={WorkspaceRole.VIEWER}
                  checked={selectedRole === WorkspaceRole.VIEWER}
                  onChange={(e) => setSelectedRole(e.target.value as WorkspaceRole)}
                  disabled={submitting}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Viewer
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Can only view collections (read-only)
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value={WorkspaceRole.EDITOR}
                  checked={selectedRole === WorkspaceRole.EDITOR}
                  onChange={(e) => setSelectedRole(e.target.value as WorkspaceRole)}
                  disabled={submitting}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Editor
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Can create and edit collections
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={submitting}
            type="button"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedUser || submitting}
            type="button"
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              'Add Member'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
