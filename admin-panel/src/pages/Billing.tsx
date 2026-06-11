import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Zap, Sparkles, Receipt, Clock } from 'lucide-react';
import { useAppStore, useCurrentSpa } from '../lib/store';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';
import { getPaymentQrUrl } from '../lib/utils';

const currencySymbols: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
};

export const Billing = () => {
  const spa = useCurrentSpa();
  const currencySymbol = currencySymbols[spa?.settings?.currency || 'INR'] || '₹';
  const plans = useAppStore((state) => state.plans);
  const updateSpaSettings = useAppStore((state) => state.updateSpaSettings);
  const paymentMethods = useAppStore((state) => state.paymentMethods || []);
  const [saveMessage, setSaveMessage] = useState('');
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  
  const [billingForm, setBillingForm] = useState(() => {
    if (spa) {
      return {
        billingCycle: spa.settings.billing.billingCycle,
        paymentMethod: spa.settings.billing.paymentMethod,
        invoiceFormat: spa.settings.billing.invoiceFormat || 'A4',
        autoRenew: spa.settings.billing.autoRenew,
        gstNumber: spa.settings.billing.gstNumber,
        nextBillingDate: spa.settings.billing.nextBillingDate,
      };
    }
    return {
      billingCycle: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
      paymentMethod: 'CARD' as any,
      invoiceFormat: 'A4' as 'A4' | 'THERMAL',
      autoRenew: true,
      gstNumber: '',
      nextBillingDate: '',
    };
  });

  if (!spa) {
    return <SpaWorkspaceFallback title="Billing unavailable" />;
  }

  const currentPlan = plans.find((p) => p.id === spa.settings.billing.currentPlanId) || plans[0];

  const handleSaveBillingDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateSpaSettings(spa.id, {
      billing: {
        ...spa.settings.billing,
        ...billingForm,
      },
    });
    setSaveMessage('Billing preferences saved successfully.');
    window.setTimeout(() => setSaveMessage(''), 2500);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your spa subscription tier, billing preferences, and invoices.</p>
      </div>

      {saveMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-green-250 bg-green-50 px-4 py-3.5 text-green-800 text-sm font-semibold shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          {saveMessage}
        </div>
      )}

      {spa.settings.billing.pendingPaymentStatus === 'PENDING_APPROVAL' && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-800 text-sm font-semibold shadow-sm">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 animate-pulse" />
          <span>
            Upgrade request to <strong>"{plans.find(p => p.id === spa.settings.billing.pendingPlanId)?.name}"</strong> plan is pending payment verification and activation by the Super Admin.
          </span>
        </div>
      )}

      {/* Pricing Comparison Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1.5">
          <Sparkles className="w-5 h-5 text-amber-500" /> Choose Subscription Plan
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan.id;
            const price = billingForm.billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
            const isPremium = plan.type === 'PREMIUM';
            
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col relative overflow-hidden ${
                  isCurrent 
                    ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md scale-[1.02]' 
                    : 'border-gray-200 hover:border-primary-300 hover:shadow'
                }`}
              >
                {/* Highlight Premium Plan */}
                {isPremium && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-primary-600"></div>
                )}
                {isPremium && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                    Recommended
                  </div>
                )}

                <div className="p-5 flex-1">
                  <h3 className="font-bold text-gray-900 text-base">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline text-gray-900">
                    <span className="text-3xl font-extrabold tracking-tight">{currencySymbol}{price}</span>
                    <span className="ml-1 text-xs text-gray-500">/{billingForm.billingCycle.toLowerCase()}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Trial period: {plan.trialDays} days</p>

                  <div className="border-t border-gray-100 my-4"></div>

                  <ul className="space-y-2.5 text-xs text-gray-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full bg-primary-100 text-primary-800 font-bold py-2.5 px-4 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Active Plan
                    </button>
                  ) : spa.settings.billing.pendingPlanId === plan.id ? (
                    <button
                      disabled
                      className="w-full bg-amber-50 border border-amber-250 text-amber-700 font-bold py-2.5 px-4 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-default animate-pulse"
                    >
                      <Clock className="w-4 h-4" /> Pending Approval
                    </button>
                  ) : (
                    <button
                      onClick={() => setCheckoutPlanId(plan.id)}
                      className="w-full bg-white hover:bg-primary-50 text-primary-600 border border-primary-200 hover:border-primary-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex justify-center items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" /> Select {plan.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Plan Summary */}
        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              {currentPlan.type} TIER
            </span>
            <h3 className="text-xl font-bold mt-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-300 shrink-0" /> {currentPlan.name} Plan
            </h3>
            <p className="text-xs text-white/80 mt-1.5 leading-relaxed">
              Provides standard service configurations, live inventory controls, appointments calendar, and multi-staff billing.
            </p>
          </div>

          <div className="border-t border-white/10 pt-4 mt-6 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/70">Payment Cycle:</span>
              <span className="font-semibold">{billingForm.billingCycle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Next Renewal Date:</span>
              <span className="font-semibold">{billingForm.nextBillingDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Renewal Amount:</span>
              <span className="font-bold text-sm">{currencySymbol}{billingForm.billingCycle === 'MONTHLY' ? currentPlan.monthlyPrice : currentPlan.yearlyPrice}</span>
            </div>
          </div>
        </div>

        {/* Billing Preferences Form */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <Receipt className="w-4.5 h-4.5 text-gray-400" /> Billing Preferences
          </h3>
          <form onSubmit={handleSaveBillingDetails} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Billing Cycle</label>
                <select
                  value={billingForm.billingCycle}
                  onChange={(e) => setBillingForm({ ...billingForm, billingCycle: e.target.value as 'MONTHLY' | 'YEARLY' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                >
                  <option value="MONTHLY">Monthly Billing</option>
                  <option value="YEARLY">Yearly Billing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Payment Method</label>
                <select
                  value={billingForm.paymentMethod}
                  onChange={(e) => setBillingForm({ ...billingForm, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                >
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="CASH">Cash Drawer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Invoice Format</label>
                <select
                  value={billingForm.invoiceFormat}
                  onChange={(e) => setBillingForm({ ...billingForm, invoiceFormat: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                >
                  <option value="A4">Standard A4 Layout</option>
                  <option value="THERMAL">80mm Thermal Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">GST / Tax Number</label>
                <input
                  type="text"
                  value={billingForm.gstNumber}
                  onChange={(e) => setBillingForm({ ...billingForm, gstNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="e.g. GSTIN-29AAACC1206D1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={billingForm.autoRenew}
                onChange={(e) => setBillingForm({ ...billingForm, autoRenew: e.target.checked })}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="autoRenew" className="text-sm font-semibold text-gray-700 select-none">Enable automatic subscription renewal</label>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg text-xs shadow-sm hover:shadow transition-all"
              >
                Save Billing Details
              </button>
            </div>
          </form>
        </div>
      </div>

      {checkoutPlanId && (() => {
        const targetPlan = plans.find(p => p.id === checkoutPlanId);
        if (!targetPlan) return null;
        const price = billingForm.billingCycle === 'MONTHLY' ? targetPlan.monthlyPrice : targetPlan.yearlyPrice;
        const activePaymentConfig = paymentMethods.find(pm => pm.isActive) || { id: 'pay-default', label: 'Default UPI', upiId: 'pay.spapos@icici', isActive: true, qrCodeUrl: '' };
        const upiId = activePaymentConfig.upiId;
        const qrCodeUrl = getPaymentQrUrl(activePaymentConfig.qrCodeUrl, upiId, price, spa.settings?.currency || 'INR');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden animate-fade-in relative text-gray-800">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-600 to-indigo-650"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-primary-50 text-primary-750 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Subscription Upgrade
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1.5">Confirm Plan Upgrade</h2>
                  </div>
                  <button
                    onClick={() => setCheckoutPlanId(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 hover:bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer outline-none"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 bg-gray-50/70 border border-gray-150 rounded-2xl p-4 text-center">
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Requested Tier</div>
                  <h3 className="font-extrabold text-gray-900 text-lg mt-0.5">{targetPlan.name}</h3>
                  <div className="text-2xl font-black text-primary-700 mt-2">
                    {currencySymbol}{price}
                    <span className="text-xs font-normal text-gray-500">/{billingForm.billingCycle.toLowerCase()}</span>
                  </div>
                </div>

                {/* QR Code and UPI ID */}
                <div className="mt-6 space-y-5 text-center">
                  <div className="bg-white p-3.5 rounded-2xl inline-block border border-gray-150 shadow-sm mx-auto">
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-40 h-40 mx-auto"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-555 max-w-sm mx-auto leading-relaxed px-2 font-semibold">
                    Scan using GPay, PhonePe, Paytm, or any UPI client to transfer <span className="font-extrabold text-gray-900">{currencySymbol}{price}</span>.
                  </p>

                  <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 flex items-center justify-between text-left">
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">UPI Address</div>
                      <div className="text-sm font-semibold text-gray-800 mt-0.5 font-mono">{upiId}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(upiId);
                        alert('UPI ID copied to clipboard!');
                      }}
                      className="bg-primary-50 hover:bg-primary-100 text-primary-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-primary-150 cursor-pointer"
                    >
                      Copy ID
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutPlanId(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-150 text-gray-750 font-bold py-3 rounded-xl text-xs border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // 1. Update billing fields in spa settings
                      updateSpaSettings(spa.id, {
                        billing: {
                          ...spa.settings.billing,
                          pendingPlanId: checkoutPlanId,
                          pendingPaymentStatus: 'PENDING_APPROVAL',
                          billingCycle: billingForm.billingCycle,
                        }
                      });
                      // 2. Set main spa status to PENDING
                      useAppStore.getState().updateSpaStatus(spa.id, 'PENDING');
                      
                      // Clean modal
                      setCheckoutPlanId(null);
                      setSaveMessage('Payment submitted successfully. Awaiting Super Admin approval.');
                      window.setTimeout(() => setSaveMessage(''), 3000);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md hover:shadow-lg transition-all border-none cursor-pointer"
                  >
                    Payment Done - Wait for Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
