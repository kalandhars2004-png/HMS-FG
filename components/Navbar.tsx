'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Bell, Settings, ChevronDown, LogOut, Command,
  UserCog, BarChart3, Pill, Moon, Sun,
  Building2, Database,
} from '@/components/ui/LucideIcon';
import { useTheme } from '@/lib/theme-context';

interface Notification {
  id: string;
  icon: any;
  iconBg: string;
  iconBorder: string;
  title: string;
  description: string;
  time: string;
}

const notifications: Notification[] = [];

function useOutsideClick(refs: React.RefObject<HTMLElement | null>[], handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (refs.some(ref => ref.current?.contains(e.target as Node))) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [refs, handler]);
}

function useEscape(handler: () => void) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') handler(); };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [handler]);
}

export default function Navbar() {
  const { dark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const closeAll = useCallback(() => {
    setShowNotifications(false);
    setShowProfile(false);
    setShowSettings(false);
  }, []);

  useOutsideClick(
    [notifRef, notifBtnRef, profileRef, profileBtnRef, settingsRef, settingsBtnRef] as React.RefObject<HTMLElement | null>[],
    closeAll
  );
  useEscape(closeAll);

  return (
    <header className="sticky top-0 z-[1000] bg-white min-h-[50px] border-b border-gray-200 px-6 flex items-center shadow-sm">
      <div className="flex items-center justify-between w-full">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="flex items-center no-underline">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#14B8A6] shadow-sm shadow-teal-500/20">
              <Pill className="w-5 h-5 text-white" />
            </div>
          </a>

          <h4 className="hidden lg:block m-0 text-base font-semibold text-gray-900 ml-1">
            Dashboard
          </h4>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5">

          {/* Search */}
          <div className="flex items-center">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-[1] transition-colors duration-250 group-focus-within:text-[#0F9291]" />
              <input type="text" placeholder="Search"
                className="h-9 text-sm text-gray-900 border border-gray-200 rounded-xl bg-gray-50 pl-9 pr-11 w-[200px] outline-none transition-all duration-250 focus:w-[260px] focus:border-[#0F9291] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,146,145,0.1)]"
              />
              <span className="flex items-center justify-center absolute right-[5px] top-1/2 -translate-y-1/2 w-[38px] h-[26px] rounded-lg bg-gray-200/70 gap-0.5 text-xs text-gray-500 font-medium">
                <Command className="w-3 h-3" />K
              </span>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center">
            {mounted && (
              <button onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white cursor-pointer text-gray-900 hover:bg-gray-50 hover:shadow-sm transition-all duration-250"
                title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <div className="transition-transform duration-500 hover:rotate-180">
                  {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </div>
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="flex items-center relative">
            <button ref={notifBtnRef} onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowSettings(false); }}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white cursor-pointer relative hover:bg-gray-50 hover:shadow-sm transition-all duration-250"
              style={{ color: showNotifications ? '#0F9291' : '#101828' }}
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse-dot" />
            </button>

            {showNotifications && (
              <div ref={notifRef}
                className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 w-[380px] z-[1050] p-5 animate-slideDown"
                style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.12)' }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <h5 className="m-0 text-base font-semibold text-gray-900">Notifications</h5>
                  <button className="text-sm font-medium text-[#0F9291] underline border-0 bg-transparent cursor-pointer p-0 hover:text-teal-700 transition-colors">
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                  <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }`}</style>
                  <div className="flex flex-col gap-2">
                    <div className="text-center py-6 text-sm text-gray-400">No notifications</div>
                  </div>
                </div>
                <div className="pt-3">
                  <button
                    className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white cursor-pointer text-sm font-semibold text-gray-900 gap-2 hover:bg-gray-50 hover:shadow-sm transition-all duration-250 active:scale-[0.98]"
                  >
                    View All
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="flex items-center relative">
            <button ref={settingsBtnRef} onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); setShowProfile(false); }}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all duration-250"
              style={{ color: showSettings ? '#0F9291' : '#101828' }}
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>

            {showSettings && (
              <div ref={settingsRef}
                className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 w-[220px] z-[1050] p-2 animate-slideDown"
                style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.12)' }}
              >
                <a href="/warehouses"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-250"
                >
                  <Building2 className="w-4 h-4" /> Warehouse Settings
                </a>
                <a href="/brands"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-250"
                >
                  <Database className="w-4 h-4" /> Brand Settings
                </a>
                <div className="pt-1 mt-1 border-t border-gray-100">
                  <button onClick={() => { toggleTheme(); closeAll(); }}
                    className="flex items-center justify-between w-full gap-2.5 px-3 py-2.5 rounded-xl border-0 bg-transparent cursor-pointer text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-250"
                  >
                    <span className="flex items-center gap-3">
                      {mounted && (dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
                      {dark ? 'Light Mode' : 'Dark Mode'}
                    </span>
                    <span className="text-[#0F9291]">{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-center relative">
            <button ref={profileBtnRef} onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowSettings(false); }}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white cursor-pointer p-0 overflow-hidden hover:shadow-sm transition-all duration-250"
            >
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white font-bold text-sm">
                RK
              </div>
            </button>

            {showProfile && (
              <div ref={profileRef}
                className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 w-[280px] z-[1050] p-4 animate-scaleIn"
                style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.12)' }}
              >
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-2">
                  <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white font-bold text-sm shadow-md">
                    RK
                  </div>
                  <div>
                    <p className="m-0 font-semibold text-sm text-gray-900">Rajesh Kumar</p>
                    <span className="text-[13px] text-gray-500">Pharmacist</span>
                  </div>
                </div>

                <a href="/people/stores"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-250"
                >
                  <UserCog className="w-4 h-4" /> My Profile
                </a>
                <a href="/reports/sales"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-250"
                >
                  <BarChart3 className="w-4 h-4" /> Reports
                </a>
                <label className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 cursor-pointer m-0 hover:bg-gray-50 transition-all duration-250">
                  <span className="flex items-center gap-3">
                    <Bell className="w-4 h-4" /> Notifications
                  </span>
                  <input type="checkbox" defaultChecked
                    className="cursor-pointer accent-[#0F9291] rounded" />
                </label>
                <a href="/warehouses"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-250"
                >
                  <Settings className="w-4 h-4" /> Settings
                </a>
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <button
                    className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl border-0 bg-transparent cursor-pointer text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-250"
                    onClick={() => { window.location.href = '/login'; }}
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
