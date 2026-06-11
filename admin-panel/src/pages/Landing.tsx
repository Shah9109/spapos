import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  Shield,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';


const pricingPlans = [
  {
    name: 'Basic',
    price: '$49',
    description: 'For single-location spas starting digital operations.',
    features: ['Appointment calendar', 'POS billing', 'Basic customer records', 'Email support'],
  },
  {
    name: 'Standard',
    price: '$99',
    description: 'For growing teams that need inventory and reminders.',
    features: ['Up to 3 branches', 'Inventory tracking', 'WhatsApp reminders', 'Role-based access'],
  },
  {
    name: 'Premium',
    price: '$169',
    description: 'For high-volume spas managing finance, HR, and reporting.',
    features: ['Advanced POS', 'Payroll and commission', 'Finance dashboards', 'Priority onboarding'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For multi-branch brands that need control, security, and scale.',
    features: ['Unlimited tenants/branches', 'License control', 'Audit logs', 'Deployment support'],
  },
];

const offeringGroups = [
  {
    title: 'Front Desk Operations',
    points: ['Online and walk-in bookings', 'Therapist assignment', 'Rescheduling and cancellations', 'Queue and slot visibility'],
  },
  {
    title: 'Billing and POS',
    points: ['Services, products, and combo billing', 'Cash, card, UPI, wallet, and split payments', 'GST invoices and receipts', 'Offline-ready desktop POS workflow'],
  },
  {
    title: 'Business Management',
    points: ['Inventory and suppliers', 'Expense tracking and cashbook', 'HR, attendance, payroll, and leave', 'Revenue and branch-level reports'],
  },
  {
    title: 'Enterprise Controls',
    points: ['Multi-tenant SaaS architecture', 'Super admin controls', 'RBAC and device/license management', 'Audit trails, backup, and subscription locking'],
  },
];

export const Landing = () => {

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <nav className="fixed top-0 z-50 w-full bg-secondary">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex flex-col items-start leading-none gap-0.5">
            <span className="text-2xl font-bold uppercase tracking-wider text-primary">
              Spa<span className="text-white">POS</span>
            </span>
            <span className="text-[8px] text-gray-400 font-semibold tracking-normal uppercase">powered by catcachcode</span>
          </div>
          <div className="hidden gap-8 text-sm font-medium text-gray-300 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
            <a href="#about" className="transition-colors hover:text-white">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="font-semibold text-gray-300 transition-colors hover:text-white">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-5 py-2.5 font-semibold text-white transition-all hover:bg-primary-600"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20 pt-32 sm:pt-36">
        <div className="rounded-[2rem] bg-gradient-to-br from-secondary to-gray-800 p-8 sm:p-12 shadow-2xl lg:p-20 text-white grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary leading-snug">
              Multi-tenant spa management platform for owners, staff, and super admins
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Run your business, <span className="text-primary">Today!</span>
            </h1>
            <p className="mt-6 max-w-3xl text-sm sm:text-base leading-relaxed text-gray-300">
              SpaPOS is built for modern spa and wellness businesses that need a complete operating system.
              It combines appointment scheduling, billing, customer history, staff management, inventory,
              reporting, super admin controls, and enterprise-grade SaaS architecture in a single product.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register"
                className="flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base sm:text-lg font-bold text-white shadow-xl shadow-primary/30 transition-all hover:bg-primary-600 border-none cursor-pointer"
              >
                Start Your 14-Day Free Trial
              </Link>
              <a
                href="#features"
                className="flex items-center justify-center rounded-xl bg-white/10 px-8 py-4 text-base sm:text-lg font-bold text-white transition-all hover:bg-white/20 border border-white/10"
              >
                Explore Features
              </a>
            </div>
          </div>
 
          <div className="relative w-full max-w-2xl mx-auto lg:max-w-none">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary-500/10 via-cyan-500/5 to-indigo-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gray-950/60 p-2 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 p-3 pb-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="text-[10px] text-gray-400 font-mono ml-2 uppercase tracking-wider font-semibold">SpaPOS Platform Demo Video</span>
              </div>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
                <iframe
                  src="https://drive.google.com/file/d/1eCCs7DFUp17T-BgjaHJmqdEjCSGkKBoEYtuRa7P6fkk/preview?autoplay=1&mute=1"
                  className="absolute inset-0 w-full h-full border-none"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="SpaPOS Demo"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Everything You Need to Scale</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-500">
              Replace scattered tools with a connected platform designed for spas, salons, and wellness centers.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<Calendar className="h-6 w-6 text-primary-600" />} title="Smart Appointments" desc="Drag-and-drop scheduling, therapist assignment, conflict visibility, and automated reminders." />
            <FeatureCard icon={<CreditCard className="h-6 w-6 text-green-600" />} title="Enterprise POS" desc="Fast service and product billing with split payments, refunds, GST invoices, and receipt printing." />
            <FeatureCard icon={<Users className="h-6 w-6 text-purple-600" />} title="CRM & Memberships" desc="Customer history, loyalty points, memberships, retention workflows, and campaign targeting." />
            <FeatureCard icon={<Package className="h-6 w-6 text-orange-600" />} title="Inventory Tracking" desc="Products, suppliers, purchase orders, stock deductions, transfers, and low-stock alerts." />
            <FeatureCard icon={<Briefcase className="h-6 w-6 text-pink-600" />} title="HR & Payroll" desc="Attendance, leave, salaries, commission, incentives, and payroll management for every branch." />
            <FeatureCard icon={<DollarSign className="h-6 w-6 text-emerald-600" />} title="Finance & Reports" desc="Daily revenue, expenses, profitability, GST-ready reporting, and business performance visibility." />
            <FeatureCard icon={<Shield className="h-6 w-6 text-indigo-600" />} title="Tenant Security" desc="RBAC, login controls, license management, device policies, and audit logs across all tenants." />
            <FeatureCard icon={<Smartphone className="h-6 w-6 text-cyan-600" />} title="Mobile & PWA Ready" desc="Responsive owner access with installable dashboard support for tablets, phones, and desktops." />
            <FeatureCard icon={<Zap className="h-6 w-6 text-yellow-600" />} title="Growth & Automation" desc="Marketing workflows, revenue forecasting, operational summaries, and automation-ready architecture." />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
          {offeringGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900">{group.title}</h3>
              <div className="mt-6 space-y-3">
                {group.points.map((point) => (
                  <div key={point} className="flex items-start gap-3 text-gray-600">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-600" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Simple Pricing for Every Stage</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-500">
              Start small, grow into multi-branch operations, and keep the same product as your business scales.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-wide text-primary-600">{plan.name}</div>
                <div className="mt-4 text-4xl font-bold text-gray-900">{plan.price}</div>
                <div className="mt-2 text-sm text-gray-500">{plan.description}</div>
                <div className="mt-6 space-y-3 text-sm text-gray-600">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/register"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  Choose {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Built as a serious SaaS operating system</h2>
            <p className="mt-5 text-lg leading-8 text-gray-500">
              SpaPOS is designed like enterprise wellness platforms, with super admin controls over subscriptions,
              plans, tenant provisioning, device licensing, and audit history. Each spa gets a dedicated operating
              workspace for customers, appointments, POS, inventory, finance, and HR.
            </p>
            <p className="mt-4 text-lg leading-8 text-gray-500">
              The architecture supports future expansion into salons, gyms, clinics, and wellness centers without
              rebuilding the core platform.
            </p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
            <div className="text-sm font-semibold uppercase tracking-wide text-primary-600">Included from the start</div>
            <div className="mt-6 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
              <div className="rounded-xl bg-white px-4 py-3">Tenant isolation</div>
              <div className="rounded-xl bg-white px-4 py-3">Soft delete strategy</div>
              <div className="rounded-xl bg-white px-4 py-3">Audit trail</div>
              <div className="rounded-xl bg-white px-4 py-3">Backup-ready design</div>
              <div className="rounded-xl bg-white px-4 py-3">Custom roles</div>
              <div className="rounded-xl bg-white px-4 py-3">Subscription locking</div>
              <div className="rounded-xl bg-white px-4 py-3">License/device binding</div>
              <div className="rounded-xl bg-white px-4 py-3">Multi-branch scaling</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-gray-900 px-8 py-14 text-white md:px-12">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold">Launch your spa on a complete operating platform.</h2>
              <p className="mt-4 text-gray-300">
                Get started with demo access, explore owner and super admin workflows, and scale into a full SaaS deployment.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 font-bold text-gray-900 transition-colors hover:bg-gray-100 cursor-pointer shadow-md text-sm"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 py-12 text-center text-gray-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary-500" />
              <span className="text-xl font-bold text-white">SpaPOS</span>
            </div>
            <span className="text-[8px] text-gray-500 font-semibold tracking-normal uppercase self-start">powered by catcachcode</span>
          </div>
          <p>© 2026 SpaPOS Enterprise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">{icon}</div>
    <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>
    <p className="leading-relaxed text-gray-500">{desc}</p>
  </div>
);
