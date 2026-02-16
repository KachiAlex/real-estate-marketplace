import React, { useState } from 'react';
import { FaHome, FaEnvelope, FaCalendar, FaMoneyBillWave, FaUsers, FaFileContract, FaBell, FaUser } from 'react-icons/fa';

const sections = [
  { id: 'overview', label: 'Overview', icon: FaHome },
  { id: 'properties', label: 'Properties', icon: FaHome },
  { id: 'inquiries', label: 'Inquiries', icon: FaEnvelope },
  { id: 'inspections', label: 'Inspections', icon: FaCalendar },
  { id: 'earnings', label: 'Earnings', icon: FaMoneyBillWave },
  { id: 'team', label: 'Team', icon: FaUsers },
  { id: 'contracts', label: 'Contracts', icon: FaFileContract },
  { id: 'notifications', label: 'Notifications', icon: FaBell },
  { id: 'profile', label: 'Profile', icon: FaUser }
];

const VendorDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-blue">Vendor Dashboard</h2>
        </div>
        <nav className="flex-1 px-4 py-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2 ${activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <section.icon className="h-5 w-5" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {activeSection === 'overview' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Overview</h1>
            <p className="text-gray-700">Welcome to your vendor dashboard. Quick stats and actions will appear here.</p>
          </div>
        )}
        {activeSection === 'properties' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Properties</h1>
            <p className="text-gray-700">Manage your property listings here.</p>
          </div>
        )}
        {activeSection === 'inquiries' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Inquiries</h1>
            <p className="text-gray-700">View and respond to buyer inquiries.</p>
          </div>
        )}
        {activeSection === 'inspections' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Inspections</h1>
            <p className="text-gray-700">Handle inspection requests and analytics.</p>
          </div>
        )}
        {activeSection === 'earnings' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Earnings</h1>
            <p className="text-gray-700">Track your earnings and transactions.</p>
          </div>
        )}
        {activeSection === 'team' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Team</h1>
            <p className="text-gray-700">Manage your team members and roles.</p>
          </div>
        )}
        {activeSection === 'contracts' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Contracts</h1>
            <p className="text-gray-700">View and manage contracts.</p>
          </div>
        )}
        {activeSection === 'notifications' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
            <p className="text-gray-700">See your notifications and alerts.</p>
          </div>
        )}
        {activeSection === 'profile' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <p className="text-gray-700">Edit your vendor profile and settings.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;
