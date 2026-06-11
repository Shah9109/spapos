import React, { useState } from 'react';
import { Megaphone, MessageSquare, Send, Plus, Pencil, Trash2, Mail, CheckSquare, Square, Play, ChevronRight } from 'lucide-react';
import { useAppStore } from '../lib/store';

interface MarketingTemplate {
  id: string;
  name: string;
  message: string;
}

const DEFAULT_TEMPLATES: MarketingTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Upgrade to Yearly Promo',
    message: 'Hello {{owner_name}},\n\nUpgrade your spa {{spa_name}} to our Yearly plan now to save 20% on your subscription and enjoy uninterrupted access to all advanced POS features!\n\nRegards,\nSpaPOS Support Team',
  },
  {
    id: 'tpl-2',
    name: 'Trial Ending Soon',
    message: 'Hello {{owner_name}},\n\nYour 14-day free trial for {{spa_name}} is expiring soon. Please visit the Billing settings page to purchase a subscription and maintain access to SpaPOS.\n\nRegards,\nSpaPOS Team',
  },
  {
    id: 'tpl-3',
    name: 'Maintenance Warning',
    message: 'Hello {{owner_name}},\n\nWe will be performing scheduled platform maintenance. The SpaPOS console for {{spa_name}} may be temporarily offline for a short period.\n\nRegards,\nSpaPOS Operations',
  }
];

