import { ensureGlobalD } from '../../utils/runtimeGuards';

// Defensive: ensure D is defined before rendering any vendor dashboard children
ensureGlobalD();
import React from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import VendorSidebar from './VendorSidebar';

const VendorLayout = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex w-full">
      <VendorSidebar />
      <main className={`flex-1 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {children}
      </main>
    </div>
  );
};

export default VendorLayout;
