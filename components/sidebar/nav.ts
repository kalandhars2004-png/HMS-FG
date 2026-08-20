import type { ComponentType } from 'react';
import {
  LayoutDashboard, ListTodo, LayoutGrid, MonitorUp, Inbox, Boxes, SquareUser,
  Layers, Truck, AlertTriangle, Layers2, ListEnd,
  TvMinimal, RotateCcw, UsersRound, Newspaper, DollarSign,
  ShoppingCart, ShoppingBag, ReplyAll, Users, BadgeDollarSign,
  BookCheck, ScanLine, BriefcaseMedical,
  BarChart3, FileSpreadsheet, FileTerminal, FileChartColumn, BadgePercent,
  ScrollText, FileAxis3d, Clock,
  Building2, FileText, Component, Archive,
} from '@/components/ui/LucideIcon';

export type Role = 'admin' | 'manager' | 'pharmacist' | 'cashier';

export type BadgeVariant = 'new' | 'hot' | 'count' | 'sync' | 'expired' | 'low';

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  shortcut?: string;
  badge?: { label: string; variant: BadgeVariant };
  roles?: Role[];
}

export interface NavSection {
  title: string;
  icon: ComponentType<{ className?: string }>;
  items: NavItem[];
  roles?: Role[];
}

/**
 * Mirrors the reference pharmacy template's sidenav: the same seven
 * `menu-title` sections in the same order, with the same labels and the same
 * icon choices, pointed at this app's real routes.
 *
 * The template also ships an "Authentication" section listing Login / Register /
 * Forgot Password / Reset Password / OTP. That exists so template buyers can
 * preview those pages — shipping it would put "Login" in the nav of an
 * already-signed-in pharmacist, so it is deliberately omitted.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'D' },
    ],
  },
  {
    title: 'Inventory',
    icon: Layers,
    roles: ['admin', 'manager', 'pharmacist'],
    items: [
      { name: 'Medicine List', href: '/medicines', icon: ListTodo, shortcut: 'M' },
      { name: 'Categories', href: '/categories', icon: LayoutGrid },
      { name: 'Units', href: '/units', icon: MonitorUp },
      { name: 'Racks', href: '/racks', icon: Inbox },
      { name: 'Batch Management', href: '/batch-management', icon: Boxes },
      { name: 'Manufacturers', href: '/brands', icon: SquareUser },
      { name: 'Stock Adjustment', href: '/stock/adjustment', icon: Layers },
      { name: 'Stock Transfer', href: '/stock/transfer', icon: Truck },
      { name: 'Expiry Tracking', href: '/dashboard/expiry', icon: AlertTriangle, badge: { label: 'Expired', variant: 'expired' } },
      { name: 'Restock', href: '/stock/restock', icon: Layers2, badge: { label: 'Low', variant: 'low' } },
      { name: 'Inventory Logs', href: '/stock/inventory-logs', icon: ListEnd },
    ],
  },
  {
    title: 'Sales',
    icon: TvMinimal,
    items: [
      { name: 'POS Sales', href: '/pos', icon: TvMinimal, shortcut: 'P' },
      { name: 'Sales Return', href: '/sales/returns', icon: RotateCcw, roles: ['admin', 'manager', 'pharmacist'] },
      { name: 'Customers', href: '/sales/customers', icon: UsersRound, shortcut: 'C' },
      { name: 'Invoices', href: '/sales/invoices', icon: Newspaper },
      { name: 'Payments', href: '/sales/invoices?view=payments', icon: DollarSign, roles: ['admin', 'manager', 'pharmacist'] },
    ],
  },
  {
    title: 'Purchases',
    icon: ShoppingCart,
    roles: ['admin', 'manager'],
    items: [
      { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
      { name: 'Purchase Orders', href: '/purchases/orders', icon: ShoppingBag },
      { name: 'Purchase Returns', href: '/purchases/returns', icon: ReplyAll },
      { name: 'Vendors', href: '/suppliers', icon: Users },
      { name: 'Vendor Payments', href: '/suppliers?view=payments', icon: BadgeDollarSign },
    ],
  },
  {
    title: 'Prescriptions',
    icon: BookCheck,
    roles: ['admin', 'manager', 'pharmacist'],
    items: [
      { name: 'Prescriptions', href: '/work-orders', icon: BookCheck },
      // Shortened from "Prescription Verification": it sits under the
      // Prescriptions heading, so the prefix was redundant and it was the only
      // label that could not fit the rail without shrinking the type. Route unchanged.
      { name: 'Verification', href: '/work-orders?view=verification', icon: ScanLine },
      { name: 'Doctors', href: '/work-orders/projects', icon: BriefcaseMedical },
    ],
  },
  {
    title: 'Reports',
    icon: BarChart3,
    roles: ['admin', 'manager', 'pharmacist'],
    items: [
      { name: 'Sales Reports', href: '/reports/sales', icon: BarChart3 },
      { name: 'Purchase Reports', href: '/purchases', icon: FileSpreadsheet },
      { name: 'Inventory Reports', href: '/reports/stock', icon: FileTerminal },
      { name: 'Expiry Reports', href: '/dashboard/expiry?view=report', icon: FileChartColumn },
      { name: 'Profit & Loss', href: '/reports/sales?view=profit-loss', icon: BadgePercent },
      { name: 'Tax Report', href: '/reports/sales?view=gst', icon: ScrollText },
      { name: 'Stock Valuation', href: '/reports/stock?view=valuation', icon: FileAxis3d },
      { name: 'Stock Aging', href: '/reports/stock?view=aging', icon: Clock },
      { name: 'Customer Outstanding', href: '/sales?view=outstanding', icon: UsersRound },
      { name: 'Vendor Outstanding', href: '/suppliers?view=ledger', icon: FileText },
    ],
  },
  {
    title: 'Settings',
    icon: Building2,
    roles: ['admin'],
    items: [
      { name: 'Business', href: '/settings/business', icon: Building2 },
      { name: 'Billing', href: '/settings/taxes', icon: FileText },
      { name: 'System Integrations', href: '/settings/integrations', icon: Component },
      { name: 'Backup', href: '/settings/backup', icon: Archive, badge: { label: 'Syncing', variant: 'sync' } },
    ],
  },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  pharmacist: 'Pharmacist',
  cashier: 'Cashier',
};

export function canSeeSection(section: NavSection, role?: string): boolean {
  if (!section.roles) return true;
  return section.roles.includes(role as Role) || role === 'admin';
}

export function canSeeItem(item: NavItem, role?: string): boolean {
  if (!item.roles) return true;
  return item.roles.includes(role as Role) || role === 'admin';
}
