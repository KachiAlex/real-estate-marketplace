import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { SidebarProvider, useSidebar } from '../../../contexts/SidebarContext';

// Mock AuthContext for authenticated user
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123', firstName: 'John', email: 'john@example.com', roles: ['buyer'] },
    logout: jest.fn(),
  }),
}));

// Helper to render Sidebar inside a specific route with SidebarProvider
const renderSidebar = (initialRoute = '/', desktopEnabled = true) => {
  // Override the default isDesktopSidebarEnabled
  const TestWrapper = ({ children }) => (
    <MemoryRouter initialEntries={[initialRoute]}>
      <SidebarProvider>
        <SidebarController enabled={desktopEnabled}>
          {children}
        </SidebarController>
      </SidebarProvider>
    </MemoryRouter>
  );
  return render(<TestWrapper><Sidebar /></TestWrapper>);
};

const SidebarController = ({ enabled, children }) => {
  const { enableDesktopSidebar, disableDesktopSidebar } = useSidebar();
  React.useEffect(() => {
    if (enabled) enableDesktopSidebar();
    else disableDesktopSidebar();
  }, [enabled, enableDesktopSidebar, disableDesktopSidebar]);
  return <>{children}</>;
};

describe('Sidebar Desktop Visibility Regression', () => {
  it('should be visible on dashboard routes when desktop sidebar is enabled', () => {
    renderSidebar('/dashboard', true);
    const sidebar = screen.getByText('Buyer Dashboard').closest('div[class*="w-64"]');
    // Check that the transform class does NOT contain -translate-x-full on desktop
    expect(sidebar).toHaveClass('lg:translate-x-0');
  });

  it('should be hidden on non-dashboard routes when desktop sidebar is disabled', () => {
    renderSidebar('/', false);
    const sidebar = screen.getByText('Buyer Dashboard').closest('div[class*="w-64"]');
    // The critical regression check: must contain lg:-translate-x-full when disabled
    expect(sidebar).toHaveClass('lg:-translate-x-full');
    // Must NOT have the old hardcoded lg:translate-x-0 when disabled
    expect(sidebar).not.toHaveClass('lg:translate-x-0');
  });

  it('should be hidden on properties page when desktop sidebar is disabled', () => {
    renderSidebar('/properties', false);
    const sidebar = screen.getByText('Buyer Dashboard').closest('div[class*="w-64"]');
    expect(sidebar).toHaveClass('lg:-translate-x-full');
    expect(sidebar).not.toHaveClass('lg:translate-x-0');
  });
});
