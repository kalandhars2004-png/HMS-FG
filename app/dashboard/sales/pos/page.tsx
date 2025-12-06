'use client';

import { useState } from 'react';
import { Search, Plus, Minus, Trash2, User, Menu, Printer, DollarSign, X, Edit } from 'lucide-react';

interface BillingItem {
  id: string;
  itemCode: string;
  productName: string;
  qty: number;
  mrp: number;
  discount: number;
  addDisc: number;
  unitCost: number;
  netAmount: number;
}

interface PaymentEntry {
  id: string;
  method: string;
  amount: number;
  account?: string;
  upiId?: string;
}

export default function POSPage() {
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [customerType, setCustomerType] = useState('Walk In');
  const [customerName, setCustomerName] = useState('Walk in Customer');
  const [remarks, setRemarks] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMultiplePayModal, setShowMultiplePayModal] = useState(false);
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);

  const products = [
    { id: '1', code: '8906069402668', name: 'Pasta and Pizza Sauce', mrp: 89.00, stock: 150 },
    { id: '2', code: 'OP000503074', name: 'TRUFFLE PASTRY', mrp: 120.00, stock: 50 },
    { id: '3', code: '8901058842906', name: 'MaggilimiSauce22', mrp: 75.00, stock: 200 },
    { id: '4', code: 'ADK000001237', name: 'Cakes', mrp: 1000.00, stock: 25 },
    { id: '5', code: 'PRD000001', name: 'iPhone 14 Pro', mrp: 89000.00, stock: 10 },
    { id: '6', code: 'PRD000002', name: 'MacBook Pro', mrp: 125000.00, stock: 8 },
  ];

  const addItem = (product: typeof products[0]) => {
    setBillingItems((prevItems) => {
      const existingItem = prevItems.find(item => item.itemCode === product.code);
      if (existingItem) {
        // Update quantity of existing item
        return prevItems.map(item => {
          if (item.id === existingItem.id) {
            const newQty = item.qty + 1;
            const unitCost = item.mrp - item.discount - item.addDisc;
            return { ...item, qty: newQty, unitCost, netAmount: unitCost * newQty };
          }
          return item;
        });
      } else {
        // Add new item
        const newItem: BillingItem = {
          id: Date.now().toString(),
          itemCode: product.code,
          productName: product.name,
          qty: 1,
          mrp: product.mrp,
          discount: 0,
          addDisc: 0,
          unitCost: product.mrp,
          netAmount: product.mrp,
        };
        return [...prevItems, newItem];
      }
    });
  };

  const updateItemQty = (id: string, newQty: number) => {
    if (newQty < 1) {
      removeItem(id);
      return;
    }
    setBillingItems((prevItems) => prevItems.map(item => {
      if (item.id === id) {
        const unitCost = item.mrp - item.discount - item.addDisc;
        return { ...item, qty: newQty, unitCost, netAmount: unitCost * newQty };
      }
      return item;
    }));
  };

  const updateItemDiscount = (id: string, discount: number) => {
    setBillingItems((prevItems) => prevItems.map(item => {
      if (item.id === id) {
        const unitCost = item.mrp - discount - item.addDisc;
        return { ...item, discount, unitCost, netAmount: unitCost * item.qty };
      }
      return item;
    }));
  };

  const updateItemAddDisc = (id: string, addDisc: number) => {
    setBillingItems((prevItems) => prevItems.map(item => {
      if (item.id === id) {
        const unitCost = item.mrp - item.discount - addDisc;
        return { ...item, addDisc, unitCost, netAmount: unitCost * item.qty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setBillingItems((prevItems) => prevItems.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const quantity = billingItems.reduce((sum, item) => sum + item.qty, 0);
    const mrpTotal = billingItems.reduce((sum, item) => sum + (item.mrp * item.qty), 0);
    const discountTotal = billingItems.reduce((sum, item) => sum + (item.discount * item.qty), 0);
    const amount = billingItems.reduce((sum, item) => sum + item.netAmount, 0);
    const taxAmount = amount * 0.05; // 5% tax

    return {
      quantity,
      mrp: mrpTotal,
      taxAmount,
      discount: discountTotal,
      flatDiscount: 0,
      roundOff: 0,
      amount: amount + taxAmount,
    };
  };

  const totals = calculateTotals();

  // Filter products based on search query
  const filteredProducts = searchQuery.length > 0
    ? products.filter(p =>
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchProduct = () => {
    if (filteredProducts.length > 0) {
      addItem(filteredProducts[0]);
      setSearchQuery('');
      setShowAutocomplete(false);
    }
  };

  const handleSelectProduct = (product: typeof products[0]) => {
    addItem(product);
    setSearchQuery('');
    setShowAutocomplete(false);
  };

  const addPaymentEntry = () => {
    const newEntry: PaymentEntry = {
      id: Date.now().toString(),
      method: 'Cash',
      amount: 0,
    };
    setPaymentEntries((prev) => [...prev, newEntry]);
  };

  const updatePaymentEntry = (id: string, field: keyof PaymentEntry, value: any) => {
    setPaymentEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const removePaymentEntry = (id: string) => {
    setPaymentEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const getTotalPaid = () => {
    return paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
  };

  const getRemainingAmount = () => {
    return totals.amount - getTotalPaid();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <Menu className="w-6 h-6" />
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded">
              <span className="font-bold text-lg">Vasy</span>
              <span className="text-xs">ERP</span>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={customerType === 'Walk In'} onChange={() => setCustomerType('Walk In')} className="w-4 h-4" />
              Walk In
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={customerType === 'Delivery'} onChange={() => setCustomerType('Delivery')} className="w-4 h-4" />
              Delivery
            </label>
          </div>
          <div>
            <label className="text-sm mr-2">Salesman:</label>
            <select className="bg-white text-gray-900 px-3 py-1 rounded">
              <option>VasyERP Demo Ac...</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span className="text-sm">Support Desk</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center text-xs cursor-pointer hover:bg-gray-800">
                ⚙️
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 h-[calc(100vh-60px)]">
        {/* Left Panel - Billing Table */}
        <div className="col-span-9 bg-white p-4 overflow-auto">
          {/* Search Bar */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Scan Barcode/Enter Product Name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAutocomplete(e.target.value.length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchProduct();
                }
              }}
              onFocus={() => setShowAutocomplete(searchQuery.length > 0)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              className="w-full px-4 py-3 border-2 border-teal-500 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            {/* Autocomplete Dropdown */}
            {showAutocomplete && filteredProducts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-teal-500 rounded shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectProduct(product);
                    }}
                    className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-600 font-mono">{product.code}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-teal-600">₹{product.mrp.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Stock: {product.stock}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk in Customer"
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              />
              <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">▼</button>
              <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">+</button>
              <input
                type="text"
                placeholder="Scan Sales Invoice"
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Billing Table */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900 text-white text-sm">
                <tr>
                  <th className="px-3 py-3 text-left w-12">#</th>
                  <th className="px-3 py-3 text-left w-16"></th>
                  <th className="px-3 py-3 text-left w-32">Itemcode</th>
                  <th className="px-3 py-3 text-left">Product</th>
                  <th className="px-3 py-3 text-center w-24">Qty</th>
                  <th className="px-3 py-3 text-right w-24">MRP</th>
                  <th className="px-3 py-3 text-center w-24">Discount</th>
                  <th className="px-3 py-3 text-center w-24">Add Disc</th>
                  <th className="px-3 py-3 text-right w-24">Unit Cost</th>
                  <th className="px-3 py-3 text-right w-32">Net Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {billingItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-20 text-center text-gray-400">
                      No items added. Search and add products to start billing.
                    </td>
                  </tr>
                ) : (
                  billingItems.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Menu className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-red-100 rounded text-red-600">
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{item.itemCode}</td>
                      <td className="px-3 py-2">{item.productName}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateItemQty(item.id, item.qty - 1)} className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center">
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center border border-gray-300 rounded px-1 py-1"
                          />
                          <button onClick={() => updateItemQty(item.id, item.qty + 1)} className="w-6 h-6 bg-teal-500 hover:bg-teal-600 text-white rounded flex items-center justify-center">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{item.mrp.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button className="p-1 bg-gray-900 text-white rounded">
                            <span className="text-xs">%</span>
                          </button>
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 text-center border border-gray-300 rounded px-1 py-1"
                            step="0.01"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button className="p-1 bg-gray-900 text-white rounded">
                            <span className="text-xs">%</span>
                          </button>
                          <input
                            type="number"
                            value={item.addDisc}
                            onChange={(e) => updateItemAddDisc(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 text-center border border-gray-300 rounded px-1 py-1"
                            step="0.01"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{item.unitCost.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {item.netAmount.toFixed(2)}
                        <button className="ml-2 text-red-600 hover:text-red-800">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Remarks */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-4 py-2 border-2 border-teal-500 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Totals Bar */}
          <div className="mt-4 grid grid-cols-8 gap-2 bg-gray-100 p-3 rounded">
            <div className="text-center">
              <div className="text-2xl font-bold">{totals.quantity.toFixed(3)}</div>
              <div className="text-xs text-gray-600">Quantity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totals.mrp.toFixed(2)}</div>
              <div className="text-xs text-gray-600">MRP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totals.taxAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Tax Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totals.discount.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Add.Charges+</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totals.discount.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Discount</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <button className="p-1 bg-gray-900 text-white rounded">
                  <span className="text-xs">%</span>
                </button>
                <input type="number" defaultValue="0.00" className="w-16 text-center border rounded px-1 py-1" />
              </div>
              <div className="text-xs text-gray-600">Flat Discount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totals.roundOff.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Round OFF</div>
            </div>
            <div className="text-center bg-teal-600 text-white rounded p-2">
              <div className="text-3xl font-bold">{totals.amount.toFixed(0)}</div>
              <div className="text-xs">Amount</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-8 gap-2">
            <button
              onClick={() => billingItems.length > 0 && setShowMultiplePayModal(true)}
              className="px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              💳 Multiple Pay (F2)
            </button>
            <button className="px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">
              💳 Hold/item Credit
            </button>
            <button className="px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">
              📋 Hold (F4)
            </button>
            <button className="px-4 py-3 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm">
              💳 UPI (F5)
            </button>
            <button className="px-4 py-3 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm">
              💳 Card (F3)
            </button>
            <button className="px-4 py-3 bg-pink-600 text-white rounded hover:bg-pink-700 text-sm">
              🖨️ Hold & Print (F7)
            </button>
            <button className="px-4 py-3 bg-pink-600 text-white rounded hover:bg-pink-700 text-sm">
              🖨️ UPI & Print (F10)
            </button>
            <button
              onClick={() => billingItems.length > 0 && setShowPaymentModal(true)}
              className="px-4 py-3 bg-gray-900 text-white rounded hover:bg-black text-sm font-semibold"
            >
              💵 Cash & Print (F8)
            </button>
          </div>
        </div>

        {/* Right Panel - Customer Details */}
        <div className="col-span-3 bg-gray-50 p-4 border-l border-gray-300 overflow-auto">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100">
                📋 Hold Bill
              </button>
              <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100">
                💳 Payments
              </button>
              <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100">
                🔄 Redeem Loyalty
              </button>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100">
                💳 Add Payment
              </button>
              <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100">
                📝 Credit Notes
              </button>
              <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100">
                📦 Orders
              </button>
            </div>

            <button className="w-full px-4 py-3 bg-white border border-gray-300 rounded hover:bg-gray-100">
              💰 Cash Control
            </button>

            <div className="bg-white p-4 rounded border border-gray-300">
              <h3 className="font-semibold mb-3">Customer Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Visited:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Bill Amount:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Most Purchased Item:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Mode:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Payment:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Purchase:</span>
                  <span>₹ 0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loyalty Points:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MemberShip:</span>
                  <span>-</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Last Bill No.:</span>
                  <span>ORD9050</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="font-semibold">Last Bill Amount:</span>
                  <span>₹ 450.00</span>
                </div>
                <button className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-black flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />
                  Last Bill Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center p-4 border-b bg-teal-600">
              <h2 className="text-lg font-semibold text-white">Complete Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-white hover:bg-teal-700 rounded-full p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900">₹ {totals.amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
              </div>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Cash Payment
                </button>
                <button className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                  💳 Card Payment
                </button>
                <button className="w-full px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-2">
                  📱 UPI Payment
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-black flex items-center justify-center gap-2">
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Pay Modal */}
      {showMultiplePayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl font-semibold text-white">Pay</h2>
              <button
                onClick={() => {
                  setShowMultiplePayModal(false);
                  setPaymentEntries([]);
                }}
                className="text-white hover:bg-blue-800 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                  <span className="text-3xl font-bold text-blue-600">₹ {totals.amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Entries */}
              <div className="space-y-4 mb-6">
                {paymentEntries.map((entry, index) => (
                  <div key={entry.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Received Amount:
                          </label>
                          <input
                            type="number"
                            value={entry.amount || ''}
                            onChange={(e) =>
                              updatePaymentEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method:
                          </label>
                          <select
                            value={entry.method}
                            onChange={(e) => updatePaymentEntry(entry.id, 'method', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                          </select>
                        </div>

                        {entry.method === 'UPI' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              UPI ID:
                            </label>
                            <input
                              type="text"
                              value={entry.upiId || ''}
                              onChange={(e) => updatePaymentEntry(entry.id, 'upiId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="example@upi"
                            />
                          </div>
                        )}

                        {(entry.method === 'Card' || entry.method === 'Bank Transfer') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Account:
                            </label>
                            <select
                              value={entry.account || ''}
                              onChange={(e) => updatePaymentEntry(entry.id, 'account', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Account</option>
                              <option value="HDFC Bank Sindhubhavan">HDFC Bank Sindhubhavan</option>
                              <option value="SBI Main Branch">SBI Main Branch</option>
                              <option value="ICICI Corporate">ICICI Corporate</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removePaymentEntry(entry.id)}
                        className="mt-8 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addPaymentEntry}
                className="w-full px-4 py-3 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 font-medium mb-6"
              >
                ➕ Add More Payment
              </button>

              {/* Summary */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-semibold text-gray-900">₹ {getTotalPaid().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className={getRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}>
                    {getRemainingAmount() > 0 ? 'Remaining:' : 'Change:'}
                  </span>
                  <span className={getRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}>
                    ₹ {Math.abs(getRemainingAmount()).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMultiplePayModal(false);
                    setPaymentEntries([]);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (getTotalPaid() >= totals.amount) {
                      alert('Payment completed successfully!');
                      setShowMultiplePayModal(false);
                      setPaymentEntries([]);
                      setBillingItems([]);
                    } else {
                      alert('Payment incomplete! Please add remaining amount.');
                    }
                  }}
                  disabled={getTotalPaid() < totals.amount}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium ${
                    getTotalPaid() >= totals.amount
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Proceed to Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
