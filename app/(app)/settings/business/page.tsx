'use client';

import { useState } from 'react';
import { Building2 } from '@/components/ui/LucideIcon';
import { SettingsSection, Field } from '@/components/settings/SettingsSection';

export default function BusinessSettingsPage() {
  const [form, setForm] = useState({
    businessName: 'Inventory Management',
    email: 'admin@example.com',
    phone: '+1-555-0100',
    address: '123 Pharma Lane, New York, NY 10001',
    gstin: 'GSTIN1234567890',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <SettingsSection title="Business" subtitle="Basic business information" icon={Building2}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Business Name" value={form.businessName} onChange={set('businessName')} />
        <Field label="Email" value={form.email} onChange={set('email')} type="email" />
        <Field label="Phone" value={form.phone} onChange={set('phone')} />
        <Field label="Address" value={form.address} onChange={set('address')} />
        <Field label="Tax Registration No." value={form.gstin} onChange={set('gstin')} />
      </div>
    </SettingsSection>
  );
}
