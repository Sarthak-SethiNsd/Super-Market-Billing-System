import React from 'react';
import { NavLink } from 'react-router-dom';
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
  UserCheck
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

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Product Catalog', path: '/products', icon: Package },
    { name: 'Billing / POS', path: '/billing', icon: ShoppingCart },
    { name: 'Transaction History', path: '/transactions', icon: Receipt },
    { name: 'Inventory Management', path: '/inventory', icon: Boxes },
    { name: 'Sales Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Admin Management', path: '/admin', icon: ShieldAlert, adminOnly: true },
    { name: 'OOP Concepts Explorer', path: '/oop-concepts', icon: Code2, badge: 'C++17' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b border-slate-800/80 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 shrink-0">
          <Store className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-base text-white tracking-tight leading-tight truncate">
              ApexMart POS
            </span>
            <span className="text-xs text-emerald-400 font-medium tracking-wide">
              C++ Supermarket Core
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className={`px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider ${collapsed ? 'hidden' : 'block'}`}>
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/90'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && (
                <span className="truncate flex-1">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-800 text-emerald-300 border border-slate-700">
                  {item.badge}
                </span>
              )}
              {!collapsed && item.adminOnly && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  isAdmin ? 'bg-purple-900/60 text-purple-300 border border-purple-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  Admin
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/70">
        <div className={`flex items-center gap-3 p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 ${collapsed ? 'justify-center p-1.5' : ''}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isAdmin ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isAdmin ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {isAdmin ? 'Store Administrator' : 'Terminal Operator'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-400' : 'bg-blue-400'}`} />
                {role} Mode
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-full mt-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex flex-col w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
