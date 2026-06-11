import { useMemo, useState } from 'react';
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import type { PlanType } from '../lib/store';
import { formatCurrency } from '../lib/utils';

const defaultForm = {
  name: '',
  type: 'BASIC' as PlanType,
  monthlyPrice: 0,
  yearlyPrice: 0,
  trialDays: 14,
  maxOnlineSpaceGB: 5,
  features: '',
  isActive: true,
};

export const SuperAdminPlans = () => {
  const plans = useAppStore((state) => state.plans);
  const spas = useAppStore((state) => state.spas);
  const createPlan = useAppStore((state) => state.createPlan);
  const updatePlan = useAppStore((state) => state.updatePlan);
  const deletePlan = useAppStore((state) => state.deletePlan);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  const usageCounts = useMemo(() => {
    return plans.reduce<Record<string, number>>((accumulator, plan) => {
      accumulator[plan.id] = spas.filter((spa) => spa.settings.billing.currentPlanId === plan.id).length;
      return accumulator;
    }, {});
  }, [plans, spas]);

  const resetModal = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEdit = (planId: string) => {
    const plan = plans.find((item) => item.id === planId);
    if (!plan) {
      return;
    }

    setEditingId(planId);
    setFormData({
      name: plan.name,
      type: plan.type,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      trialDays: plan.trialDays,
      maxOnlineSpaceGB: plan.maxOnlineSpaceGB || 0,
      features: plan.features.join(', '),
      isActive: plan.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: formData.name,
      type: formData.type,
      monthlyPrice: Number(formData.monthlyPrice),
      yearlyPrice: Number(formData.yearlyPrice),
      trialDays: Number(formData.trialDays),
      maxOnlineSpaceGB: Number(formData.maxOnlineSpaceGB),
      features: formData.features
        .split(',')
        .map((feature) => feature.trim())
        .filter(Boolean),
      isActive: formData.isActive,
    };

    if (editingId) {
      updatePlan(editingId, payload);
    } else {
      createPlan(payload);
    }

    resetModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
          <p className="mt-1 text-gray-500">Manage SaaS pricing, trials, and tenant plan assignment.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  <CreditCard className="h-3.5 w-3.5" />
                  {plan.type}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{usageCounts[plan.id] ?? 0} spa(s) assigned</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Monthly</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(plan.monthlyPrice)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Yearly</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(plan.yearlyPrice)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Trial</div>
                <div className="text-md font-semibold text-gray-800">{plan.trialDays} days</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Cloud Storage Limit</div>
                <div className="text-md font-semibold text-gray-800">{plan.maxOnlineSpaceGB ?? 0} GB</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <div key={feature} className="text-sm text-gray-600">
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleEdit(plan.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                disabled={(usageCounts[plan.id] ?? 0) > 0}
                onClick={() => deletePlan(plan.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Plan' : 'Create Plan'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  required
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Plan name"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={formData.type}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, type: event.target.value as PlanType }))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="BASIC">Basic</option>
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
                <input
                  required
                  min="0"
                  type="number"
                  value={formData.monthlyPrice}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, monthlyPrice: Number(event.target.value) }))
                  }
                  placeholder="Monthly price"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  min="0"
                  type="number"
                  value={formData.yearlyPrice}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, yearlyPrice: Number(event.target.value) }))
                  }
                  placeholder="Yearly price"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  min="0"
                  type="number"
                  value={formData.trialDays}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, trialDays: Number(event.target.value) }))
                  }
                  placeholder="Trial days"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  required
                  min="0"
                  type="number"
                  value={formData.maxOnlineSpaceGB}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, maxOnlineSpaceGB: Number(event.target.value) }))
                  }
                  placeholder="Max Cloud Space (GB)"
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(event) => setFormData((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  Plan is active
                </label>
              </div>
              <textarea
                rows={4}
                value={formData.features}
                onChange={(event) => setFormData((current) => ({ ...current, features: event.target.value }))}
                placeholder="Comma separated feature list"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
