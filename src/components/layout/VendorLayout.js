import React from 'react';
import { FaBars } from 'react-icons/fa';
import { useSidebar } from '../../contexts/SidebarContext';
import VendorSidebar from './VendorSidebar';

const VendorLayout = ({ children }) => {
  const { isCollapsed, toggleMobileSidebar } = useSidebar();

  return (
    <div className="flex w-full">
      <VendorSidebar />
      <main className={`flex-1 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Mobile hamburger — only visible on small screens */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-gray-900"
            aria-label="Open sidebar"
          >
            <FaBars className="h-5 w-5" />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
};

export default VendorLayout;
