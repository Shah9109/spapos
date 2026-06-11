import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, CreditCard, LogOut, Check, MessageSquare, Mail } from 'lucide-react';
import { useCurrentSpa, useAppStore } from '../lib/store';
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

export const StatusGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const spa = useCurrentSpa();
  const currencySymbol = currencySymbols[spa?.settings?.currency || 'INR'] || '₹';
  const plans = useAppStore((state) => state.plans);
  const updateSpaStatus = useAppStore((state) => state.updateSpaStatus);
  const updateSpaSettings = useAppStore((state) => state.updateSpaSettings);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();
  const paymentMethods = useAppStore((state) => state.paymentMethods || []);

  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? '');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI'>('CARD');
  const [upiRef, setUpiRef] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!spa) {
    return <>{children}</>;
  }

  // Admin users have no spa gates, check if logged user is superadmin
  const currentUser = useAppStore((state) => state.users.find(u => u.id === state.session.currentUserId));
  if (currentUser?.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 1. Check blocked or suspended status
  if (spa.status === 'BLOCKED' || spa.status === 'SUSPENDED') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 p-6 text-white">
        <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-red-500"></div>
          
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <ShieldAlert className="w-8 h-8 text-red-500 animate-bounce" />
          </div>
          
          <h2 className="text-2xl font-extrabold tracking-tight">Access Restricted</h2>
          <p className="mt-4 text-gray-400 text-sm leading-relaxed">
            Your Spa POS account has been <span className="text-red-400 font-semibold">{spa.status.toLowerCase()}</span> by the platform administrator.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Please contact support@spapos.com or your billing administrator to resolve this restriction.
          </p>

          <button
            onClick={handleLogout}
            className="mt-8 w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-all border border-gray-700"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 2. Check pending approval status
  if (spa.status === 'PENDING') {
    const pendingPlan = plans.find(p => p.id === spa.settings.billing.pendingPlanId) || plans.find(p => p.id === spa.settings.billing.currentPlanId) || plans[0];
    const planPrice = spa.settings.billing.billingCycle === 'MONTHLY' ? pendingPlan.monthlyPrice : pendingPlan.yearlyPrice;
    const planName = pendingPlan.name;
    const notificationMessage = `Hello Admin, my spa "${spa.name}" (Subdomain: ${spa.subdomain}) is waiting for subscription approval. Plan: ${planName} (${currencySymbol}${planPrice}). Please review and approve my payment.`;

    const notifyWhatsApp = () => {
      const adminPhone = '919876543210';
      const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(notificationMessage)}`;
      window.open(url, '_blank');
    };

    const notifyEmail = () => {
      const adminEmail = 'admin@spapos.com';
      const subject = 'SpaPOS Activation Request';
      const url = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(notificationMessage)}`;
      window.open(url, '_blank');
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white border border-gray-250/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-primary-600"></div>
          
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100 animate-pulse">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Approval Pending</h2>
          <p className="mt-4 text-gray-600 text-sm leading-relaxed">
            Your subscription payment has been received and is currently under review.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            A Super Admin must review and approve your tenant activation. This process usually takes a few minutes.
          </p>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left border border-gray-150 text-xs text-gray-500 space-y-2">
            <div><span className="font-semibold text-gray-700">Spa:</span> {spa.name}</div>
            <div><span className="font-semibold text-gray-700">Subdomain:</span> {spa.subdomain}</div>
            <div><span className="font-semibold text-gray-700">Plan:</span> {planName} ({currencySymbol}{planPrice})</div>
            <div><span className="font-semibold text-gray-700">Status:</span> Pending Activation</div>
          </div>

          <div className="mt-6 border border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50/50 text-left space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fast-Track Approval</h4>
            <p className="text-[11px] text-gray-500 leading-tight">
              Directly message or email the system administrator to verify your activation.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={notifyWhatsApp}
                className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 rounded-xl text-[10px] flex items-center justify-center gap-1 border border-emerald-150 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 animate-bounce" /> WhatsApp Admin
              </button>
              <button
                type="button"
                onClick={notifyEmail}
                className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 rounded-xl text-[10px] flex items-center justify-center gap-1 border border-indigo-150 cursor-pointer transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-650" /> Email Admin
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm cursor-pointer border-none"
            >
              Refresh Status
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all border border-gray-250 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Check trial expiration
  const trialEndsStr = spa.settings.billing.trialEndsAt;
  const isTrialExpired = trialEndsStr 
    ? new Date(trialEndsStr + 'T23:59:59') < new Date() 
    : false;

  if (spa.status === 'TRIAL' && isTrialExpired) {
    const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
    const planPrice = billingCycle === 'MONTHLY' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;
    
    const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Simulate payment processing time
      setTimeout(() => {
        // Update plan settings & change status to PENDING
        updateSpaSettings(spa.id, {
          billing: {
            ...spa.settings.billing,
            currentPlanId: selectedPlanId,
            billingCycle: billingCycle,
            paymentMethod: paymentMethod === 'CARD' ? 'CARD' : 'UPI',
          }
        });
        updateSpaStatus(spa.id, 'PENDING');
        setIsSubmitting(false);
      }, 1500);
    };

    return (
      <div className="fixed inset-0 z-50 bg-gray-50/95 overflow-y-auto flex items-center justify-center p-4 md:p-8">
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col md:flex-row">
          
          {/* Plans Summary */}
          <div className="md:w-1/2 bg-gradient-to-br from-primary-600 to-indigo-700 p-8 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Trial Expired
                </span>
                <Clock className="w-4 h-4 text-amber-300 animate-spin" />
              </div>
              <h2 className="text-3xl font-extrabold mt-4 tracking-tight leading-tight">Your 14-day trial has ended.</h2>
              <p className="mt-3 text-white/80 text-sm leading-relaxed">
                Thank you for trying SpaPOS! Please select a subscription plan to unlock your workspace.
              </p>

              <div className="mt-8 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">Select Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPlanId === p.id 
                          ? 'bg-white text-primary-750 border-white font-bold shadow' 
                          : 'bg-white/10 hover:bg-white/25 text-white border-white/20'
                      }`}
                    >
                      <div className="text-xs uppercase opacity-75 font-semibold">{p.name}</div>
                      <div className="text-lg font-bold mt-0.5">{currencySymbol}{billingCycle === 'MONTHLY' ? p.monthlyPrice : p.yearlyPrice}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${billingCycle === 'MONTHLY' ? 'bg-white text-primary-700 shadow-sm' : 'text-white/85 hover:text-white'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('YEARLY')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${billingCycle === 'YEARLY' ? 'bg-white text-primary-700 shadow-sm' : 'text-white/85 hover:text-white'}`}
                >
                  Yearly (Save ~15%)
                </button>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-white/10 text-xs text-white/75 flex justify-between items-center">
              <span>Need help? Contact support@spapos.com</span>
              <button onClick={handleLogout} className="flex items-center gap-1.5 hover:text-white font-semibold">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          {/* Payment Form */}
          <div className="md:w-1/2 p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" /> Subscription Checkout
              </h3>
              <p className="text-xs text-gray-500 mt-1">Complete your subscription details to submit for activation.</p>

              <div className="mt-6 bg-gray-50 rounded-2xl p-4 border border-gray-150">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-650 font-medium">{selectedPlan.name} Plan ({billingCycle.toLowerCase()})</span>
                  <span className="font-bold text-gray-900">{currencySymbol}{planPrice}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Status changes to pending approval after checkout.</div>
              </div>

              <div className="mt-6 flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${paymentMethod === 'CARD' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${paymentMethod === 'UPI' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  UPI QR Code
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="mt-6 space-y-4">
                {paymentMethod === 'CARD' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Card Number</label>
                      <input
                        required
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Expiration</label>
                        <input
                          required
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">CVC</label>
                        <input
                          required
                          type="text"
                          placeholder="123"
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    {(() => {
                      const activePaymentConfig = paymentMethods.find(pm => pm.isActive) || { id: 'pay-default', label: 'Default UPI', upiId: 'pay.spapos@icici', isActive: true, qrCodeUrl: '' };
                      const targetUpiId = activePaymentConfig.upiId;
                      const qrCodeUrl = getPaymentQrUrl(activePaymentConfig.qrCodeUrl, targetUpiId, planPrice, spa.settings?.currency || 'INR');
                      return (
                        <>
                          <div className="bg-white p-3 rounded-2xl inline-block border border-gray-150 shadow-sm">
                            <img
                              src={qrCodeUrl}
                              alt="UPI Payment QR Code"
                              className="w-36 h-36 mx-auto"
                            />
                          </div>
                          <p className="text-[10px] text-gray-500 leading-tight">
                            Scan the QR code using any UPI app (GPay, PhonePe, Paytm) to make payment of <span className="font-bold text-gray-900">{currencySymbol}{planPrice}</span>.
                          </p>
                          
                          <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 flex items-center justify-between text-left">
                            <div>
                              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">UPI Address</div>
                              <div className="text-sm font-semibold text-gray-800 mt-0.5 font-mono">{targetUpiId}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(targetUpiId);
                                alert('UPI ID copied to clipboard!');
                              }}
                              className="bg-primary-50 hover:bg-primary-100 text-primary-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-primary-150 cursor-pointer"
                            >
                              Copy ID
                            </button>
                          </div>
                        </>
                      );
                    })()}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 text-left">Transaction Ref No. / UPI ID</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. TXN9988776655"
                        value={upiRef}
                        onChange={e => setUpiRef(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Pay & Submit for Approval
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active status or within trial period: allow render
  return <>{children}</>;
};
