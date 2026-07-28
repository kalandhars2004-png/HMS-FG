'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState, useCallback } from 'react';
import {
  LayoutDashboard, Pill, Layers, Ruler, Palette, Box, Tag, Warehouse, RefreshCw,
  ArrowLeftRight, Timer, TrendingDown, ClipboardList, ShoppingCart, RotateCcw, Users,
  FileText, FileCheck, ShoppingBag, FileInput, Undo, Truck, Stethoscope, BarChart3,
  FileSpreadsheet, Building2, Building, Store, UserCircle, Bell, Download, Shield,
  ChevronDown, LogOut, Clock, Ban, Package, Database, Gauge, CreditCard, Wallet,
  Hourglass, Sun, TrendingUp, MapPin, Globe, Lock, Key, Smartphone,
  Syringe, ClipboardPen, FileSearch, FilePlus, User, Receipt, Percent, Cloud,
} from '@/components/ui/LucideIcon';

interface SubMenuItem {
  name: string;
  href: string;
  icon?: any;
}

interface MenuItem {
  name: string;
  icon?: any;
  href?: string;
  children?: SubMenuItem[];
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const sidebarData: MenuSection[] = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { name: 'Medicine List', href: '/medicines', icon: Pill },
      { name: 'Categories', href: '/categories', icon: Layers },
      { name: 'Sub Categories', href: '/subcategories', icon: ClipboardPen },
      { name: 'Units', href: '/units', icon: Ruler },
      { name: 'Racks', href: '/variants', icon: Palette },
      { name: 'Batch Management', href: '/batch-management', icon: Box },
      { name: 'Manufacturers', href: '/brands', icon: Tag },
      { name: 'Stock Adjustment', href: '/stock/adjustment', icon: RefreshCw },
      { name: 'Stock Transfer', href: '/stock/transfer', icon: ArrowLeftRight },
      { name: 'Expiry Tracking', href: '/dashboard/expiry', icon: Timer },
      { name: 'Low Stock', href: '/stock', icon: TrendingDown },
      { name: 'Inventory Logs', href: '/equipment/log', icon: ClipboardList },
    ],
  },
  {
    title: 'Sales',
    items: [
      { name: 'POS Sales', href: '/pos', icon: ShoppingCart, badge: 'Hot' },
      { name: 'Sales Return', href: '/sales/returns', icon: RotateCcw },
      { name: 'Customers', href: '/sales/customers', icon: Users },
      { name: 'Invoices', href: '/sales/invoices', icon: FileText },
      { name: 'Quotations', href: '/sales/quotations', icon: FileCheck },
    ],
  },
  {
    title: 'Purchases',
    items: [
      { name: 'Purchases', href: '/purchases', icon: ShoppingBag },
      { name: 'Purchase Orders', href: '/purchases/create', icon: FileInput },
      { name: 'Purchase Returns', href: '/purchases/returns', icon: Undo },
      { name: 'Vendors', href: '/suppliers', icon: Truck },
    ],
  },
  {
    title: 'Prescriptions',
    items: [
      { name: 'Prescriptions', href: '/work-orders', icon: ClipboardPen },
      { name: 'Prescription Verification', href: '/work-orders', icon: FileSearch },
      { name: 'Doctors', href: '/work-orders/projects', icon: Stethoscope },
    ],
  },
  {
    title: 'Equipment',
    items: [
      { name: 'Equipment', href: '/equipment', icon: Syringe },
      { name: 'Equipment Logs', href: '/equipment/log', icon: FilePlus },
    ],
  },
  {
    title: 'Reports',
    items: [
      { name: 'Sales Reports', href: '/reports/sales', icon: BarChart3 },
      { name: 'Purchase Reports', href: '/purchases', icon: ShoppingBag },
      { name: 'Inventory Reports', href: '/reports/stock', icon: FileSpreadsheet },
      { name: 'Expiry Reports', href: '/dashboard/expiry', icon: Hourglass },
      { name: 'Profit & Loss', href: '/reports/sales', icon: TrendingUp },
      { name: 'Tax Report', href: '/reports/sales', icon: Percent },
      { name: 'Stock Valuation', href: '/reports/stock', icon: Database },
      { name: 'Stock Aging', href: '/reports/stock', icon: Clock },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        name: 'Business',
        icon: Building2,
        children: [
          { name: 'Business Settings', href: '/warehouses', icon: Building },
          { name: 'Stores', href: '/people/stores', icon: Store },
          { name: 'Billers', href: '/people/billers', icon: UserCircle },
          { name: 'Notifications', href: '/dashboard', icon: Bell },
        ],
      },
      { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
      { name: 'Localization', href: '/dashboard', icon: Globe },
      { name: 'Backup', href: '/dashboard', icon: Download },
    ],
  },
  {
    title: 'Authentication',
    items: [
      { name: 'Login', href: '/login', icon: Lock },
      { name: 'Register', href: '/login', icon: User },
      { name: 'Forgot Password', href: '/login', icon: Key },
      { name: 'Reset Password', href: '/login', icon: Smartphone },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState<string[]>(['Business']);

  const toggleExpand = useCallback((name: string) => {
    setExpanded(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }, []);

  const isActive = (href?: string) => {
    if (!href) return false;
    if (pathname === href) return true;
    if (href !== '/dashboard' && pathname.startsWith(href + '/')) return true;
    return false;
  };
  const isParentActive = (item: MenuItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) return item.children.some(c => isActive(c.href));
    return false;
  };

  return (
    <div className="w-[260px] h-screen bg-[#1A1D29] flex flex-col border-r border-white/[0.06] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] shadow-lg shadow-teal-500/20">
          <Pill className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="m-0 text-base font-bold text-white tracking-tight">Inventory</p>
          <p className="m-0 text-[11px] text-white/40 font-medium">Management System</p>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
          .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .sidebar-item { transition: all 0.2s ease; }
          .sidebar-item:hover { background: rgba(255,255,255,0.04) !important; }
        `}</style>
        {sidebarData.map(section => (
          <div key={section.title} className="mb-1">
            <p className="mx-5 mt-5 mb-2 text-[10px] font-semibold tracking-[0.1em] uppercase text-white/20">
              {section.title}
            </p>

            {section.items.map(item => {
              const active = isParentActive(item);
              if (item.children) {
                const open = expanded.includes(item.name);
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`sidebar-item flex items-center justify-between w-full h-11 px-5 text-sm cursor-pointer border-0 transition-all duration-200 ${
                        active
                          ? 'text-white font-medium bg-white/[0.06] shadow-[inset_3px_0_0_#14B8A6]'
                          : 'text-white/60 font-normal hover:text-white/80'
                      }`}
                      style={{ background: active ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-[18px] h-[18px] shrink-0 opacity-70" />
                        <span className="text-[13px]">{item.name}</span>
                      </div>
                      <ChevronDown className="w-3 h-3 transition-all duration-200 opacity-30"
                        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-4 pb-1">
                        {item.children.map(child => {
                          const childActive = isActive(child.href);
                          return (
                            <Link key={child.href} href={child.href}
                              className={`sidebar-item flex items-center gap-3 h-9 px-4 text-xs cursor-pointer no-underline transition-all duration-200 rounded-md mx-1 ${
                                childActive
                                  ? 'text-[#14B8A6] font-medium bg-teal-500/10'
                                  : 'text-white/40 font-normal hover:text-white/70 hover:bg-white/[0.03]'
                              }`}
                            >
                              {child.icon && <child.icon className="w-[14px] h-[14px] shrink-0 opacity-60" />}
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link key={item.href} href={item.href!}
                  className={`sidebar-item flex items-center gap-3 h-11 px-5 text-sm cursor-pointer no-underline transition-all duration-200 ${
                    active
                      ? 'text-white font-medium bg-white/[0.06] shadow-[inset_3px_0_0_#14B8A6]'
                      : 'text-white/60 font-normal hover:text-white/80'
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0 opacity-70" />
                  <span className="text-[13px]">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF453A] to-[#FF6B5A] text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom user section */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg mb-2 hover:bg-white/[0.03] transition-colors duration-200">
          <div className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white font-bold text-sm shrink-0 shadow-md">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="m-0 text-[13px] font-medium text-white truncate">
              {user?.username || 'User'}
            </p>
            <p className="m-0 text-[11px] text-white/35 font-medium">
              {user?.role || 'Admin'}
            </p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center justify-center w-full gap-2 h-9 text-[13px] cursor-pointer border border-white/[0.08] rounded-lg text-white/45 hover:text-red-400 hover:border-red-400/30 transition-all duration-200 font-medium"
          style={{ background: 'transparent' }}
        >
          <LogOut className="w-[15px] h-[15px]" /> Sign Out
        </button>
      </div>
    </div>
  );
}
