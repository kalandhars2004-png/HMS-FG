'use client';

import { useState } from 'react';
import Link from 'next/link';
import { House, ChevronLeft, Search, Calendar, Plus, Trash2, GripVertical, Printer, Download, X } from '@/components/ui/LucideIcon';

interface ItemRow { id: number; product: string; qty: string; unit: string; rate: string; tax: string; discount: string; total: string; }

const CUSTOMERS = ['Select', 'Andrew George', 'John Doe', 'Jane Smith', 'Robert Johnson'];
const INVOICES = ['Select', '#INV016', '#INV017', '#INV018', '#INV019'];
const CURRENCIES = ['INR'];
const TAXES = ['18%', '5%', '12%', '28%'];
const PRODUCTS = ['Select', 'Paracetamol', 'Amoxicillin', 'Cetirizine', 'Ceftriaxone', 'Ondansetron'];

export default function AddSalesReturnPage() {
  const [customer, setCustomer] = useState('Select');
  const [invoice, setInvoice] = useState('Select');
  const [date, setDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [taxSel, setTaxSel] = useState('18%');
  const [discountPct, setDiscountPct] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { id: 1, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
    { id: 2, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
    { id: 3, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
    { id: 4, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
    { id: 5, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
  ]);

  const addRow = () => setItems(s => [...s, { id: Date.now(), product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' }]);
  const delRow = (id: number) => setItems(s => s.length <= 1 ? s : s.filter(r => r.id !== id));
  const updRow = (id: number, field: keyof ItemRow, val: string) => {
    setItems(s => s.map(r => {
      if (r.id !== id) return r;
      const n = { ...r, [field]: val } as ItemRow;
      // auto calc total when qty/rate changes
      if (field === 'qty' || field === 'rate') {
        const q = parseFloat(field === 'qty' ? val : n.qty) || 0;
        const ra = parseFloat(field === 'rate' ? val : n.rate) || 0;
        n.total = q && ra ? String(q * ra) : '';
      }
      return n;
    }));
  };

  const subTotal = items.reduce((a, r) => a + (parseFloat(r.total) || 0), 0);
  const taxRate = parseFloat(taxSel) || 0;
  const discRate = parseFloat(discountPct) || 0;
  const taxAmt = subTotal * taxRate / 100;
  const discAmt = subTotal * discRate / 100;
  const grand = subTotal + taxAmt - discAmt;

  const reset = () => {
    setCustomer('Select'); setInvoice('Select'); setDate(''); setCurrency('INR'); setTaxSel('18%'); setDiscountPct(''); setNotes(''); setTerms('');
    setItems([
      { id: 1, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
      { id: 2, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
      { id: 3, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
      { id: 4, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
      { id: 5, product: 'Select', qty: '', unit: '', rate: '', tax: '', discount: '', total: '' },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] -m-4 sm:-m-6">
      {/* DreamPOS page-wrapper ms-0 */}
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* LEFT — bg-white py-4 px-3 */}
          <div className="bg-white py-6 px-4 sm:px-6 lg:px-8">
            {/* breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="flex items-center gap-1.5 text-sm list-none p-0 m-0">
                <li><Link href="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 no-underline"><House className="w-4 h-4" /> Dashboard</Link></li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-900 font-medium">Sales Returns</li>
              </ol>
            </nav>

            {/* Title with back */}
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Link href="/sales/returns" className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 no-underline">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              Create Sales Return
            </h2>

            {/* Form row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name <span className="text-red-500">*</span></label>
                <select value={customer} onChange={e => setCustomer(e.target.value)} className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20">
                  {CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice <span className="text-red-500">*</span></label>
                <select value={invoice} onChange={e => setInvoice(e.target.value)} className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20">
                  {INVOICES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} placeholder="dd/mm/yyyy"
                    className="w-full h-10 pl-3 pr-10 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Calendar className="w-4 h-4" /></span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax <span className="text-red-500">*</span></label>
                <select value={taxSel} onChange={e => setTaxSel(e.target.value)} className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20">
                  {TAXES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount %</label>
                <input type="text" value={discountPct} onChange={e => setDiscountPct(e.target.value)} placeholder="0"
                  className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20" />
              </div>
            </div>

            <span className="text-[15px] font-bold text-gray-900 mb-3 block">Item Details</span>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-[#f8f9fa] border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: 220 }}>Items</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Tax</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody id="itemTable" className="divide-y divide-gray-100 bg-white">
                  {items.map(row => (
                    <tr key={row.id}>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => delRow(row.id)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 shrink-0" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                          <select value={row.product} onChange={e => updRow(row.id, 'product', e.target.value)} className="flex-1 min-w-[140px] h-8 px-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F9291]">
                            {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-1.5 py-2"><input value={row.qty} onChange={e => updRow(row.id, 'qty', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded-full text-center focus:outline-none focus:border-[#0F9291] focus:ring-1 focus:ring-[#0F9291]/20" /></td>
                      <td className="px-1.5 py-2"><input value={row.unit} onChange={e => updRow(row.id, 'unit', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded-full text-center focus:outline-none focus:border-[#0F9291]" /></td>
                      <td className="px-1.5 py-2"><input value={row.rate} onChange={e => updRow(row.id, 'rate', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded-full text-center focus:outline-none focus:border-[#0F9291]" /></td>
                      <td className="px-1.5 py-2"><input value={row.tax} onChange={e => updRow(row.id, 'tax', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded-full text-center focus:outline-none focus:border-[#0F9291]" /></td>
                      <td className="px-1.5 py-2"><input value={row.discount} onChange={e => updRow(row.id, 'discount', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded-full text-center focus:outline-none focus:border-[#0F9291]" /></td>
                      <td className="px-1.5 py-2"><input value={row.total} onChange={e => updRow(row.id, 'total', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded-full text-center bg-gray-50 focus:outline-none focus:border-[#0F9291]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center my-4">
              <button onClick={addRow} className="inline-flex items-center gap-2 px-6 py-2 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-full text-sm font-medium shadow-sm">
                <Plus className="w-4 h-4" /> Add New
              </button>
            </div>

            <div className="mb-3">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add Notes" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20 resize-none" />
            </div>
            <div className="mb-6">
              <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={2} placeholder="Terms & Conditions" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/20 resize-none" />
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button onClick={reset} className="px-5 py-2.5 bg-[#f8f9fa] border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100">Reset</button>
              <div className="flex items-center gap-2">
                <button onClick={() => alert('Saved & Sent')} className="px-5 py-2.5 bg-white border border-[#0F9291] text-[#0F9291] rounded-lg text-sm font-medium hover:bg-[#0F9291]/5">Save & Send</button>
                <button onClick={() => alert('Sales Return Created')} className="px-5 py-2.5 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium shadow-sm">Create New</button>
              </div>
            </div>
          </div>

          {/* RIGHT — preview */}
          <div className="bg-[#f8f9fa] px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"><Printer className="w-4 h-4" /> Print</button>
              <button onClick={() => alert('Download')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F9291] hover:bg-[#0e7a79] text-white rounded-lg text-sm font-medium shadow-sm"><Download className="w-4 h-4" /> Download</button>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0F9291] flex items-center justify-center text-white font-bold text-sm">D</div>
                      <span className="font-bold text-gray-900">DreamsPOS</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">15 Hodges Mews, High Wycombe HP12 3JL, United Kingdom</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Sales Return</h4>
                    <p className="text-sm text-gray-600 mb-1">Invoice Number : <span className="font-semibold text-gray-900">{invoice !== 'Select' ? invoice : '#POR1236'}</span></p>
                    <p className="text-sm text-gray-600 mb-1">Invoice Date: <span className="font-semibold text-gray-900">{date || '18 Feb 2026'}</span></p>
                    <p className="text-sm text-gray-600">Due Date: <span className="font-semibold text-gray-900">{date || '18 Feb 2026'}</span></p>
                  </div>
                </div>

                {/* Billed By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <h6 className="font-bold text-sm text-gray-900 mb-2">Billed By</h6>
                    <p className="font-medium text-sm text-gray-900 mb-1">DreamsPOS Pharmacy Management</p>
                    <p className="text-sm text-gray-500 mb-1">15 Hodges Mews, HP12 3JL, United Kingdom</p>
                    <p className="text-sm text-gray-500 mb-1">Phone : +1 54664 75945</p>
                    <p className="text-sm text-gray-500 mb-1">Email : info@example.com</p>
                    <p className="text-sm text-gray-500">GST : 243E45767889</p>
                  </div>
                  <div>
                    <h6 className="font-bold text-sm text-gray-900 mb-2">Billed To</h6>
                    <p className="font-medium text-sm text-gray-900 mb-1">{customer !== 'Select' ? customer : 'Customer Name'}</p>
                    <p className="text-sm text-gray-500 mb-1">15 Hodges Mews, HP12 3JL, United Kingdom</p>
                    <p className="text-sm text-gray-500 mb-1">Phone : +1 54664 75945</p>
                    <p className="text-sm text-gray-500 mb-1">Email : info@example.com</p>
                    <p className="text-sm text-gray-500">GST : 243E45767889</p>
                  </div>
                </div>

                <h6 className="font-bold text-sm text-gray-900 mb-3">Item Details</h6>
                <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f8f9fa] border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">#</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Item</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Quantity</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Unit</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Discount</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Tax</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {items.filter(r => r.product !== 'Select' && r.qty).length === 0 ? (
                        <>
                          <tr><td className="px-3 py-2.5">1</td><td className="px-3 py-2.5 font-medium text-gray-900">Paracetamol 500</td><td className="px-3 py-2.5">3</td><td className="px-3 py-2.5">300</td><td className="px-3 py-2.5">200</td><td className="px-3 py-2.5">18%</td><td className="px-3 py-2.5 text-right font-semibold">₹200</td></tr>
                          <tr><td className="px-3 py-2.5">2</td><td className="px-3 py-2.5 font-medium text-gray-900">Amoxicillin 250</td><td className="px-3 py-2.5">4</td><td className="px-3 py-2.5">5000</td><td className="px-3 py-2.5">3000</td><td className="px-3 py-2.5">16%</td><td className="px-3 py-2.5 text-right font-semibold">₹600</td></tr>
                          <tr><td className="px-3 py-2.5">3</td><td className="px-3 py-2.5 font-medium text-gray-900">Cetirizine</td><td className="px-3 py-2.5">3</td><td className="px-3 py-2.5">2000</td><td className="px-3 py-2.5">2000</td><td className="px-3 py-2.5">24%</td><td className="px-3 py-2.5 text-right font-semibold">₹500</td></tr>
                          <tr><td className="px-3 py-2.5">4</td><td className="px-3 py-2.5 font-medium text-gray-900">Ceftriaxone 20</td><td className="px-3 py-2.5">4</td><td className="px-3 py-2.5">3000</td><td className="px-3 py-2.5">3400</td><td className="px-3 py-2.5">18%</td><td className="px-3 py-2.5 text-right font-semibold">₹600</td></tr>
                          <tr><td className="px-3 py-2.5">5</td><td className="px-3 py-2.5 font-medium text-gray-900">Ondansetron</td><td className="px-3 py-2.5">3</td><td className="px-3 py-2.5">4500</td><td className="px-3 py-2.5">1200</td><td className="px-3 py-2.5">16%</td><td className="px-3 py-2.5 text-right font-semibold">₹800</td></tr>
                        </>
                      ) : (
                        items.filter(r => r.product !== 'Select').map((r, i) => (
                          <tr key={r.id}>
                            <td className="px-3 py-2.5">{i + 1}</td>
                            <td className="px-3 py-2.5 font-medium text-gray-900">{r.product}</td>
                            <td className="px-3 py-2.5">{r.qty || '-'}</td>
                            <td className="px-3 py-2.5">{r.unit || '-'}</td>
                            <td className="px-3 py-2.5">{r.discount || '-'}</td>
                            <td className="px-3 py-2.5">{r.tax || '-'}</td>
                            <td className="px-3 py-2.5 text-right font-semibold">₹{r.total || '0'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h6 className="font-bold text-sm text-gray-900 mb-1">Notes</h6>
                    <p className="text-sm text-gray-500 leading-relaxed">{notes || 'This Purchase Order is subject to the buyer\'s standard terms and conditions.'}</p>
                    <h6 className="font-bold text-sm text-gray-900 mt-4 mb-1">Terms & Conditions</h6>
                    <p className="text-sm text-gray-500 leading-relaxed">{terms || 'Please reference this Purchase Order Number on all invoices and correspondence.'}</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4 bg-[#f8f9fa]/50">
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Sub Total</span><span className="font-semibold text-sm text-gray-900">₹{subTotal ? subTotal.toFixed(2) : '900.25'}</span></div>
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Tax</span><span className="font-semibold text-sm text-gray-900">₹{taxAmt ? taxAmt.toFixed(2) : '70.00'}</span></div>
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Discount</span><span className="font-semibold text-sm text-red-500">-₹{discAmt ? discAmt.toFixed(2) : '26.00'}</span></div>
                    <div className="flex justify-between border-t border-gray-200 mt-2 pt-3"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-gray-900">₹{grand ? grand.toFixed(2) : '944.00'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
