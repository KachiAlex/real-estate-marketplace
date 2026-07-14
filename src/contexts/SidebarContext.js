import React, { createContext, useContext, useState, useCallback } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarEnabled, setIsDesktopSidebarEnabled] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const collapseSidebar = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expandSidebar = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const enableDesktopSidebar = useCallback(() => setIsDesktopSidebarEnabled(true), []);
  const disableDesktopSidebar = useCallback(() => setIsDesktopSidebarEnabled(false), []);

  const value = {
    isCollapsed,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
    isMobileSidebarOpen,
    toggleMobileSidebar,
    closeMobileSidebar,
    isDesktopSidebarEnabled,
    enableDesktopSidebar,
    disableDesktopSidebar
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
