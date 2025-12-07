'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { ChevronRight, Package, Layers, FolderTree, Tag, Ruler, Palette, Warehouse, RefreshCw, ArrowLeftRight, ShoppingCart, FileText, RotateCcw, FileCheck, CreditCard, ShoppingBag, FileInput, Undo, Users, Building, Store } from 'lucide-react';

interface MenuItem {
  name: string;
  href?: string;
  icon: any;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Package },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Categories', href: '/dashboard/categories', icon: Layers },
  { name: 'Sub Categories', href: '/dashboard/subcategories', icon: FolderTree },
  { name: 'Brands', href: '/dashboard/brands', icon: Tag },
  { name: 'Units', href: '/dashboard/units', icon: Ruler },
  { name: 'Variants', href: '/dashboard/variants', icon: Palette },
  {
    name: 'Stock',
    icon: Warehouse,
    children: [
      { name: 'Manage Stock', href: '/dashboard/stock/manage', icon: Warehouse },
      { name: 'Stock Adjustment', href: '/dashboard/stock/adjustment', icon: RefreshCw },
      { name: 'Stock Transfer', href: '/dashboard/stock/transfer', icon: ArrowLeftRight },
    ],
  },
  {
    name: 'Purchases',
    icon: ShoppingBag,
    children: [
      { name: 'Purchases', href: '/dashboard/purchases', icon: ShoppingBag },
      { name: 'Purchase Order', href: '/dashboard/purchases/orders', icon: FileInput },
      { name: 'Purchase Return', href: '/dashboard/purchases/returns', icon: Undo },
    ],
  },
  {
    name: 'Sales',
    icon: ShoppingCart,
    children: [
      { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
      { name: 'Invoices', href: '/dashboard/sales/invoices', icon: FileText },
      { name: 'Sales Return', href: '/dashboard/sales/returns', icon: RotateCcw },
      { name: 'Quotation', href: '/dashboard/sales/quotations', icon: FileCheck },
    ],
  },
  { name: 'POS', href: '/pos', icon: CreditCard },
  {
    name: 'Peoples',
    icon: Users,
    children: [
      { name: 'Customers', href: '/dashboard/peoples/customers', icon: Users },
      { name: 'Suppliers', href: '/dashboard/peoples/suppliers', icon: Building },
      { name: 'Stores', href: '/dashboard/peoples/stores', icon: Store },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Stock', 'Purchases', 'Sales', 'Peoples']);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isExpanded = expandedMenus.includes(item.name);
    const isActive = pathname === item.href;

    if (item.children) {
      return (
        <li key={item.name}>
          <button
            onClick={() => toggleMenu(item.name)}
            className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </div>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>
          {isExpanded && (
            <ul className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = pathname === child.href;
                return (
                  <li key={child.href}>
                    <Link
                      href={child.href!}
                      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        isChildActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <ChildIcon className="w-4 h-4" />
                      <span>{child.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.href}>
        <Link
          href={item.href!}
          className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
            isActive
              ? 'bg-indigo-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span>{item.name}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white w-64">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Inventory Management</h1>
        {user && (
          <p className="text-sm text-gray-400 mt-1">Welcome, {user.username}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
