'use client';

import { useState } from 'react';
import {
  Building2, Globe, Receipt, Percent, Sun, Moon, Download, Upload,
  Save, Check, ChevronDown, RefreshCw, Wallet,
} from '@/components/ui/LucideIcon';
import { useTheme } from '@/lib/theme-context';

const tabs = [
  { key: 'business', label: 'Business Info', icon: Building2 },
  { key: 'localization', label: 'Localization', icon: Globe },
  { key: 'invoice', label: 'Invoice', icon: Receipt },
  { key: 'tax', label: 'Tax', icon: Percent },
  { key: 'preferences', label: 'Preferences', icon: Wallet },
];

export default function SettingsPage() {
  const { dark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('business');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    businessName: 'Inventory Management',
    email: 'admin@example.com',
    phone: '+1-555-0100',
    address: '123 Pharma Lane',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10001',
    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata',
    language: 'English',
    invoicePrefix: 'INV',
    invoiceNextNo: '1001',
    invoiceFooter: 'Thank you for your business!',
    taxName: 'GST',
    taxRate: '18',
    taxRegistrationNo: 'GSTIN1234567890',
  });

  const handleSave = () => {
    setSaved(true);
    localStorage.setItem('settings', JSON.stringify(form));
    setTimeout(() => setSaved(false), 2000);
  };

  const TabIcon = activeTab === 'business' ? Building2
    : activeTab === 'localization' ? Globe
    : activeTab === 'invoice' ? Receipt
    : activeTab === 'tax' ? Percent
    : Wallet;

  return (
    <div className="pb-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 font-['Space_Grotesk']">Settings</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage your business configuration</p>
        </div>
        <button onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold border-0 cursor-pointer hover:bg-teal-700 transition-all duration-200 hover:shadow-lg active:scale-95">
          {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border-0 cursor-pointer ${
                active ? 'bg-[#0F9291] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F9291]/10">
            <TabIcon className="w-5 h-5 text-[#0F9291]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-['Space_Grotesk'] m-0">
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
            <p className="text-[13px] text-gray-400 m-0 mt-0.5">
              {activeTab === 'business' ? 'Basic business information'
              : activeTab === 'localization' ? 'Regional settings and formatting'
              : activeTab === 'invoice' ? 'Invoice numbering and defaults'
              : activeTab === 'tax' ? 'Tax configuration'
              : 'Appearance and preferences'}
            </p>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'business' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Business Name" value={form.businessName} onChange={v => setForm(f => ({ ...f, businessName: v }))} />
              <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Field label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} />
              <Field label="City" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Field label="State" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} />
              <Field label="Country" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
              <Field label="Postal Code" value={form.postalCode} onChange={v => setForm(f => ({ ...f, postalCode: v }))} />
            </div>
          )}

          {activeTab === 'localization' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SelectField label="Currency" value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))}
                options={['INR']} />
              <Field label="Currency Symbol" value={form.currencySymbol} onChange={v => setForm(f => ({ ...f, currencySymbol: v }))} />
              <SelectField label="Date Format" value={form.dateFormat} onChange={v => setForm(f => ({ ...f, dateFormat: v }))}
                options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} />
              <SelectField label="Timezone" value={form.timezone} onChange={v => setForm(f => ({ ...f, timezone: v }))}
                options={['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Dubai', 'Asia/Singapore']} />
              <SelectField label="Language" value={form.language} onChange={v => setForm(f => ({ ...f, language: v }))}
                options={['English', 'Hindi', 'Spanish', 'French', 'Arabic']} />
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Invoice Prefix" value={form.invoicePrefix} onChange={v => setForm(f => ({ ...f, invoicePrefix: v }))} />
              <Field label="Next Invoice Number" value={form.invoiceNextNo} onChange={v => setForm(f => ({ ...f, invoiceNextNo: v }))} type="number" />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Footer</label>
                <textarea value={form.invoiceFooter} onChange={e => setForm(f => ({ ...f, invoiceFooter: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10 transition-all min-h-[80px]" />
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Tax Name" value={form.taxName} onChange={v => setForm(f => ({ ...f, taxName: v }))} />
              <Field label="Tax Rate (%)" value={form.taxRate} onChange={v => setForm(f => ({ ...f, taxRate: v }))} type="number" />
              <Field label="Tax Registration No." value={form.taxRegistrationNo} onChange={v => setForm(f => ({ ...f, taxRegistrationNo: v }))} />
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm">
                    {dark ? <Sun className="w-5 h-5 text-[#FA9200]" /> : <Moon className="w-5 h-5 text-[#3848F5]" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Theme Mode</p>
                    <p className="text-[12px] text-gray-400">{dark ? 'Dark mode active' : 'Light mode active'}</p>
                  </div>
                </div>
                <button onClick={toggleTheme}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 border-0 cursor-pointer ${dark ? 'bg-[#0F9291]' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${dark ? 'translate-x-7' : 'translate-x-0.5'}`}>
                    {dark ? <Moon className="w-3 h-3 text-[#0F9291]" /> : <Sun className="w-3 h-3 text-[#FA9200]" />}
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Backup Data</p>
                  <p className="text-[12px] text-gray-400">Export all your data as JSON</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Restore Data</p>
                  <p className="text-[12px] text-gray-400">Import data from a backup file</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" /> Import
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-medium text-amber-800">These settings are stored locally. A backend sync feature will be available soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10 transition-all" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
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