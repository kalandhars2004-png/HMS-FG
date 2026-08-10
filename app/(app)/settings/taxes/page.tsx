'use client';

import { useState } from 'react';
import { Calculator } from '@/components/ui/LucideIcon';
import { SettingsSection, Field, SelectField } from '@/components/settings/SettingsSection';

export default function TaxesSettingsPage() {
  const [form, setForm] = useState({
    taxName: 'GST',
    taxRate: '18',
    taxRegistrationNo: 'GSTIN1234567890',
    appliedOn: 'All products',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <SettingsSection title="Taxes" subtitle="Configure tax rates and registration" icon={Calculator}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Tax Name" value={form.taxName} onChange={set('taxName')} />
        <Field label="Tax Rate (%)" value={form.taxRate} onChange={set('taxRate')} type="number" />
        <Field label="Tax Registration No." value={form.taxRegistrationNo} onChange={set('taxRegistrationNo')} />
        <SelectField label="Applied On" value={form.appliedOn} onChange={set('appliedOn')} options={['All products', 'Prescription only', 'Exempt items']} />
      </div>
    </SettingsSection>
  );
}
