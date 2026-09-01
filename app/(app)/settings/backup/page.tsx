'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Archive, Download, Cloud, RefreshCw, CheckCircle2, AlertTriangle, Loader2,
  Building2, Database, Clock, HardDrive, ExternalLink, ShieldCheck,
} from '@/components/ui/LucideIcon';
import { BackupAPI, BranchesAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import GlobalModal from '@/components/ui/GlobalModal';

interface BackupRecord {
  id: number;
  branchId?: number | null;
  fileName?: string;
  label?: string;
  status?: string;
  progressPct?: number;
  sizeBytes?: number;
  detail?: string;
  driveUrl?: string;
  createdAt?: string;
  completedAt?: string;
}

function fmtSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RUNNING: 'bg-sky-50 text-sky-700 border-sky-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
};

export default function BackupSettingsPage() {
  const { user } = useAuth();
  const isSuper = (user?.role || '').toLowerCase() === 'super_admin';

  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [latest, setLatest] = useState<BackupRecord | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [cloud, setCloud] = useState<{ cloudConfigured: boolean; message: string }>({ cloudConfigured: false, message: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingScope, setPendingScope] = useState<string | null>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, lat, stat, br] = await Promise.all([
        BackupAPI.history(),
        BackupAPI.latest().catch(() => null),
        BackupAPI.status().catch(() => ({ cloudConfigured: false, message: '' })),
        BranchesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      const list = (hist as any)?.data || [];
      setHistory(list);
      // latest may resolve to the envelope when empty; normalise to a record or null
      const l = (lat as any);
      setLatest(l && l.id ? l : list.find((r: any) => r.status === 'COMPLETED') || null);
      setCloud(stat as any);
      setBranches((br as any)?.data || []);
    } catch {
      setToast({ type: 'error', msg: 'Failed to load backup data' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isSuper) load(); }, [isSuper, load]);

  const lastCompleted = useMemo(
    () => history.find(h => h.status === 'COMPLETED') || latest,
    [history, latest]
  );

  const runBackup = useCallback(async (branchId: string | null) => {
    setBusy(true);
    setConfirmOpen(false);
    try {
      await BackupAPI.create(branchId ?? undefined);
      setToast({ type: 'success', msg: 'Backup started in the background' });
      // poll for completion/status
      const start = Date.now();
      const poll = setInterval(async () => {
        try {
          const hist = (await BackupAPI.history()) as any;
          const list = hist?.data || [];
          const running = list.some((r: any) => r.status === 'RUNNING');
          setHistory(list);
          const done = list.find((r: any) => r.status === 'COMPLETED') || null;
          if (done) setLatest(done);
          if (!running || Date.now() - start > 180000) {
            clearInterval(poll);
            setBusy(false);
          }
        } catch {
          clearInterval(poll);
          setBusy(false);
        }
      }, 3000);
    } catch {
      setToast({ type: 'error', msg: 'Failed to start backup' });
      setBusy(false);
    }
  }, []);

  const confirmRun = () => {
    runBackup(pendingScope);
  };

  if (!isSuper) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Superadmin only</p>
          <p className="text-xs text-gray-400 mt-1">Backup is available to the Super Administrator account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Archive className="w-6 h-6 text-[#0F9291]" /> Backup
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Export every branch's data from one place. Files are gzipped JSON and can be stored
          locally or in Google Drive.
        </p>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Cloud status */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
        cloud.cloudConfigured ? 'bg-[#0F9291]/5 border-[#0F9291]/15' : 'bg-amber-50 border-amber-200'
      }`}>
        {cloud.cloudConfigured
          ? <Cloud className="w-5 h-5 text-[#0F9291] shrink-0" />
          : <HardDrive className="w-5 h-5 text-amber-600 shrink-0" />}
        <div>
          <p className={`text-sm font-semibold ${cloud.cloudConfigured ? 'text-[#0B7F7E]' : 'text-amber-700'}`}>
            {cloud.cloudConfigured ? 'Google Drive connected' : 'Cloud storage not configured'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{cloud.message}</p>
        </div>
      </div>

      {/* Last backup card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#161B22] flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-[#0F9291]/10 text-[#0F9291] flex items-center justify-center"><Clock className="w-5 h-5" /></span>
          <div>
            <p className="text-xs text-gray-500">Last backup</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtDate(lastCompleted?.completedAt || lastCompleted?.createdAt)}</p>
            <p className="text-[11px] text-gray-400">{lastCompleted?.label || 'No backup yet'}</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#161B22] flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Database className="w-5 h-5" /></span>
          <div>
            <p className="text-xs text-gray-500">Backups stored</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{history.length}</p>
            <p className="text-[11px] text-gray-400">
              {history.filter(h => h.status === 'FAILED').length} failed · {fmtSize(lastCompleted?.sizeBytes)} last size
            </p>
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#161B22] flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Building2 className="w-5 h-5" /></span>
          <div>
            <p className="text-xs text-gray-500">Branches covered</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{branches.length}</p>
            <p className="text-[11px] text-gray-400">All-branch dumps include every one</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 rounded-2xl border border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#161B22]">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Create a backup</p>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            value={selectedBranchId}
            onChange={e => setSelectedBranchId(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#161B22] text-sm focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10"
          >
            <option value="">All branches</option>
            {branches.map((b: any) => (
              <option key={b.id} value={String(b.id)}>{b.name} ({b.code})</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => { setPendingScope(selectedBranchId || 'all'); setConfirmOpen(true); }}
              disabled={busy}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-sm shadow-[#0F9291]/30 hover:shadow-md disabled:opacity-50 transition-all"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              {busy ? 'Backing up…' : selectedBranchId ? 'Backup Selected Branch' : 'Backup All Branches'}
            </button>
            <button
              onClick={load}
              disabled={busy}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#232323] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-all disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
        {lastCompleted && (
          <button
            onClick={() => window.open(BackupAPI.download(lastCompleted.id), '_blank')}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#0F9291] hover:underline cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download latest backup ({fmtSize(lastCompleted.sizeBytes)})
          </button>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#161B22] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2A2A2A]">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Backup history</p>
        </div>
        {loading ? (
          <div className="p-10 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#0F9291]" /></div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No backups yet — run your first backup above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-[#1F2937] text-xs text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Label</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Size</th>
                  <th className="text-left px-5 py-3 font-semibold">Storage</th>
                  <th className="text-left px-5 py-3 font-semibold">Created</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#2A2A2A]">
                {history.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{b.label}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[b.status || ''] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {b.status === 'RUNNING' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {b.status || '—'}
                        {b.status === 'RUNNING' && b.progressPct != null ? ` · ${b.progressPct}%` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{fmtSize(b.sizeBytes)}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                      {b.driveUrl ? <span className="inline-flex items-center gap-1"><Cloud className="w-3.5 h-3.5 text-[#0F9291]" /> Drive</span> : <span className="inline-flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Local</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{fmtDate(b.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {b.driveUrl && (
                        <a href={b.driveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#0F9291] hover:underline mr-3">
                          <ExternalLink className="w-3.5 h-3.5" /> Drive
                        </a>
                      )}
                      {b.id ? (
                        <button onClick={() => window.open(BackupAPI.download(b.id), '_blank')} className="inline-flex items-center gap-1 text-xs font-medium text-[#0F9291] hover:underline cursor-pointer">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      <GlobalModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Start backup?"
        size="sm"
        icon={<Archive className="w-5 h-5" />}
        submitLabel="Start Backup"
        onSubmit={confirmRun}
        submitting={busy}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          This will export <span className="font-semibold">{pendingScope === 'all' ? 'all branches' : 'selected branch'}</span> data
          as a gzipped JSON file{cloud.cloudConfigured ? ' and upload it to Google Drive' : ' and store it locally'}.
          This can take a few moments.
        </p>
      </GlobalModal>
    </div>
  );
}
