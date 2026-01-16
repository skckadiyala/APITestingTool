import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { useWorkspaceStore, type Workspace } from '../../stores/workspaceStore';
import CreateWorkspaceDialog from '../workspace/CreateWorkspaceDialog';
import toast from 'react-hot-toast';

export default function ProfileSettingsTabContent() {
  const { user, setUser } = useAuthStore();
  const { workspaces, currentWorkspace, setCurrentWorkspace, updateWorkspace, deleteWorkspace, duplicateWorkspace, isLoading: workspaceLoading } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'workspaces'>('overview');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [hasUnsavedProfileChanges, setHasUnsavedProfileChanges] = useState(false);
  const [hasUnsavedPreferenceChanges, setHasUnsavedPreferenceChanges] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    desktopNotifications: false,
    autoSaveRequests: true,
    theme: 'system' as 'light' | 'dark' | 'system',
  });

  // Workspace management state
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
      setHasUnsavedProfileChanges(false);
    }
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl+S to save profile
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedProfileChanges) {
          handleSaveProfile();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedProfileChanges]);

  const handleProfileChange = (field: keyof typeof profileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedProfileChanges(true);
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: keyof typeof preferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedPreferenceChanges(true);
  };

  const validateProfile = () => {
    if (!profileData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (profileData.name.length > 100) {
      toast.error('Name must be less than 100 characters');
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      toast.error('Current password is required');
      return false;
    }
    if (!passwordData.newPassword) {
      toast.error('New password is required');
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setIsLoadingProfile(true);
    try {
      const response = await authService.updateProfile({
        name: profileData.name,
      });
      setUser(response.user);
      setHasUnsavedProfileChanges(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsLoadingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoadingPreferences(true);
    try {
      // TODO: Implement preferences API endpoint
      await new Promise((resolve) => setTimeout(resolve, 500));
      setHasUnsavedPreferenceChanges(false);
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Workspace management functions
  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditingName(workspace.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (workspaceId: string) => {
    const trimmedName = editingName.trim();
    
    if (!trimmedName) {
      toast.error('Workspace name cannot be empty');
      return;
    }

    if (trimmedName.length > 100) {
      toast.error('Workspace name must be 100 characters or less');
      return;
    }

    await updateWorkspace(workspaceId, trimmedName);
    setEditingId(null);
    setEditingName('');
  };

  const handleStartDelete = (workspace: Workspace) => {
    if (workspaces.length === 1) {
      toast.error('Cannot delete your only workspace');
      return;
    }
    setDeleteConfirmId(workspace.id);
    setDeleteConfirmName('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    const workspace = workspaces.find((w) => w.id === deleteConfirmId);
    if (!workspace) return;

    if (deleteConfirmName !== workspace.name) {
      toast.error('Workspace name does not match');
      return;
    }

    await deleteWorkspace(deleteConfirmId);
    setDeleteConfirmId(null);
    setDeleteConfirmName('');
  };

  const handleDuplicate = async (workspaceId: string) => {
    setDuplicatingId(workspaceId);
    await duplicateWorkspace(workspaceId);
    setDuplicatingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  // Auto-focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
      {/* Profile Name Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-1 bg-white dark:bg-gray-800">
        <div className="w-full px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 text-left">
          Profile Settings
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700 px-4 bg-white dark:bg-gray-800">
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
          onClick={() => setActiveTab('workspaces')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'workspaces'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Workspaces
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
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {activeTab === 'overview' ? (
          /* Overview Tab Content - Profile Information */
          <div className="max-w-2xl">
            <div className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Profile Information
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your personal information
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-36 pt-2 flex-shrink-0">
                  Name
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    {profileData.name.length}/100 characters
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-36 pt-2 flex-shrink-0">
                  Email
                </label>
                <div className="flex-1">
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="w-36 flex-shrink-0"></div>
                <div className="flex-1">
                  <button
                    onClick={handleSaveProfile}
                    disabled={!hasUnsavedProfileChanges || isLoadingProfile}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                    {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                  {hasUnsavedProfileChanges && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Press ⌘S to save
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'workspaces' ? (
          /* Workspaces Tab Content */
          <div className="max-w-2xl">
            <div className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Manage Workspaces
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create, edit, and organize your workspaces
              </p>
            </div>

            {/* Top Actions Bar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Search Box */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search workspaces..."
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
                {searchQuery && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {filteredWorkspaces.length} workspace{filteredWorkspaces.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>

              {/* Create Workspace Button */}
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Workspace
              </button>
            </div>

            {/* Workspace Cards */}
            {workspaceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredWorkspaces.map((workspace) => {
                  const isEditing = editingId === workspace.id;
                  const isActive = currentWorkspace?.id === workspace.id;
                  const isDuplicating = duplicatingId === workspace.id;

                  return (
                    <div
                      key={workspace.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isActive
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750'
                      }`}
                    >
                      {/* Workspace Name & Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(workspace.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              onBlur={() => handleSaveEdit(workspace.id)}
                              maxLength={100}
                              className="w-full px-2 py-1 border border-primary-500 rounded text-base font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3
                                className="text-base font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
                                onClick={() => handleStartEdit(workspace)}
                                title={workspace.name}
                              >
                                {workspace.name}
                              </h3>
                              {isActive && (
                                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/40 rounded">
                                  Active
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 mb-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {formatDate(workspace.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Updated: {formatRelativeTime(workspace.updatedAt)}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {workspace.collectionsCount || 0} collections
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            {workspace.environmentsCount || 0} environments
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            onClick={() => setCurrentWorkspace(workspace.id)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/40 hover:bg-primary-200 dark:hover:bg-primary-900/60 rounded transition-colors"
                          >
                            Switch to
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicate(workspace.id)}
                          disabled={isDuplicating}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {isDuplicating ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-700 dark:border-gray-300 border-t-transparent"></div>
                              Duplicating...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Duplicate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleStartDelete(workspace)}
                          disabled={workspaces.length === 1}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={workspaces.length === 1 ? 'Cannot delete your only workspace' : 'Delete workspace'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Settings Tab Content - Security and Preferences */
          <div className="max-w-2xl space-y-12">
            {/* Security Section */}
            <section>
              <div className="mb-8">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Security
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your password and account security
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-36 pt-2 flex-shrink-0">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="flex items-start gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-36 pt-2 flex-shrink-0">
                    New Password
                  </label>
                  <div className="flex-1">
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Must be at least 8 characters
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-36 pt-2 flex-shrink-0">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="w-36 flex-shrink-0"></div>
                  <div className="flex-1">
                    <button
                      onClick={handleChangePassword}
                      disabled={isLoadingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
                    >
                      {isLoadingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      You will be logged out of all other devices
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Preferences Section */}
            <section>
              <div className="mb-8">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Preferences
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customize your application experience
                </p>
              </div>

              <div className="space-y-6">
                {/* Notifications */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">Email Notifications</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive updates via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">Desktop Notifications</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Show desktop alerts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.desktopNotifications}
                        onChange={(e) => handlePreferenceChange('desktopNotifications', e.target.checked)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Editor */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Editor</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">Auto-save Requests</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Automatically save changes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.autoSaveRequests}
                        onChange={(e) => handlePreferenceChange('autoSaveRequests', e.target.checked)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Appearance</h3>
                  <div className="space-y-2">
                    {(['system', 'light', 'dark'] as const).map((theme) => (
                      <div key={theme} className="flex items-center py-2.5">
                        <input
                          type="radio"
                          name="theme"
                          value={theme}
                          checked={preferences.theme === theme}
                          onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          id={`theme-${theme}`}
                        />
                        <label htmlFor={`theme-${theme}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300 capitalize cursor-pointer">
                          {theme === 'system' && 'System'}
                          {theme === 'light' && 'Light'}
                          {theme === 'dark' && 'Dark'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Preferences */}
                <div className="pt-2">
                  <button
                    onClick={handleSavePreferences}
                    disabled={!hasUnsavedPreferenceChanges || isLoadingPreferences}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                    {isLoadingPreferences ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Workspace
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This action cannot be undone. All collections, requests, and environments in this workspace will be permanently deleted.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type the workspace name <span className="font-semibold">{workspaces.find(w => w.id === deleteConfirmId)?.name}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Workspace name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirmName !== workspaces.find(w => w.id === deleteConfirmId)?.name}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
