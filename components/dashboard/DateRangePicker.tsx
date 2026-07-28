'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown } from '@/components/ui/LucideIcon';

interface DateRangePickerProps {
  value: string;
  onChange: (value: string, label: string) => void;
}

const presets = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'This Week', days: 7 },
  { label: 'Last Week', days: 14 },
  { label: 'This Month', days: 30 },
  { label: 'Last Month', days: 60 },
  { label: 'Last 3 Months', days: 90 },
  { label: 'Last 6 Months', days: 180 },
];

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input type="text" readOnly
        value={value}
        onClick={() => setIsOpen(!isOpen)}
        className="h-[42px] text-sm border border-gray-200 bg-white pr-10 pl-4 text-gray-700 cursor-pointer rounded-xl w-[200px] outline-none focus:border-[#0F9291] transition-colors duration-250"
      />
      <Calendar className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl border border-gray-200 min-w-[220px] z-[1050] p-1.5 animate-slideDown shadow-xl">
          {presets.map(p => {
            const start = new Date();
            start.setDate(start.getDate() - p.days);
            const end = new Date();
            const display = `${formatDate(start)} - ${formatDate(end)}`;
            return (
              <button key={p.label} onClick={() => { onChange(display, p.label); setIsOpen(false); }}
                className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <span className="font-medium">{p.label}</span>
                <span className="text-xs text-gray-400 ml-2">{display}</span>
              </button>
            );
          })}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={() => { onChange('Custom Range', 'Custom'); setIsOpen(false); }}
              className="block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#0F9291] hover:bg-[#0F9291]/5 transition-colors">
              Custom Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