export const SuperAdminMarketing = () => {
  const spas = useAppStore((state) => state.spas);
  const users = useAppStore((state) => state.users);
  const plans = useAppStore((state) => state.plans);

  const [activeTab, setActiveTab] = useState<'SPAS' | 'TEMPLATES'>('SPAS');
  const [templates, setTemplates] = useState<MarketingTemplate[]>(() => {
    const saved = localStorage.getItem('spapos_sa_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const saveTemplates = (newTemplates: MarketingTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('spapos_sa_templates', JSON.stringify(newTemplates));
  };

  // Form states for template CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', message: '' });

  // Selected targets
  const [selectedSpaIds, setSelectedSpaIds] = useState<Record<string, boolean>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Queue Wizard states
  const [campaignQueue, setCampaignQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const getSpaOwner = (spaId: string) => {
    return users.find((u) => u.spaId === spaId && u.role === 'SPA_OWNER');
  };

  const getSpaPlanName = (spaId: string) => {
    const spaItem = spas.find(s => s.id === spaId);
    if (!spaItem) return 'None';
    const plan = plans.find(p => p.id === spaItem.settings.billing.currentPlanId);
    return plan ? plan.name : 'Basic';
  };

  const toggleSelectAll = () => {
    const allSelected = spas.every(s => selectedSpaIds[s.id]);
    if (allSelected) {
      setSelectedSpaIds({});
    } else {
      const next: Record<string, boolean> = {};
      spas.forEach(s => { next[s.id] = true; });
      setSelectedSpaIds(next);
    }
  };

  const filterTargets = (type: 'ALL' | 'TRIAL' | 'ACTIVE' | 'PENDING') => {
    const next: Record<string, boolean> = {};
    spas.forEach(s => {
      if (type === 'ALL') {
        next[s.id] = true;
      } else if (s.status === type) {
        next[s.id] = true;
      }
    });
    setSelectedSpaIds(next);
  };

  const handleEditTemplate = (template: MarketingTemplate) => {
    setEditingId(template.id);
    setFormData({ name: template.name, message: template.message });
    setIsModalOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updated = templates.filter(t => t.id !== id);
      saveTemplates(updated);
      if (selectedTemplateId === id) setSelectedTemplateId('');
    }
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = templates.map(t => t.id === editingId ? { ...t, name: formData.name, message: formData.message } : t);
      saveTemplates(updated);
    } else {
      const newTemplate = {
        id: `tpl-${Date.now()}`,
        name: formData.name,
        message: formData.message
      };
      saveTemplates([...templates, newTemplate]);
    }
    setFormData({ name: '', message: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const parseTemplate = (text: string, spaItem: any) => {
    const owner = getSpaOwner(spaItem.id);
    const planName = getSpaPlanName(spaItem.id);
    return text
      .replace(/{{owner_name}}/g, owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Spa Owner')
      .replace(/{{spa_name}}/g, spaItem.name)
      .replace(/{{current_plan}}/g, planName);
  };

  const startCampaignWizard = () => {
    const targetSpas = spas.filter(s => selectedSpaIds[s.id]);
    if (targetSpas.length === 0) {
      alert('Please select at least one spa tenant as a target.');
      return;
    }
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      alert('Please select a campaign template.');
      return;
    }

    setCampaignQueue(targetSpas);
    setQueueIndex(0);
  };

  // Dispatch Actions
  const handleWhatsApp = (spaItem: any, message: string) => {
    const owner = getSpaOwner(spaItem.id);
    if (!owner || !owner.phone) {
      alert('Owner phone number is not available.');
      return;
    }
    const phone = owner.phone.replace(/[^0-9]/g, '');
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSMS = (spaItem: any, message: string) => {
    const owner = getSpaOwner(spaItem.id);
    if (!owner || !owner.phone) {
      alert('Owner phone number is not available.');
      return;
    }
    const phone = owner.phone.replace(/[^0-9]/g, '');
    const url = `sms:${phone}?&body=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleEmail = (spaItem: any, message: string) => {
    const owner = getSpaOwner(spaItem.id);
    if (!owner || !owner.email) {
      alert('Owner email address is not available.');
      return;
    }
    const subject = 'SpaPOS Platform Update';
    const url = `mailto:${owner.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary-600" /> SaaS Marketing & Promos
          </h1>
          <p className="text-gray-500 mt-1">Send marketing templates, discount upgrades, and system alerts to Spa Owners.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('SPAS')}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 cursor-pointer transition-colors ${
            activeTab === 'SPAS' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Spa Tenants ({spas.length})
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 cursor-pointer transition-colors ${
            activeTab === 'TEMPLATES' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Campaign Templates ({templates.length})
        </button>
      </div>

      {activeTab === 'SPAS' ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-50"
              >
                {spas.every(s => selectedSpaIds[s.id]) ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
                Select All
              </button>
              
              <div className="flex gap-1">
                <button
                  onClick={() => filterTargets('ALL')}
                  className="text-[10px] font-bold text-gray-600 border border-gray-200 bg-white px-2.5 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                >
                  All
                </button>
                <button
                  onClick={() => filterTargets('TRIAL')}
                  className="text-[10px] font-bold text-sky-700 border border-sky-100 bg-sky-50 px-2.5 py-1.5 rounded hover:bg-sky-100 cursor-pointer"
                >
                  Trials Only
                </button>
                <button
                  onClick={() => filterTargets('ACTIVE')}
                  className="text-[10px] font-bold text-green-700 border border-green-100 bg-green-50 px-2.5 py-1.5 rounded hover:bg-green-100 cursor-pointer"
                >
                  Active Only
                </button>
                <button
                  onClick={() => filterTargets('PENDING')}
                  className="text-[10px] font-bold text-amber-705 border border-amber-100 bg-amber-50 px-2.5 py-1.5 rounded hover:bg-amber-100 cursor-pointer"
                >
                  Pending Only
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 w-10">Select</th>
                    <th className="px-5 py-3">Spa Name</th>
                    <th className="px-5 py-3">Owner Contact</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {spas.map(spaItem => {
                    const owner = getSpaOwner(spaItem.id);
                    const planName = getSpaPlanName(spaItem.id);
                    const isSelected = !!selectedSpaIds[spaItem.id];

                    return (
                      <tr key={spaItem.id} className={`hover:bg-gray-50/50 ${isSelected ? 'bg-primary-50/20' : ''}`}>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedSpaIds(c => ({ ...c, [spaItem.id]: !c[spaItem.id] }))}
                            className="text-gray-500 hover:text-primary-600 focus:outline-none border-none bg-transparent cursor-pointer"
                          >
                            {isSelected ? <CheckSquare className="w-5 h-5 text-primary-650" /> : <Square className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 text-sm">{spaItem.name}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{spaItem.subdomain}.spapos.com</div>
                        </td>
                        <td className="px-5 py-4">
                          {owner ? (
                            <div>
                              <div className="text-xs font-semibold text-gray-700">{owner.firstName} {owner.lastName}</div>
                              <div className="text-[11px] text-gray-500 leading-tight mt-0.5">{owner.email}</div>
                              {owner.phone && <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{owner.phone}</div>}
                            </div>
                          ) : (
                            <span className="text-xs text-red-500 italic">No owner account</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-gray-650">
                          {planName}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border ${
                            spaItem.status === 'ACTIVE' ? 'bg-green-50 border-green-200 text-green-700' :
                            spaItem.status === 'TRIAL' ? 'bg-sky-50 border-sky-200 text-sky-700' :
                            spaItem.status === 'PENDING' ? 'bg-amber-50 border-amber-250 text-amber-705 animate-pulse' :
                            'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {spaItem.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-fit space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <Play className="w-4 h-4 text-primary-600" /> Dispatch Campaign
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Select a message template below, choose target spas on the left, and click Launch to start sending messages sequentially.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Select Message Template</label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">-- Choose Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={startCampaignWizard}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm transition-all"
            >
              <Send className="w-4 h-4" /> Start Dispatch Queue ({Object.values(selectedSpaIds).filter(Boolean).length} Target Spas)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900">Campaign Messaging Templates</h2>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', message: '' });
                setIsModalOpen(true);
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white border-none text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Template
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <div key={template.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between min-h-[160px]">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 text-sm">{template.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors border border-gray-100 bg-white rounded cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors border border-gray-100 bg-white rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-550 mt-3 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium">
                    {template.message}
                  </p>
                </div>
                
                <div className="mt-3 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  Placeholders: owner_name, spa_name, current_plan
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Edit / Create Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-gray-800">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-900">{editingId ? 'Edit Campaign Template' : 'Add Campaign Template'}</h2>
            </div>
            <form onSubmit={handleSaveTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Template Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(c => ({ ...c, name: e.target.value }))}
                  placeholder="e.g. Upgrade Special Promo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Message Content</label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={e => setFormData(c => ({ ...c, message: e.target.value }))}
                  placeholder="Type message text. Use {{owner_name}}, {{spa_name}}, and {{current_plan}} as placeholders."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm leading-relaxed"
                />
                <span className="text-[10px] text-gray-400 mt-1 block leading-tight">
                  Placeholders are case-sensitive. Wrap placeholders inside double curly brackets.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-750 hover:bg-gray-50 border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-5 py-2 rounded-lg cursor-pointer border-none shadow-sm"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sequential Dispatch Queue Modal */}
      {campaignQueue.length > 0 && queueIndex < campaignQueue.length && (() => {
        const activeSpa = campaignQueue[queueIndex];
        const template = templates.find(t => t.id === selectedTemplateId)!;
        const parsedMessage = parseTemplate(template.message, activeSpa);
        const owner = getSpaOwner(activeSpa.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden text-gray-800 animate-fade-in relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-indigo-550"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <div>
                    <span className="text-[9px] bg-primary-50 text-primary-750 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">
                      Campaign Queue Wizard
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">
                      Target Spa: {activeSpa.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setCampaignQueue([])}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 hover:bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold">Queue Progress</span>
                  <span className="font-bold text-primary-700">{queueIndex + 1} / {campaignQueue.length} Spas</span>
                </div>

                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-primary-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((queueIndex + 1) / campaignQueue.length) * 100}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl text-xs border border-gray-150">
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Owner Name</div>
                      <div className="font-semibold text-gray-700 mt-0.5">{owner ? `${owner.firstName} ${owner.lastName}` : 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Current Plan</div>
                      <div className="font-semibold text-gray-750 mt-0.5">{getSpaPlanName(activeSpa.id)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Email Address</div>
                      <div className="font-semibold text-gray-705 mt-0.5 truncate">{owner?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Phone Number</div>
                      <div className="font-semibold text-gray-705 mt-0.5">{owner?.phone || 'N/A'}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Parsed Message Preview</label>
                    <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 text-sm font-medium whitespace-pre-wrap leading-relaxed text-gray-800">
                      {parsedMessage}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleWhatsApp(activeSpa, parsedMessage)}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleSMS(activeSpa, parsedMessage)}
                      className="bg-sky-50 hover:bg-sky-100 border border-sky-150 text-sky-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> SMS
                    </button>
                    <button
                      onClick={() => handleEmail(activeSpa, parsedMessage)}
                      className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  </div>

                  <div className="flex gap-2 justify-between pt-2">
                    <button
                      onClick={() => setCampaignQueue([])}
                      className="text-gray-500 hover:text-gray-700 text-xs font-semibold px-4 py-2 border border-gray-200 rounded-lg cursor-pointer bg-white"
                    >
                      Cancel Campaign
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setQueueIndex(i => i + 1)}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer border border-gray-200 bg-white"
                      >
                        Skip Spa
                      </button>
                      <button
                        onClick={() => setQueueIndex(i => i + 1)}
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2 rounded-lg cursor-pointer flex items-center gap-1 border-none shadow-sm"
                      >
                        Next Spa <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
