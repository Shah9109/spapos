import { useMemo, useState } from 'react';
import { DollarSign, Download, Plus, Search, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react';
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

type FinancePeriodFilter = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR';

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const Finance = () => {
  const spa = useCurrentSpa();
  const currencySymbol = currencySymbols[spa?.settings?.currency || 'INR'] || '₹';
  const expenses = useAppStore((state) => state.expenses);
  const invoices = useAppStore((state) => state.invoices);
  const addExpense = useAppStore((state) => state.addExpense);
  const deleteExpense = useAppStore((state) => state.deleteExpense);
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'PROFIT_LOSS' | 'GST_REPORTS'>('EXPENSES');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ category: 'Supplies', amount: 0, description: '', method: 'CASH', date: new Date().toISOString().split('T')[0] });
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<FinancePeriodFilter>('ALL');

  const spaId = spa?.id ?? '';
  const spaExpenses = useMemo(() => expenses.filter((expense) => expense.spaId === spaId), [expenses, spaId]);
  const spaIncome = useMemo(
    () => invoices.filter((invoice) => invoice.spaId === spaId && invoice.status === 'PAID'),
    [invoices, spaId],
  );

  const handleAddExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addExpense({
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      method: formData.method as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'UPI',
      date: formData.date,
    });
    setIsModalOpen(false);
    setFormData({ category: 'Supplies', amount: 0, description: '', method: 'CASH', date: new Date().toISOString().split('T')[0] });
  };

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = getMonthKey(now);
    const previousMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const currentYear = String(now.getFullYear());

    return spaExpenses.filter((expense) => {
      const matchesSearch =
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase());

      const expenseDate = new Date(expense.date);
      const expenseMonth = getMonthKey(expenseDate);
      const expenseYear = String(expenseDate.getFullYear());
      const matchesPeriod =
        periodFilter === 'ALL' ||
        (periodFilter === 'THIS_MONTH' && expenseMonth === currentMonth) ||
        (periodFilter === 'LAST_MONTH' && expenseMonth === previousMonth) ||
        (periodFilter === 'THIS_YEAR' && expenseYear === currentYear);

      return matchesSearch && matchesPeriod;
    });
  }, [periodFilter, searchTerm, spaExpenses]);

  const filteredIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = getMonthKey(now);
    const previousMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const currentYear = String(now.getFullYear());

    return spaIncome.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      const invoiceMonth = getMonthKey(invoiceDate);
      const invoiceYear = String(invoiceDate.getFullYear());
      return (
        periodFilter === 'ALL' ||
        (periodFilter === 'THIS_MONTH' && invoiceMonth === currentMonth) ||
        (periodFilter === 'LAST_MONTH' && invoiceMonth === previousMonth) ||
        (periodFilter === 'THIS_YEAR' && invoiceYear === currentYear)
      );
    });
  }, [periodFilter, spaIncome]);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = filteredIncome.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalGst = filteredIncome.reduce((sum, invoice) => sum + invoice.taxAmount, 0);
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((expense) => {
      map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const exportExpensesCsv = () => {
    const rows = [
      ['Date', 'Category', 'Description', 'Method', 'Amount'],
      ...filteredExpenses.map((expense) => [
        expense.date,
        expense.category,
        expense.description,
        expense.method,
        expense.amount.toFixed(2),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-expenses-${spa?.name.toLowerCase().replace(/\s+/g, '-') ?? 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!spa) {
    return <SpaWorkspaceFallback title="Finance unavailable" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance & Accounts</h1>
          <p className="text-gray-500 mt-1">Manage expenses, track profit & loss, and generate tax reports.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={exportExpensesCsv}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Income</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Net Profit</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency((totalIncome - totalExpenses))}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'EXPENSES' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('PROFIT_LOSS')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'PROFIT_LOSS' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Profit & Loss
          </button>
          <button
            onClick={() => setActiveTab('GST_REPORTS')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'GST_REPORTS' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            GST & Tax Reports
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value as FinancePeriodFilter)}
              className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Time</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>
        </div>

        {activeTab === 'EXPENSES' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold">Method</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-500 text-sm">{exp.date}</td>
                    <td className="p-4 font-medium text-gray-900">{exp.category}</td>
                    <td className="p-4 text-gray-600 text-sm">{exp.description}</td>
                    <td className="p-4 text-gray-500 text-sm">{exp.method}</td>
                    <td className="p-4 font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => deleteExpense(exp.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No expenses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'PROFIT_LOSS' ? (
          <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Revenue</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Expenses</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Net Profit</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency((totalIncome - totalExpenses))}</div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-lg font-semibold text-gray-900">Expense Breakdown</div>
              <div className="mt-4 space-y-3">
                {categoryBreakdown.length > 0 ? (
                  categoryBreakdown.map(([category, amount]) => {
                    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    return (
                      <div key={category}>
                        <div className="mb-1 flex justify-between text-sm text-gray-600">
                          <span>{category}</span>
                          <span>{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-primary-600" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500">No expenses in the selected period.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500">Taxable Revenue</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500">Collected GST</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalGst)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500">Filed Period</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">{periodFilter.replace(/_/g, ' ')}</div>
            </div>
            <div className="md:col-span-3 rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3 text-gray-700">
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">GST Summary</span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Tax is derived from paid invoices only. Use this summary to cross-check collected GST before filing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Add New Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({currencySymbol})</label>
                    <input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="Supplies">Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Rent">Rent</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Details about this expense..." />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">Save Expense</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
