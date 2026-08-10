'use client';

import { Archive, Download, Upload, ShieldCheck } from '@/components/ui/LucideIcon';
import { SettingsSection } from '@/components/settings/SettingsSection';

export default function BackupSettingsPage() {
  return (
    <SettingsSection title="Backup" subtitle="Export and restore your data" icon={Archive}>
      <div className="space-y-4">
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
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0F9291]/5 border border-[#0F9291]/15">
          <ShieldCheck className="w-5 h-5 text-[#0F9291] shrink-0" />
          <p className="text-[13px] text-[#0B7F7E]">Last backup: Today, 03:00 AM. Automatic nightly backups are enabled.</p>
        </div>
      </div>
    </SettingsSection>
  );
}
