'use client';

import { useState } from 'react';
import { GitFork } from '@/components/ui/LucideIcon';
import { SettingsSection, Field } from '@/components/settings/SettingsSection';

export default function BranchesSettingsPage() {
  const [form, setForm] = useState({
    branchName: 'Head Office',
    manager: 'Administrator',
    location: 'New York, NY',
    phone: '+1-555-0100',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <SettingsSection title="Branches" subtitle="Manage branch locations" icon={GitFork}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Branch Name" value={form.branchName} onChange={set('branchName')} />
        <Field label="Manager" value={form.manager} onChange={set('manager')} />
        <Field label="Location" value={form.location} onChange={set('location')} />
        <Field label="Phone" value={form.phone} onChange={set('phone')} />
      </div>
    </SettingsSection>
  );
}
