import { useMemo, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Download, KeyRound, Laptop2, Pencil, Plus, Search } from 'lucide-react';
import { useAppStore } from '../lib/store';

type LicenseFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRING' | 'EXPIRED';

const getDefaultExpiryDate = () =>
  new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const getDaysUntilExpiry = (expiresAt: string) => {
  const today = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const SuperAdminLicenses = () => {
  const licenses = useAppStore((state) => state.licenses);
  const spas = useAppStore((state) => state.spas);
  const createLicense = useAppStore((state) => state.createLicense);
  const toggleLicense = useAppStore((state) => state.toggleLicense);
  const updateLicense = useAppStore((state) => state.updateLicense);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLicenseId, setEditingLicenseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<LicenseFilter>('ALL');
  const [formData, setFormData] = useState(() => ({
    spaId: spas[0]?.id ?? '',
    deviceName: 'Front Desk POS',
    deviceId: '',
    isActive: true,
    expiresAt: getDefaultExpiryDate(),
  }));

  const licenseRows = useMemo(
    () =>
      licenses
        .map((license) => {
          const spaName = spas.find((spa) => spa.id === license.spaId)?.name ?? 'Unknown Spa';
          const daysUntilExpiry = getDaysUntilExpiry(license.expiresAt);
          const lifecycle =
            daysUntilExpiry < 0 ? 'EXPIRED' : daysUntilExpiry <= 14 ? 'EXPIRING' : license.isActive ? 'ACTIVE' : 'INACTIVE';

          return {
            ...license,
            spaName,
            daysUntilExpiry,
            lifecycle,
          };
        })
        .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)),
    [licenses, spas],
  );

  const filteredLicenses = useMemo(
    () =>
      licenseRows.filter((license) => {
        const matchesSearch = `${license.key} ${license.spaName} ${license.deviceName} ${license.deviceId}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        const matchesFilter =
          filter === 'ALL' ||
          (filter === 'ACTIVE' && license.isActive && license.lifecycle !== 'EXPIRED') ||
          (filter === 'INACTIVE' && !license.isActive && license.lifecycle !== 'EXPIRED') ||
          (filter === 'EXPIRING' && license.lifecycle === 'EXPIRING') ||
          (filter === 'EXPIRED' && license.lifecycle === 'EXPIRED');

        return matchesSearch && matchesFilter;
      }),
    [filter, licenseRows, searchTerm],
  );

  const summary = useMemo(
    () => ({
      active: licenseRows.filter((license) => license.isActive && license.lifecycle !== 'EXPIRED').length,
      expiring: licenseRows.filter((license) => license.lifecycle === 'EXPIRING').length,
      expired: licenseRows.filter((license) => license.lifecycle === 'EXPIRED').length,
      inactive: licenseRows.filter((license) => !license.isActive && license.lifecycle !== 'EXPIRED').length,
    }),
    [licenseRows],
  );

  const editingLicense = editingLicenseId ? licenseRows.find((license) => license.id === editingLicenseId) : null;

  const resetForm = () => {
    setFormData({
      spaId: spas[0]?.id ?? '',
      deviceName: 'Front Desk POS',
      deviceId: '',
      isActive: true,
      expiresAt: getDefaultExpiryDate(),
    });
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createLicense(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingLicenseId) {
      return;
    }

    updateLicense(editingLicenseId, formData);
    setEditingLicenseId(null);
    resetForm();
  };

  const exportLicensesCsv = () => {
    const rows = [
      ['License Key', 'Spa', 'Device Name', 'Device ID', 'State', 'Expiry Date'],
      ...filteredLicenses.map((license) => [
        license.key,
        license.spaName,
        license.deviceName,
        license.deviceId,
        license.lifecycle,
        license.expiresAt,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spapos-licenses.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const startEditing = (licenseId: string) => {
    const target = licenseRows.find((license) => license.id === licenseId);
    if (!target) {
      return;
    }

    setFormData({
      spaId: target.spaId,
      deviceName: target.deviceName,
      deviceId: target.deviceId,
      isActive: target.isActive,
      expiresAt: target.expiresAt,
    });
    setEditingLicenseId(licenseId);
  };

  const getLifecycleBadge = (lifecycle: string) => {
    if (lifecycle === 'EXPIRED') {
      return 'bg-red-100 text-red-800';
    }
    if (lifecycle === 'EXPIRING') {
      return 'bg-amber-100 text-amber-800';
    }
    if (lifecycle === 'ACTIVE') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">License Management</h1>
          <p className="mt-1 text-gray-500">Generate, bind, filter, and manage device licenses for every spa tenant.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={exportLicensesCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Generate License
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Active</div>
          <div className="mt-2 text-2xl font-bold text-green-700">{summary.active}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Expiring Soon</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{summary.expiring}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Expired</div>
          <div className="mt-2 text-2xl font-bold text-red-700">{summary.expired}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Inactive</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{summary.inactive}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search license, spa, or device..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as LicenseFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Licenses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRING">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredLicenses.map((license) => (
            <div key={license.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-indigo-50 p-3 text-indigo-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getLifecycleBadge(license.lifecycle)}`}>
                  {license.lifecycle}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="font-mono text-sm font-semibold text-gray-900">{license.key}</div>
                <div className="text-sm text-gray-600">{license.spaName}</div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Laptop2 className="h-4 w-4" />
                  {license.deviceName}
                </div>
                <div className="text-sm text-gray-500">Device ID: {license.deviceId || 'Not bound'}</div>
                <div className="text-sm text-gray-500">
                  Expires: {license.expiresAt}
                  {license.daysUntilExpiry >= 0 ? ` (${license.daysUntilExpiry} day${license.daysUntilExpiry === 1 ? '' : 's'})` : ' (expired)'}
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleLicense(license.id)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {license.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => startEditing(license.id)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredLicenses.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
              No licenses match the current search and filter.
            </div>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Generate New License</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <LicenseForm
                spas={spas}
                formData={formData}
                setFormData={setFormData}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
                  Create License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Edit License</h2>
              <p className="mt-1 text-sm text-gray-500">{editingLicense.key}</p>
            </div>
            <form onSubmit={handleEdit} className="space-y-4 p-6">
              <LicenseForm
                spas={spas}
                formData={formData}
                setFormData={setFormData}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLicenseId(null);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LicenseForm = ({
  spas,
  formData,
  setFormData,
}: {
  spas: { id: string; name: string }[];
  formData: {
    spaId: string;
    deviceName: string;
    deviceId: string;
    isActive: boolean;
    expiresAt: string;
  };
  setFormData: Dispatch<
    SetStateAction<{
      spaId: string;
      deviceName: string;
      deviceId: string;
      isActive: boolean;
      expiresAt: string;
    }>
  >;
}) => (
  <>
    <select
      value={formData.spaId}
      onChange={(event) => setFormData((current) => ({ ...current, spaId: event.target.value }))}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
    >
      {spas.map((spa) => (
        <option key={spa.id} value={spa.id}>
          {spa.name}
        </option>
      ))}
    </select>
    <input
      required
      value={formData.deviceName}
      onChange={(event) => setFormData((current) => ({ ...current, deviceName: event.target.value }))}
      placeholder="Device name"
      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
    />
    <input
      value={formData.deviceId}
      onChange={(event) => setFormData((current) => ({ ...current, deviceId: event.target.value }))}
      placeholder="Device ID"
      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
    />
    <input
      type="date"
      value={formData.expiresAt}
      onChange={(event) => setFormData((current) => ({ ...current, expiresAt: event.target.value }))}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
    />
    <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={formData.isActive}
        onChange={(event) => setFormData((current) => ({ ...current, isActive: event.target.checked }))}
      />
      Activate immediately
    </label>
  </>
);
