'use client';

import { useState } from 'react';
import { Save, Check, ChevronDown } from '@/components/ui/LucideIcon';

export function SettingsSection({ title, subtitle, icon: Icon, children }: {
  title: string;
  subtitle: string;
  icon: any;
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className="pb-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 font-['Space_Grotesk']">{title}</h1>
          <p className="text-[13px] text-gray-500 mt-1">{subtitle}</p>
        </div>
        <button onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold border-0 cursor-pointer hover:bg-teal-700 transition-all duration-200 hover:shadow-lg active:scale-95">
          {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F9291]/10">
            <Icon className="w-5 h-5 text-[#0F9291]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-['Space_Grotesk'] m-0">{title}</h2>
            <p className="text-[13px] text-gray-400 m-0 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10 transition-all" />
    </div>
  );
}

export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <select id={id} value={value} onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10 transition-all appearance-none bg-white cursor-pointer">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
