import { useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Printer,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useAppStore, useCurrentSpa } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';

const currencySymbols: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
};

type InvoiceStatusFilter = 'ALL' | 'PAID' | 'PENDING' | 'REFUNDED';
type InvoicePeriodFilter = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR';

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const Invoices = () => {
  const spa = useCurrentSpa();
  const currencySymbol = currencySymbols[spa?.settings?.currency || 'INR'] || '₹';
  const invoices = useAppStore((state) => state.invoices);
  const createInvoice = useAppStore((state) => state.createInvoice);
  const [searchTerm, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    amount: 0,
    status: 'PAID' as 'PAID' | 'PENDING' | 'REFUNDED',
    method: 'CASH' as 'CASH' | 'CARD' | 'UPI' | 'WALLET',
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('ALL');
  const [periodFilter, setPeriodFilter] = useState<InvoicePeriodFilter>('ALL');

  const spaId = spa?.id ?? '';
  const spaInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.spaId === spaId),
    [invoices, spaId],
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
            <XCircle className="w-3 h-3" /> Refunded
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const handleAddInvoice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(formData.amount);
    const taxAmount = formData.status === 'REFUNDED' ? 0 : Number((amount * 0.18).toFixed(2));

    createInvoice({
      customerName: formData.customer || 'Walk-in Customer',
      items: [
        {
          id: `manual-${Date.now()}`,
          itemType: 'SERVICE',
          itemId: 'manual-entry',
          name: 'Manual Invoice Entry',
          quantity: 1,
          unitPrice: amount,
          totalPrice: amount,
        },
      ],
      subtotal: amount,
      discount: 0,
      taxAmount,
      totalAmount: amount + taxAmount,
      status: formData.status,
      paymentMethod: formData.method,
    });

    setIsModalOpen(false);
    setFormData({ customer: '', amount: 0, status: 'PAID', method: 'CASH' });
  };

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const currentMonth = getMonthKey(now);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = getMonthKey(previousMonthDate);
    const currentYear = String(now.getFullYear());

    return spaInvoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;

      const invoiceDate = new Date(invoice.createdAt);
      const invoiceMonth = getMonthKey(invoiceDate);
      const invoiceYear = String(invoiceDate.getFullYear());
      const matchesPeriod =
        periodFilter === 'ALL' ||
        (periodFilter === 'THIS_MONTH' && invoiceMonth === currentMonth) ||
        (periodFilter === 'LAST_MONTH' && invoiceMonth === previousMonth) ||
        (periodFilter === 'THIS_YEAR' && invoiceYear === currentYear);

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [periodFilter, searchTerm, spaInvoices, statusFilter]);

  const invoiceSummary = useMemo(() => {
    const paid = filteredInvoices.filter((invoice) => invoice.status === 'PAID');
    const pending = filteredInvoices.filter((invoice) => invoice.status === 'PENDING');
    const refunded = filteredInvoices.filter((invoice) => invoice.status === 'REFUNDED');

    return {
      totalAmount: filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      refundedCount: refunded.length,
    };
  }, [filteredInvoices]);

  const selectedInvoice = spaInvoices.find((invoice) => invoice.id === selectedInvoiceId);

  const downloadInvoice = (invoiceId: string) => {
    const invoice = spaInvoices.find((item) => item.id === invoiceId);
    if (!invoice) {
      return;
    }

    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportInvoicesCsv = () => {
    const rows = [
      ['Invoice Number', 'Customer', 'Date', 'Subtotal', 'Tax', 'Total', 'Status', 'Payment Method'],
      ...filteredInvoices.map((invoice) => [
        invoice.invoiceNumber,
        invoice.customerName,
        new Date(invoice.createdAt).toLocaleDateString(),
        invoice.subtotal.toFixed(2),
        invoice.taxAmount.toFixed(2),
        invoice.totalAmount.toFixed(2),
        invoice.status,
        invoice.paymentMethod,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-${spa?.name.toLowerCase().replace(/\s+/g, '-') ?? 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printInvoice = (invoiceId: string) => {
    const invoice = spaInvoices.find((item) => item.id === invoiceId);
    if (!invoice) {
      return;
    }

    const format = spa?.settings.billing.invoiceFormat || 'A4';
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      return;
    }

    if (format === 'THERMAL') {
      const rows = invoice.items
        .map(
          (item) => `
            <tr>
              <td style="padding: 4px 0; border-bottom: 1px dashed #ccc; text-align: left;">${item.name}</td>
              <td style="padding: 4px 0; border-bottom: 1px dashed #ccc; text-align: center;">${formatCurrency(item.unitPrice)}</td>
              <td style="padding: 4px 0; border-bottom: 1px dashed #ccc; text-align: center;">${String(item.quantity).padStart(2, '0')}</td>
              <td style="padding: 4px 0; border-bottom: 1px dashed #ccc; text-align: right;">${formatCurrency(item.totalPrice)}</td>
            </tr>`,
        )
        .join('');

      const cgst = invoice.taxAmount / 2;
      const sgst = invoice.taxAmount / 2;

      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; max-width: 300px; margin: 0 auto; padding: 20px; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .logo { width: 50px; height: 50px; margin: 0 auto 10px; display: block; border-radius: 50%; background: #000; color: #fff; line-height: 50px; text-align: center; font-size: 24px; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
              th { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; text-align: left; }
              .summary-row { display: flex; justify-content: space-between; margin: 4px 0; }
              .summary-group { margin-left: auto; width: 60%; }
              .footer { margin-top: 20px; text-align: center; color: #555; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="logo">W</div>
            <div class="text-center font-bold" style="font-size: 16px;">${spa?.name?.toUpperCase() ?? 'SPA POS'}</div>
            <div class="text-center" style="margin-bottom: 15px;">${spa?.address ?? 'Spa Address'}</div>
            
            <div class="text-center">------------- RECEIPT -------------</div>
            
            <div style="margin: 10px 0;">
              <div class="summary-row">
                <span>Name: ${invoice.customerName.toUpperCase()}</span>
                <span>Invoice No: ${invoice.invoiceNumber.replace('INV-', '')}</span>
              </div>
              <div class="summary-row">
                <span></span>
                <span>Date: ${new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Price</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <div class="summary-group">
              <div class="summary-row">
                <span>Sub-Total:</span>
                <span>${formatCurrency(invoice.subtotal)}</span>
              </div>
              <div class="summary-row">
                <span>CGST:</span>
                <span class="text-right">2.5%<br/>${formatCurrency(cgst)}</span>
              </div>
              <div class="summary-row">
                <span>SGST:</span>
                <span class="text-right">2.5%<br/>${formatCurrency(sgst)}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            <div class="summary-row font-bold" style="font-size: 14px;">
              <span>Mode: ${invoice.paymentMethod === 'CASH' ? 'Cash' : invoice.paymentMethod}</span>
              <span>Total: ${formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div class="divider"></div>

            <div class="footer">
              <p>**SAVE PAPER SAVE NATURE !!</p>
              <p>YOU CAN NOW CALL US ON 1800 226344 (TOLL-FREE) FOR QUERIES/COMPLAINTS.</p>
              <p>Time: ${new Date(invoice.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
            </div>
            <div class="divider"></div>
          </body>
        </html>
      `);
    } else {
      const rows = invoice.items
        .map(
          (item) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.name}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.unitPrice)}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.totalPrice)}</td>
            </tr>`,
        )
        .join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>${invoice.invoiceNumber}</title>
          </head>
          <body style="font-family:Arial,sans-serif;padding:32px;color:#111827;">
            <h1 style="margin:0 0 8px;">${spa?.name ?? 'SpaPOS'} Invoice</h1>
            <p style="margin:0 0 4px;"><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
            <p style="margin:0 0 4px;"><strong>Customer:</strong> ${invoice.customerName}</p>
            <p style="margin:0 0 16px;"><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleString()}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <thead>
                <tr>
                  <th style="padding:8px;border-bottom:2px solid #d1d5db;text-align:left;">Item</th>
                  <th style="padding:8px;border-bottom:2px solid #d1d5db;text-align:center;">Qty</th>
                  <th style="padding:8px;border-bottom:2px solid #d1d5db;text-align:right;">Unit</th>
                  <th style="padding:8px;border-bottom:2px solid #d1d5db;text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="max-width:280px;margin-left:auto;">
              <p style="display:flex;justify-content:space-between;"><span>Subtotal</span><strong>${formatCurrency(invoice.subtotal)}</strong></p>
              <p style="display:flex;justify-content:space-between;"><span>Tax</span><strong>${formatCurrency(invoice.taxAmount)}</strong></p>
              <p style="display:flex;justify-content:space-between;"><span>Status</span><strong>${invoice.status}</strong></p>
              <p style="display:flex;justify-content:space-between;font-size:18px;"><span>Total</span><strong>${formatCurrency(invoice.totalAmount)}</strong></p>
            </div>
          </body>
        </html>
      `);
    }
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!spa) {
    return <SpaWorkspaceFallback title="Invoices unavailable" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices & Billing</h1>
          <p className="text-gray-500 mt-1">Manage all your spa invoices, receipts, and refunds.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={exportInvoicesCsv}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <FileText className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Filtered Revenue</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(invoiceSummary.totalAmount)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Paid Invoices</div>
          <div className="mt-2 text-2xl font-bold text-green-700">{invoiceSummary.paidCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Pending Invoices</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{invoiceSummary.pendingCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Refunded Invoices</div>
          <div className="mt-2 text-2xl font-bold text-red-700">{invoiceSummary.refundedCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 p-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as InvoiceStatusFilter)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value as InvoicePeriodFilter)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Time</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Invoice ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="p-4">
                    <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{invoice.customerName}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                  </td>
                  <td className="p-4">{getStatusBadge(invoice.status)}</td>
                  <td className="p-4 text-gray-600 text-sm font-medium">{invoice.paymentMethod}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedInvoiceId(invoice.id)} className="p-1.5 text-gray-500 rounded-lg transition-colors hover:bg-primary-50 hover:text-primary-600" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => printInvoice(invoice.id)} className="p-1.5 text-gray-500 rounded-lg transition-colors hover:bg-green-50 hover:text-green-600" title="Print Invoice">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => downloadInvoice(invoice.id)} className="p-1.5 text-gray-500 rounded-lg transition-colors hover:bg-purple-50 hover:text-purple-600" title="Download Invoice">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No invoices found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-white p-4 text-sm">
          <span className="text-gray-500">
            Showing {filteredInvoices.length} of {spaInvoices.length} invoice(s)
          </span>
          <div className="text-gray-500">Latest first</div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4">
              <h2 className="text-lg font-bold text-gray-800">Create New Invoice</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Walk-in Customer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({currencySymbol})</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PAID' | 'PENDING' | 'REFUNDED' })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="PAID">Paid</option>
                      <option value="PENDING">Pending</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={formData.method}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value as 'CASH' | 'CARD' | 'UPI' | 'WALLET' })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="WALLET">Wallet</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700">
                    Create Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-sm text-gray-500">{selectedInvoice.customerName}</p>
              </div>
              <button onClick={() => setSelectedInvoiceId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="mt-2">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-sm text-gray-500">Payment Method</div>
                  <div className="mt-2 font-semibold text-gray-900">{selectedInvoice.paymentMethod}</div>
                </div>
              </div>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                selectedInvoice.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Detailed items for this Walk-in Customer invoice are stored in Local Disk Storage mode only.
                </div>
              )}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span>{formatCurrency(selectedInvoice.discount)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="mt-2 flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => downloadInvoice(selectedInvoice.id)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => printInvoice(selectedInvoice.id)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
