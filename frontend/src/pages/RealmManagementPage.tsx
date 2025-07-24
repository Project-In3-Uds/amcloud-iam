// src/pages/RealmManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import * as realmService from '../services/realm'; // Import the new realm service
import { useNotification } from '../contexts/NotificationContext'; // Import notification hook
import axios from 'axios'; // Import axios for error handling
import './RealmManagementPage.css'; // Import the new CSS file

// Define Realm interface based on backend RealmResponse DTO
interface Realm {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const RealmManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isCreatingNewRealm, setIsCreatingNewRealm] = useState(false);
  const [realms, setRealms] = useState<Realm[]>([]);
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  // State for new realm creation form
  const [newRealmName, setNewRealmName] = useState('');
  const [newRealmDescription, setNewRealmDescription] = useState('');

  // State for editing existing realm
  const [editRealmName, setEditRealmName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Function to fetch all realms
  const fetchRealms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await realmService.getAllRealms();
      setRealms(response.data);
      // If no realms exist and not in creation mode, automatically switch to creation mode
      if (response.data.length === 0 && !isCreatingNewRealm) {
        setIsCreatingNewRealm(true);
        setSelectedRealm(null); // Ensure no realm is selected when creating
        setActiveTab('general'); // Ensure general tab is active for new creation
      } else if (response.data.length > 0 && isCreatingNewRealm) {
        // If realms exist and we were in creation mode, revert to list view
        setIsCreatingNewRealm(false);
        setSelectedRealm(null); // Ensure no realm is selected
      }
    } catch (error: any) {
      console.error('Error fetching realms:', error);
      let errorMessage = 'Failed to load realms.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data || errorMessage;
      }
      showNotification(errorMessage, 'error');
      setRealms([]); // Clear realms on error
    } finally {
      setLoading(false);
    }
  }, [isCreatingNewRealm, showNotification]);

  // Effect to fetch realms on component mount and when creation mode changes
  useEffect(() => {
    fetchRealms();
  }, [fetchRealms]);

  // Effect to populate edit form when a realm is selected
  useEffect(() => {
    if (selectedRealm) {
      setEditRealmName(selectedRealm.name);
      setEditDescription(selectedRealm.description);
      setIsCreatingNewRealm(false); // Ensure not in creation mode when editing
      setActiveTab('general'); // Always show general tab for editing
    }
  }, [selectedRealm]);

  const handleSelectRealm = (realm: Realm) => {
    setSelectedRealm(realm);
    setIsCreatingNewRealm(false); // Exit creation mode if a realm is selected
  };

  const handleSaveExistingRealm = async () => {
    if (!selectedRealm) return;

    setLoading(true);
    try {
      const updatedRealmData = {
        name: editRealmName,
        description: editDescription,
      };
      await realmService.updateRealm(selectedRealm.id, updatedRealmData);
      showNotification('Realm updated successfully!', 'success');
      setSelectedRealm(null); // Deselect after saving
      fetchRealms(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating realm:', error);
      let errorMessage = 'Failed to update realm.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data || errorMessage;
      }
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExistingRealm = () => {
    setSelectedRealm(null); // Deselect
    fetchRealms(); // Refresh to ensure latest data if needed
  };

  const handleCreateNewRealm = async () => {
    setLoading(true);
    try {
      const newRealmData = {
        name: newRealmName,
        description: newRealmDescription,
      };
      await realmService.createRealm(newRealmData);
      showNotification('Realm created successfully!', 'success');
      setNewRealmName('');
      setNewRealmDescription('');
      setIsCreatingNewRealm(false); // Exit creation mode
      setSelectedRealm(null); // Ensure no realm is selected
      fetchRealms(); // Refresh the list to show the new realm
    } catch (error: any) {
      console.error('Error creating realm:', error);
      let errorMessage = 'Failed to create realm.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data || errorMessage;
      }
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewRealm = () => {
    setNewRealmName('');
    setNewRealmDescription('');
    setIsCreatingNewRealm(false); // Exit creation mode
    setSelectedRealm(null); // Ensure no realm is selected
    fetchRealms(); // Go back to list view
  };

  const handleDeleteRealm = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this realm? This action cannot be undone.')) {
      setLoading(true);
      try {
        await realmService.deleteRealm(id);
        showNotification('Realm deleted successfully!', 'success');
        setSelectedRealm(null); // Deselect if the deleted realm was selected
        fetchRealms(); // Refresh the list
      } catch (error: any) {
        console.error('Error deleting realm:', error);
        let errorMessage = 'Failed to delete realm.';
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
      <div className="realm-management-container" style={{ textAlign: 'center', padding: '50px' }}>
        Loading realms...
      </div>
    );
  }

  return (
    <div className="realm-management-container">
      <div className="realm-header-section">
        <h1 className="realm-main-title">
          {isCreatingNewRealm ? 'Create New Realm' : selectedRealm ? selectedRealm.name : 'Realms'}
        </h1>
        <div className="realm-header-actions">
          {selectedRealm && (
            <i
              className="fas fa-trash-alt"
              style={{ color: '#dc3545', cursor: 'pointer', fontSize: '1.1rem', marginRight: '15px' }}
              onClick={() => handleDeleteRealm(selectedRealm.id)}
              title="Delete Realm"
            ></i>
          )}
          {!isCreatingNewRealm && (
            <button
              className="form-button save"
              onClick={() => {
                setIsCreatingNewRealm(true);
                setSelectedRealm(null); // Clear selected realm when creating new
                setActiveTab('general');
              }}
            >
              Create Realm
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation - only visible when a realm is selected */}
      {selectedRealm && !isCreatingNewRealm && (
        <nav className="realm-tabs-nav">
          <button
            className={`realm-tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`realm-tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
            disabled={!selectedRealm} // Disable other tabs if no realm is selected
          >
            Login
          </button>
          <button
            className={`realm-tab-button ${activeTab === 'keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('keys')}
            disabled={!selectedRealm}
          >
            Keys
          </button>
          <button
            className={`realm-tab-button ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
            disabled={!selectedRealm}
          >
            Email
          </button>
          <button
            className={`realm-tab-button ${activeTab === 'themes' ? 'active' : ''}`}
            onClick={() => setActiveTab('themes')}
            disabled={!selectedRealm}
          >
            Themes
          </button>
          <button
            className={`realm-tab-button ${activeTab === 'cache' ? 'active' : ''}`}
            onClick={() => setActiveTab('cache')}
            disabled={!selectedRealm}
          >
            Cache
          </button>
          <button
            className={`realm-tab-button ${activeTab === 'tokens' ? 'active' : ''}`}
            onClick={() => setActiveTab('tokens')}
            disabled={!selectedRealm}
          >
            Tokens
          </button>
          <button
            className={`realm-tab-button ${activeTab === 'client-registration' ? 'active' : ''}`}
            onClick={() => setActiveTab('client-registration')}
            disabled={!selectedRealm}
          >
            Client Registration
          </button>
          <button
            className={`realm-tab-button ${activeTab === 'security-defenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('security-defenses')}
            disabled={!selectedRealm}
          >
            Security Defenses
          </button>
        </nav>
      )}

      <div className="realm-tab-content">
        {isCreatingNewRealm ? (
          // Form for creating a new realm
          <div className="form-section">
            <form>
              <div className="form-group">
                <label htmlFor="new-realm-name" className="form-label">
                  <span style={{ color: 'red' }}>*</span> Name
                  <i className="fas fa-info-circle info-icon" title="The unique name of the new realm."></i>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="new-realm-name"
                    type="text"
                    className="form-input small"
                    value={newRealmName}
                    onChange={(e) => setNewRealmName(e.target.value)}
                    placeholder="Enter new realm name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-realm-description" className="form-label">
                  Description
                  <i className="fas fa-info-circle info-icon" title="A brief description for the new realm."></i>
                </label>
                <div className="form-input-wrapper">
                  <textarea
                    id="new-realm-description"
                    className="form-input"
                    value={newRealmDescription}
                    onChange={(e) => setNewRealmDescription(e.target.value)}
                    rows={3}
                    placeholder="Enter new realm description"
                  ></textarea>
                </div>
              </div>

              <div className="form-buttons">
                <button type="button" className="form-button save" onClick={handleCreateNewRealm}>
                  Create
                </button>
                <button type="button" className="form-button cancel" onClick={handleCancelNewRealm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : selectedRealm ? (
          // Existing realm details form (only visible when a realm is selected)
          activeTab === 'general' && (
            <div className="form-section">
              <form>
                {/* ID field (display only) */}
                <div className="form-group">
                  <label htmlFor="realm-id" className="form-label">
                    ID
                    <i className="fas fa-info-circle info-icon" title="The unique ID of the realm."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="realm-id"
                      type="text"
                      className="form-input small"
                      value={selectedRealm.id}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Name field (modifiable) */}
                <div className="form-group">
                  <label htmlFor="realm-name" className="form-label">
                    <span style={{ color: 'red' }}>*</span> Name
                    <i className="fas fa-info-circle info-icon" title="The unique name of the realm."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="realm-name"
                      type="text"
                      className="form-input small"
                      value={editRealmName}
                      onChange={(e) => setEditRealmName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description field (modifiable) */}
                <div className="form-group">
                  <label htmlFor="realm-description" className="form-label">
                    Description
                    <i className="fas fa-info-circle info-icon" title="A brief description of the realm."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <textarea
                      id="realm-description"
                      className="form-input"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                    ></textarea>
                  </div>
                </div>

                {/* Created At field (display only) */}
                <div className="form-group">
                  <label htmlFor="created-at" className="form-label">
                    Created At
                    <i className="fas fa-info-circle info-icon" title="The date and time when the realm was created."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="created-at"
                      type="text"
                      className="form-input"
                      value={selectedRealm.createdAt}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Updated At field (display only) */}
                <div className="form-group">
                  <label htmlFor="updated-at" className="form-label">
                    Updated At
                    <i className="fas fa-info-circle info-icon" title="The date and time when the realm was last updated."></i>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="updated-at"
                      type="text"
                      className="form-input"
                      value={selectedRealm.updatedAt}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  <button type="button" className="form-button save" onClick={handleSaveExistingRealm}>
                    Save
                  </button>
                  <button type="button" className="form-button cancel" onClick={handleCancelExistingRealm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )
        ) : (
          // Display introductory text and list of realms
          <div className="realm-list-section">
            <div className="realm-intro-text">
              <p>
                In Amcloud IAM, a <strong>Realm</strong> represents a logical partition of users, applications, and security policies.
              </p>
              <p>
                Select an existing realm from the list below to manage its settings, or click "Create Realm" to set up a new one.
              </p>
            </div>
            {realms.length > 0 ? (
              <ul className="realm-list">
                {realms.map((realm) => (
                  <li key={realm.id} className="realm-list-item">
                    <span className="realm-name" onClick={() => handleSelectRealm(realm)}>
                      {realm.name}
                    </span>
                    <span className="realm-description">
                      {realm.description || 'No description provided'}
                    </span>
                    <button
                      className="realm-delete-button"
                      onClick={() => handleDeleteRealm(realm.id)}
                      title="Delete Realm"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-realms-found">
                <p>No realms found. Click "Create Realm" to add your first one.</p>
              </div>
            )}
          </div>
        )}
        {/* Message for other tabs when not creating or editing a new realm */}
        {!isCreatingNewRealm && !selectedRealm && activeTab !== 'general' && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#777' }}>
            Content for {activeTab.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} tab is under development.
          </div>
        )}
      </div>
    </div>
  );
};

export default RealmManagementPage;
