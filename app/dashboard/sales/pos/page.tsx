'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, User, Menu, Printer, DollarSign, X, Edit } from 'lucide-react';

interface BillingItem {
  id: string;
  itemCode: string;
  productName: string;
  productImage?: string;
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
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [customerType, setCustomerType] = useState('Walk In');
  const [customerName, setCustomerName] = useState('');
  const [showCustomerAutocomplete, setShowCustomerAutocomplete] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(0);
  const [showProductImages, setShowProductImages] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMultiplePayModal, setShowMultiplePayModal] = useState(false);
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerCity, setNewCustomerCity] = useState('');
  const [newCustomerState, setNewCustomerState] = useState('');
  const [newCustomerCountry, setNewCustomerCountry] = useState('');
  const [newCustomerPostalCode, setNewCustomerPostalCode] = useState('');
  const [newCustomerStatus, setNewCustomerStatus] = useState(true);
  const [newCustomerImage, setNewCustomerImage] = useState<string | null>(null);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [showPaymentCompletedModal, setShowPaymentCompletedModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<{
    items: BillingItem[];
    totals: any;
    receivedAmount: number;
    changeAmount: number;
    customerName: string;
    date: string;
    invoiceNo: string;
  } | null>(null);

  // Auto-populate customer form when modal opens
  useEffect(() => {
    if (showAddCustomerModal && customerName.trim()) {
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setNewCustomerFirstName(firstName);
      setNewCustomerLastName(lastName);
    } else if (!showAddCustomerModal) {
      // Reset form fields when modal closes
      setNewCustomerFirstName('');
      setNewCustomerLastName('');
      setNewCustomerEmail('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setNewCustomerCity('');
      setNewCustomerState('');
      setNewCustomerCountry('');
      setNewCustomerPostalCode('');
      setNewCustomerStatus(true);
      setNewCustomerImage(null);
    }
  }, [showAddCustomerModal, customerName]);

  const customers = [
    { id: '1', name: 'Walk in Customer', phone: '', address: '' },
    { id: '2', name: 'Vishal 747955667', phone: '747955667', address: 'Address' },
    { id: '3', name: 'Johar 7486082249', phone: '7486082249', address: 'Address' },
    { id: '4', name: 'Carl Evans', phone: '9876543210', address: '123 Main St' },
    { id: '5', name: 'Minerva Rameriz', phone: '9876543211', address: '456 Oak Ave' },
    { id: '6', name: 'Robert Lamon', phone: '9876543212', address: '789 Pine Rd' },
    { id: '7', name: 'Mark Joslyn', phone: '9876543213', address: '321 Elm St' },
    { id: '8', name: 'Patricia Lewis', phone: '9876543214', address: '654 Maple Dr' },
    { id: '9', name: 'Marsha Betts', phone: '9876543215', address: '987 Cedar Ln' },
    { id: '10', name: 'John Smith', phone: '9876543216', address: '147 Birch Way' },
  ];

  const products = [
    { id: '1', code: '8906069402668', name: 'Pasta and Pizza Sauce', mrp: 89.00, stock: 150, image: '🍝' },
    { id: '2', code: 'OP000503074', name: 'TRUFFLE PASTRY', mrp: 120.00, stock: 50, image: '🧁' },
    { id: '3', code: '8901058842906', name: 'MaggilimiSauce22', mrp: 75.00, stock: 200, image: '🍅' },
    { id: '4', code: 'ADK000001237', name: 'Cakes', mrp: 1000.00, stock: 25, image: '🎂' },
    { id: '5', code: 'PRD000001', name: 'iPhone 14 Pro', mrp: 89000.00, stock: 10, image: '📱' },
    { id: '6', code: 'PRD000002', name: 'MacBook Pro', mrp: 125000.00, stock: 8, image: '💻' },
    { id: '7', code: '8901234567890', name: 'Samsung Galaxy S24', mrp: 75000.00, stock: 15, image: '📱' },
    { id: '8', code: 'FD000001', name: 'Fresh Orange Juice', mrp: 150.00, stock: 100, image: '🧃' },
    { id: '9', code: 'FD000002', name: 'Chocolate Brownie', mrp: 250.00, stock: 75, image: '🍫' },
    { id: '10', code: 'FD000003', name: 'Chicken Sandwich', mrp: 180.00, stock: 60, image: '🥪' },
    { id: '11', code: 'EL000001', name: 'Sony Headphones WH-1000XM5', mrp: 25000.00, stock: 12, image: '🎧' },
    { id: '12', code: 'EL000002', name: 'Dell XPS 15 Laptop', mrp: 145000.00, stock: 6, image: '💻' },
    { id: '13', code: 'CL000001', name: 'Nike Air Max Shoes', mrp: 8500.00, stock: 30, image: '👟' },
    { id: '14', code: 'CL000002', name: 'Adidas Sports T-Shirt', mrp: 1200.00, stock: 80, image: '👕' },
    { id: '15', code: 'BK000001', name: 'Harry Potter Complete Set', mrp: 3500.00, stock: 20, image: '📚' },
    { id: '16', code: 'GR000001', name: 'Organic Tomatoes (1kg)', mrp: 60.00, stock: 200, image: '🍅' },
    { id: '17', code: 'GR000002', name: 'Fresh Milk (1L)', mrp: 70.00, stock: 150, image: '🥛' },
    { id: '18', code: 'SN000001', name: 'Lays Potato Chips', mrp: 20.00, stock: 300, image: '🍟' },
    { id: '19', code: 'SN000002', name: 'Coca Cola (500ml)', mrp: 40.00, stock: 250, image: '🥤' },
    { id: '20', code: 'AC000001', name: 'Leather Wallet', mrp: 1500.00, stock: 45, image: '👛' },
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
          productImage: product.image,
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
      const productToAdd = filteredProducts[selectedProductIndex] || filteredProducts[0];
      addItem(productToAdd);
      setSearchQuery('');
      setShowAutocomplete(false);
      setSelectedProductIndex(0);
    }
  };

  const handleSelectProduct = (product: typeof products[0]) => {
    addItem(product);
    setSearchQuery('');
    setShowAutocomplete(false);
    setSelectedProductIndex(0);
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

  // Filter customers based on customer name query
  const filteredCustomers = customerName.length > 0
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerName.toLowerCase()) ||
        c.phone.includes(customerName)
      )
    : [];

  const handleSelectCustomer = (customer: typeof customers[0]) => {
    setCustomerName(customer.name);
    setShowCustomerAutocomplete(false);
    setSelectedCustomerIndex(0);
  };

  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCustomerAutocomplete || filteredCustomers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedCustomerIndex(prev => prev < filteredCustomers.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedCustomerIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCustomers[selectedCustomerIndex]) {
        handleSelectCustomer(filteredCustomers[selectedCustomerIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowCustomerAutocomplete(false);
      setSelectedCustomerIndex(0);
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-button {
            display: none;
          }
        }
      `}</style>

    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <Menu className="w-6 h-6" />
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded">
              <span className="font-bold text-lg">SSS</span>
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

      <div className="h-[calc(100vh-60px)] flex">
        {/* Billing Panel */}
        <div className={`bg-white p-4 overflow-auto h-full transition-all ${showProductImages ? 'w-[70%]' : 'w-full'}`}>
          {/* Search Bar with Images Toggle */}
          <div className="mb-4 flex gap-2 items-center">
            <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Scan Barcode/Enter Product Name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAutocomplete(e.target.value.length > 0);
                setSelectedProductIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchProduct();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedProductIndex((prev) =>
                    prev < filteredProducts.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedProductIndex((prev) => prev > 0 ? prev - 1 : 0);
                }
              }}
              onFocus={() => setShowAutocomplete(searchQuery.length > 0)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              className="w-full px-4 py-3 border-2 border-teal-500 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            {/* Autocomplete Dropdown */}
            {showAutocomplete && filteredProducts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-teal-500 rounded shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectProduct(product);
                    }}
                    onMouseEnter={() => setSelectedProductIndex(index)}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                      index === selectedProductIndex ? 'bg-teal-100' : 'hover:bg-teal-50'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      {showProductImages && (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">{product.image}</span>
                        </div>
                      )}
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
            <button
              onClick={() => setShowProductImages(!showProductImages)}
              className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={showProductImages ? 'Hide Product Images' : 'Show Product Images'}
            >
              <span className="text-lg">🖼️</span>
              <span className="text-sm font-medium text-gray-700">
                {showProductImages ? 'Hide Images' : 'Show Images'}
              </span>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${
                showProductImages ? 'bg-teal-600' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  showProductImages ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </button>
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setShowCustomerAutocomplete(e.target.value.length > 0);
                    setSelectedCustomerIndex(0);
                  }}
                  onKeyDown={handleCustomerKeyDown}
                  onFocus={() => setShowCustomerAutocomplete(customerName.length > 0)}
                  onBlur={() => setTimeout(() => setShowCustomerAutocomplete(false), 200)}
                  placeholder="Walk in Customer"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />

                {/* Customer Autocomplete Dropdown */}
                {showCustomerAutocomplete && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-teal-500 rounded shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer, index) => (
                        <div
                          key={customer.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectCustomer(customer);
                          }}
                          onMouseEnter={() => setSelectedCustomerIndex(index)}
                          className={`px-4 py-3 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                            index === selectedCustomerIndex ? 'bg-teal-100' : 'hover:bg-teal-50'
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-xs text-gray-600">Phone: {customer.phone}</div>
                          )}
                          {customer.address && (
                            <div className="text-xs text-gray-500">{customer.address}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setShowAddCustomerModal(true);
                          setShowCustomerAutocomplete(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer bg-blue-100 border-l-4 border-blue-500"
                      >
                        <div className="font-semibold text-blue-700 flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add Contact
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Click to add "{customerName}" as new customer
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">▼</button>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                +
              </button>
              <input
                type="text"
                placeholder="Scan Sales Invoice"
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Billing Table */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-900 text-white text-sm sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left w-12">#</th>
                    <th className="px-3 py-3 text-left w-16"></th>
                    {showProductImages && <th className="px-3 py-3 text-left w-16">Image</th>}
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
                    <td colSpan={showProductImages ? 11 : 10} className="px-3 py-20 text-center text-gray-400">
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
                      {showProductImages && (
                        <td className="px-3 py-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center">
                            <span className="text-xl">{item.productImage}</span>
                          </div>
                        </td>
                      )}
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
              onClick={() => billingItems.length > 0 && setShowCashPaymentModal(true)}
              className="px-4 py-3 bg-gray-900 text-white rounded hover:bg-black text-sm font-semibold"
            >
              💵 Cash & Print (F8)
            </button>
          </div>
        </div>

        {/* Right Navigation Panel - Product Images */}
        {showProductImages && (
          <div className="w-[30%] bg-white border-l border-gray-300 overflow-y-auto h-full">
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Products</h3>
              <div className="grid grid-cols-3 gap-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="cursor-pointer border border-gray-200 rounded-lg p-2 hover:shadow-lg hover:border-teal-500 transition-all"
                  >
                    <div className="w-full aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center mb-2">
                      <span className="text-4xl">{product.image}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-900 text-center truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-teal-600 text-center font-bold">
                      ₹{product.mrp.toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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

      {/* Cash Payment Modal */}
      {showCashPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-3 border-b bg-gradient-to-r from-green-600 to-green-700 sticky top-0 z-10">
              <h2 className="text-base font-semibold text-white">Cash Payment</h2>
              <button
                onClick={() => {
                  setShowCashPaymentModal(false);
                  setReceivedAmount('');
                }}
                className="text-white hover:bg-green-800 rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {/* Total Amount Display */}
              <div className="mb-3 bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-xs text-gray-600">Total Amount</div>
                  <div className="text-2xl font-bold text-green-600">₹ {totals.amount.toFixed(2)}</div>
                </div>
              </div>

              {/* Received Amount Input */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Received Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-base">₹</span>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    step="0.01"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Quick Amount</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 200, 500, 1000, 2000, 5000, 'Exact', 'Clear'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        if (amount === 'Exact') {
                          setReceivedAmount(totals.amount.toFixed(2));
                        } else if (amount === 'Clear') {
                          setReceivedAmount('');
                        } else {
                          const current = parseFloat(receivedAmount) || 0;
                          setReceivedAmount((current + (amount as number)).toFixed(2));
                        }
                      }}
                      className={`px-2 py-1.5 rounded font-medium text-xs ${
                        amount === 'Exact'
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : amount === 'Clear'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {amount === 'Exact' || amount === 'Clear' ? amount : `+${amount}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change/Balance Display */}
              {receivedAmount && parseFloat(receivedAmount) > 0 && (
                <div className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-600">Received:</span>
                    <span className="font-semibold text-gray-900">₹ {parseFloat(receivedAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold text-gray-900">₹ {totals.amount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between items-center">
                      <span className={`font-bold text-sm ${
                        parseFloat(receivedAmount) >= totals.amount ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(receivedAmount) >= totals.amount ? 'Change:' : 'Due:'}
                      </span>
                      <span className={`font-bold text-lg ${
                        parseFloat(receivedAmount) >= totals.amount ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹ {Math.abs(parseFloat(receivedAmount) - totals.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Account */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Account
                </label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Account</option>
                  <option value="cash-counter-1">Cash Counter 1</option>
                  <option value="cash-counter-2">Cash Counter 2</option>
                  <option value="petty-cash">Petty Cash</option>
                  <option value="main-cash">Main Cash</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={2}
                  placeholder="Add payment notes..."
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <button
                  onClick={() => {
                    setShowCashPaymentModal(false);
                    setReceivedAmount('');
                  }}
                  className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const received = parseFloat(receivedAmount) || 0;
                    if (received < totals.amount) {
                      alert('Received amount cannot be less than total amount!');
                      return;
                    }
                    if (received === 0) {
                      alert('Please enter received amount!');
                      return;
                    }
                    // Process payment
                    const change = received - totals.amount;

                    // Save transaction data
                    const invoiceNo = 'CS' + Math.floor(Math.random() * 1000000);
                    const currentDate = new Date().toLocaleDateString('en-GB');

                    setCompletedTransaction({
                      items: [...billingItems],
                      totals: { ...totals },
                      receivedAmount: received,
                      changeAmount: change,
                      customerName: customerName || 'Walk in Customer',
                      date: currentDate,
                      invoiceNo: invoiceNo
                    });

                    // Close cash payment modal and show completion modal
                    setShowCashPaymentModal(false);
                    setShowPaymentCompletedModal(true);
                  }}
                  disabled={!receivedAmount || parseFloat(receivedAmount) < totals.amount}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1 text-sm ${
                    receivedAmount && parseFloat(receivedAmount) >= totals.amount
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  Complete & Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Completed Modal */}
      {showPaymentCompletedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Completed</h2>
              <p className="text-gray-600 mb-6">Do you want to Print Receipt for the Completed Order</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReceipt(true);
                    setShowPaymentCompletedModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-medium"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    setShowPaymentCompletedModal(false);
                    setBillingItems([]);
                    setReceivedAmount('');
                    setCompletedTransaction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                >
                  Next Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt/Invoice Modal */}
      {showReceipt && completedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[95vh] overflow-y-auto">
            <div id="receipt-content" className="p-8">
              {/* Company Header */}
              <div className="text-center mb-6 border-b pb-4">
                <div className="flex justify-center mb-2">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded">
                    <span className="font-bold text-xl">SSS</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900">SSS</h3>
                <p className="text-sm text-gray-600">Phone Number: +1 5656665656</p>
                <p className="text-sm text-gray-600">Email: example@gmail.com</p>
              </div>

              {/* Invoice Title */}
              <h2 className="text-xl font-bold text-center mb-6">Tax Invoice</h2>

              {/* Customer & Invoice Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm"><span className="font-semibold">Name:</span> {completedTransaction.customerName}</p>
                  <p className="text-sm"><span className="font-semibold">Invoice No:</span> {completedTransaction.invoiceNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm"><span className="font-semibold">Customer Id:</span> #LL93784</p>
                  <p className="text-sm"><span className="font-semibold">Date:</span> {completedTransaction.date}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2 text-sm font-semibold"># Item</th>
                      <th className="text-right py-2 text-sm font-semibold">Price</th>
                      <th className="text-center py-2 text-sm font-semibold">Qty</th>
                      <th className="text-right py-2 text-sm font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTransaction.items.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-2 text-sm">{index + 1}. {item.productName}</td>
                        <td className="text-right py-2 text-sm">${item.unitCost.toFixed(2)}</td>
                        <td className="text-center py-2 text-sm">{item.qty}</td>
                        <td className="text-right py-2 text-sm">${item.netAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Sub Total :</span>
                  <span className="text-sm">${(completedTransaction.totals.amount - completedTransaction.totals.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Discount :</span>
                  <span className="text-sm">-${completedTransaction.totals.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Shipping :</span>
                  <span className="text-sm">0.00</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Tax (5%) :</span>
                  <span className="text-sm">${completedTransaction.totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Total Bill :</span>
                  <span className="text-sm">${completedTransaction.totals.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-medium">Due :</span>
                  <span className="text-sm">$0.00</span>
                </div>
                <div className="flex justify-between border-t-2 border-gray-300 pt-4">
                  <span className="text-lg font-bold">Total Payable :</span>
                  <span className="text-lg font-bold">${completedTransaction.totals.amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center text-xs text-gray-600">
                <p>**VAT against this challan is payable through central registration. Thank you for your business!</p>
              </div>

              {/* Barcode */}
              <div className="mt-6 flex flex-col items-center">
                <div className="bg-white p-2">
                  <svg className="w-48 h-12">
                    <rect x="2" y="0" width="2" height="48" fill="black"/>
                    <rect x="6" y="0" width="1" height="48" fill="black"/>
                    <rect x="10" y="0" width="3" height="48" fill="black"/>
                    <rect x="15" y="0" width="1" height="48" fill="black"/>
                    <rect x="18" y="0" width="2" height="48" fill="black"/>
                    <rect x="22" y="0" width="1" height="48" fill="black"/>
                    <rect x="25" y="0" width="3" height="48" fill="black"/>
                    <rect x="30" y="0" width="2" height="48" fill="black"/>
                    <rect x="34" y="0" width="1" height="48" fill="black"/>
                    <rect x="37" y="0" width="2" height="48" fill="black"/>
                    <rect x="41" y="0" width="3" height="48" fill="black"/>
                    <rect x="46" y="0" width="1" height="48" fill="black"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold mt-2">Sale {completedTransaction.invoiceNo.replace('CS', '')}</p>
              </div>

              {/* Thank you message */}
              <div className="mt-4 text-center text-sm text-gray-600">
                Thank You For Shopping With Us. Please Come Again
              </div>

              {/* Print Button */}
              <div className="mt-6 text-center print-button">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    setShowReceipt(false);
                    setBillingItems([]);
                    setReceivedAmount('');
                    setCompletedTransaction(null);
                  }}
                  className="ml-3 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b bg-orange-500">
              <h2 className="text-lg font-semibold text-white">Add Customer</h2>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-white hover:bg-orange-600 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Upload Image */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                    {newCustomerImage ? (
                      <img src={newCustomerImage} alt="Customer" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-orange-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-orange-600">
                    <Edit className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewCustomerImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerFirstName}
                    onChange={(e) => setNewCustomerFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerLastName}
                    onChange={(e) => setNewCustomerLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter last name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerCity}
                    onChange={(e) => setNewCustomerCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter city"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerState}
                    onChange={(e) => setNewCustomerState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter state"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerCountry}
                    onChange={(e) => setNewCustomerCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter country"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomerPostalCode}
                    onChange={(e) => setNewCustomerPostalCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter postal code"
                  />
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNewCustomerStatus(!newCustomerStatus)}
                      className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {newCustomerStatus ? 'Active' : 'Inactive'}
                      </span>
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${
                        newCustomerStatus ? 'bg-green-600' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          newCustomerStatus ? 'translate-x-5' : 'translate-x-0'
                        }`}></div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newCustomerFirstName || !newCustomerLastName || !newCustomerEmail || !newCustomerPhone) {
                      alert('Please fill in all required fields!');
                      return;
                    }
                    // Here you would normally save the customer data
                    const fullName = `${newCustomerFirstName} ${newCustomerLastName}`;
                    alert(`Customer "${fullName}" added successfully!`);
                    setCustomerName(fullName);
                    setShowAddCustomerModal(false);
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
