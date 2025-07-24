// src/pages/UserManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import * as userService from '../services/user'; // Import the user service
import { useNotification } from '../contexts/NotificationContext'; // Import notification hook
import axios from 'axios'; // Import axios for error handling
import './UserManagementPage.css'; // Import the new CSS file

// Define User interface based on backend UserResponse DTO
interface User {
  id: number;
  username: string;
  email: string;
  status: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string; // Optional as it might be null
  roles: string[];
  permissions: string[];
}

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  // State for new user creation form
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newStatus, setNewStatus] = useState('ACTIVE'); // Default status for new user
  const [newRoles, setNewRoles] = useState<string[]>(['ROLE_USER']); // Default role for new user

  // State for editing existing user
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editRoles, setEditRoles] = useState<string[]>([]);

  // Function to fetch all users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      setUsers(response.data);
      // If no users exist and not in creation mode, automatically switch to creation mode
      if (response.data.length === 0 && !isCreatingNewUser) {
        setIsCreatingNewUser(true);
        setSelectedUser(null); // Ensure no user is selected when creating
        setActiveTab('general'); // Ensure general tab is active for new creation
      } else if (response.data.length > 0 && isCreatingNewUser) {
        // If users exist and we were in creation mode, revert to list view
        setIsCreatingNewUser(false);
        setSelectedUser(null); // Ensure no user is selected
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      let errorMessage = 'Failed to load users.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data || errorMessage;
      }
      showNotification(errorMessage, 'error');
      setUsers([]); // Clear users on error
    } finally {
      setLoading(false);
    }
  }, [isCreatingNewUser, showNotification]);

  // Effect to fetch users on component mount and when creation mode changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Effect to populate edit form when a user is selected
  useEffect(() => {
    if (selectedUser) {
      setEditUsername(selectedUser.username);
      setEditEmail(selectedUser.email);
      setEditStatus(selectedUser.status);
      setEditRoles(selectedUser.roles);
      setIsCreatingNewUser(false); // Ensure not in creation mode when editing
      setActiveTab('general'); // Always show general tab for editing
    }
  }, [selectedUser]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsCreatingNewUser(false); // Exit creation mode if a user is selected
  };

  const handleSaveExistingUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const updatedUserData = {
        username: editUsername,
        email: editEmail,
        status: editStatus,
        roles: editRoles,
      };
      await userService.updateUser(selectedUser.id, updatedUserData);
      showNotification('User updated successfully!', 'success');
      setSelectedUser(null); // Deselect after saving
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating user:', error);
      let errorMessage = 'Failed to update user.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data || errorMessage;
      }
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExistingUser = () => {
    setSelectedUser(null); // Deselect
    fetchUsers(); // Refresh to ensure latest data if needed
  };

  const handleCreateNewUser = async () => {
    setLoading(true);
    try {
      if (newPassword !== newConfirmPassword) {
        showNotification('Passwords do not match.', 'error');
        setLoading(false);
        return;
      }
      const newUserData = {
        username: newUsername,
        email: newEmail,
        password: newPassword,
        status: newStatus,
        roles: newRoles,
      };
      await userService.createUser(newUserData);
      showNotification('User created successfully!', 'success');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewConfirmPassword('');
      setNewStatus('ACTIVE');
      setNewRoles(['ROLE_USER']);
      setIsCreatingNewUser(false); // Exit creation mode
      setSelectedUser(null); // Ensure no user is selected
      fetchUsers(); // Refresh the list to show the new user
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data || errorMessage;
      }
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewUser = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewConfirmPassword('');
    setNewStatus('ACTIVE');
    setNewRoles(['ROLE_USER']);
    setIsCreatingNewUser(false); // Exit creation mode
    setSelectedUser(null); // Ensure no user is selected
    fetchUsers(); // Go back to list view
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setLoading(true);
      try {
        await userService.deleteUser(id);
        showNotification('User deleted successfully!', 'success');
        setSelectedUser(null); // Deselect if the deleted user was selected
        fetchUsers(); // Refresh the list
      } catch (error: any) {
        console.error('Error deleting user:', error);
        let errorMessage = 'Failed to delete user.';
        if (axios.isAxiosError(error) && error.response) {
          errorMessage = error.response.data?.message || error.response.data || errorMessage;
        }
        showNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="user-management-container" style={{ textAlign: 'center', padding: '50px' }}>
        Loading users...
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-header-section">
        <h1 className="user-main-title">
          {isCreatingNewUser ? 'Create New User' : selectedUser ? selectedUser.username : 'Users'}
        </h1>
        <div className="user-header-actions">
          {selectedUser && (
            <i
              className="fas fa-trash-alt"
              style={{ color: '#dc3545', cursor: 'pointer', fontSize: '1.1rem', marginRight: '15px' }}
              onClick={() => handleDeleteUser(selectedUser.id)}
              title="Delete User"
            ></i>
          )}
          {!isCreatingNewUser && (
            <button
              className="form-button save"
              onClick={() => {
                setIsCreatingNewUser(true);
                setSelectedUser(null); // Clear selected user when creating new
                setActiveTab('general');
              }}
            >
              Create User
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation - only visible when a user is selected */}
      {selectedUser && !isCreatingNewUser && (
        <nav className="user-tabs-nav">
          <button
            className={`user-tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`user-tab-button ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
            disabled={!selectedUser} // Disable other tabs if no user is selected
          >
            Roles
          </button>
          <button
            className={`user-tab-button ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
            disabled={!selectedUser}
          >
            Credentials
          </button>
          {/* Add more tabs as needed, e.g., "Attributes", "Sessions", "Groups" */}
        </nav>
      )}

      <div className="user-tab-content">
        {isCreatingNewUser ? (
          // Form for creating a new user
          <div className="form-section">
            <form>
              <div className="form-group">
                <label htmlFor="new-username" className="form-label">
                  <span style={{ color: 'red' }}>*</span> Username
                  <i className="fas fa-info-circle info-icon" title="The unique username of the new user."></i>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="new-username"
                    type="text"
                    className="form-input small"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-email" className="form-label">
                  <span style={{ color: 'red' }}>*</span> Email
                  <i className="fas fa-info-circle info-icon" title="The email address of the new user."></i>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="new-email"
                    type="email"
                    className="form-input"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new user email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-password" className="form-label">
                  <span style={{ color: 'red' }}>*</span> Password
                  <i className="fas fa-info-circle info-icon" title="The password for the new user."></i>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-confirm-password" className="form-label">
                  <span style={{ color: 'red' }}>*</span> Confirm Password
                  <i className="fas fa-info-circle info-icon" title="Confirm the password for the new user."></i>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="new-confirm-password"
                    type="password"
                    className="form-input"
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-status" className="form-label">
                  Status
                  <i className="fas fa-info-circle info-icon" title="The status of the user account."></i>
                </label>
                <div className="form-input-wrapper">
                  <select
                    id="new-status"
                    className="form-input small"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-roles" className="form-label">
                  Roles
                  <i className="fas fa-info-circle info-icon" title="Roles assigned to the new user."></i>
                </label>
                <div className="form-input-wrapper">
                  {/* For simplicity, a comma-separated input. In a real app, this would be a multi-select. */}
                  <input
                    id="new-roles"
                    type="text"
                    className="form-input"
                    value={newRoles.join(', ')}
                    onChange={(e) => setNewRoles(e.target.value.split(',').map(role => role.trim()))}
                    placeholder="e.g., ROLE_USER, ROLE_ADMIN"
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="button" className="form-button save" onClick={handleCreateNewUser}>
                  Create
                </button>
                <button type="button" className="form-button cancel" onClick={handleCancelNewUser}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : selectedUser ? (
          // Existing user details form (only visible when a user is selected)
          activeTab === 'general' && (
            <div className="form-section">
              <form>
                {/* ID field (display only) */}
                <div className="form-group">
                  <label htmlFor="user-id" className="form-label">
                    ID
                    <i className="fas fa-info-circle info-icon" title="The unique ID of the user."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="user-id"
                      type="text"
                      className="form-input small"
                      value={selectedUser.id}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Username field (modifiable) */}
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    <span style={{ color: 'red' }}>*</span> Username
                    <i className="fas fa-info-circle info-icon" title="The unique username of the user."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="username"
                      type="text"
                      className="form-input small"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email field (modifiable) */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <span style={{ color: 'red' }}>*</span> Email
                    <i className="fas fa-info-circle info-icon" title="The email address of the user."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="email"
                      type="email"
                      className="form-input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status field (modifiable) */}
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status
                    <i className="fas fa-info-circle info-icon" title="The status of the user account."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <select
                      id="status"
                      className="form-input small"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                      <option value="DISABLED">DISABLED</option>
                    </select>
                  </div>
                </div>

                {/* Roles field (modifiable) */}
                <div className="form-group">
                  <label htmlFor="roles" className="form-label">
                    Roles
                    <i className="fas fa-info-circle info-icon" title="Roles assigned to the user."></i>
                  </label>
                  <div className="form-input-wrapper">
                    {/* For simplicity, a comma-separated input. In a real app, this would be a multi-select. */}
                    <input
                      id="roles"
                      type="text"
                      className="form-input"
                      value={editRoles.join(', ')}
                      onChange={(e) => setEditRoles(e.target.value.split(',').map(role => role.trim()))}
                      placeholder="e.g., ROLE_USER, ROLE_ADMIN"
                    />
                  </div>
                </div>

                {/* Created At field (display only) */}
                <div className="form-group">
                  <label htmlFor="created-at" className="form-label">
                    Created At
                    <i className="fas fa-info-circle info-icon" title="The date and time when the user was created."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="created-at"
                      type="text"
                      className="form-input"
                      value={selectedUser.createdAt}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Updated At field (display only) */}
                <div className="form-group">
                  <label htmlFor="updated-at" className="form-label">
                    Updated At
                    <i className="fas fa-info-circle info-icon" title="The date and time when the user was last updated."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="updated-at"
                      type="text"
                      className="form-input"
                      value={selectedUser.updatedAt}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Last Login At field (display only) */}
                <div className="form-group">
                  <label htmlFor="last-login-at" className="form-label">
                    Last Login At
                    <i className="fas fa-info-circle info-icon" title="The date and time of the user's last login."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="last-login-at"
                      type="text"
                      className="form-input"
                      value={selectedUser.lastLoginAt || 'N/A'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  <button type="button" className="form-button save" onClick={handleSaveExistingUser}>
                    Save
                  </button>
                  <button type="button" className="form-button cancel" onClick={handleCancelExistingUser}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )
        ) : (
          // Display introductory text and list of users
          <div className="user-list-section">
            <div className="user-intro-text">
              <p>
                In Amcloud IAM, <strong>Users</strong> are individuals who can authenticate and interact with your applications.
                Each user has a unique identity, associated roles, and permissions that define their access rights.
              </p>
              <p>
                Manage existing users from the list below, or click "Create User" to add a new one.
              </p>
            </div>
            {users.length > 0 ? (
              <ul className="user-list">
                {users.map((user) => (
                  <li key={user.id} className="user-list-item">
                    <span className="user-name" onClick={() => handleSelectUser(user)}>
                      {user.username} ({user.email})
                    </span>
                    <span className="user-status">
                      Status: {user.status}
                    </span>
                    <button
                      className="user-delete-button"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-users-found">
                <p>No users found. Click "Create User" to add your first one.</p>
              </div>
            )}
          </div>
        )}
        {/* Message for other tabs when not creating or editing a new user */}
        {!isCreatingNewUser && !selectedUser && activeTab !== 'general' && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#777' }}>
            Content for {activeTab.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} tab is under development.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
