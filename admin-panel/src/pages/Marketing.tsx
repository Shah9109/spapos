import { useState } from 'react';
import { MessageSquare, Calendar, Gift, FileText, Send, User, Plus, Pencil, Trash2, Mail, PhoneCall } from 'lucide-react';
import { useAppStore, useCurrentSpa, type MessageTemplate } from '../lib/store';

export const Marketing = () => {
  const spa = useCurrentSpa();
  const allTemplates = useAppStore((state) => state.messageTemplates);
  const allCustomers = useAppStore((state) => state.customers);
  const allAppointments = useAppStore((state) => state.appointments);

  const templates = allTemplates || [];
  const customers = (allCustomers || []).filter((c) => c.spaId === spa?.id);
  const appointments = (allAppointments || []).filter((a) => a.spaId === spa?.id);

  const createMessageTemplate = useAppStore((state) => state.createMessageTemplate);
  const updateMessageTemplate = useAppStore((state) => state.updateMessageTemplate);
  const deleteMessageTemplate = useAppStore((state) => state.deleteMessageTemplate);

  const [activeTab, setActiveTab] = useState<'TASKS' | 'TEMPLATES' | 'CAMPAIGNS'>('TASKS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    templateName: '',
    templateType: 'CUSTOM' as MessageTemplate['templateType'],
    message: '',
  });

  // Bulk campaign states
  const [campaignGroups, setCampaignGroups] = useState({
    gold: false,
    birthdays: false,
    inactive: false,
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [activeCampaignQueue, setActiveCampaignQueue] = useState<any[]>([]);
  const [campaignIndex, setCampaignIndex] = useState(0);

  // Derive tasks lists
  const birthdayTasks = customers.slice(0, 3); // Seed 3 birthday tasks
  const renewalTasks = customers.filter(c => c.membership).slice(0, 2); // Seed expiring membership tasks
  const inactiveTasks = customers.slice(1, 4); // Seed inactive customer tasks

  const resetModal = () => {
    setFormData({
      templateName: '',
      templateType: 'CUSTOM',
      message: '',
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setFormData({
      templateName: template.templateName,
      templateType: template.templateType,
      message: template.message,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMessageTemplate(editingId, formData);
    } else {
      createMessageTemplate(formData);
    }
    resetModal();
  };

  // Replace tags utility
  const replaceTemplate = (template: string, data: any) => {
    return template
      .replace(/{{customer_name}}/g, data.customerName || 'Customer')
      .replace(/{{service_name}}/g, data.serviceName || 'Spa Service')
      .replace(/{{appointment_date}}/g, data.date || '')
      .replace(/{{appointment_time}}/g, data.time || '')
      .replace(/{{expiry_date}}/g, data.expiryDate || '')
      .replace(/{{spa_name}}/g, data.spaName || 'Zen Wellness');
  };

  const getTemplateForType = (type: string) => {
    const t = templates.find((item) => item.templateType === type);
    return t ? t.message : '';
  };

  // Dispatch utilities
  const sendWhatsApp = (customer: any, message: string) => {
    const phone = customer.phone.replace(/[^0-9]/g, '');
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const sendEmail = (customer: any, subject: string, message: string) => {
    const url = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const sendSMS = (customer: any, message: string) => {
    const phone = customer.phone.replace(/[^0-9]/g, '');
    const url = `sms:${phone}?&body=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Start campaign wizard
  const handleLaunchCampaign = () => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (!selectedTemplate) {
      alert('Please select a message template.');
      return;
    }

    let targets: any[] = [];
    if (campaignGroups.gold) {
      // Fetch VIP tagged customers
      targets = [...targets, ...customers.filter(c => c.tags.includes('VIP'))];
    }
    if (campaignGroups.birthdays) {
      targets = [...targets, ...birthdayTasks];
    }
    if (campaignGroups.inactive) {
      targets = [...targets, ...inactiveTasks];
    }

    // Deduplicate
    const uniqueTargets = Array.from(new Set(targets.map(t => t.id)))
      .map(id => targets.find(t => t.id === id));

    if (uniqueTargets.length === 0) {
      alert('No target customers selected for this campaign.');
      return;
    }

    setActiveCampaignQueue(uniqueTargets);
    setCampaignIndex(0);
  };

  if (!spa) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing & Campaigns</h1>
        <p className="text-gray-500 mt-1">Engage customers via semi-automated messaging (WhatsApp, SMS, Email).</p>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Message Templates', value: templates.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
          { label: 'Today\'s Messaging Tasks', value: birthdayTasks.length + renewalTasks.length, icon: Gift, color: 'text-amber-600 bg-amber-50' },
          { label: 'Total CRM Clients', value: customers.length, icon: User, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Scheduled Slots', value: appointments.length, icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</span>
              <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{stat.value}</h3>
            </div>
            <div className={`p-3.5 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'TASKS', label: 'Today\'s Reminders', count: birthdayTasks.length + renewalTasks.length },
          { id: 'TEMPLATES', label: 'Message Templates', count: templates.length },
          { id: 'CAMPAIGNS', label: 'Bulk Campaigns', count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabs Contents */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-[300px]">
        {/* Tab 1: Tasks / Reminders */}
        {activeTab === 'TASKS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today's Reminders & Tasks</h2>
              <p className="text-sm text-gray-500 mt-0.5">Click actions to load pre-filled texts to contact customers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Birthdays Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-red-100 pb-2">
                  <Gift className="w-5 h-5 text-red-500 animate-bounce" />
                  <h3 className="font-bold text-red-900 text-sm uppercase tracking-wide">
                    🎁 Birthday Celebrations ({birthdayTasks.length})
                  </h3>
                </div>
                {birthdayTasks.map((cust) => {
                  const bdyMessage = replaceTemplate(getTemplateForType('BIRTHDAY_OFFER'), {
                    customerName: `${cust.firstName} ${cust.lastName}`,
                    spaName: spa.name,
                  });
                  return (
                    <div key={cust.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{cust.firstName} {cust.lastName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{cust.phone}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendWhatsApp(cust, bdyMessage)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <button
                          onClick={() => sendSMS(cust, bdyMessage)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> SMS
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expiring Memberships Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                  <User className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wide">
                    💳 Membership Renewals ({renewalTasks.length})
                  </h3>
                </div>
                {renewalTasks.map((cust) => {
                  const renMessage = replaceTemplate(getTemplateForType('MEMBERSHIP_RENEWAL'), {
                    customerName: `${cust.firstName} ${cust.lastName}`,
                    expiryDate: cust.membership?.expiryDate,
                    spaName: spa.name,
                  });
                  return (
                    <div key={cust.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{cust.firstName} {cust.lastName}</div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                          Expires: {cust.membership?.expiryDate}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendWhatsApp(cust, renMessage)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <button
                          onClick={() => sendEmail(cust, 'Renew Membership', renMessage)}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Message Templates */}
        {activeTab === 'TEMPLATES' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Message Templates</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage custom scripts with dynamic placeholder variables.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary border-none text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded uppercase tracking-wide">
                      {(template.templateType || 'CUSTOM').replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-2 text-md">{template.templateName}</h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-4 whitespace-pre-wrap font-mono bg-gray-50 p-2.5 rounded-lg">
                      {template.message}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-1.5 text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMessageTemplate(template.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Bulk Campaigns */}
        {activeTab === 'CAMPAIGNS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bulk Campaigns (Semi-Automatic)</h2>
              <p className="text-sm text-gray-500 mt-0.5">Filter targeted user segments and dispatch messages sequentially.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">1. Select Target Segments</h3>
                <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-5">
                  <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={campaignGroups.gold}
                      onChange={(e) => setCampaignGroups(c => ({ ...c, gold: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    ☑ VIP & Gold Members
                  </label>
                  <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={campaignGroups.birthdays}
                      onChange={(e) => setCampaignGroups(c => ({ ...c, birthdays: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    ☑ Birthday Customers Today
                  </label>
                  <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={campaignGroups.inactive}
                      onChange={(e) => setCampaignGroups(c => ({ ...c, inactive: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    ☑ Inactive Customers (&gt;30 Days)
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">2. Choose Template</h3>
                <div className="space-y-3">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.templateName}</option>
                    ))}
                  </select>

                  {selectedTemplateId && (
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs text-gray-600 font-mono whitespace-pre-wrap">
                      {templates.find(t => t.id === selectedTemplateId)?.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-end">
                <button
                  onClick={handleLaunchCampaign}
                  className="w-full bg-primary border-none text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Start Campaign Dispatcher
                </button>
              </div>
            </div>

            {/* Campaign Dispatcher Wizard */}
            {activeCampaignQueue.length > 0 && (
              <div className="border border-primary-200 bg-primary-50/20 rounded-2xl p-6 mt-8 space-y-4">
                <div className="flex justify-between items-center border-b border-primary-100 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Active Campaign Dispatcher</h3>
                    <p className="text-xs text-gray-500">Sequencing customer message window pops.</p>
                  </div>
                  <span className="text-xs font-bold bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                    Queue {campaignIndex + 1} of {activeCampaignQueue.length}
                  </span>
                </div>

                {campaignIndex < activeCampaignQueue.length ? (() => {
                  const target = activeCampaignQueue[campaignIndex];
                  const rawMsg = templates.find(t => t.id === selectedTemplateId)?.message || '';
                  const msgText = replaceTemplate(rawMsg, {
                    customerName: `${target.firstName} ${target.lastName}`,
                    expiryDate: target.membership?.expiryDate,
                    spaName: spa.name,
                  });

                  return (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-800 text-md">{target.firstName} {target.lastName}</div>
                        <div className="text-xs text-gray-500">Contact: {target.phone}</div>
                        <div className="text-xs font-mono bg-gray-50 p-2.5 rounded border border-gray-100 mt-2 block whitespace-pre-wrap max-w-lg">
                          {msgText}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            sendWhatsApp(target, msgText);
                            if (campaignIndex + 1 < activeCampaignQueue.length) {
                              setCampaignIndex(campaignIndex + 1);
                            } else {
                              setActiveCampaignQueue([]);
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Open WhatsApp & Next
                        </button>
                        <button
                          onClick={() => {
                            if (campaignIndex + 1 < activeCampaignQueue.length) {
                              setCampaignIndex(campaignIndex + 1);
                            } else {
                              setActiveCampaignQueue([]);
                            }
                          }}
                          className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-lg text-center"
                        >
                          Skip Client
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="text-center py-6 text-sm font-semibold text-emerald-700">
                    🎉 Campaign completed successfully! All messages dispatched.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Message Template' : 'Create Message Template'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  required
                  type="text"
                  value={formData.templateName}
                  onChange={(e) => setFormData(c => ({ ...c, templateName: e.target.value }))}
                  placeholder="e.g. Booking Confirmed"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
                <select
                  value={formData.templateType}
                  onChange={(e) => setFormData(c => ({ ...c, templateType: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="APPOINTMENT_CONFIRMATION">Appointment Confirmation</option>
                  <option value="BIRTHDAY_OFFER">Birthday Offer</option>
                  <option value="MEMBERSHIP_RENEWAL">Membership Renewal</option>
                  <option value="CUSTOM">Custom Campaign</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData(c => ({ ...c, message: e.target.value }))}
                  placeholder="Write message. Use placeholders like {{customer_name}}, {{service_name}}, {{appointment_date}}, {{appointment_time}}, {{expiry_date}}, {{spa_name}}..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Dynamic placeholders: <code>{"{{customer_name}}"}</code>, <code>{"{{service_name}}"}</code>, <code>{"{{appointment_date}}"}</code>, <code>{"{{appointment_time}}"}</code>, <code>{"{{expiry_date}}"}</code>, <code>{"{{spa_name}}"}</code>
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white text-sm font-bold px-5 py-2 rounded-lg"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
