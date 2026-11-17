import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Search, ShieldCheck, Lock, LogOut, ChevronRight, Store } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminUnlockModal } from '@/components/auth/AdminUnlockModal';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

const routeTitles: Record<string, { title: string; category: string }> = {
  '/staff': { title: 'Dashboard Overview', category: 'Analytics & Summary' },
  '/dashboard': { title: 'Dashboard Overview', category: 'Analytics & Summary' },
  '/products': { title: 'Product Catalog', category: 'Inventory' },
  '/billing': { title: 'Billing & Checkout', category: 'Sales & Checkout' },
  '/transactions': { title: 'Transactions & Sales History', category: 'Sales & Invoices' },
  '/inventory': { title: 'Inventory Management', category: 'Stock Control' },
  '/analytics': { title: 'Sales Analytics', category: 'Reports' },
  '/admin': { title: 'Staff & System Management', category: 'Administration' },
  '/oop-concepts': { title: 'C++ OOP Concepts Explorer', category: 'Architecture' },
  '/system-architecture': { title: 'C++ OOP Concepts Explorer', category: 'Architecture' },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isStaff, logoutStaff } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const currentRoute = routeTitles[location.pathname] || { title: 'Supermart Management', category: 'System' };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/billing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-col lg:flex-row lg:items-center justify-between min-h-16 py-2 px-3 sm:px-4 md:px-8 gap-y-2 bg-white/95 backdrop-blur-xs border-b border-[#E5E4DC] shadow-xs print:hidden">
        {/* Left: Mobile Toggle & Page Title / Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full lg:w-auto min-w-0 pr-1.5 sm:pr-2">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-1.5 sm:p-2 -ml-1 text-[#777D76] hover:text-[#303631] hover:bg-[#F7F6F1] rounded md:hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#285943] shrink-0"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#777D76] font-medium truncate">
              <Link to="/staff" className="hover:text-[#303631] transition-colors shrink-0">Supermarket</Link>
              <ChevronRight className="w-3 h-3 text-[#9BA09A] shrink-0" />
              <span className="text-[#777D76] truncate">{currentRoute.category}</span>
            </div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#303631] tracking-tight leading-tight truncate">
              {currentRoute.title}
            </h1>
          </div>
        </div>

        {/* Right: System Home Link + Quick Search + Status Indicator + Auth Role Pill */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end w-full lg:w-auto gap-1.5 sm:gap-2 md:gap-3">
          {/* Link to System Home */}
          <Link
            to="/"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#E5E4DC] bg-white text-xs font-medium text-[#303631] hover:text-[#285943] hover:border-[#285943] hover:bg-[#F7F6F1] transition-colors"
            title="Open Supermart System Home"
          >
            <Store className="w-3.5 h-3.5 text-[#285943]" />
            <span>System Home</span>
          </Link>

          {/* Quick Jump to Billing Scanner */}
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded bg-[#FAF9F5] border border-[#E5E4DC] text-[#777D76] text-xs w-52 hover:border-[#D4D3C9] hover:bg-[#F7F6F1] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#285943] text-left"
            title="Open Barcode & Product Scanner (Ctrl+K)"
            aria-label="Open barcode and product search"
          >
            <Search className="w-3.5 h-3.5 text-[#777D76]" />
            <span className="flex-1 text-[#777D76] truncate">Search code, barcode...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#E5E4DC] rounded text-[#777D76]">Ctrl K</kbd>
          </button>

          {/* Backend Connection Health Badge */}
          <StatusBadge />

          <div className="h-5 w-px bg-[#E5E4DC] hidden sm:block" />

          {/* Role & Staff Mode Authentication Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isStaff ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Badge variant="staff" className="gap-1 py-1 px-2.5 text-xs bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#285943]" />
                  <span className="hidden sm:inline">Staff Mode</span>
                  <span className="sm:hidden">Staff</span>
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await logoutStaff();
                    navigate('/');
                  }}
                  className="text-xs text-[#A63A38] hover:bg-[#F8EFEF] hover:border-[#ECD1D0] gap-1 px-2.5 py-1"
                  title="Logout from Staff Mode and return to Customer Mode"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Staff</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Badge variant="default" className="gap-1 py-1 px-2.5 text-xs bg-[#FAF9F5] text-[#777D76] border border-[#E5E4DC]">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="hidden sm:inline">Customer Mode</span>
                  <span className="sm:hidden">Customer</span>
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/staff/login')}
                  className="text-xs text-[#303631] hover:text-[#285943] hover:border-[#285943] gap-1 px-2.5 py-1 whitespace-nowrap bg-white font-semibold"
                  title="Authenticate Staff credentials"
                >
                  <Lock className="w-3.5 h-3.5 text-[#285943]" />
                  <span className="hidden sm:inline">Staff Login</span>
                  <span className="sm:hidden">Staff</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Staff Login Modal */}
      <AdminUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />
    </>
  );
};
