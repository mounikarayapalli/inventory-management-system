// Navigation configuration for Calibo AI Academy Stock & Inventory Management
// Structured with allowedRoles metadata for seamless future RBAC integration.

export const ROLES = {
  ADMIN: 'Admin',
  STOCK_MANAGER: 'Stock Manager',
};

export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'Boxes',
    allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
    children: [
      {
        id: 'opening-stock',
        label: 'Opening Stock',
        path: '/inventory/opening-stock',
        icon: 'Archive',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'inward',
        label: 'Inward',
        path: '/inventory/inward',
        icon: 'ArrowDownLeft',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'outward',
        label: 'Outward',
        path: '/inventory/outward',
        icon: 'ArrowUpRight',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'distribution',
        label: 'Distribution',
        path: '/inventory/distribution',
        icon: 'GitFork',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'returns',
        label: 'Returns',
        path: '/inventory/returns',
        icon: 'RotateCcw',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'adjustments',
        label: 'Stock Adjustment',
        path: '/inventory/adjustments',
        icon: 'Sliders',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: 'Warehouse',
    allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
    children: [
      {
        id: 'available-stock',
        label: 'Available Stock',
        path: '/stock',
        icon: 'Warehouse',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'stock-movements',
        label: 'Stock Movement',
        path: '/stock/movements',
        icon: 'History',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
    ],
  },
  {
    id: 'masters',
    label: 'Masters',
    icon: 'Database',
    allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
    children: [
      {
        id: 'items',
        label: 'Items',
        path: '/items',
        icon: 'Package',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'categories',
        label: 'Categories',
        path: '/categories',
        icon: 'Tags',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'suppliers',
        label: 'Suppliers',
        path: '/suppliers',
        icon: 'Truck',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
      {
        id: 'locations',
        label: 'Locations',
        path: '/locations',
        icon: 'MapPin',
        allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: 'FileBarChart',
    allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
  },
  {
    id: 'users',
    label: 'Users',
    path: '/users',
    icon: 'Users',
    allowedRoles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
  },
];
