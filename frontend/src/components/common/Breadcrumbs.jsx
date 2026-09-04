import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  '/dashboard': ['Home', 'Dashboard'],
  '/items': ['Masters', 'Items'],
  '/categories': ['Masters', 'Categories'],
  '/suppliers': ['Masters', 'Suppliers'],
  '/locations': ['Masters', 'Locations'],
  '/inventory/opening-stock': ['Inventory', 'Opening Stock'],
  '/inventory/inward': ['Inventory', 'Inward'],
  '/inventory/outward': ['Inventory', 'Outward'],
  '/inventory/distribution': ['Inventory', 'Distribution'],
  '/inventory/returns': ['Inventory', 'Returns'],
  '/inventory/adjustments': ['Inventory', 'Stock Adjustment'],
  '/stock': ['Stock', 'Available Stock'],
  '/stock/movements': ['Stock', 'Stock Movement'],
  '/reports': ['Home', 'Reports'],
  '/users': ['Home', 'Users'],
};

export const Breadcrumbs = ({ items }) => {
  const location = useLocation();

  const breadcrumbsList = items || ROUTE_LABELS[location.pathname] || ['Home', 'Page'];

  return (
    <nav className="breadcrumbs-nav" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <Link to="/dashboard" className="breadcrumb-link" aria-label="Home Dashboard">
            <Home size={14} />
          </Link>
        </li>
        {breadcrumbsList.map((label, idx) => (
          <li key={idx} className="breadcrumb-item">
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className={idx === breadcrumbsList.length - 1 ? 'breadcrumb-current' : 'breadcrumb-text'}>
              {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
