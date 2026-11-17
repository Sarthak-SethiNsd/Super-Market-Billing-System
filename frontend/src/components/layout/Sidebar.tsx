import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Boxes,
  BarChart3,
  ShieldAlert,
  Code2,
  Store,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { role, isAdmin } = useAuth();
  const location = useLocation();

  const operationItems = [
    { name: 'Dashboard', path: '/staff', aliasPath: '/dashboard', icon: LayoutDashboard },
    { name: 'Billing & Checkout', path: '/billing', icon: ShoppingCart },
  ];

  const adminModules = [
    { name: 'Admin Panel Hub', path: '/admin', icon: ShieldAlert },
    { name: 'Product Management', path: '/products', icon: Package },
    { name: 'Inventory Management', path: '/inventory', icon: Boxes },
    { name: 'Sales Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Staff Management', path: '/admin', icon: UserCheck },
    { name: 'Transactions & Sales History', path: '/transactions', icon: Receipt },
  ];

  const technicalItems = [
    { name: 'OOP Concepts Explorer', path: '/oop-concepts', icon: Code2, badge: 'C++17' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#263B32] text-[#d6e2dc] border-r border-[#334c41] select-none">
      {/* Brand Header */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b border-[#334c41] ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-10 h-10 rounded bg-[#285943] border border-[#3d5a4d] flex items-center justify-center text-white shrink-0">
          <Store className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-base text-white tracking-tight leading-tight truncate">
              Supermart
            </span>
            <span className="text-xs text-[#9cb5a8] font-medium tracking-wide">
              Management Platform
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* Operations Section */}
        <div className="space-y-1">
          <div className={`px-3 mb-2 text-[10px] font-semibold text-[#82998e] uppercase tracking-wider ${collapsed ? 'hidden' : 'block'}`}>
            Operations
          </div>
          {operationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) => {
                  const active = isActive || (item.aliasPath && location.pathname === item.aliasPath);
                  return `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all group relative ${
                    active
                      ? 'bg-[#285943] text-white shadow-xs'
                      : 'text-[#b4c7be] hover:text-white hover:bg-[#1f3029]'
                  } ${collapsed ? 'justify-center px-2' : ''}`;
                }}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                {!collapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Admin Panel Section */}
        <div className="space-y-1 pt-2 border-t border-[#334c41]/50">
          <div className={`flex items-center justify-between px-3 mb-2 text-[10px] font-semibold text-[#82998e] uppercase tracking-wider ${collapsed ? 'hidden' : 'flex'}`}>
            <span>Admin Panel</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isAdmin ? 'bg-[#285943] text-white' : 'bg-[#1d2d26] text-[#82998e]'}`}>
              {isAdmin ? 'UNLOCKED' : 'AUTH REQ'}
            </span>
          </div>
          {adminModules.map((item, idx) => {
            const Icon = item.icon;
            // Prevent duplicate NavLink rendering when on /admin for both hub & staff
            const isStaffItem = item.name === 'Staff Management';
            return (
              <NavLink
                key={`${item.path}-${idx}`}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) => {
                  const active = isStaffItem ? false : isActive;
                  return `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all group relative ${
                    active
                      ? 'bg-[#285943] text-white shadow-xs'
                      : 'text-[#b4c7be] hover:text-white hover:bg-[#1f3029]'
                  } ${collapsed ? 'justify-center px-2' : ''}`;
                }}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                {!collapsed && (
                  <span className="truncate flex-1 text-xs">{item.name}</span>
                )}
                {!collapsed && !isAdmin && (
                  <Lock className="w-3 h-3 text-[#777D76] shrink-0" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Technical & Academic Section */}
        <div className="space-y-1 pt-2 border-t border-[#334c41]/50">
          <div className={`px-3 mb-2 text-[10px] font-semibold text-[#82998e] uppercase tracking-wider ${collapsed ? 'hidden' : 'block'}`}>
            Academic Architecture
          </div>
          {technicalItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) => {
                  return `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-[#285943] text-white shadow-xs'
                      : 'text-[#b4c7be] hover:text-white hover:bg-[#1f3029]'
                  } ${collapsed ? 'justify-center px-2' : ''}`;
                }}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                {!collapsed && (
                  <span className="truncate flex-1 text-xs">{item.name}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#1d2d26] text-[#b4c7be] border border-[#334c41]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Return to System Home Link */}
      <div className="px-3 pt-2 pb-1 border-t border-[#334c41]">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold text-[#b4c7be] hover:text-white hover:bg-[#1f3029] transition-colors ${
            collapsed ? 'justify-center px-2 py-2.5' : ''
          }`}
          title="Return to System Home"
        >
          <Store className="w-4 h-4 text-[#71836A] shrink-0" />
          {!collapsed && <span className="truncate">System Home</span>}
        </NavLink>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-[#334c41] bg-[#1f3029]/80">
        <div className={`flex items-center gap-3 p-2 rounded bg-[#192621] border border-[#2f4339] ${collapsed ? 'justify-center p-1.5' : ''}`}>
          <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-[#285943] text-white">
            {isAdmin ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {isAdmin ? 'System Administrator' : 'Terminal Operator'}
              </div>
              <div className="text-[11px] text-[#9cb5a8] flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-[#e8cda2]' : 'bg-[#71836A]'}`} />
                {role} Mode
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-full mt-2 py-1.5 text-xs text-[#82998e] hover:text-white hover:bg-[#1f3029] rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#285943]"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /><span>Collapse</span></div>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex print:hidden flex-col shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden flex">
          <div
            className="fixed inset-0 bg-[#191D1A]/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex flex-col w-72 max-w-[80vw] h-full shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
