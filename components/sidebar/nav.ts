import type { ComponentType } from 'react';
import {
  LayoutDashboard, Search, Star, Pill, LayoutGrid, FolderTree, MonitorUp, ClipboardList,
  Gauge, Tag, SquareUser, Users, Inbox, Warehouse, Boxes, AlertTriangle, Layers, Truck,
  ListEnd, ShieldCheck, Layers2, ShoppingBag, Package, ReplyAll, BadgeDollarSign, BookOpen,
  TvMinimal, Newspaper, UsersRound, RotateCcw, FileText, DollarSign, Hourglass,
  BriefcaseMedical, UserCircle, BookCheck, ScanLine, BarChart3, FileSpreadsheet,
  FileTerminal, FileChartColumn, BadgePercent, CalendarDays, Calendar, TrendingUp,
  FileAxis3d, ScrollText, Building2, UserCog, Key, GitFork, Bell, Component, Archive,
  Settings, Clock, Calculator,
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

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'D' },
      { name: 'Quick Search', href: '#search', icon: Search },
      { name: 'Favorites', href: '#favorites', icon: Star },
    ],
  },
  {
    title: 'Inventory',
    icon: Layers,
    roles: ['admin', 'manager', 'pharmacist'],
    items: [
      { name: 'Medicines', href: '/medicines', icon: Pill, shortcut: 'M' },
      { name: 'Categories', href: '/categories', icon: LayoutGrid },
      { name: 'Sub Categories', href: '/categories?view=subcategories', icon: FolderTree },
      { name: 'Units', href: '/units', icon: MonitorUp },
      { name: 'Medicine Forms', href: '/units?view=medicine-forms', icon: ClipboardList },
      { name: 'Strengths', href: '/variants', icon: Gauge },
      { name: 'Brands', href: '/brands', icon: Tag },
      { name: 'Manufacturers', href: '/brands?view=manufacturers', icon: SquareUser },
      { name: 'Suppliers', href: '/suppliers', icon: Users },
      { name: 'Racks', href: '/racks', icon: Inbox },
      { name: 'Storage Locations', href: '/warehouses', icon: Warehouse },
      { name: 'Branches', href: '/warehouses?view=branches', icon: GitFork },
      { name: 'Batches', href: '/batch-management', icon: Boxes },
      { name: 'Expiry Tracking', href: '/dashboard/expiry', icon: AlertTriangle, badge: { label: 'Expired', variant: 'expired' } },
      { name: 'Stock Adjustment', href: '/stock/adjustment', icon: Layers },
      { name: 'Stock Transfer', href: '/stock/transfer', icon: Truck },
      { name: 'Inventory Logs', href: '/stock/inventory-logs', icon: ListEnd },
      { name: 'Inventory Audit', href: '/stock/cycle-count', icon: ShieldCheck, badge: { label: 'NEW', variant: 'new' } },
      { name: 'Low Stock', href: '/stock/reorder', icon: Layers2, badge: { label: 'Low', variant: 'low' } },
    ],
  },
  {
    title: 'Purchase',
    icon: ShoppingBag,
    roles: ['admin', 'manager'],
    items: [
      { name: 'Purchase Orders', href: '/purchases/orders', icon: ShoppingBag, badge: { label: '12', variant: 'count' } },
      { name: 'Receive Stock', href: '/purchases/create', icon: Package, badge: { label: 'HOT', variant: 'hot' } },
      { name: 'Purchase Returns', href: '/purchases/returns', icon: ReplyAll },
      { name: 'Supplier Payments', href: '/suppliers?view=payments', icon: BadgeDollarSign },
      { name: 'Supplier Ledger', href: '/suppliers?view=ledger', icon: BookOpen },
    ],
  },
  {
    title: 'Sales',
    icon: TvMinimal,
    items: [
      { name: 'POS Billing', href: '/pos', icon: TvMinimal, shortcut: 'P' },
      { name: 'Invoices', href: '/sales/invoices', icon: Newspaper },
      { name: 'Customers', href: '/sales/customers', icon: UsersRound, shortcut: 'C' },
      { name: 'Sales Returns', href: '/sales/returns', icon: RotateCcw, roles: ['admin', 'manager', 'pharmacist'] },
      { name: 'Credit Notes', href: '/sales/quotations', icon: FileText, roles: ['admin', 'manager', 'pharmacist'] },
      { name: 'Payments', href: '/sales/invoices?view=payments', icon: DollarSign, roles: ['admin', 'manager', 'pharmacist'] },
      { name: 'Outstanding Bills', href: '/sales?view=outstanding', icon: Hourglass, roles: ['admin', 'manager', 'pharmacist'] },
    ],
  },
  {
    title: 'Prescription',
    icon: BookCheck,
    roles: ['admin', 'manager', 'pharmacist'],
    items: [
      { name: 'Doctors', href: '/work-orders/projects', icon: BriefcaseMedical },
      { name: 'Patients', href: '/people/stores', icon: UserCircle },
      { name: 'Prescriptions', href: '/work-orders', icon: BookCheck },
      { name: 'Prescription Verification', href: '/work-orders?view=verification', icon: ScanLine },
    ],
  },
  {
    title: 'Reports',
    icon: BarChart3,
    roles: ['admin', 'manager', 'pharmacist'],
    items: [
      { name: 'Sales Report', href: '/reports/sales', icon: BarChart3 },
      { name: 'Purchase Report', href: '/purchases', icon: FileSpreadsheet },
      { name: 'Stock Report', href: '/reports/stock', icon: FileTerminal },
      { name: 'GST Report', href: '/reports/sales?view=gst', icon: FileChartColumn },
      { name: 'Profit & Loss', href: '/reports/sales?view=profit-loss', icon: BadgePercent },
      { name: 'Daily Report', href: '/reports/sales?view=daily', icon: CalendarDays },
      { name: 'Monthly Report', href: '/reports/sales?view=monthly', icon: Calendar },
      { name: 'Top Selling Medicines', href: '/reports/sales?view=top-selling', icon: TrendingUp },
      { name: 'Inventory Valuation', href: '/reports/stock?view=valuation', icon: FileAxis3d },
      { name: 'Expiry Report', href: '/dashboard/expiry?view=report', icon: AlertTriangle },
      { name: 'Audit Logs', href: '/audit', icon: ScrollText },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    roles: ['admin'],
    items: [
      { name: 'Business', href: '/settings/business', icon: Building2 },
      { name: 'Users', href: '/settings/users', icon: UserCog },
      { name: 'Roles', href: '/settings/roles', icon: Key },
      { name: 'Permissions', href: '/settings/permissions', icon: ShieldCheck },
      { name: 'Branches', href: '/settings/branches', icon: GitFork },
      { name: 'Taxes', href: '/settings/taxes', icon: Calculator },
      { name: 'Notifications', href: '/settings/notifications', icon: Bell },
      { name: 'Integrations', href: '/settings/integrations', icon: Component },
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
