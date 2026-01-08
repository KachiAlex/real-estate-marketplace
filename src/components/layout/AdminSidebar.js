import React from 'react';
import { 
  FaBuilding, 
  FaFileContract, 
  FaFileAlt, 
  FaUsers, 
  FaChartBar,
  FaBlog,
  FaCheckCircle,
  FaUniversity
} from 'react-icons/fa';

export const ADMIN_MENU_ITEMS = [
    { 
      id: 'properties', 
      label: 'Properties', 
      icon: FaBuilding,
      description: 'Manage property listings and verifications'
    },
    { 
      id: 'verification', 
      label: 'Verification', 
      icon: FaCheckCircle,
      description: 'Review property verification requests'
    },
    { 
      id: 'escrow', 
      label: 'Escrow', 
      icon: FaFileContract,
      description: 'Monitor escrow transactions'
    },
    { 
      id: 'disputes', 
      label: 'Disputes', 
      icon: FaFileAlt,
      description: 'Handle dispute resolutions'
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: FaUsers,
      description: 'Manage user accounts'
    },
    { 
      id: 'blog', 
      label: 'Blog', 
      icon: FaBlog,
      description: 'Manage blog posts and content'
    },
    { 
      id: 'mortgage-banks', 
      label: 'Mortgage Banks', 
      icon: FaUniversity,
      description: 'Verify and manage mortgage banks'
    }
  ];

const AdminSidebar = ({ activeTab, setActiveTab }) => {

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="hidden lg:flex lg:flex-col w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40">
      {/* Admin Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center">
            <FaChartBar className="text-white text-lg" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">ADMIN PANEL</p>
            <p className="text-sm font-semibold text-gray-900">PropertyArk</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <nav className="space-y-1">
          {ADMIN_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-brand-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={item.description}
              >
                <Icon className="text-lg flex-shrink-0" />
                <div className="flex-1">
                  <span className="block">{item.label}</span>
                  <span className={`text-xs leading-snug ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin Info */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
            System Status
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;


