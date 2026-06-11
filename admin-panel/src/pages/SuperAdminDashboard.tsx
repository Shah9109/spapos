import { Building2, CreditCard, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { formatCurrency } from '../lib/utils';

export const SuperAdminDashboard = () => {
  const spas = useAppStore((state) => state.spas);
  const users = useAppStore((state) => state.users);
  const plans = useAppStore((state) => state.plans);
  const invoices = useAppStore((state) => state.invoices);
  const auditLogs = useAppStore((state) => state.auditLogs);

  const monthlyRevenue = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return invoices
      .filter((invoice) => invoice.status === 'PAID' && invoice.createdAt.startsWith(currentMonth))
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }, [invoices]);

  const activeSpas = spas.filter((spa) => spa.status === 'ACTIVE').length;
  const activeOwners = users.filter((user) => user.role === 'SPA_OWNER' && user.isActive).length;
  const activePlans = plans.filter((plan) => plan.isActive).length;
  const recentSpas = [...spas].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and tenant metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Spas</p>
            <h3 className="text-2xl font-bold text-gray-900">{spas.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Spa Owners</p>
            <h3 className="text-2xl font-bold text-gray-900">{activeOwners}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Plans</p>
            <h3 className="text-2xl font-bold text-gray-900">{activePlans}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Monthly MRR</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyRevenue)}</h3>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Tenant Health</h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-sm text-gray-500">Active Spas</div>
              <div className="text-2xl font-bold text-gray-900">{activeSpas}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-sm text-gray-500">Pending / Trial</div>
              <div className="text-2xl font-bold text-gray-900">
                {spas.filter((spa) => spa.status === 'PENDING' || spa.status === 'TRIAL').length}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-sm text-gray-500">Blocked/Suspended</div>
              <div className="text-2xl font-bold text-gray-900">
                {spas.filter((spa) => spa.status === 'BLOCKED' || spa.status === 'SUSPENDED').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Recent Activity</h2>
          <div className="space-y-4">
            {recentSpas.map((spa) => (
              <div key={spa.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div>
                  <div className="font-semibold text-gray-900">{spa.name}</div>
                  <div className="text-sm text-gray-500">{spa.email}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    spa.status === 'ACTIVE'
                      ? 'bg-green-50 text-green-700'
                      : spa.status === 'TRIAL'
                        ? 'bg-sky-50 text-sky-700'
                        : spa.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                  }`}
                >
                  {spa.status}
                </span>
              </div>
            ))}
            {auditLogs.length > 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                Latest audit: {auditLogs[0].action}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
