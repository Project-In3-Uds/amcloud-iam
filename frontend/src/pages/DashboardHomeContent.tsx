// src/pages/DashboardHomeContent.tsx
import React from 'react';
// Note: This component no longer imports DashboardLayout or its CSS directly.
// It's just the content for the dashboard's home page.

const DashboardHomeContent: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg text-center">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Welcome to Amcloud IAM!</h2>
      <p className="text-lg text-gray-700">
        This is your central hub for managing identity and access for your applications.
        Use the navigation on the left to configure realms, manage users, roles, and more.
      </p>
      {/* You can add more dashboard-specific content here, e.g., statistics, quick links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-blue-50 rounded-lg shadow-sm">
          <i className="fas fa-users text-blue-600 text-3xl mb-3"></i>
          <h3 className="font-semibold text-gray-700">Total Users</h3>
          <p className="text-2xl font-bold text-blue-800">1,234</p>
        </div>
        <div className="p-6 bg-green-50 rounded-lg shadow-sm">
          <i className="fas fa-puzzle-piece text-green-600 text-3xl mb-3"></i>
          <h3 className="font-semibold text-gray-700">Active Clients</h3>
          <p className="text-2xl font-bold text-green-800">56</p>
        </div>
        <div className="p-6 bg-purple-50 rounded-lg shadow-sm">
          <i className="fas fa-globe text-purple-600 text-3xl mb-3"></i>
          <h3 className="font-semibold text-gray-700">Realms Configured</h3>
          <p className="text-2xl font-bold text-purple-800">3</p>
        </div>
        <div className="p-6 bg-red-50 rounded-lg shadow-sm">
          <i className="fas fa-shield-alt text-red-600 text-3xl mb-3"></i>
          <h3 className="font-semibold text-gray-700">Security Events</h3>
          <p className="text-2xl font-bold text-red-800">12</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHomeContent;
