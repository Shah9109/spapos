import { useMemo, useState } from 'react';
import { Building2, Plus, Search, ShieldCheck, ShieldX, Trash2 } from 'lucide-react';
import { useAppStore } from '../lib/store';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subdomain: '',
  address: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  planId: '',
};

export const SuperAdminSpas = () => {
  const spas = useAppStore((state) => state.spas);
  const plans = useAppStore((state) => state.plans);
  const createSpa = useAppStore((state) => state.createSpa);
  const updateSpaStatus = useAppStore((state) => state.updateSpaStatus);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    ...emptyForm,
    planId: plans[0]?.id ?? '',
  });

  const filteredSpas = useMemo(
    () =>
      spas.filter((spa) =>
        `${spa.name} ${spa.email} ${spa.subdomain} ${spa.status}`.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm, spas],
  );

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    createSpa(formData);
    setFormData({ ...emptyForm, planId: plans[0]?.id ?? '' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spas & Tenants</h1>
          <p className="mt-1 text-gray-500">Create, activate, suspend, and monitor all tenant accounts.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Create Spa
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search spa, email, or status..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="text-sm text-gray-500">{filteredSpas.length} tenant(s)</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3">Spa</th>
                <th className="px-6 py-3">Subdomain</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSpas.map((spa) => {
                const plan = plans.find((item) => item.id === spa.settings.billing.currentPlanId);

                return (
                  <tr key={spa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{spa.name}</div>
                          <div className="text-sm text-gray-500">{spa.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{spa.subdomain}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{plan?.name ?? 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          spa.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : spa.status === 'TRIAL'
                              ? 'bg-sky-100 text-sky-800'
                            : spa.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {spa.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {spa.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => updateSpaStatus(spa.id, 'ACTIVE')}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Approve & Activate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => updateSpaStatus(spa.id, spa.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {spa.status === 'ACTIVE' ? <ShieldX className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                          {spa.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSpaStatus(spa.id, 'BLOCKED')}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Block
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSpas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No spa tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Create New Spa</h2>
            </div>
            <form onSubmit={submitForm} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  required
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Spa name"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Spa email"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  value={formData.phone}
                  onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Spa phone"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  value={formData.subdomain}
                  onChange={(event) => setFormData((current) => ({ ...current, subdomain: event.target.value.toLowerCase() }))}
                  placeholder="Subdomain"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  value={formData.ownerName}
                  onChange={(event) => setFormData((current) => ({ ...current, ownerName: event.target.value }))}
                  placeholder="Owner name"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  value={formData.ownerEmail}
                  onChange={(event) => setFormData((current) => ({ ...current, ownerEmail: event.target.value }))}
                  placeholder="Owner email"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  value={formData.ownerPhone}
                  onChange={(event) => setFormData((current) => ({ ...current, ownerPhone: event.target.value }))}
                  placeholder="Owner phone"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={formData.planId}
                  onChange={(event) => setFormData((current) => ({ ...current, planId: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                required
                value={formData.address}
                onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))}
                rows={3}
                placeholder="Spa address"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
                  Save Spa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
