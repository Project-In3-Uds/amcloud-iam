// src/layouts/DashboardLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext'; // Import notification hook
import './DashboardLayout.css'; // Import the CSS file

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setIsDropdownOpen(false); // Close dropdown on logout
    await logout();
    // The logout function in AuthContext already handles redirection to /login
    // so no explicit navigate here.
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <i className="fas fa-cloud logo-icon"></i> {/* Font Awesome icon */}
          <span>AMCLOUD IAM</span>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className="sidebar-section-title">CONFIGURE</li>
            <li>
              <Link to="/realms" className={location.pathname === '/realms' ? 'active' : ''}>
                <i className="fas fa-globe nav-icon"></i> Realm Settings
              </Link>
            </li>
            <li>
              <Link to="/clients" className={location.pathname === '/clients' ? 'active' : ''}>
                <i className="fas fa-puzzle-piece nav-icon"></i> Clients
              </Link>
            </li>
            <li>
              <Link to="/client-scopes" className={location.pathname === '/client-scopes' ? 'active' : ''}>
                <i className="fas fa-crosshairs nav-icon"></i> Client Scopes
              </Link>
            </li>
            <li>
              <Link to="/roles" className={location.pathname === '/roles' ? 'active' : ''}>
                <i className="fas fa-user-tag nav-icon"></i> Roles
              </Link>
            </li>
            <li>
              <Link to="/identity-providers" className={location.pathname === '/identity-providers' ? 'active' : ''}>
                <i className="fas fa-id-card nav-icon"></i> Identity Providers
              </Link>
            </li>
            <li>
              <Link to="/user-federation" className={location.pathname === '/user-federation' ? 'active' : ''}>
                <i className="fas fa-users-cog nav-icon"></i> User Federation
              </Link>
            </li>
            <li>
              <Link to="/authentication" className={location.pathname === '/authentication' ? 'active' : ''}>
                <i className="fas fa-shield-alt nav-icon"></i> Authentication
              </Link>
            </li>

            <li className="sidebar-section-title">MANAGE</li>
            <li>
              <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>
                <i className="fas fa-users nav-icon"></i> Users
              </Link>
            </li>
            <li>
              <Link to="/groups" className={location.pathname === '/groups' ? 'active' : ''}>
                <i className="fas fa-layer-group nav-icon"></i> Groups
              </Link>
            </li>
            <li>
              <Link to="/sessions" className={location.pathname === '/sessions' ? 'active' : ''}>
                <i className="fas fa-clock nav-icon"></i> Sessions
              </Link>
            </li>
            <li>
              <Link to="/events" className={location.pathname === '/events' ? 'active' : ''}>
                <i className="fas fa-calendar-alt nav-icon"></i> Events
              </Link>
            </li>
            <li>
              <Link to="/import" className={location.pathname === '/import' ? 'active' : ''}>
                <i className="fas fa-file-import nav-icon"></i> Import
              </Link>
            </li>
            <li>
              <Link to="/export" className={location.pathname === '/export' ? 'active' : ''}>
                <i className="fas fa-file-export nav-icon"></i> Export
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <h1 className="header-title">Realm Settings</h1> {/* This title might need to be dynamic */}
          <div className="header-user-menu">
            <button className="header-user-button" onClick={toggleDropdown}>
              <i className="fas fa-user-circle user-icon"></i>
              admin <i className={`fas fa-caret-${isDropdownOpen ? 'up' : 'down'}`}></i>
            </button>
            {isDropdownOpen && (
              <ul className="dropdown-menu">
                <li><button onClick={handleLogout}>Logout</button></li>
              </ul>
            )}
          </div>
        </header>

        {/* Content Area (where pages like RealmManagementPage will be rendered) */}
        <div className="content-area">
          <Outlet /> {/* This is where nested routes will render */}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
