'use client';

import { useState } from 'react';
import { Key } from '@/components/ui/LucideIcon';
import { SettingsSection, Field } from '@/components/settings/SettingsSection';

export default function RolesSettingsPage() {
  const [form, setForm] = useState({
    roleName: 'Pharmacist',
    description: 'Dispenses prescriptions and manages stock',
    usersCount: '3',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <SettingsSection title="Roles" subtitle="Define roles and their responsibilities" icon={Key}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Role Name" value={form.roleName} onChange={set('roleName')} />
        <Field label="Assigned Users" value={form.usersCount} onChange={set('usersCount')} type="number" />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10 transition-all min-h-[80px]" />
        </div>
      </div>
    </SettingsSection>
  );
}
