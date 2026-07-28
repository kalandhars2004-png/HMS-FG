'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Package, AlertTriangle, Clock, Ban, ShoppingCart, TrendingUp, CheckCheck } from '@/components/ui/LucideIcon';

interface Notification {
  id: string;
  icon: any;
  iconBg: string;
  iconBorder: string;
  title: string;
  description: string;
  time: string;
  href?: string;
  category: 'low_stock' | 'expired' | 'near_expiry' | 'sales' | 'purchase' | 'system';
  read: boolean;
}

interface NotificationDropdownProps {
  products: any[];
  transactions: any[];
}

export default function NotificationDropdown({ products, transactions }: NotificationDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const n: Notification[] = [];

    const lowStock = products.filter((p: any) => {
      const q = p.quantity ?? p.stockQuantity ?? 0;
      return q > 0 && q < 30;
    });
    lowStock.slice(0, 3).forEach((p: any) => {
      n.push({
        id: `ls-${p.id}`,
        icon: AlertTriangle,
        iconBg: '#FFF1EB',
        iconBorder: '#FED5C5',
        title: 'Low Stock Alert',
        description: `${p.name} is running low (${p.quantity ?? p.stockQuantity ?? 0} units)`,
        time: 'Now',
        href: `/medicines/create?id=${p.id}`,
        category: 'low_stock',
        read: false,
      });
    });

    const outOfStock = products.filter((p: any) => (p.quantity ?? p.stockQuantity ?? 0) === 0);
    outOfStock.slice(0, 2).forEach((p: any) => {
      n.push({
        id: `oos-${p.id}`,
        icon: Ban,
        iconBg: '#FFEDEA',
        iconBorder: '#FBCAC1',
        title: 'Out of Stock',
        description: `${p.name} is currently out of stock`,
        time: 'Now',
        href: `/medicines/create?id=${p.id}`,
        category: 'low_stock',
        read: false,
      });
    });

    transactions.slice(0, 3).forEach((t: any) => {
      n.push({
        id: `tx-${t.id}`,
        icon: t.transactionType === 'PURCHASE' ? ShoppingCart : TrendingUp,
        iconBg: t.transactionType === 'PURCHASE' ? '#EAF0FF' : '#FFF6ED',
        iconBorder: t.transactionType === 'PURCHASE' ? '#C2D2FF' : '#FFCFA5',
        title: t.transactionType === 'PURCHASE' ? 'Purchase Completed' : 'Sale Completed',
        description: `#INV-${String(t.id).padStart(4, '0')} — ₹${Number(t.totalPrice || 0).toLocaleString()}`,
        time: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recently',
        href: '/sales/invoices',
        category: t.transactionType === 'PURCHASE' ? 'purchase' : 'sales',
        read: false,
      });
    });

    setNotifications(n.slice(0, 8));
  }, [products, transactions]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { isOpen, setIsOpen, unreadCount, notifications, markAllRead, deleteNotification, btnRef, ref };
}
