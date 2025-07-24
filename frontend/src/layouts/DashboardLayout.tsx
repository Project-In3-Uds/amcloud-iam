// src/layouts/DashboardLayout.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import './DashboardLayout.css'; // Import the CSS file

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Reference for dropdown

  const handleLogout = async () => {
    setIsDropdownOpen(false); // Close dropdown on logout
    await logout();
    // The logout function in AuthContext already handles redirection to /login
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle clicks outside the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to determine if a navigation link is active (updated for nested routes)
  const isActive = (path: string) => {
    // For the dashboard home link, check exact match
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    // For nested admin routes, check if the current path starts with the link path
    return location.pathname.startsWith(path);
  };

  // Dynamic header title based on current route
  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
      case '/dashboard/':
        return 'Admin Console';
      case '/dashboard/realms':
        return 'Realm Settings';
      case '/dashboard/users':
        return 'Users';
      case '/dashboard/roles':
        return 'Roles';
      case '/dashboard/permissions':
        return 'Permissions';
      case '/dashboard/clients':
        return 'Clients';
      case '/dashboard/client-scopes':
        return 'Client Scopes';
      case '/dashboard/identity-providers':
        return 'Identity Providers';
      case '/dashboard/user-federation':
        return 'User Federation';
      case '/dashboard/authentication':
        return 'Authentication';
      case '/dashboard/groups':
        return 'Groups';
      case '/dashboard/sessions':
        return 'Sessions';
      case '/dashboard/events':
        return 'Events';
      case '/dashboard/import':
        return 'Import';
      case '/dashboard/export':
        return 'Export';
      default:
        return 'Amcloud IAM';
    }
  };


  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
          </svg>
          AMCLOUD IAM
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className="sidebar-section-title">CONFIGURE</li>
            <li>
              <Link to="/dashboard/realms" className={isActive("/dashboard/realms") ? "active" : ""}>
                <i className="nav-icon fas fa-cogs"></i> Realm Settings
              </Link>
            </li>
            <li>
              <Link to="/dashboard/clients" className={isActive("/dashboard/clients") ? "active" : ""}>
                <i className="nav-icon fas fa-users"></i> Clients
              </Link>
            </li>
            <li>
              <Link to="/dashboard/client-scopes" className={isActive("/dashboard/client-scopes") ? "active" : ""}>
                <i className="nav-icon fas fa-sitemap"></i> Client Scopes
              </Link>
            </li>
            <li>
              <Link to="/dashboard/roles" className={isActive("/dashboard/roles") ? "active" : ""}>
                <i className="nav-icon fas fa-user-tag"></i> Roles
              </Link>
            </li>
            <li>
              <Link to="/dashboard/identity-providers" className={isActive("/dashboard/identity-providers") ? "active" : ""}>
                <i className="nav-icon fas fa-id-card"></i> Identity Providers
              </Link>
            </li>
            <li>
              <Link to="/dashboard/user-federation" className={isActive("/dashboard/user-federation") ? "active" : ""}>
                <i className="nav-icon fas fa-users-cog"></i> User Federation
              </Link>
            </li>
            <li>
              <Link to="/dashboard/authentication" className={isActive("/dashboard/authentication") ? "active" : ""}>
                <i className="nav-icon fas fa-lock"></i> Authentication
              </Link>
            </li>

            <li className="sidebar-section-title">MANAGE</li>
            <li>
              <Link to="/dashboard/users" className={isActive("/dashboard/users") ? "active" : ""}>
                <i className="nav-icon fas fa-user"></i> Users
              </Link>
            </li>
            <li>
              <Link to="/dashboard/groups" className={isActive("/dashboard/groups") ? "active" : ""}>
                <i className="nav-icon fas fa-layer-group"></i> Groups
              </Link>
            </li>
            <li>
              <Link to="/dashboard/sessions" className={isActive("/dashboard/sessions") ? "active" : ""}>
                <i className="nav-icon fas fa-clock"></i> Sessions
              </Link>
            </li>
            <li>
              <Link to="/dashboard/events" className={isActive("/dashboard/events") ? "active" : ""}>
                <i className="nav-icon fas fa-calendar-alt"></i> Events
              </Link>
            </li>
            <li>
              <Link to="/dashboard/import" className={isActive("/dashboard/import") ? "active" : ""}>
                <i className="nav-icon fas fa-file-import"></i> Import
              </Link>
            </li>
            <li>
              <Link to="/dashboard/export" className={isActive("/dashboard/export") ? "active" : ""}>
                <i className="nav-icon fas fa-file-export"></i> Export
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1 className="header-title">{getHeaderTitle()}</h1>
          <div className="header-user-menu" ref={dropdownRef}>
            <button className="header-user-button" onClick={toggleDropdown}>
              <i className="fas fa-user-circle user-icon"></i> {/* User icon */}
              <span>{user?.username}</span>
              <i className={`fas fa-caret-${isDropdownOpen ? 'up' : 'down'}`}></i> {/* Arrow icon */}
            </button>
            {isDropdownOpen && (
              <ul className="dropdown-menu">
                <li>
                  <button onClick={handleLogout}>Sign Out</button>
                </li>
              </ul>
            )}
          </div>
        </header>
        <div className="content-area">
          {/* This is where the nested route content will be rendered */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
