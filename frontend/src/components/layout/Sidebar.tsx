import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Boxes,
  BarChart3,
  Shield,
  Code2,
  Store,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Settings
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavGroup {
  label: string;
  items: {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
    primary?: boolean;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { role, isAdmin } = useAuth();

  const navGroups: NavGroup[] = [
    {
      label: 'Checkout & Sales',
      items: [
        { name: 'POS Terminal', path: '/billing', icon: ShoppingCart, badge: 'Ctrl+K', primary: true },
        { name: 'Sales Receipts', path: '/transactions', icon: Receipt },
      ],
    },
    {
      label: 'Inventory & Catalog',
      items: [
        { name: 'Product Catalog', path: '/products', icon: Package },
        { name: 'Stock Control', path: '/inventory', icon: Boxes },
      ],
    },
    {
      label: 'Store Management',
      items: [
        { name: 'Dashboard Overview', path: '/', icon: LayoutDashboard },
        { name: 'Sales Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Store Administration', path: '/admin', icon: Settings, adminOnly: true },
      ],
    },
    {
      label: 'Engineering & Docs',
      items: [
        { name: 'System Architecture', path: '/oop-concepts', icon: Code2, badge: 'Architecture' },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-800/80 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 shrink-0">
          <Store className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-extrabold text-base text-white tracking-tight leading-tight truncate">
              ApexMart
            </span>
            <span className="text-[11px] text-emerald-400 font-medium tracking-wide">
              Retail Supermarket POS
            </span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group relative ${
                      isActive
                        ? item.primary
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30 font-bold'
                          : 'bg-emerald-600/90 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/90'
                    } ${collapsed ? 'justify-center px-2 py-2.5' : ''}`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                    item.primary ? 'text-emerald-400 group-hover:text-white' : ''
                  }`} />
                  {!collapsed && (
                    <span className="truncate flex-1">{item.name}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-900 text-slate-300 border border-slate-700/80">
                      {item.badge}
                    </span>
                  )}
                  {!collapsed && item.adminOnly && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      isAdmin ? 'bg-purple-900/60 text-purple-300 border border-purple-800' : 'bg-slate-900 text-slate-400'
                    }`}>
                      Manager
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90">
        <div className={`flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 ${collapsed ? 'justify-center p-1.5' : ''}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isAdmin ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {isAdmin ? 'Store Manager' : 'Cashier Terminal'}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-400' : 'bg-blue-400'}`} />
                {role} Mode
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-full mt-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-900 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <div className="flex items-center gap-1 text-[11px]"><ChevronLeft className="w-3.5 h-3.5" /><span>Collapse Sidebar</span></div>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex print:hidden flex-col shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-18' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
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
