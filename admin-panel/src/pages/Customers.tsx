import { useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  Plus,
  Search,
  X,
  Calendar,
  Award,
  User,
  Trash2,
  Edit,
  MinusCircle,
  Sparkles
} from 'lucide-react';
import { useAppStore, useCurrentSpa, type Customer, type MembershipType } from '../lib/store';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';

export const Customers = () => {
  const spa = useCurrentSpa();
  const customers = useAppStore((state) => state.customers);
  const addCustomer = useAppStore((state) => state.addCustomer);
  const updateCustomer = useAppStore((state) => state.updateCustomer);
  const deleteCustomer = useAppStore((state) => state.deleteCustomer);
  
  const handleContactCustomer = (customer: Customer, channel: 'WA' | 'SMS' | 'MAIL') => {
    const defaultMsg = `Hello ${customer.firstName},\n\nHope you are doing well. Just wanted to connect with you from ${spa?.name || 'Zen Wellness'}.`;
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (channel === 'WA') {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
    } else if (channel === 'SMS') {
      window.open(`sms:${cleanPhone}?&body=${encodeURIComponent(defaultMsg)}`, '_blank');
    } else if (channel === 'MAIL') {
      window.open(`mailto:${customer.email}?subject=Message from ${spa?.name || 'Zen Wellness'}&body=${encodeURIComponent(defaultMsg)}`, '_blank');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    tags: 'New',
  });

  const [membershipForm, setMembershipForm] = useState({
    type: 'MONTHLY' as MembershipType,
    totalVisits: '10',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });

  const spaId = spa?.id ?? '';
  const spaCustomers = useMemo(() => customers.filter((customer) => customer.spaId === spaId), [customers, spaId]);
  
  const filteredCustomers = useMemo(() => {
    return spaCustomers.filter((customer) =>
      `${customer.firstName} ${customer.lastName} ${customer.email} ${customer.phone}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [spaCustomers, searchTerm]);

  // Default selected customer
  const activeCustomer = useMemo(() => {
    if (selectedCustomerId) {
      const found = spaCustomers.find((c) => c.id === selectedCustomerId);
      if (found) return found;
    }
    return spaCustomers[0] || null;
  }, [spaCustomers, selectedCustomerId]);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      loyaltyPoints: editingId
        ? customers.find((customer) => customer.id === editingId)?.loyaltyPoints ?? 0
        : 0,
      notes: formData.notes,
      tags: formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (editingId) {
      updateCustomer(editingId, payload);
    } else {
      addCustomer(payload);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', notes: '', tags: 'New' });
  };

  const openEdit = (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selecting the row
    const customer = spaCustomers.find((item) => item.id === customerId);
    if (!customer) return;

    setEditingId(customerId);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      tags: customer.tags.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(customerId);
      if (selectedCustomerId === customerId) {
        setSelectedCustomerId(null);
      }
    }
  };

  // Open membership assignment modal
  const openMembershipModal = (customer: Customer) => {
    const existing = customer.membership;
    if (existing && existing.type !== 'NONE') {
      setMembershipForm({
        type: existing.type,
        totalVisits: String(existing.totalVisits),
        startDate: existing.startDate || new Date().toISOString().split('T')[0],
        expiryDate: existing.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: existing.isActive,
      });
    } else {
      setMembershipForm({
        type: 'MONTHLY',
        totalVisits: '10',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
      });
    }
    setSelectedCustomerId(customer.id);
    setIsMembershipModalOpen(true);
  };

  const handleMembershipTypeChange = (type: MembershipType) => {
    let visits = '10';
    let days = 30;
    
    switch (type) {
      case 'MONTHLY':
        visits = '10';
        days = 30;
        break;
      case 'QUARTERLY':
        visits = '30';
        days = 90;
        break;
      case '6_MONTHS':
        visits = '60';
        days = 180;
        break;
      case '1_YEAR':
        visits = '120';
        days = 365;
        break;
      case 'CUSTOM':
        visits = '20';
        days = 30;
        break;
      case 'NONE':
        visits = '0';
        days = 0;
        break;
    }
    
    const start = membershipForm.startDate;
    const expiry = new Date(new Date(start).getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setMembershipForm({
      ...membershipForm,
      type,
      totalVisits: visits,
      expiryDate: expiry,
    });
  };

  const handleMembershipSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    updateCustomer(selectedCustomerId, {
      membership: {
        type: membershipForm.type,
        totalVisits: Number(membershipForm.totalVisits),
        remainingVisits: Number(membershipForm.totalVisits),
        startDate: membershipForm.startDate,
        expiryDate: membershipForm.expiryDate,
        isActive: membershipForm.isActive,
      }
    });

    setIsMembershipModalOpen(false);
  };

  const handleDeductVisit = (customer: Customer) => {
    if (!customer || !customer.membership) return;
    if (customer.membership.remainingVisits <= 0) {
      alert('No visits remaining on this membership package.');
      return;
    }

    updateCustomer(customer.id, {
      membership: {
        ...customer.membership,
        remainingVisits: customer.membership.remainingVisits - 1,
      }
    });
  };

  const handleCancelMembership = (customerId: string) => {
    if (window.confirm('Are you sure you want to remove the membership package from this customer?')) {
      updateCustomer(customerId, {
        membership: {
          type: 'NONE',
          totalVisits: 0,
          remainingVisits: 0,
          startDate: '',
          expiryDate: '',
          isActive: false,
        }
      });
    }
  };

  const getMembershipBadgeColor = (customer: Customer) => {
    const mem = customer.membership;
    if (!mem || mem.type === 'NONE') return 'bg-gray-100 text-gray-700';
    if (!mem.isActive) return 'bg-red-50 text-red-700 border border-red-200';
    
    const isExpired = new Date(mem.expiryDate) < new Date();
    if (isExpired) return 'bg-amber-50 text-amber-700 border border-amber-200';
    
    if (mem.remainingVisits <= 2) return 'bg-rose-50 text-rose-700 border border-rose-200';
    
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  };

  const getMembershipLabel = (customer: Customer) => {
    const mem = customer.membership;
    if (!mem || mem.type === 'NONE') return 'No Package';
    
    const isExpired = new Date(mem.expiryDate) < new Date();
    if (isExpired) return 'Expired';
    if (!mem.isActive) return 'Suspended';
    
    const typeLabel = mem.type === '6_MONTHS' ? '6 Months' : mem.type.charAt(0) + mem.type.slice(1).toLowerCase();
    return `${typeLabel} (${mem.remainingVisits}/${mem.totalVisits})`;
  };

  if (!spa) {
    return <SpaWorkspaceFallback title="Customers unavailable" />;
  }

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col overflow-hidden -m-8 p-8 bg-gray-50">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer profiles, loyalty rewards, and membership package visits.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ firstName: '', lastName: '', email: '', phone: '', notes: '', tags: 'New' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-all font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Customer Directory */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full min-h-0">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
            <div className="relative w-full max-w-sm">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-xs text-gray-400 font-medium shrink-0 ml-4">
              Showing {filteredCustomers.length} of {spaCustomers.length} customers
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200 z-10">
                <tr>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Contact Info</th>
                  <th className="px-6 py-3 font-semibold">Membership Plan</th>
                  <th className="px-6 py-3 font-semibold">Rewards</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${
                      activeCustomer?.id === customer.id ? 'bg-primary-50/50 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                          {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {customer.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.2 rounded bg-gray-100 text-gray-600 text-[10px] font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {customer.email}</span>
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getMembershipBadgeColor(customer)}`}>
                        {getMembershipLabel(customer)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700 text-xs">
                      <div className="flex items-center gap-1 text-primary-600">
                        <Award className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>{customer.loyaltyPoints} Pts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => openEdit(customer.id, e)}
                        className="text-gray-500 hover:text-primary-600 text-xs font-medium mr-3 hover:bg-gray-100 p-1.5 rounded transition-all inline-flex items-center"
                        title="Edit Customer Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCustomer(customer.id, e)}
                        className="text-gray-500 hover:text-red-600 text-xs font-medium hover:bg-red-50 p-1.5 rounded transition-all inline-flex items-center"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-medium">No customers found</p>
                      <p className="text-xs text-gray-400 mt-1">Try tweaking your search term or add a new customer.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Customer Details Inspector Panel */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden shrink-0">
          {activeCustomer ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Profile Header */}
              <div className="p-6 border-b border-gray-100 text-center bg-gray-50/30 shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-primary-600/20">
                  {activeCustomer.firstName[0]}{activeCustomer.lastName[0]}
                </div>
                <h3 className="mt-3 text-lg font-bold text-gray-900">
                  {activeCustomer.firstName} {activeCustomer.lastName}
                </h3>
                <div className="flex justify-center gap-1.5 mt-2">
                  {activeCustomer.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-primary-50 text-primary-700 text-[10px] font-semibold tracking-wide uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Profile Details (Scrollable Body) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Information */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Contact Details</h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{activeCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{activeCustomer.phone}</span>
                    </div>
                  </div>
                  
                  {/* Marketing Action Dispatch Row */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => handleContactCustomer(activeCustomer, 'WA')}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 text-center transition-colors"
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleContactCustomer(activeCustomer, 'SMS')}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 text-center transition-colors"
                    >
                      SMS
                    </button>
                    <button
                      onClick={() => handleContactCustomer(activeCustomer, 'MAIL')}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 text-center transition-colors"
                    >
                      Email
                    </button>
                  </div>
                </div>

                {/* Membership Package Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Membership Packages</h4>
                    {activeCustomer.membership && activeCustomer.membership.type !== 'NONE' && (
                      <button
                        onClick={() => openMembershipModal(activeCustomer)}
                        className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center"
                      >
                        Modify
                      </button>
                    )}
                  </div>

                  {activeCustomer.membership && activeCustomer.membership.type !== 'NONE' ? (
                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      {/* Membership Details Card */}
                      <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-4 text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              {activeCustomer.membership.type === '6_MONTHS' ? '6 Months' : activeCustomer.membership.type}
                            </span>
                            <h5 className="font-bold text-base mt-1.5 flex items-center gap-1.5">
                              <Sparkles className="w-4.5 h-4.5 text-amber-300" /> Subscription Plan
                            </h5>
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow ${
                            activeCustomer.membership.isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {activeCustomer.membership.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </div>

                        {/* Visited Progress Indicator */}
                        <div className="mt-6">
                          <div className="flex justify-between text-xs font-medium">
                            <span>Allowed Visits Balance</span>
                            <span className="font-bold">{activeCustomer.membership.remainingVisits} / {activeCustomer.membership.totalVisits} Left</span>
                          </div>
                          <div className="w-full bg-white/25 rounded-full h-2 mt-2">
                            <div
                              className="bg-white rounded-full h-2 shadow-sm transition-all duration-300"
                              style={{ width: `${(activeCustomer.membership.remainingVisits / activeCustomer.membership.totalVisits) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Package Meta details */}
                      <div className="p-4 bg-white border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Start Date</span>
                          <span className="font-medium text-gray-900">{activeCustomer.membership.startDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Expiry Date</span>
                          <span className="font-medium text-gray-900">{activeCustomer.membership.expiryDate}</span>
                        </div>
                      </div>

                      {/* Deduct visit check-in button */}
                      <div className="bg-gray-50 border-t border-gray-100 p-3 flex gap-2">
                        <button
                          onClick={() => handleDeductVisit(activeCustomer)}
                          disabled={activeCustomer.membership.remainingVisits <= 0}
                          className="flex-1 inline-flex justify-center items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MinusCircle className="w-4 h-4" /> Deduct Visit
                        </button>
                        <button
                          onClick={() => handleCancelMembership(activeCustomer.id)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 font-bold rounded-lg border border-red-200 text-xs transition-all"
                        >
                          Cancel Package
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center bg-gray-50/50">
                      <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-600">No active membership package</p>
                      <p className="text-[10px] text-gray-400 mt-1 mb-4">Add a membership tier to this customer to enable service visit tracking.</p>
                      <button
                        onClick={() => openMembershipModal(activeCustomer)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Assign Package
                      </button>
                    </div>
                  )}
                </div>

                {/* Loyalty Info & Notes */}
                <div className="space-y-4">
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-amber-800">Loyalty Rewards</div>
                        <div className="text-[10px] text-amber-600">Earned from bills</div>
                      </div>
                    </div>
                    <span className="font-extrabold text-lg text-amber-900">{activeCustomer.loyaltyPoints} Pts</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Internal Notes</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 min-h-[60px] italic">
                      {activeCustomer.notes || 'No customer notes entered.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <User className="w-16 h-16 text-gray-300 mb-3" />
              <p className="text-sm font-semibold">Select a customer</p>
              <p className="text-xs text-gray-400 mt-1">Select a customer from the listing table to view membership packages and progress.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">First Name</label>
                    <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Last Name</label>
                    <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Phone Number</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Tags (comma-separated)</label>
                  <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="VIP, Returning" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Notes</label>
                  <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-sm">{editingId ? 'Update Customer' : 'Save Customer'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign / Modify Membership Modal */}
      {isMembershipModalOpen && activeCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Assign Membership Plan</h2>
              <button onClick={() => setIsMembershipModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleMembershipSave} className="space-y-4">
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-xs text-primary-800 font-semibold flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-primary-600 shrink-0" />
                  <span>Assigning membership to: {activeCustomer.firstName} {activeCustomer.lastName}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Plan Duration</label>
                  <select
                    value={membershipForm.type}
                    onChange={(e) => handleMembershipTypeChange(e.target.value as MembershipType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  >
                    <option value="MONTHLY">Monthly Plan (30 Days)</option>
                    <option value="QUARTERLY">Quarterly Plan (90 Days)</option>
                    <option value="6_MONTHS">6 Months Plan (180 Days)</option>
                    <option value="1_YEAR">Yearly Plan (365 Days)</option>
                    <option value="CUSTOM">Custom Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Allowed Visits</label>
                  <input
                    required
                    type="number"
                    value={membershipForm.totalVisits}
                    onChange={(e) => setMembershipForm({ ...membershipForm, totalVisits: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    min="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Start Date</label>
                    <input
                      required
                      type="date"
                      value={membershipForm.startDate}
                      onChange={(e) => setMembershipForm({ ...membershipForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Expiry Date</label>
                    <input
                      required
                      type="date"
                      value={membershipForm.expiryDate}
                      onChange={(e) => setMembershipForm({ ...membershipForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={membershipForm.isActive}
                    onChange={(e) => setMembershipForm({ ...membershipForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 select-none">Plan is Active & Verified</label>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button type="button" onClick={() => setIsMembershipModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-sm">Save & Assign</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
