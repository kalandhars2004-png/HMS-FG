'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Timer, Ban, MapPin, Package, Building2, Trash2, ArrowLeft, CalendarDays, AlertTriangle, Box, Store } from '@/components/ui/LucideIcon';

export default function ExpiryDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id as string;
  const name = searchParams.get('name') || 'Unknown Product';
  const sku = searchParams.get('sku') || 'N/A';
  const rack = searchParams.get('rack') || 'N/A';
  const batch = searchParams.get('batch') || 'N/A';
  const supplier = searchParams.get('supplier') || 'N/A';
  const qty = searchParams.get('qty') || '0';
  const isExpired = searchParams.get('expired') === 'true';
  const expiryDays = searchParams.get('expiryDays') || '0';
  const expiredDays = searchParams.get('expiredDays') || '0';

  const category = 'N/A';

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0F9291] transition-colors duration-250 no-underline mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-250 group-hover:-translate-x-1" />
        Back to Dashboard
      </Link>

      {/* Header Card */}
      <div className={`rounded-3xl overflow-hidden shadow-[0_12px_35px_rgba(15,23,42,0.08)] ${isExpired ? 'border border-red-200' : 'border border-orange-200'}`}>
        <div className={`px-6 py-6 ${isExpired ? 'bg-red-50' : 'bg-orange-50'}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${isExpired ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
              {isExpired ? <Ban className="w-8 h-8" /> : <Timer className="w-8 h-8" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 m-0">{name}</h1>
                {isExpired ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    <Ban className="w-3 h-3" /> Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                    <Timer className="w-3 h-3" /> Near Expiry
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 m-0 mt-1">SKU: {sku} · {category}</p>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className={`px-6 py-3 border-b flex items-center justify-between flex-wrap gap-2 ${isExpired ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}>
          <div className="flex items-center gap-2">
            {isExpired ? (
              <><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-700">Expired {expiredDays} days ago — requires immediate disposal</span></>
            ) : (
              <><AlertTriangle className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-orange-700">Expiring in {expiryDays} days — action recommended</span></>
            )}
          </div>
          <span className="text-sm font-bold text-gray-900">{qty} units remaining</span>
        </div>

        {/* Detail Sections */}
        <div className="p-6 space-y-6">
          {/* Batch & Location Info */}
          <div>
            <h3 className="text-base font-bold text-gray-900 m-0 mb-3 flex items-center gap-2">
              <Box className="w-4 h-4 text-[#0F9291]" /> Batch & Location Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Box, label: 'Batch Number', value: batch, color: 'text-[#0F9291]', bg: 'bg-[#0F9291]/5' },
                { icon: MapPin, label: 'Rack Location', value: rack, color: 'text-[#E65B0D]', bg: 'bg-[#E65B0D]/5' },
                { icon: Store, label: 'Supplier', value: supplier, color: 'text-[#3848F5]', bg: 'bg-[#3848F5]/5' },
                { icon: Package, label: 'Available Stock', value: `${qty} units`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((d, i) => (
                <div key={i} className={`${d.bg} rounded-2xl p-4 border border-gray-100`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <d.icon className={`w-4 h-4 ${d.color}`} />
                    <span className="text-xs font-medium text-gray-500">{d.label}</span>
                  </div>
                  <p className={`text-base font-bold text-gray-900 m-0 ${d.label === 'Rack Location' ? 'text-lg' : ''}`}>{d.value}</p>
                  {d.label === 'Rack Location' && (
                    <p className="text-[11px] text-gray-400 m-0 mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> Added {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Disposal / Action Instructions */}
          <div className={`rounded-2xl p-5 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              {isExpired ? (
                <Trash2 className="w-5 h-5 text-red-500" />
              ) : (
                <Building2 className="w-5 h-5 text-orange-500" />
              )}
              <h4 className="text-base font-bold text-gray-900 m-0">
                {isExpired ? 'Disposal Instructions' : 'Recommended Action'}
              </h4>
            </div>

            {isExpired ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 m-0">
                  This batch has expired and must be disposed of following pharmacy guidelines.
                </p>
                <div className="bg-white/80 rounded-xl p-4 border border-red-100">
                  <h5 className="text-sm font-bold text-gray-900 m-0 mb-2">Step-by-Step Disposal</h5>
                  <ol className="m-0 pl-4 space-y-2">
                    <li className="text-[13px] text-gray-700">
                      <span className="font-semibold text-gray-900">Locate:</span> Go to rack <span className="font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{rack}</span>
                    </li>
                    <li className="text-[13px] text-gray-700">
                      <span className="font-semibold text-gray-900">Identify:</span> Find batch <span className="font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{batch}</span> and scan barcode
                    </li>
                    <li className="text-[13px] text-gray-700">
                      <span className="font-semibold text-gray-900">Separate:</span> Remove {qty} units from active inventory
                    </li>
                    <li className="text-[13px] text-gray-700">
                      <span className="font-semibold text-gray-900">Dispose:</span> Place in designated red biohazard disposal bin
                    </li>
                    <li className="text-[13px] text-gray-700">
                      <span className="font-semibold text-gray-900">Update:</span> Mark batch as &ldquo;Disposed&rdquo; in the system
                    </li>
                  </ol>
                </div>
                <button className="w-full px-4 py-3 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all duration-250 border-0 cursor-pointer flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Mark Batch as Disposed
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 m-0">
                  This batch is nearing its expiry date. Take action to minimize losses.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Move to Promo', desc: 'Discount selling', icon: TagIcon, bg: 'bg-white border-orange-200 hover:bg-orange-100' },
                    { label: 'Return to Supplier', desc: 'Request exchange', icon: RotateIcon, bg: 'bg-white border-orange-200 hover:bg-orange-100' },
                    { label: 'Donate', desc: 'Charity / NGO', icon: HeartIcon, bg: 'bg-white border-orange-200 hover:bg-orange-100' },
                  ].map((action, i) => (
                    <button key={i} className={`rounded-xl p-3 border text-left cursor-pointer transition-all duration-250 ${action.bg}`}>
                      <action.icon className="w-5 h-5 text-orange-600 mb-1" />
                      <p className="text-sm font-semibold text-gray-900 m-0">{action.label}</p>
                      <p className="text-[11px] text-gray-500 m-0 mt-0.5">{action.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="bg-white/80 rounded-xl p-4 border border-orange-100">
                  <h5 className="text-sm font-bold text-gray-900 m-0 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" /> Item Location
                  </h5>
                  <p className="text-[13px] text-gray-700 m-0">
                    Rack <span className="font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{rack}</span> · 
                    Batch <span className="font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{batch}</span> · 
                    {qty} units · Supplied by {supplier}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Back Button */}
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0F9291] transition-colors duration-250 no-underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function RotateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
