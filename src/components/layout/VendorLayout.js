import React from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import VendorSidebar from './VendorSidebar';

const VendorLayout = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex w-full">
      <VendorSidebar />
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
};

export default VendorLayout;
