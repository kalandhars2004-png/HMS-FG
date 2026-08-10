'use client';

import { useState } from 'react';
import { ShieldCheck } from '@/components/ui/LucideIcon';
import { SettingsSection, SelectField } from '@/components/settings/SettingsSection';

const permissions = [
  { name: 'View Dashboard', role: 'All roles' },
  { name: 'Manage Medicines', role: 'Admin, Manager' },
  { name: 'Process Sales', role: 'Admin, Manager, Pharmacist, Cashier' },
  { name: 'Approve Purchases', role: 'Admin, Manager' },
  { name: 'View Reports', role: 'Admin, Manager, Pharmacist' },
  { name: 'Manage Users', role: 'Admin' },
];

export default function PermissionsSettingsPage() {
  const [state, setState] = useState<Record<string, string>>(() =>
    Object.fromEntries(permissions.map(p => [p.name, p.role]))
  );
  return (
    <SettingsSection title="Permissions" subtitle="Control access to features and modules" icon={ShieldCheck}>
      <div className="flex flex-col gap-3">
        {permissions.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">{p.name}</p>
              <p className="text-[12px] text-gray-400">Which roles can access this feature</p>
            </div>
            <div className="w-56">
              <SelectField
                label={''}
                value={state[p.name]}
                onChange={v => setState(s => ({ ...s, [p.name]: v }))}
                options={['Admin', 'Admin, Manager', 'Admin, Manager, Pharmacist', 'All roles']}
              />
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
