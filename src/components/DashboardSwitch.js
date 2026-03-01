import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaStore, FaShoppingCart, FaExchangeAlt, FaCog, FaChartLine, FaBuilding } from 'react-icons/fa';
import { 
  getPrimaryRole, 
  getDashboardPath, 
  canSwitchToRole, 
  getAvailableDashboards, 
  getRoleDisplayName,
  getRoleTheme,
  getSwitchRoleValue 
} from '../utils/roleManager';

export default function DashboardSwitch() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingRole, setLoadingRole] = useState(null);

  // Get primary role and available dashboards
  const primaryRole = getPrimaryRole(user);
  const availableDashboards = getAvailableDashboards(user);

  if (!availableDashboards || availableDashboards.length <= 1) {
    return null;
  }

  const currentPath = location.pathname;

  // Enhanced switch handler: change active role then navigate
  const handleSwitch = async (targetRole, switchValueOverride = null) => {
    const canonicalSwitchValue = switchValueOverride || getSwitchRoleValue(targetRole);

    if (!switchRole) {
      navigate(getDashboardPath(targetRole));
      return;
    }

    try {
      setLoadingRole(targetRole);
      await switchRole(canonicalSwitchValue);
      const targetPath = getDashboardPath(targetRole);
      navigate(targetPath);
      toast.success(`Switched to ${getRoleDisplayName(targetRole)} Dashboard`);
    } catch (e) {
      console.error('Role switch failed', e);
      toast.error(e.message || 'Failed to switch dashboard');
    } finally {
      setLoadingRole(null);
    }
  };

  // Get icon for dashboard
  const getIcon = (iconName) => {
    const icons = {
      'store': FaStore,
      'shopping-cart': FaShoppingCart,
      'cog': FaCog,
      'chart-line': FaChartLine,
      'bank': FaBuilding
    };
    return icons[iconName] || FaShoppingCart;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FaExchangeAlt className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Switch Dashboard</h3>
        </div>
        <div className="text-sm text-gray-500">
          Active: <span className="font-medium text-gray-700 capitalize">{getRoleDisplayName(primaryRole)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableDashboards.map((dashboard) => {
          const switchable = canSwitchToRole(user, dashboard.role);
          const isActiveByRole = primaryRole === dashboard.role;
          const isActive = isActiveByRole || currentPath === dashboard.path;
          const theme = getRoleTheme(dashboard.role);
          const Icon = getIcon(dashboard.icon);
          
          return (
            <button
              key={dashboard.role}
              onClick={() => handleSwitch(dashboard.role, dashboard.switchValue)}
              disabled={isActive || loadingRole === dashboard.role || !switchable}
              className={`relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                isActive 
                  ? `${theme.border} ${theme.bg}` 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${
                    isActive ? `${theme.button} text-white` : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Icon className="text-lg" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-gray-800">{dashboard.name}</h4>
                    <p className="text-xs text-gray-600">{dashboard.description}</p>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className={`${theme.button} text-white text-xs px-2 py-1 rounded-full`}>
                      Active
                    </span>
                  </div>
                )}
                {loadingRole === dashboard.role && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                    <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${theme.primary === 'green' ? 'border-green-500' : theme.primary === 'blue' ? 'border-blue-500' : theme.primary === 'red' ? 'border-red-500' : theme.primary === 'purple' ? 'border-purple-500' : theme.primary === 'indigo' ? 'border-indigo-500' : 'border-gray-500'}`}></div>
                  </div>
                )}
                {!switchable && !isActive && (
                  <div className="absolute inset-x-0 bottom-2 text-center text-xs text-gray-400">
                    Not available
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Switch between your different dashboard views
      </div>
    </div>
  );
}
