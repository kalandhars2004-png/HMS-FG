'use client';

import { useState } from 'react';
import { Component } from '@/components/ui/LucideIcon';
import { SettingsSection, SelectField } from '@/components/settings/SettingsSection';

const integrations = [
  { name: 'Email Service', desc: 'Transactional and invoice emails', status: 'Connected' },
  { name: 'SMS Gateway', desc: 'OTP and order updates', status: 'Not connected' },
  { name: 'Payment Gateway', desc: 'Online payments and refunds', status: 'Connected' },
  { name: 'Accounting Export', desc: 'Sync invoices to accounting software', status: 'Not connected' },
];

export default function IntegrationsSettingsPage() {
  const [state, setState] = useState<Record<string, string>>(() =>
    Object.fromEntries(integrations.map(i => [i.name, i.status]))
  );
  return (
    <SettingsSection title="Integrations" subtitle="Connect external services" icon={Component}>
      <div className="flex flex-col gap-3">
        {integrations.map(i => (
          <div key={i.name} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">{i.name}</p>
              <p className="text-[12px] text-gray-400">{i.desc}</p>
            </div>
            <div className="w-44">
              <SelectField
                label={''}
                value={state[i.name]}
                onChange={v => setState(s => ({ ...s, [i.name]: v }))}
                options={['Connected', 'Not connected']}
              />
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
