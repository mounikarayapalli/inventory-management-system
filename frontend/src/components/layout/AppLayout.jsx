import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import MobileQuickActionsSheet from './MobileQuickActionsSheet';
import MobileMoreDrawer from './MobileMoreDrawer';

export const AppLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const location = useLocation();

  // Close mobile overlays when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
    setQuickActionsOpen(false);
    setMoreDrawerOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile overlays
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
        setQuickActionsOpen(false);
        setMoreDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={handleCloseSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={handleCloseSidebar} />

      <div className="app-main-wrapper">
        <Navbar onToggleSidebar={handleToggleSidebar} />
        <main className="app-content" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile App Shell Elements (< 768px) */}
      <MobileBottomNav
        onOpenQuickActions={() => setQuickActionsOpen(true)}
        onOpenMoreDrawer={() => setMoreDrawerOpen(true)}
      />

      <MobileQuickActionsSheet
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
      />

      <MobileMoreDrawer
        isOpen={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
