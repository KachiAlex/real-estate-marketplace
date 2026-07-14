import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Breadcrumbs from '../Breadcrumbs';

const renderWithRouter = (component, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('Breadcrumbs', () => {
  it('should render breadcrumbs with provided items', () => {
    const items = [
      { label: 'Home', path: '/' },
      { label: 'Properties', path: '/properties' },
      { label: 'Property Detail', path: '/property/123' }
    ];

    renderWithRouter(<Breadcrumbs items={items} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Property Detail')).toBeInTheDocument();
  });

  it('should auto-generate breadcrumbs from route when items not provided', () => {
    renderWithRouter(<Breadcrumbs />, ['/properties']);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('should mark last item as current page', () => {
    const items = [
      { label: 'Home', path: '/' },
      { label: 'Admin Dashboard', path: '/admin' }
    ];

    renderWithRouter(<Breadcrumbs items={items} />);
    
    const lastItem = screen.getByText('Admin Dashboard');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });

  it('should render links for non-last items', () => {
    const items = [
      { label: 'Home', path: '/' },
      { label: 'Properties', path: '/properties' }
    ];

    renderWithRouter(<Breadcrumbs items={items} />);
    
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should have correct ARIA label', () => {
    renderWithRouter(<Breadcrumbs items={[{ label: 'Home', path: '/' }]} />);
    
    const nav = screen.getByLabelText('Breadcrumb');
    expect(nav).toBeInTheDocument();
  });

  it('should handle empty items array gracefully', () => {
    renderWithRouter(<Breadcrumbs items={[]} />);
    
    // Should still render navigation structure
    const nav = screen.getByLabelText('Breadcrumb');
    expect(nav).toBeInTheDocument();
  });

  it('should format route names correctly when auto-generating', () => {
    renderWithRouter(<Breadcrumbs />, ['/admin-dashboard']);
    
    // Should capitalize and format route name
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});

