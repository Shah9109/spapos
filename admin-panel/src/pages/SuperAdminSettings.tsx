import { useMemo, useState } from 'react';
import type { ElementType, FormEvent } from 'react';
import { Activity, Bell, Download, Lock, Shield, CreditCard, Plus, Trash2, Pencil, Check } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { getPaymentQrUrl } from '../lib/utils';

type AuditFilter = 'ALL' | 'PLATFORM' | 'TENANT';

export const SuperAdminSettings = () => {
  const auditLogs = useAppStore((state) => state.auditLogs);
  const spas = useAppStore((state) => state.spas);
  const licenses = useAppStore((state) => state.licenses);
  const plans = useAppStore((state) => state.plans);
  const platformSettings = useAppStore((state) => state.platformSettings);
  const updatePlatformSettings = useAppStore((state) => state.updatePlatformSettings);

  // Payment configuration CRUD states
  const paymentMethods = useAppStore((state) => state.paymentMethods || []);
  const createPaymentMethod = useAppStore((state) => state.createPaymentMethod);
  const updatePaymentMethod = useAppStore((state) => state.updatePaymentMethod);
  const deletePaymentMethod = useAppStore((state) => state.deletePaymentMethod);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingPayId, setEditingPayId] = useState<string | null>(null);
  const [payFormData, setPayFormData] = useState({
    label: '',
    upiId: '',
    qrCodeUrl: '',
    isActive: true,
  });

  const resetPayForm = () => {
    setPayFormData({
      label: '',
      upiId: '',
      qrCodeUrl: '',
      isActive: true,
    });
    setEditingPayId(null);
    setIsPayModalOpen(false);
  };

  const handleEditPay = (pm: any) => {
    setEditingPayId(pm.id);
    setPayFormData({
      label: pm.label,
      upiId: pm.upiId,
      qrCodeUrl: pm.qrCodeUrl,
      isActive: pm.isActive,
    });
    setIsPayModalOpen(true);
  };

  const handleSavePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayId) {
      updatePaymentMethod(editingPayId, payFormData);
    } else {
      createPaymentMethod(payFormData);
    }
    resetPayForm();
  };

  const handleToggleActivePay = (id: string, currentStatus: boolean) => {
    if (!currentStatus) {
      paymentMethods.forEach(pm => {
        if (pm.id !== id && pm.isActive) {
          updatePaymentMethod(pm.id, { isActive: false });
        }
      });
    }
    updatePaymentMethod(id, { isActive: !currentStatus });
  };

  const [auditFilter, setAuditFilter] = useState<AuditFilter>('ALL');
  const [saveMessage, setSaveMessage] = useState('');
  const [formState, setFormState] = useState(platformSettings);

  const activeSpas = spas.filter((spa) => spa.status === 'ACTIVE').length;
  const activeLicenses = licenses.filter((license) => license.isActive).length;
  const activePlans = plans.filter((plan) => plan.isActive).length;
  const pendingSpas = spas.filter((spa) => spa.status === 'PENDING' || spa.status === 'TRIAL').length;

  const filteredAuditLogs = useMemo(
    () =>
      auditLogs.filter((log) => {
        if (auditFilter === 'PLATFORM') {
          return !log.spaId;
        }
        if (auditFilter === 'TENANT') {
          return Boolean(log.spaId);
        }
        return true;
      }),
    [auditFilter, auditLogs],
  );

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updatePlatformSettings(formState);
    setSaveMessage('Platform settings saved.');
    window.setTimeout(() => setSaveMessage(''), 2500);
  };

  const exportAuditCsv = () => {
    const rows = [
      ['Time', 'Actor', 'Scope', 'Action'],
      ...filteredAuditLogs.map((log) => [
        new Date(log.createdAt).toLocaleString(),
        log.actor,
        log.spaId ?? 'Platform',
        log.action,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spapos-audit-trail.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-gray-500">Persisted platform controls, operational health, and audit visibility.</p>
        </div>
        <button
          type="button"
          onClick={exportAuditCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export Audit Logs
        </button>
      </div>

      {saveMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {saveMessage}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard icon={Shield} title="Tenant Health" value={String(activeSpas)} subtitle="Active tenants able to transact" iconClassName="text-primary-600" />
        <MetricCard icon={Lock} title="Device Licenses" value={String(activeLicenses)} subtitle="Currently active device bindings" iconClassName="text-indigo-600" />
        <MetricCard icon={Bell} title="Published Plans" value={String(activePlans)} subtitle="Plans available for assignment" iconClassName="text-emerald-600" />
        <MetricCard icon={Activity} title="Pending Review" value={String(pendingSpas)} subtitle="Pending or trial tenants" iconClassName="text-amber-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <form onSubmit={saveSettings} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Platform Controls</h2>
            <p className="mt-1 text-sm text-gray-500">These values are persisted in the shared application store.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ToggleRow
              label="Maintenance Mode"
              description="Disable normal platform access during maintenance windows."
              checked={formState.maintenanceMode}
              onChange={(checked) => setFormState((current) => ({ ...current, maintenanceMode: checked }))}
            />
            <ToggleRow
              label="Allow New Trials"
              description="Enable self-serve signup and trial tenant creation."
              checked={formState.allowNewTrials}
              onChange={(checked) => setFormState((current) => ({ ...current, allowNewTrials: checked }))}
            />
            <ToggleRow
              label="Auto-Approve Payments"
              description="Automatically mark platform payments as verified."
              checked={formState.autoApprovePayments}
              onChange={(checked) => setFormState((current) => ({ ...current, autoApprovePayments: checked }))}
            />
            <ToggleRow
              label="Enforce MFA for Admins"
              description="Require stronger login controls for super-admin users."
              checked={formState.enforceMfaForAdmins}
              onChange={(checked) => setFormState((current) => ({ ...current, enforceMfaForAdmins: checked }))}
            />
            <ToggleRow
              label="Notify on Tenant Signup"
              description="Create alerts when a new tenant registers."
              checked={formState.notifyOnTenantSignup}
              onChange={(checked) => setFormState((current) => ({ ...current, notifyOnTenantSignup: checked }))}
            />
            <ToggleRow
              label="Notify on License Expiry"
              description="Create alerts when licenses are close to expiry."
              checked={formState.notifyOnLicenseExpiry}
              onChange={(checked) => setFormState((current) => ({ ...current, notifyOnLicenseExpiry: checked }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Support Email</label>
              <input
                type="email"
                value={formState.supportEmail}
                onChange={(event) => setFormState((current) => ({ ...current, supportEmail: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Backup Frequency</label>
              <select
                value={formState.backupFrequency}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    backupFrequency: event.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Incident Webhook</label>
              <input
                type="text"
                value={formState.incidentWebhook}
                onChange={(event) => setFormState((current) => ({ ...current, incidentWebhook: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://hooks.example.com/..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Audit Retention (days)</label>
              <input
                min="30"
                type="number"
                value={formState.auditRetentionDays}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, auditRetentionDays: Number(event.target.value) }))
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700">
              Save Platform Settings
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
              <select
                value={auditFilter}
                onChange={(event) => setAuditFilter(event.target.value as AuditFilter)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">All Activity</option>
                <option value="PLATFORM">Platform Only</option>
                <option value="TENANT">Tenant Events</option>
              </select>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredAuditLogs.slice(0, 12).map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="rounded-full bg-gray-100 p-2 text-gray-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900">{log.action}</div>
                    <div className="text-sm text-gray-500">
                      {log.actor} | {log.spaId ?? 'Platform'} | {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {filteredAuditLogs.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-500">No audit logs match the selected scope.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Security Defaults</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>HTTP-only sessions</span>
                <span className="font-semibold text-emerald-700">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>Tenant isolation policy</span>
                <span className="font-semibold text-emerald-700">Active</span>
              </div>
              <div className="flex justify-between">
                <span>MFA for super admins</span>
                <span className={`font-semibold ${formState.enforceMfaForAdmins ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {formState.enforceMfaForAdmins ? 'Required' : 'Optional'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Maintenance mode</span>
                <span className={`font-semibold ${formState.maintenanceMode ? 'text-red-700' : 'text-emerald-700'}`}>
                  {formState.maintenanceMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-650" /> UPI Accounts (Checkout)
              </h2>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white border-none text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add UPI
              </button>
            </div>
            
            <div className="space-y-3">
              {paymentMethods.map(pm => (
                <div key={pm.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                      <img
                        src={getPaymentQrUrl(pm.qrCodeUrl, pm.upiId, 100, 'INR')}
                        alt="QR Code Preview"
                        className="w-10 h-10 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{pm.label}</span>
                        {pm.isActive && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 animate-pulse" /> Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-gray-600 mt-0.5">{pm.upiId}</div>
                      {pm.qrCodeUrl && (
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-xs">QR Link: {pm.qrCodeUrl}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActivePay(pm.id, pm.isActive)}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                        pm.isActive
                          ? 'bg-amber-50 border-amber-250 text-amber-705'
                          : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pm.isActive ? 'Deactivate' : 'Set Active'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditPay(pm)}
                      className="p-1.5 text-gray-550 hover:text-primary-600 transition-colors border border-gray-200 bg-white rounded-lg cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {pm.id !== 'pay-default' && (
                      <button
                        type="button"
                        onClick={() => deletePaymentMethod(pm.id)}
                        className="p-1.5 text-gray-550 hover:text-red-655 transition-colors border border-gray-200 bg-white rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {paymentMethods.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-500 font-medium border border-dashed border-gray-200 rounded-xl">
                  No payment methods configured. Standard fallback will be used.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method CRUD Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in text-gray-800">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900">{editingPayId ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
            </div>
            <form onSubmit={handleSavePay} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-750 mb-1">Account Label</label>
                <input
                  required
                  type="text"
                  value={payFormData.label}
                  onChange={(e) => setPayFormData(c => ({ ...c, label: e.target.value }))}
                  placeholder="e.g. Primary HDFC, Backup GPay"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-755 mb-1">UPI Address (UPI ID)</label>
                <input
                  required
                  type="text"
                  value={payFormData.upiId}
                  onChange={(e) => setPayFormData(c => ({ ...c, upiId: e.target.value }))}
                  placeholder="e.g. merchant@icici"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-755 mb-1">QR Code Image URL (Optional)</label>
                <input
                  type="url"
                  value={payFormData.qrCodeUrl}
                  onChange={(e) => setPayFormData(c => ({ ...c, qrCodeUrl: e.target.value }))}
                  placeholder="https://example.com/qr-image.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <span className="text-[10px] text-gray-400 mt-1 block leading-tight">
                  If left blank, a dynamic payment QR code will be generated automatically using your UPI ID.
                </span>

                {/* Live QR Image Preview */}
                {payFormData.upiId && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-150 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Live QR Preview</span>
                    <div className="w-28 h-28 bg-white rounded-lg border border-gray-250 flex items-center justify-center overflow-hidden p-1 shadow-sm shrink-0">
                      <img
                        src={getPaymentQrUrl(payFormData.qrCodeUrl, payFormData.upiId, 100, 'INR')}
                        alt="Live QR Preview"
                        className="w-24 h-24 object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                            `upi://pay?pa=${payFormData.upiId}&pn=SpaPOS&am=100&cu=INR`
                          )}`;
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="payActive"
                  checked={payFormData.isActive}
                  onChange={(e) => setPayFormData(c => ({ ...c, isActive: e.target.checked }))}
                  className="h-4 w-4 text-primary-650 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="payActive" className="text-sm font-semibold text-gray-750 select-none">Set as active payment method</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetPayForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-750 hover:bg-gray-50 border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-5 py-2 rounded-lg cursor-pointer border-none"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  iconClassName,
}: {
  icon: ElementType;
  title: string;
  value: string;
  subtitle: string;
  iconClassName: string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <Icon className={`h-8 w-8 ${iconClassName}`} />
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
    <p className="mt-3 text-sm text-gray-500">{subtitle}</p>
  </div>
);

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="rounded-xl border border-gray-200 p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="mt-1 text-sm text-gray-500">{description}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </div>
  </label>
);
