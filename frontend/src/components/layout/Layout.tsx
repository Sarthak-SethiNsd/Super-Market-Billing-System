import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F6F1] text-[#303631] print:block print:h-auto print:w-auto print:overflow-visible print:bg-white">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:block print:overflow-visible">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto px-3 py-3.5 sm:px-4 sm:py-6 md:px-8 md:py-8 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto space-y-3.5 sm:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
