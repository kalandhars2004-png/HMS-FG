'use client';

import { useState } from 'react';
import { X, FileText, FileSpreadsheet, Download, Printer, CheckCircle2 } from '@/components/ui/LucideIcon';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [scope, setScope] = useState<'current' | 'entire' | 'selected'>('current');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 1500);
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Export Dashboard</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Format</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'pdf' as const, icon: FileText, label: 'PDF', desc: 'Document' },
                { key: 'excel' as const, icon: FileSpreadsheet, label: 'Excel', desc: 'Spreadsheet' },
                { key: 'csv' as const, icon: Download, label: 'CSV', desc: 'Data file' },
              ].map(opt => (
                <button key={opt.key} onClick={() => setFormat(opt.key)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 ${
                    format === opt.key ? 'border-[#0F9291] bg-[#0F9291]/5' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <opt.icon className={`w-5 h-5 ${format === opt.key ? 'text-[#0F9291]' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${format === opt.key ? 'text-[#0F9291]' : 'text-gray-700'}`}>{opt.label}</span>
                  <span className="text-[10px] text-gray-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Scope</p>
            <div className="flex gap-2">
              {[
                { key: 'current' as const, label: 'Current View' },
                { key: 'entire' as const, label: 'Entire Dashboard' },
                { key: 'selected' as const, label: 'Selected Cards' },
              ].map(opt => (
                <button key={opt.key} onClick={() => setScope(opt.key)}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    scope === opt.key ? 'border-[#0F9291] bg-[#0F9291]/5 text-[#0F9291]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {done ? (
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Exported successfully!</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-200">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={handleExport} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9291] text-white text-sm font-semibold hover:bg-teal-700 transition-all duration-200 disabled:opacity-60">
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : <Download className="w-4 h-4" />}
                {loading ? 'Exporting...' : 'Export'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
