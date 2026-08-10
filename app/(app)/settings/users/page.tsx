'use client';

import { useState } from 'react';
import { UserCog } from '@/components/ui/LucideIcon';
import { SettingsSection, Field, SelectField } from '@/components/settings/SettingsSection';

export default function UsersSettingsPage() {
  const [form, setForm] = useState({
    username: 'admin',
    fullName: 'Administrator',
    email: 'admin@example.com',
    role: 'Admin',
    status: 'Active',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <SettingsSection title="Users" subtitle="Manage system users and access" icon={UserCog}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Username" value={form.username} onChange={set('username')} />
        <Field label="Full Name" value={form.fullName} onChange={set('fullName')} />
        <Field label="Email" value={form.email} onChange={set('email')} type="email" />
        <SelectField label="Role" value={form.role} onChange={set('role')} options={['Admin', 'Manager', 'Pharmacist', 'Cashier']} />
        <SelectField label="Status" value={form.status} onChange={set('status')} options={['Active', 'Inactive']} />
      </div>
    </SettingsSection>
  );
}
