import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useCurrentSpa, useAppStore } from '../lib/store';

interface PlanGateProps {
  requiredPlanType: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  children: React.ReactNode;
}

export const PlanGate: React.FC<PlanGateProps> = ({ requiredPlanType, children }) => {
  const spa = useCurrentSpa();
  const plans = useAppStore((state) => state.plans);
  
  if (!spa) return <>{children}</>;

  const currentPlan = plans.find(p => p.id === spa.settings.billing.currentPlanId);
  const currentPlanType = currentPlan?.type || 'BASIC';

  const planHierarchy = {
    'BASIC': 1,
    'STANDARD': 2,
    'PREMIUM': 3,
    'ENTERPRISE': 4
  };

  const currentTier = planHierarchy[currentPlanType as keyof typeof planHierarchy] || 1;
  const requiredTier = planHierarchy[requiredPlanType] || 2;

  const isLocked = currentTier < requiredTier;

  if (isLocked) {
    const requiredPlanName = plans.find(p => p.type === requiredPlanType)?.name || requiredPlanType;
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50/50 p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-gray-150 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-primary-600"></div>
          
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" /> Upgrade Required
          </h2>
          
          <p className="mt-3 text-sm text-gray-600 leading-relaxed font-medium">
            This module is locked under your current <span className="font-bold text-primary-700">{currentPlan?.name || 'Basic'}</span> plan. 
            Upgrade to the <span className="font-bold text-amber-600">{requiredPlanName}</span> plan or higher to unlock this feature.
          </p>

          <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-150 text-left text-xs space-y-3">
            <div className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Plan Benefits:</div>
            {requiredPlanType === 'STANDARD' && (
              <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                <li>Complete POS Billing System</li>
                <li>Live Inventory & Stock Manager</li>
                <li>WhatsApp & SMS Client Reminders</li>
                <li>Manage up to 10 staff members</li>
              </ul>
            )}
            {requiredPlanType === 'PREMIUM' && (
              <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                <li>Advanced Finance & Expense tracker</li>
                <li>Complete HR, Shifts, and Payroll slips</li>
                <li>Performance tracking and commissions</li>
                <li>Priority support & analytics dashboards</li>
              </ul>
            )}
            {requiredPlanType === 'ENTERPRISE' && (
              <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                <li>Multi-branch database & sync</li>
                <li>Strict IP & MFA restrictions</li>
                <li>Detailed audit logs and change histories</li>
                <li>Dedicated support manager</li>
              </ul>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              to="/owner/settings"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all shadow hover:shadow-md flex justify-center items-center gap-1.5 text-sm"
            >
              Go to Settings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
