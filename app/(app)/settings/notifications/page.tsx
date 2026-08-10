'use client';

import { useState } from 'react';
import { Bell } from '@/components/ui/LucideIcon';
import { SettingsSection, SelectField } from '@/components/settings/SettingsSection';

const channels = [
  { name: 'Low Stock Alerts', desc: 'Notify when stock falls below reorder level' },
  { name: 'Expiry Warnings', desc: 'Notify when medicines near expiration' },
  { name: 'Daily Sales Summary', desc: 'End-of-day performance summary' },
  { name: 'Backup Notifications', desc: 'Status of scheduled backups' },
];

export default function NotificationsSettingsPage() {
  const [state, setState] = useState<Record<string, string>>(() =>
    Object.fromEntries(channels.map(c => [c.name, 'Email']))
  );
  return (
    <SettingsSection title="Notifications" subtitle="Choose how and when you get notified" icon={Bell}>
      <div className="flex flex-col gap-3">
        {channels.map(c => (
          <div key={c.name} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">{c.name}</p>
              <p className="text-[12px] text-gray-400">{c.desc}</p>
            </div>
            <div className="w-40">
              <SelectField
                label={''}
                value={state[c.name]}
                onChange={v => setState(s => ({ ...s, [c.name]: v }))}
                options={['Email', 'In-app', 'Push', 'Off']}
              />
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
