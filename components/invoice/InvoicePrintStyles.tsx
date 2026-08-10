'use client';

export default function InvoicePrintStyles() {
  return <style>{`
    @media print {
      nav, header, .no-print { display: none !important; }
      body { background: white; }
      .invoice-print { padding: 20px; }
    }
  `}</style>;
}
