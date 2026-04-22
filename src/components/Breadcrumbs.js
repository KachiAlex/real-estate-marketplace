import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';

const Breadcrumbs = ({ items }) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from route if items not provided
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const breadcrumbItems = items || [
    { label: 'Home', path: '/' },
    ...pathnames.map((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { label, path: routeTo };
    })
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={item.path || index} className="flex items-center">
              {index === 0 && (
                <FaHome className="h-4 w-4 text-gray-400 mr-2" aria-hidden="true" />
              )}
              {isLast ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link 
                    to={item.path} 
                    className="hover:text-blue-600 transition-colors"
                    aria-label={`Navigate to ${item.label}`}
                  >
                    {item.label}
                  </Link>
                  <FaChevronRight className="h-3 w-3 text-gray-400 mx-2" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

