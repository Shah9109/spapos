import { useEffect, useState } from 'react';
import { Bell, Building2, CheckCircle2, Shield, FolderOpen, HardDrive, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useCurrentSpa } from '../lib/store';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';
import { storeDirectoryHandle, getStorageEstimate } from '../lib/localFileStorage';

export const Settings = () => {
  const spa = useCurrentSpa();
  const navigate = useNavigate();
  const updateSpaSettings = useAppStore((state) => state.updateSpaSettings);
  const plans = useAppStore((state) => state.plans);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'NOTIFICATIONS' | 'SECURITY'>('GENERAL');
  const [saveMessage, setSaveMessage] = useState('');
  const [formState, setFormState] = useState(() => spa?.settings);
  const [storageEstimate, setStorageEstimate] = useState<{ usageMB: number; quotaMB: number; percentageUsed: number } | null>(null);

  const currentPlan = plans.find(p => p.id === spa?.settings?.billing?.currentPlanId);
  const maxOnlineSpaceGB = currentPlan?.maxOnlineSpaceGB ?? 5;

  useEffect(() => {
    getStorageEstimate().then(setStorageEstimate);
  }, []);

  useEffect(() => {
    setFormState(spa?.settings);
  }, [spa]);

  const handlePickDirectory = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await storeDirectoryHandle(handle);
      (window as any).currentDirectoryHandle = handle;
      
      setFormState(current => current ? {
        ...current,
        offlineFolderName: handle.name,
        offlineStorageEnabled: true,
      } : current);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to pick directory:', err);
        alert('Failed to select directory: ' + err.message);
      }
    }
  };

  if (!spa || !formState) {
    return <SpaWorkspaceFallback title="Settings unavailable" />;
  }

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    updateSpaSettings(spa.id, formState);
    setSaveMessage('Settings saved successfully.');
    window.setTimeout(() => setSaveMessage(''), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spa Settings</h1>
          <p className="text-gray-500 mt-1">Manage your spa configuration and preferences.</p>
        </div>
      </div>

      {saveMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {saveMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        <div className="w-full md:w-64 border-r border-gray-200 bg-gray-50/50 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'GENERAL' ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Building2 className="w-5 h-5" /> General Info
          </button>
          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'NOTIFICATIONS' ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'SECURITY' ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Shield className="w-5 h-5" /> Security
          </button>
        </div>

        <div className="flex-1 p-8">
          {activeTab === 'GENERAL' && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">General Information</h2>
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spa Name</label>
                  <input
                    type="text"
                    value={formState.spaName}
                    onChange={(event) => setFormState((current) => current && { ...current, spaName: event.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState((current) => current && { ...current, email: event.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(event) => setFormState((current) => current && { ...current, phone: event.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={3}
                    value={formState.address}
                    onChange={(event) => setFormState((current) => current && { ...current, address: event.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Enter spa address..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <input
                      type="text"
                      value={formState.timezone}
                      onChange={(event) =>
                      setFormState((current) => current && { ...current, timezone: event.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={formState.currency}
                      onChange={(event) =>
                      setFormState((current) => current && { ...current, currency: event.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="CAD">CAD (A$)</option>
                      <option value="SGD">SGD (A$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme Style</label>
                    <select
                      value={formState.theme || 'FLAT'}
                      onChange={(event) =>
                      setFormState((current) => current && { ...current, theme: event.target.value as 'FLAT' | 'CLAY' })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="FLAT">Flat Classic</option>
                      <option value="CLAY">Soft Claymorphism</option>
                    </select>
                  </div>
                </div>

                {/* Offline File Storage Section */}
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-primary-600" /> Offline Local Disk Storage Mode
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Save database state updates directly as a JSON file in a local computer directory. Works completely offline.
                    </p>
                  </div>
                  
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-4">
                    <label className="flex items-center gap-3 text-sm text-gray-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formState.offlineStorageEnabled}
                        onChange={(event) => {
                          const enabled = event.target.checked;
                          if (enabled && !formState.offlineFolderName) {
                            handlePickDirectory();
                          } else {
                            setFormState((current) => current && { ...current, offlineStorageEnabled: enabled });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      Enable Local Directory Sync (Offline Storage Mode)
                    </label>

                    {formState.offlineStorageEnabled && (
                      <div className="space-y-4 pt-2 border-t border-gray-200/60">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="w-8 h-8 text-yellow-500" />
                            <div>
                              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Assigned Folder</div>
                              <div className="text-sm font-bold text-gray-800">
                                {formState.offlineFolderName || 'No directory assigned'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handlePickDirectory}
                            className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start sm:self-center"
                          >
                            {formState.offlineFolderName ? 'Change Folder' : 'Select Local Folder'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Max Storage Space Limit (MB)
                            </label>
                            <input
                              type="number"
                              min={10}
                              max={2000}
                              value={formState.offlineSpaceMB || 50}
                              onChange={(event) =>
                                setFormState((current) =>
                                  current && { ...current, offlineSpaceMB: Number(event.target.value) }
                                )
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                          </div>

                          {storageEstimate && (
                            <div className="flex flex-col justify-end">
                              <div className="text-xs text-gray-500 flex justify-between mb-1">
                                <span>IndexedDB System Cache Usage:</span>
                                <span className="font-semibold">{storageEstimate.usageMB} MB of {storageEstimate.quotaMB} MB</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, storageEstimate.percentageUsed)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Online Cloud Sync Section */}
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-primary-600" /> Online Cloud Sync & Database Storage
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Synchronize your data to secure remote databases. Cloud capacity is capped by your subscription plan.
                    </p>
                  </div>
                  
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-4">
                    <label className="flex items-center gap-3 text-sm text-gray-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formState.onlineSyncEnabled}
                        onChange={(event) =>
                          setFormState((current) => current && { ...current, onlineSyncEnabled: event.target.checked })
                        }
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      Enable Cloud Backup Sync
                    </label>

                    {formState.onlineSyncEnabled && (
                      <div className="space-y-4 pt-4 border-t border-gray-200/60">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-700">Cloud Storage Tier Allocation</span>
                            <span className="text-xs font-bold bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full uppercase">
                              {currentPlan?.name ?? 'Basic'}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500 flex justify-between">
                            <span>Cloud Storage Space Limit:</span>
                            <span className="font-bold">{maxOnlineSpaceGB} GB</span>
                          </div>

                          <div className="text-xs text-gray-500 flex justify-between">
                            <span>Database Assets & Backups Size:</span>
                            <span className="font-semibold text-gray-800">14.2 MB of {maxOnlineSpaceGB} GB</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (14.2 / (maxOnlineSpaceGB * 1024)) * 100)}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[11px] text-gray-400">
                              Offline disk storage remains free and unlimited.
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate('/owner/billing')}
                              className="text-xs text-primary-600 font-bold hover:underline"
                            >
                              Upgrade storage limit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button type="submit" className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'NOTIFICATIONS' && (
            <form onSubmit={handleSave} className="max-w-3xl space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['emailBookings', 'Booking emails'],
                  ['emailBilling', 'Billing emails'],
                  ['emailMarketing', 'Marketing emails'],
                  ['smsReminders', 'SMS reminders'],
                  ['smsBilling', 'SMS billing alerts'],
                  ['whatsappCampaigns', 'WhatsApp campaigns'],
                  ['whatsappReminders', 'WhatsApp reminders'],
                  ['dailySummary', 'Daily summary'],
                  ['lowStockAlerts', 'Low stock alerts'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formState.notifications[key as keyof typeof formState.notifications]}
                      onChange={(event) =>
                        setFormState((current) =>
                          current
                            ? {
                                ...current,
                                notifications: {
                                  ...current.notifications,
                                  [key]: event.target.checked,
                                },
                              }
                            : current,
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
              <button type="submit" className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white hover:bg-primary-700">
                Save Notifications
              </button>
            </form>
          )}

          {activeTab === 'SECURITY' && (
            <form onSubmit={handleSave} className="max-w-3xl space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Security</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formState.security.mfaRequired}
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              security: { ...current.security, mfaRequired: event.target.checked },
                            }
                          : current,
                      )
                    }
                  />
                  Require MFA for staff
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formState.security.allowUnknownDevices}
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              security: { ...current.security, allowUnknownDevices: event.target.checked },
                            }
                          : current,
                      )
                    }
                  />
                  Allow unknown devices
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formState.security.ipRestrictionsEnabled}
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              security: { ...current.security, ipRestrictionsEnabled: event.target.checked },
                            }
                          : current,
                      )
                    }
                  />
                  Enable IP restrictions
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formState.security.financialPinEnabled}
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              security: { ...current.security, financialPinEnabled: event.target.checked },
                            }
                          : current,
                      )
                    }
                  />
                  Protect financial reports with PIN
                </label>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    min="5"
                    type="number"
                    value={formState.security.sessionTimeoutMinutes}
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              security: {
                                ...current.security,
                                sessionTimeoutMinutes: Number(event.target.value),
                              },
                            }
                          : current,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password Rotation (days)</label>
                  <input
                    min="30"
                    type="number"
                    value={formState.security.passwordRotationDays}
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              security: {
                                ...current.security,
                                passwordRotationDays: Number(event.target.value),
                              },
                            }
                          : current,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Allowed IPs</label>
                <textarea
                  rows={3}
                  value={formState.security.allowedIps.join(', ')}
                  onChange={(event) =>
                    setFormState((current) =>
                      current
                        ? {
                            ...current,
                            security: {
                              ...current.security,
                              allowedIps: event.target.value
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean),
                            },
                          }
                        : current,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="103.21.44.55, 192.168.0.10"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Financial PIN</label>
                <input
                  maxLength={6}
                  type="password"
                  value={formState.security.financialPin}
                  onChange={(event) =>
                    setFormState((current) =>
                      current
                        ? {
                            ...current,
                            security: { ...current.security, financialPin: event.target.value },
                          }
                        : current,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button type="submit" className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white hover:bg-primary-700">
                Save Security
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
