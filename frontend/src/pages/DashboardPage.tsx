// src/pages/DashboardPage.tsx
import React from 'react';
import '../layouts/DashboardLayout.css'; // Correct import for layout CSS

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-content">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Amcloud IAM Dashboard</h2>
      <p className="text-gray-600">
        This is your central hub for managing identity and access for your applications.
        Use the navigation on the left to configure realms, manage users, roles, and more.
      </p>
      <div className="dashboard-stats-grid mt-8">
        <div className="stat-card">
          <i className="fas fa-users icon-large text-blue-500"></i>
          <h3 className="stat-title">Total Users</h3>
          <p className="stat-value">1,234</p> {/* Placeholder data */}
        </div>
        <div className="stat-card">
          <i className="fas fa-puzzle-piece icon-large text-green-500"></i>
          <h3 className="stat-title">Active Clients</h3>
          <p className="stat-value">56</p> {/* Placeholder data */}
        </div>
        <div className="stat-card">
          <i className="fas fa-globe icon-large text-purple-500"></i>
          <h3 className="stat-title">Realms Configured</h3>
          <p className="stat-value">3</p> {/* Placeholder data */}
        </div>
        <div className="stat-card">
          <i className="fas fa-shield-alt icon-large text-red-500"></i>
          <h3 className="stat-title">Security Events</h3>
          <p className="stat-value">12</p> {/* Placeholder data */}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

