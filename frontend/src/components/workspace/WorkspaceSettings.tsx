import { useState, useEffect } from 'react';
import workspaceMemberService from '../../services/workspaceMemberService';
import type { WorkspaceMember, UserSearchResult } from '../../types/workspace.types';
import { WorkspaceRole } from '../../types/workspace.types';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import toast from 'react-hot-toast';

interface WorkspaceSettingsProps {
  workspaceId: string;
  onClose: () => void;
}

export default function WorkspaceSettings({ workspaceId, onClose }: WorkspaceSettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(WorkspaceRole.VIEWER);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { currentWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaceStore();
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
    loadMembers();
  }, [workspaceId]);

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
    try {
      setLoading(true);
      const data = await workspaceMemberService.getWorkspaceMembers(workspaceId);
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
    if (!selectedUserForRole) return;

    try {
      await workspaceMemberService.addMember(workspaceId, selectedUserForRole.id, selectedRole);
      toast.success('Member added successfully');
      setSelectedUserForRole(null);
      setSearchTerm('');
      setSearchResults([]);
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      await workspaceMemberService.updateMemberRole(workspaceId, memberId, newRole);
      toast.success('Member role updated');
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this workspace?`)) return;

    try {
      await workspaceMemberService.removeMember(workspaceId, memberId);
      toast.success('Member removed successfully');
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateWorkspace = async () => {
    try {
      await updateWorkspace(workspaceId, workspaceName, workspaceDescription);
      toast.success('Workspace updated successfully');
    } catch (error: any) {
      toast.error('Failed to update workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      await deleteWorkspace(workspaceId);
      toast.success('Workspace deleted successfully');
      onClose();
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

  const currentUserId = localStorage.getItem('userId'); // Or get from auth store

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Workspace Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Members ({members.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Workspace Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Workspace Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Workspace Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
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

              {/* Save Button */}
              {canEdit && (
                <button
                  onClick={handleUpdateWorkspace}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                >
                  Save Changes
                </button>
              )}

              {/* Delete Workspace */}
              {isOwner && (
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Once you delete a workspace, there is no going back. Please be certain.
                  </p>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete Workspace
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteWorkspace}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Add Member (Owner Only) */}
              {isOwner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Member
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users by email or name..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setSelectedUserForRole(user);
                              setSearchResults([]);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-3"
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
                  </div>
                </div>
              )}

              {/* Members List */}
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium">
                          {getInitials(member.user.name, member.user.email)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {member.user.name || member.user.email}
                            {isCurrentUser && <span className="text-gray-500 dark:text-gray-400 ml-2">(You)</span>}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {member.user.email}
                          </div>
                        </div>

                        {/* Role Badge/Dropdown */}
                        {canModify ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value as WorkspaceRole)}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)} border-none focus:ring-2 focus:ring-primary-500`}
                          >
                            <option value={WorkspaceRole.OWNER}>Owner</option>
                            <option value={WorkspaceRole.EDITOR}>Editor</option>
                            <option value={WorkspaceRole.VIEWER}>Viewer</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        )}

                        {/* Remove Button */}
                        {canModify && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.user.name || member.user.email)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                            title="Remove member"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Note */}
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Note: The workspace owner has full control and cannot be changed or removed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Role Selection Dialog */}
      {selectedUserForRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Select Role
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add {selectedUserForRole.name || selectedUserForRole.email} as:
            </p>
            <div className="space-y-2 mb-6">
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
            <div className="flex gap-2">
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                Add Member
              </button>
              <button
                onClick={() => {
                  setSelectedUserForRole(null);
                  setSelectedRole(WorkspaceRole.VIEWER);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
