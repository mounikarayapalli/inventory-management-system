import React, { createContext, useContext, useState } from 'react';
import { ROLES } from '../constants/navigation';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  // Temporary development state for testing Admin vs Stock Manager view modes
  const [activeRole, setActiveRole] = useState(ROLES.ADMIN);

  const value = {
    activeRole,
    setActiveRole,
    isAdmin: activeRole === ROLES.ADMIN,
    isStockManager: activeRole === ROLES.STOCK_MANAGER,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    // Fallback if rendered outside Provider
    return {
      activeRole: ROLES.ADMIN,
      setActiveRole: () => {},
      isAdmin: true,
      isStockManager: false,
    };
  }
  return context;
};

/* [DEV TEMPORARY WIDGET]
   This component is isolated exclusively for development testing.
   In production, the user role will be read directly from the backend/JWT session.
*/
export const DevRoleSwitcher = () => {
  const { activeRole, setActiveRole } = useRole();

  return (
    <div className="dev-role-switcher-bar">
      <span className="dev-role-label">[DEV ONLY] View Mode:</span>
      <button
        className={`dev-role-btn ${activeRole === ROLES.ADMIN ? 'active' : ''}`}
        onClick={() => setActiveRole(ROLES.ADMIN)}
      >
        Admin (Full Access)
      </button>
      <button
        className={`dev-role-btn ${activeRole === ROLES.STOCK_MANAGER ? 'active' : ''}`}
        onClick={() => setActiveRole(ROLES.STOCK_MANAGER)}
      >
        Stock Manager (View Only)
      </button>
    </div>
  );
};

export default RoleContext;
