'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuditAPI } from '@/lib/api';
import {
  Search, Filter, RotateCw, Trash2, ChevronDown, ChevronRight,
  Clock, User, House,
} from '@/components/ui/LucideIcon';
import GlobalModal from '@/components/ui/GlobalModal';
import { beginSilentScope, endSilentScope } from '@/components/ui/global-loader/loader-bridge';

interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  description: string;
  changedBy: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  STATUS_CHANGE: 'bg-amber-50 text-amber-700 border-amber-200',
  IMPORT: 'bg-purple-50 text-purple-700 border-purple-200',
  EXPORT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const ENTITY_TYPES = ['PRODUCT', 'SUPPLIER', 'WAREHOUSE', 'PURCHASE_ORDER', 'SALES_ORDER', 'CATEGORY', 'BRAND', 'UNIT', 'VARIANT', 'TRANSACTION', 'EQUIPMENT', 'STOCK_ADJUSTMENT', 'STOCK_TRANSFER', 'BATCH', 'USER'];

const PAGE_SIZE = 25;

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleanDays, setCleanDays] = useState(90);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { beginSilentScope(); Promise.resolve(loadLogs()).finally(endSilentScope); }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { entityType?: string; entityId?: string } = {};
      if (entityTypeFilter) params.entityType = entityTypeFilter;
      const res = await AuditAPI.getAll(Object.keys(params).length ? params : undefined);
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityTypeFilter]);

  const handleClean = async () => {
    try {
      await AuditAPI.cleanOldLogs(cleanDays);
      setShowCleanModal(false);
      loadLogs();
    } catch (error) {
      console.error('Failed to clean logs:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || log.description?.toLowerCase().includes(searchQuery.toLowerCase()) || log.changedBy?.toLowerCase().includes(searchQuery.toLowerCase()) || log.entityType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 m-0 p-0 list-none text-sm">
            <li className="flex items-center gap-1.5">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700 no-underline flex items-center gap-1.5">
                <House className="w-4 h-4" /> Dashboard
              </a>
              <span className="text-gray-300 mx-1">/</span>
            </li>
            <li className="text-gray-900 font-medium" aria-current="page">Audit Trail</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => loadLogs()}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-250 shadow-sm"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCleanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all duration-250 shadow-sm hover:shadow-md active:scale-95"
          >
            <Trash2 className="w-4 h-4" /> Clean Old Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search description, user, entity..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-60 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={entityTypeFilter}
                  onChange={e => { setEntityTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-44 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250 appearance-none bg-white"
                >
                  <option value="">All Entity Types</option>
                  {ENTITY_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <select
                value={actionFilter}
                onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }}
                className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250 appearance-none bg-white"
              >
                <option value="">All Actions</option>
                {Object.keys(ACTION_STYLES).map(a => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#0F9291] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Description', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm mb-1">No audit logs found</p>
                      <p className="text-gray-300 text-xs">Activity will appear here as changes are made</p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map(log => {
                    const isExpanded = expandedId === log.id;
                    const hasDetails = log.oldValue || log.newValue;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors duration-250">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {formatDateTime(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {log.changedBy || 'System'}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${ACTION_STYLES[log.action] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                          {log.entityType.replace(/_/g, ' ')}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                          #{log.entityId}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {log.description || '-'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          {hasDetails && (
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-[#0F9291] hover:bg-[#0F9291]/10 transition-all duration-250"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                        {isExpanded && (
                          <tr key={`${log.id}-details`}>
                            <td colSpan={7} className="px-5 py-4 bg-gray-50/50">
                              <div className="grid grid-cols-2 gap-4">
                                {log.oldValue && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Old Value</p>
                                    <pre className="text-xs text-gray-700 bg-white rounded-xl p-3 border border-gray-200 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                                      {(() => { try { return JSON.stringify(JSON.parse(log.oldValue), null, 2); } catch { return log.oldValue; } })()}
                                    </pre>
                                  </div>
                                )}
                                {log.newValue && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Value</p>
                                    <pre className="text-xs text-gray-700 bg-white rounded-xl p-3 border border-gray-200 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                                      {(() => { try { return JSON.stringify(JSON.parse(log.newValue), null, 2); } catch { return log.newValue; } })()}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-250"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const page = start + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-all duration-250 ${
                      page === currentPage
                        ? 'bg-[#0F9291] text-white border-[#0F9291]'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-250"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showCleanModal && (
        <GlobalModal
          onClose={() => setShowCleanModal(false)}
          title="Clean Old Logs"
          subtitle="Permanently delete audit logs older than the specified number of days."
          icon={<Trash2 className="w-5 h-5" />}
          danger
          cancelLabel="Cancel"
          submitLabel="Delete Logs"
          onSubmit={handleClean}
        >
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Delete audit logs older than the specified number of days. This action cannot be undone.</p>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Delete logs older than (days)</label>
            <input
              type="number"
              min={1}
              value={cleanDays}
              onChange={e => setCleanDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#1E1E1E] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 transition-all duration-250"
            />
          </div>
        </GlobalModal>
      )}
    </div>
  );
}
