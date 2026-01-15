import { useState, useEffect } from 'react';
import workspaceMemberService from '../../services/workspaceMemberService';
import type { WorkspaceMember, UserSearchResult } from '../../types/workspace.types';
import { WorkspaceRole } from '../../types/workspace.types';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function WorkspaceSettingsTabContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(WorkspaceRole.VIEWER);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  
  const { currentWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
  const [workspaceDescription, setWorkspaceDescription] = useState(currentWorkspace?.description || '');

  const userRole = currentWorkspace?.userRole;
  const isOwner = userRole === WorkspaceRole.OWNER;
  const canEdit = isOwner || userRole === WorkspaceRole.EDITOR;

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name);
      setWorkspaceDescription(currentWorkspace.description || '');
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers();
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadMembers = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const data = await workspaceMemberService.getWorkspaceMembers(currentWorkspace.id);
      setMembers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const results = await workspaceMemberService.searchUsers(searchTerm);
      // Filter out users who are already members
      const memberUserIds = members.map(m => m.userId);
      const filteredResults = results.filter(user => !memberUserIds.includes(user.id));
      setSearchResults(filteredResults);
    } catch (error: any) {
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserForRole || !currentWorkspace) return;

    try {
      await workspaceMemberService.addMember(currentWorkspace.id, selectedUserForRole.id, selectedRole);
      toast.success('Member added successfully');
      setSelectedUserForRole(null);
      setSearchTerm('');
      setSearchResults([]);
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: WorkspaceRole, userName: string) => {
    if (!currentWorkspace) return;
    try {
      await workspaceMemberService.updateMemberRole(currentWorkspace.id, memberId, newRole);
      toast.success('Member role updated');
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRoleOrRemove = async (memberId: string, value: string, userName: string) => {
    if (value === 'REMOVE') {
      handleRemoveMember(memberId, userName);
    } else {
      handleUpdateRole(memberId, value as WorkspaceRole, userName);
    }
  };

  const handleRemoveMember = async (memberId: string, userName: string) => {
    if (!currentWorkspace) return;
    if (!confirm(`Remove ${userName} from this workspace?`)) return;

    try {
      await workspaceMemberService.removeMember(currentWorkspace.id, memberId);
      toast.success('Member removed successfully');
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateWorkspace = async () => {
    if (!currentWorkspace) return;
    try {
      await updateWorkspace(currentWorkspace.id, workspaceName, workspaceDescription);
      toast.success('Workspace updated successfully');
    } catch (error: any) {
      toast.error('Failed to update workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;
    try {
      await deleteWorkspace(currentWorkspace.id);
      toast.success('Workspace deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete workspace');
    }
  };

  const getRoleBadgeColor = (role: WorkspaceRole) => {
    switch (role) {
      case WorkspaceRole.OWNER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case WorkspaceRole.EDITOR:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case WorkspaceRole.VIEWER:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  const currentUserId = user?.id;

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No workspace selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Workspace Name Header */}
      <div className="px-4 pt-3 pb-1">
        <div className="w-full px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 text-left">
          {currentWorkspace.name}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-full">
            {/* Description and Info Side by Side */}
            <div className="flex gap-6">
              {/* Workspace Description */}
              <div className="flex-1">
                <textarea
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  placeholder="Add a description..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Workspace Info */}
              <div className="w-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2 flex-shrink-0">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Created</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {currentWorkspace?.createdAt && new Date(currentWorkspace.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Owner</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {members.find(m => m.role === WorkspaceRole.OWNER && m.userId === currentWorkspace?.ownerId)?.user.email || 'You'}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {canEdit && (
              <button
                onClick={handleUpdateWorkspace}
                className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            {/* Add Member Button (Owner Only) */}
            {isOwner && (
              <button
                onClick={() => {
                  setShowAddMemberDialog(true);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Member
              </button>
            )}

            {/* Members List */}
            {loading ? (
              <div className="text-left py-8 text-xs text-gray-500 dark:text-gray-400">
                Loading members...
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const isCurrentUser = member.userId === currentUserId;
                  const isWorkspaceOwner = member.userId === currentWorkspace?.ownerId;
                  const canModify = isOwner && !isCurrentUser && !isWorkspaceOwner;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-medium flex-shrink-0">
                        {getInitials(member.user.name, member.user.email)}
                      </div>

                      {/* User Info with inline role */}
                      <div className="flex-1 min-w-0 text-left flex items-center gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
                            <span className="truncate">
                              {member.user.name || member.user.email}
                            </span>
                            {isCurrentUser && <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">(You)</span>}
                            {/* Role Badge/Dropdown inline */}
                            {canModify ? (
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleOrRemove(member.id, e.target.value, member.user.name || member.user.email)}
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)} border-none focus:ring-2 focus:ring-primary-500 flex-shrink-0`}
                              >
                                <option value={WorkspaceRole.OWNER}>Owner</option>
                                <option value={WorkspaceRole.EDITOR}>Editor</option>
                                <option value={WorkspaceRole.VIEWER}>Viewer</option>
                                <option value="REMOVE" style={{ color: '#DC2626' }}>Remove</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)} flex-shrink-0`}>
                                {member.role}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Note */}
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Note: The workspace owner has full control and cannot be changed or removed.
            </p>

            {/* Danger Zone */}
            {isOwner && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1 text-left">
                  Danger Zone
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-500 mb-4 text-left">
                  Once you delete a workspace, there is no going back. Please be certain.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Workspace
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteWorkspace}
                      className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      {showAddMemberDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Add Member
            </h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by email or name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                {searching && (
                  <div className="absolute right-3 top-2.5">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-4 border border-gray-200 dark:border-gray-600 rounded max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUserForRole(user);
                      setSearchResults([]);
                      setSearchTerm('');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
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
                ))}
              </div>
            )}

            {/* Selected User and Role Selection */}
            {selectedUserForRole && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Selected: {selectedUserForRole.name || selectedUserForRole.email}
                </p>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="role"
                      value={WorkspaceRole.VIEWER}
                      checked={selectedRole === WorkspaceRole.VIEWER}
                      onChange={(e) => setSelectedRole(e.target.value as WorkspaceRole)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Viewer</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Can view collections and environments</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="role"
                      value={WorkspaceRole.EDITOR}
                      checked={selectedRole === WorkspaceRole.EDITOR}
                      onChange={(e) => setSelectedRole(e.target.value as WorkspaceRole)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Editor</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Can create, edit, and delete resources</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto">
              {selectedUserForRole && (
                <button
                  onClick={() => {
                    handleAddMember();
                    setShowAddMemberDialog(false);
                    setSelectedUserForRole(null);
                    setSelectedRole(WorkspaceRole.VIEWER);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                >
                  Add Member
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddMemberDialog(false);
                  setSelectedUserForRole(null);
                  setSelectedRole(WorkspaceRole.VIEWER);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
