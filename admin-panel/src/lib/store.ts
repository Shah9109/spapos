import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SPA_OWNER'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'THERAPIST'
  | 'ACCOUNTANT';

export type SpaStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'PENDING' | 'TRIAL';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
export type PlanType = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
export type NotificationChannel = 'email' | 'sms' | 'whatsapp';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'BANK_TRANSFER' | 'SPLIT';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'REFUNDED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollStatus = 'PENDING' | 'PAID';

export interface AppUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  spaId?: string;
  isActive: boolean;
  createdAt: string;
  loginId?: string;
}

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  features: string[];
  maxOnlineSpaceGB?: number;
  isActive: boolean;
  createdAt: string;
}

export interface License {
  id: string;
  key: string;
  spaId: string;
  deviceName: string;
  deviceId: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface BillingSettings {
  currentPlanId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  autoRenew: boolean;
  trialEndsAt?: string;
  nextBillingDate: string;
  paymentMethod: PaymentMethod;
  gstNumber: string;
  invoiceFormat?: 'A4' | 'THERMAL';
  pendingPlanId?: string;
  pendingPaymentStatus?: 'NONE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface PaymentMethodConfig {
  id: string;
  label: string;
  upiId: string;
  qrCodeUrl: string;
  isActive: boolean;
}

export interface NotificationSettings {
  emailBookings: boolean;
  emailBilling: boolean;
  emailMarketing: boolean;
  smsReminders: boolean;
  smsBilling: boolean;
  whatsappCampaigns: boolean;
  whatsappReminders: boolean;
  dailySummary: boolean;
  lowStockAlerts: boolean;
}

export interface SecuritySettings {
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  ipRestrictionsEnabled: boolean;
  allowedIps: string[];
  financialPinEnabled: boolean;
  financialPin: string;
  passwordRotationDays: number;
  allowUnknownDevices: boolean;
}

export interface SpaSettings {
  spaName: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  theme?: 'FLAT' | 'CLAY';
  colorTheme?: 'classic' | 'terracotta' | 'amber' | 'peach' | 'sandalwood' | 'copper';
  offlineStorageEnabled?: boolean;
  offlineFolderName?: string;
  offlineSpaceMB?: number;
  onlineSyncEnabled?: boolean;
  billing: BillingSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface Spa {
  id: string;
  name: string;
  email: string;
  phone: string;
  subdomain: string;
  address: string;
  status: SpaStatus;
  ownerUserId: string;
  settings: SpaSettings;
  createdAt: string;
}

export type MembershipType = 'MONTHLY' | 'QUARTERLY' | '6_MONTHS' | '1_YEAR' | 'CUSTOM' | 'NONE';

export interface CustomerMembership {
  type: MembershipType;
  totalVisits: number;      // total visits allowed (-1 for unlimited)
  remainingVisits: number;  // remaining visits
  startDate: string;        // YYYY-MM-DD
  expiryDate: string;       // YYYY-MM-DD
  isActive: boolean;
}

export interface Customer {
  id: string;
  spaId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  tags: string[];
  notes: string;
  createdAt: string;
  membership?: CustomerMembership;
}

export interface StaffMember {
  id: string;
  spaId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Exclude<UserRole, 'SUPER_ADMIN' | 'SPA_OWNER'>;
  isActive: boolean;
  salary: number;
  commissionRate: number;
  createdAt: string;
  loginId?: string;
  password?: string;
}

export interface Service {
  id: string;
  spaId: string;
  name: string;
  duration: number;
  price: number;
}

export interface ComboItem {
  id: string;
  sourceType: 'SERVICE' | 'PRODUCT' | 'CUSTOM';
  sourceId?: string;
  name: string;
  price: number;
  quantity: number;
  duration?: number;
}

export interface Combo {
  id: string;
  spaId: string;
  name: string;
  price: number;
  items: ComboItem[];
}

export interface Product {
  id: string;
  spaId: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  barcode: string;
  supplierId?: string;
}

export interface Supplier {
  id: string;
  spaId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface PurchaseOrder {
  id: string;
  spaId: string;
  supplierId: string;
  supplierName: string;
  itemCount: number;
  totalAmount: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  createdAt: string;
}

export interface Appointment {
  id: string;
  spaId: string;
  customerId?: string;
  customerName: string;
  serviceId?: string;
  serviceName: string;
  therapistId?: string;
  therapistName: string;
  start: string;
  end: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes: string;
}

export interface InvoiceItem {
  id: string;
  itemType: 'SERVICE' | 'PRODUCT' | 'COMBO';
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  spaId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  templateName: string;
  templateType: 'APPOINTMENT_CONFIRMATION' | 'BIRTHDAY_OFFER' | 'MEMBERSHIP_RENEWAL' | 'CUSTOM';
  message: string;
}

export interface Expense {
  id: string;
  spaId: string;
  category: string;
  amount: number;
  description: string;
  method: PaymentMethod;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  spaId: string;
  staffId: string;
  employee: string;
  date: string;
  status: AttendanceStatus;
}

export interface PayrollRecord {
  id: string;
  spaId: string;
  staffId: string;
  employee: string;
  month: string;
  basicSalary: number;
  commission: number;
  incentives: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
}

export interface LeaveRequest {
  id: string;
  spaId: string;
  staffId: string;
  employee: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
}

export interface AuditLog {
  id: string;
  actor: string;
  spaId?: string;
  action: string;
  createdAt: string;
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  allowNewTrials: boolean;
  autoApprovePayments: boolean;
  enforceMfaForAdmins: boolean;
  backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  supportEmail: string;
  incidentWebhook: string;
  auditRetentionDays: number;
  notifyOnTenantSignup: boolean;
  notifyOnLicenseExpiry: boolean;
}

interface SessionState {
  currentUserId?: string;
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  spaName: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email?: string;
  loginId?: string;
  password: string;
  role?: 'superadmin' | 'owner';
}

interface AppState {
  users: AppUser[];
  plans: Plan[];
  spas: Spa[];
  licenses: License[];
  customers: Customer[];
  staff: StaffMember[];
  services: Service[];
  combos: Combo[];
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  appointments: Appointment[];
  invoices: Invoice[];
  expenses: Expense[];
  attendance: AttendanceRecord[];
  payrolls: PayrollRecord[];
  leaveRequests: LeaveRequest[];
  auditLogs: AuditLog[];
  platformSettings: PlatformSettings;
  session: SessionState;
  login: (payload: LoginPayload) => { success: boolean; message?: string; role?: UserRole };
  loginWithGoogle: (roleOrCredential: string) => { success: boolean; message?: string; role?: UserRole };
  registerOwner: (payload: RegisterPayload) => { success: boolean; message?: string };
  registerOwnerWithGoogle: () => { success: boolean; message?: string; email?: string };
  logout: () => void;
  createSpa: (payload: {
    name: string;
    email: string;
    phone: string;
    subdomain: string;
    address: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    planId: string;
  }) => void;
  updateSpaStatus: (spaId: string, status: SpaStatus) => void;
  updateSpaSettings: (spaId: string, settings: Partial<SpaSettings>) => void;
  createPlan: (payload: Omit<Plan, 'id' | 'createdAt'>) => void;
  updatePlan: (planId: string, payload: Partial<Plan>) => void;
  deletePlan: (planId: string) => void;
  createLicense: (payload: Omit<License, 'id' | 'createdAt' | 'key'>) => void;
  toggleLicense: (licenseId: string) => void;
  updateLicense: (licenseId: string, payload: Partial<License>) => void;
  updatePlatformSettings: (payload: Partial<PlatformSettings>) => void;
  addCustomer: (payload: Omit<Customer, 'id' | 'createdAt' | 'spaId'>) => void;
  updateCustomer: (customerId: string, payload: Partial<Customer>) => void;
  deleteCustomer: (customerId: string) => void;
  addStaff: (payload: Omit<StaffMember, 'id' | 'spaId' | 'createdAt'>) => void;
  updateStaff: (staffId: string, payload: Partial<StaffMember>) => void;
  deleteStaff: (staffId: string) => void;
  addAppointment: (payload: Omit<Appointment, 'id' | 'spaId'>) => void;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  addService: (payload: Omit<Service, 'id' | 'spaId'>) => void;
  updateService: (serviceId: string, payload: Partial<Service>) => void;
  deleteService: (serviceId: string) => void;
  addCombo: (payload: Omit<Combo, 'id' | 'spaId'>) => void;
  updateCombo: (comboId: string, payload: Partial<Combo>) => void;
  deleteCombo: (comboId: string) => void;
  addProduct: (payload: Omit<Product, 'id' | 'spaId'>) => void;
  updateProduct: (productId: string, payload: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  addSupplier: (payload: Omit<Supplier, 'id' | 'spaId'>) => void;
  addPurchaseOrder: (payload: Omit<PurchaseOrder, 'id' | 'spaId' | 'createdAt'>) => void;
  addExpense: (payload: Omit<Expense, 'id' | 'spaId'>) => void;
  deleteExpense: (expenseId: string) => void;
  markAttendance: (payload: Omit<AttendanceRecord, 'id' | 'spaId'>) => void;
  createPayroll: (payload: Omit<PayrollRecord, 'id' | 'spaId' | 'netSalary'>) => void;
  addLeaveRequest: (payload: Omit<LeaveRequest, 'id' | 'spaId'>) => void;
  updateLeaveStatus: (leaveId: string, status: LeaveStatus) => void;
  createInvoice: (payload: Omit<Invoice, 'id' | 'spaId' | 'invoiceNumber' | 'createdAt'>) => void;
  hydrateOfflineState: (newState: Partial<AppState>) => void;
  messageTemplates: MessageTemplate[];
  createMessageTemplate: (payload: Omit<MessageTemplate, 'id'>) => void;
  updateMessageTemplate: (templateId: string, payload: Partial<MessageTemplate>) => void;
  deleteMessageTemplate: (templateId: string) => void;
  paymentMethods: PaymentMethodConfig[];
  createPaymentMethod: (payload: Omit<PaymentMethodConfig, 'id'>) => void;
  updatePaymentMethod: (id: string, payload: Partial<PaymentMethodConfig>) => void;
  deletePaymentMethod: (id: string) => void;
}

const now = () => new Date().toISOString();
const buildId = (prefix: string) =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const createLicenseKey = () => `SPA-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const defaultPlatformSettings: PlatformSettings = {
  maintenanceMode: false,
  allowNewTrials: true,
  autoApprovePayments: false,
  enforceMfaForAdmins: true,
  backupFrequency: 'DAILY',
  supportEmail: 'support@spapos.com',
  incidentWebhook: '',
  auditRetentionDays: 180,
  notifyOnTenantSignup: true,
  notifyOnLicenseExpiry: true,
};

const demoPlanIds = {
  basic: 'plan-basic',
  standard: 'plan-standard',
  premium: 'plan-premium',
  enterprise: 'plan-enterprise',
};

const demoSpas = [
  {
    id: 'spa-zen',
    name: 'Zen Wellness Spa',
    email: 'contact@zenwellness.com',
    phone: '+1 800 936 9355',
    subdomain: 'zenwellness',
    address: '12 Sunset Boulevard, Los Angeles, CA',
    status: 'ACTIVE' as SpaStatus,
    ownerUserId: 'user-owner',
    createdAt: now(),
    settings: {
      spaName: 'Zen Wellness Spa',
      email: 'contact@zenwellness.com',
      phone: '+1 800 936 9355',
      address: '12 Sunset Boulevard, Los Angeles, CA',
      timezone: 'America/Los_Angeles',
      currency: 'INR',
      theme: 'FLAT',
      billing: {
        currentPlanId: demoPlanIds.premium,
        billingCycle: 'MONTHLY' as const,
        autoRenew: true,
        trialEndsAt: '',
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: 'CARD' as PaymentMethod,
        gstNumber: 'GST-998877',
      },
      notifications: {
        emailBookings: true,
        emailBilling: true,
        emailMarketing: false,
        smsReminders: true,
        smsBilling: true,
        whatsappCampaigns: false,
        whatsappReminders: true,
        dailySummary: true,
        lowStockAlerts: true,
      },
      security: {
        mfaRequired: false,
        sessionTimeoutMinutes: 60,
        ipRestrictionsEnabled: false,
        allowedIps: [],
        financialPinEnabled: true,
        financialPin: '2468',
        passwordRotationDays: 90,
        allowUnknownDevices: true,
      },
    },
  },
  {
    id: 'spa-serenity',
    name: 'Serenity Thai Spa',
    email: 'hello@serenityspa.com',
    phone: '+1 800 222 9988',
    subdomain: 'serenity',
    address: '88 Harbor Road, Miami, FL',
    status: 'PENDING' as SpaStatus,
    ownerUserId: 'user-serenity-owner',
    createdAt: now(),
    settings: {
      spaName: 'Serenity Thai Spa',
      email: 'hello@serenityspa.com',
      phone: '+1 800 222 9988',
      address: '88 Harbor Road, Miami, FL',
      timezone: 'America/New_York',
      currency: 'INR',
      theme: 'FLAT',
      billing: {
        currentPlanId: demoPlanIds.standard,
        billingCycle: 'YEARLY' as const,
        autoRenew: true,
        trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
        gstNumber: 'GST-223311',
        invoiceFormat: 'THERMAL',
      },
      notifications: {
        emailBookings: true,
        emailBilling: true,
        emailMarketing: true,
        smsReminders: true,
        smsBilling: false,
        whatsappCampaigns: true,
        whatsappReminders: true,
        dailySummary: false,
        lowStockAlerts: true,
      },
      security: {
        mfaRequired: true,
        sessionTimeoutMinutes: 45,
        ipRestrictionsEnabled: true,
        allowedIps: ['103.21.44.55'],
        financialPinEnabled: true,
        financialPin: '9090',
        passwordRotationDays: 60,
        allowUnknownDevices: false,
      },
    },
  },
];

const initialState = {
  users: [
    {
      id: 'user-super-admin',
      email: 'admin@spapos.com',
      password: 'Admin@123',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1 800 000 0001',
      role: 'SUPER_ADMIN' as UserRole,
      isActive: true,
      createdAt: now(),
    },
    {
      id: 'user-super-admin-sanjay',
      email: 'sanjayshah910930@gmail.com',
      password: 'Admin@123',
      firstName: 'Sanjay',
      lastName: 'Shah',
      phone: '+1 800 000 0001',
      role: 'SUPER_ADMIN' as UserRole,
      isActive: true,
      createdAt: now(),
    },
    {
      id: 'user-owner',
      email: 'owner@spapos.com',
      password: 'Owner@123',
      firstName: 'Sanjay',
      lastName: 'Shah',
      phone: '+1 800 000 0002',
      role: 'SPA_OWNER' as UserRole,
      spaId: 'spa-zen',
      isActive: true,
      createdAt: now(),
    },
    {
      id: 'user-serenity-owner',
      email: 'owner2@spapos.com',
      password: 'Owner@123',
      firstName: 'Amelia',
      lastName: 'Stone',
      phone: '+1 800 000 0003',
      role: 'SPA_OWNER' as UserRole,
      spaId: 'spa-serenity',
      isActive: true,
      createdAt: now(),
    },
    {
      id: 'staff-1',
      email: 'sarah@zenwellness.com',
      password: 'Manager@123',
      firstName: 'Sarah',
      lastName: 'Connor',
      phone: '111-222-3333',
      role: 'MANAGER' as UserRole,
      spaId: 'spa-zen',
      isActive: true,
      createdAt: now(),
      loginId: 'sarah123',
    },
  ] as AppUser[],
  plans: [
    {
      id: demoPlanIds.basic,
      name: 'Basic',
      type: 'BASIC' as PlanType,
      monthlyPrice: 49,
      yearlyPrice: 499,
      trialDays: 14,
      features: ['1 branch', '3 users', 'Core billing', 'Email support'],
      maxOnlineSpaceGB: 1,
      isActive: true,
      createdAt: now(),
    },
    {
      id: demoPlanIds.standard,
      name: 'Standard',
      type: 'STANDARD' as PlanType,
      monthlyPrice: 99,
      yearlyPrice: 999,
      trialDays: 14,
      features: ['3 branches', '10 users', 'POS + inventory', 'WhatsApp reminders'],
      maxOnlineSpaceGB: 5,
      isActive: true,
      createdAt: now(),
    },
    {
      id: demoPlanIds.premium,
      name: 'Premium',
      type: 'PREMIUM' as PlanType,
      monthlyPrice: 169,
      yearlyPrice: 1699,
      trialDays: 14,
      features: ['Unlimited staff', 'Finance + HR', 'Advanced reports', 'Priority support'],
      maxOnlineSpaceGB: 20,
      isActive: true,
      createdAt: now(),
    },
    {
      id: demoPlanIds.enterprise,
      name: 'Enterprise',
      type: 'ENTERPRISE' as PlanType,
      monthlyPrice: 299,
      yearlyPrice: 2999,
      trialDays: 30,
      features: ['Multi-branch', 'IP restrictions', 'Audit trail', 'Dedicated success manager'],
      maxOnlineSpaceGB: 100,
      isActive: true,
      createdAt: now(),
    },
  ] as Plan[],
  spas: demoSpas as Spa[],
  licenses: [
    {
      id: 'lic-zen-01',
      key: 'SPA-ZEN1-2026',
      spaId: 'spa-zen',
      deviceName: 'Front Desk POS',
      deviceId: 'device-001',
      isActive: true,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: now(),
    },
  ] as License[],
  customers: [
    {
      id: 'cust-1',
      spaId: 'spa-zen',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phone: '123-456-7890',
      loyaltyPoints: 120,
      tags: ['VIP'],
      notes: 'Prefers evening slots',
      createdAt: now(),
      membership: {
        type: 'MONTHLY',
        totalVisits: 10,
        remainingVisits: 7,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
      },
    },
    {
      id: 'cust-2',
      spaId: 'spa-zen',
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      phone: '987-654-3210',
      loyaltyPoints: 45,
      tags: ['New'],
      notes: '',
      createdAt: now(),
      membership: {
        type: 'NONE',
        totalVisits: 0,
        remainingVisits: 0,
        startDate: '',
        expiryDate: '',
        isActive: false,
      },
    },
  ] as Customer[],
  staff: [
    {
      id: 'staff-1',
      spaId: 'spa-zen',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@zenwellness.com',
      phone: '111-222-3333',
      role: 'MANAGER',
      isActive: true,
      salary: 3800,
      commissionRate: 8,
      createdAt: now(),
      loginId: 'sarah123',
      password: 'Manager@123',
    },
    {
      id: 'staff-2',
      spaId: 'spa-zen',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@zenwellness.com',
      phone: '444-555-6666',
      role: 'THERAPIST',
      isActive: true,
      salary: 3200,
      commissionRate: 12,
      createdAt: now(),
    },
  ] as StaffMember[],
  services: [
    { id: 'srv-1', spaId: 'spa-zen', name: 'Deep Tissue Massage', duration: 60, price: 80 },
    { id: 'srv-2', spaId: 'spa-zen', name: 'Swedish Massage', duration: 60, price: 65 },
    { id: 'srv-3', spaId: 'spa-zen', name: 'Facial Treatment', duration: 45, price: 50 },
  ] as Service[],
  combos: [
    {
      id: 'combo-1',
      spaId: 'spa-zen',
      name: 'Full Body Spa + Facial',
      price: 120,
      items: [
        {
          id: 'combo-1-item-1',
          sourceType: 'SERVICE',
          sourceId: 'srv-1',
          name: 'Deep Tissue Massage',
          price: 80,
          quantity: 1,
          duration: 60,
        },
        {
          id: 'combo-1-item-2',
          sourceType: 'SERVICE',
          sourceId: 'srv-3',
          name: 'Facial Treatment',
          price: 50,
          quantity: 1,
          duration: 45,
        },
      ],
    },
    {
      id: 'combo-2',
      spaId: 'spa-zen',
      name: 'Couples Massage',
      price: 150,
      items: [
        {
          id: 'combo-2-item-1',
          sourceType: 'SERVICE',
          sourceId: 'srv-2',
          name: 'Swedish Massage',
          price: 65,
          quantity: 2,
          duration: 60,
        },
        {
          id: 'combo-2-item-2',
          sourceType: 'CUSTOM',
          name: 'Aromatherapy Upgrade',
          price: 20,
          quantity: 1,
        },
      ],
    },
  ] as Combo[],
  products: [
    { id: 'prod-1', spaId: 'spa-zen', name: 'Massage Oil', sku: 'MO-001', stock: 45, price: 15, barcode: '100001' },
    { id: 'prod-2', spaId: 'spa-zen', name: 'Aroma Candles', sku: 'AC-002', stock: 12, price: 8.5, barcode: '100002' },
    { id: 'prod-3', spaId: 'spa-zen', name: 'Towels (Pack of 10)', sku: 'TW-003', stock: 5, price: 25, barcode: '100003' },
  ] as Product[],
  suppliers: [
    {
      id: 'sup-1',
      spaId: 'spa-zen',
      name: 'Pure Spa Supplies',
      contactPerson: 'Marina Holt',
      email: 'sales@purespa.com',
      phone: '+1 555 0100',
      address: '21 Supply Lane, Austin, TX',
    },
  ] as Supplier[],
  purchaseOrders: [
    {
      id: 'po-1',
      spaId: 'spa-zen',
      supplierId: 'sup-1',
      supplierName: 'Pure Spa Supplies',
      itemCount: 3,
      totalAmount: 420,
      status: 'RECEIVED',
      createdAt: now(),
    },
  ] as PurchaseOrder[],
  appointments: [
    {
      id: 'appt-1',
      spaId: 'spa-zen',
      customerId: 'cust-1',
      customerName: 'Alice Johnson',
      serviceId: 'srv-1',
      serviceName: 'Deep Tissue Massage',
      therapistId: 'staff-2',
      therapistName: 'John Doe',
      start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
      status: 'SCHEDULED',
      notes: '',
    },
  ] as Appointment[],
  invoices: [
    {
      id: 'inv-1',
      spaId: 'spa-zen',
      invoiceNumber: 'INV-2026-001',
      customerId: 'cust-1',
      customerName: 'Alice Johnson',
      items: [
        {
          id: 'item-1',
          itemType: 'SERVICE',
          itemId: 'srv-1',
          name: 'Deep Tissue Massage',
          quantity: 1,
          unitPrice: 80,
          totalPrice: 80,
        },
      ],
      subtotal: 80,
      discount: 0,
      taxAmount: 14.4,
      totalAmount: 94.4,
      status: 'PAID',
      paymentMethod: 'CARD',
      createdAt: now(),
    },
  ] as Invoice[],
  expenses: [
    {
      id: 'exp-1',
      spaId: 'spa-zen',
      category: 'Supplies',
      amount: 150,
      description: 'Massage oils and towels',
      method: 'CARD',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'exp-2',
      spaId: 'spa-zen',
      category: 'Utilities',
      amount: 300,
      description: 'Electricity bill',
      method: 'BANK_TRANSFER',
      date: new Date().toISOString().split('T')[0],
    },
  ] as Expense[],
  attendance: [
    {
      id: 'att-1',
      spaId: 'spa-zen',
      staffId: 'staff-1',
      employee: 'Sarah Connor',
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
    },
    {
      id: 'att-2',
      spaId: 'spa-zen',
      staffId: 'staff-2',
      employee: 'John Doe',
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
    },
  ] as AttendanceRecord[],
  payrolls: [
    {
      id: 'pay-1',
      spaId: 'spa-zen',
      staffId: 'staff-1',
      employee: 'Sarah Connor',
      month: new Date().toISOString().slice(0, 7),
      basicSalary: 3800,
      commission: 240,
      incentives: 100,
      deductions: 40,
      netSalary: 4100,
      status: 'PENDING',
    },
  ] as PayrollRecord[],
  leaveRequests: [
    {
      id: 'leave-1',
      spaId: 'spa-zen',
      staffId: 'staff-2',
      employee: 'John Doe',
      startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: 'Family event',
      status: 'PENDING',
    },
  ] as LeaveRequest[],
  auditLogs: [
    { id: 'log-1', actor: 'System', spaId: 'spa-zen', action: 'Seeded demo workspace', createdAt: now() },
  ] as AuditLog[],
  messageTemplates: [
    {
      id: 'template-confirm',
      templateName: 'Appointment Confirmation',
      templateType: 'APPOINTMENT_CONFIRMATION',
      message: 'Hello {{customer_name}},\n\nYour appointment for {{service_name}} is confirmed.\n\nDate: {{appointment_date}}\nTime: {{appointment_time}}\n\nThank you,\n{{spa_name}}'
    },
    {
      id: 'template-birthday',
      templateName: 'Birthday Offer',
      templateType: 'BIRTHDAY_OFFER',
      message: 'Happy Birthday {{customer_name}} 🎉\n\nEnjoy 20% OFF on all services.\n\nRegards,\n{{spa_name}}'
    },
    {
      id: 'template-renewal',
      templateName: 'Membership Renewal',
      templateType: 'MEMBERSHIP_RENEWAL',
      message: 'Hello {{customer_name}},\n\nYour membership expires on {{expiry_date}}.\n\nRenew now and get special benefits.\n\nRegards,\n{{spa_name}}'
    },
    {
      id: 'template-sa-yearly',
      templateName: 'Upgrade to Yearly Promo',
      templateType: 'CUSTOM',
      message: 'Hello {{owner_name}},\n\nUpgrade your spa {{spa_name}} to our Yearly plan now to save 20% on your subscription and enjoy uninterrupted access to all advanced POS features!\n\nRegards,\nSpaPOS Support Team'
    },
    {
      id: 'template-sa-trial',
      templateName: 'Trial Ending Soon',
      templateType: 'CUSTOM',
      message: 'Hello {{owner_name}},\n\nYour 14-day free trial for {{spa_name}} is expiring soon. Please visit the Billing settings page to purchase a subscription and maintain access to SpaPOS.\n\nRegards,\nSpaPOS Team'
    },
    {
      id: 'template-sa-maintenance',
      templateName: 'Maintenance Warning',
      templateType: 'CUSTOM',
      message: 'Hello {{owner_name}},\n\nWe will be performing scheduled platform maintenance. The SpaPOS console for {{spa_name}} may be temporarily offline for a short period.\n\nRegards,\nSpaPOS Operations'
    }
  ] as MessageTemplate[],
  paymentMethods: [
    {
      id: 'pay-default',
      label: 'Primary UPI (SaaS Fees)',
      upiId: 'pay.spapos@icici',
      qrCodeUrl: '',
      isActive: true
    }
  ] as PaymentMethodConfig[],
  platformSettings: defaultPlatformSettings,
  session: {} as SessionState,
};

const getCurrentUser = (state: AppState) => state.users.find((user) => user.id === state.session.currentUserId);
const getCurrentSpaId = (state: AppState) => getCurrentUser(state)?.spaId;

const appendAudit = (auditLogs: AuditLog[], actor: string, action: string, spaId?: string) => [
  { id: buildId('audit'), actor, action, spaId, createdAt: now() },
  ...auditLogs,
].slice(0, 100);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      login: (payload) => {
        const { email, loginId, password } = payload;
        const searchVal = (loginId || email || '').trim().toLowerCase();
        
        if (searchVal === 'sanjayshah910930@gmail.com') {
          const state = get();
          const exists = state.users.find(u => u.email.toLowerCase() === 'sanjayshah910930@gmail.com');
          if (!exists) {
            const sanjayUser = {
              id: 'user-super-admin-sanjay',
              email: 'sanjayshah910930@gmail.com',
              password: 'Admin@123',
              firstName: 'Sanjay',
              lastName: 'Shah',
              phone: '+1 800 000 0001',
              role: 'SUPER_ADMIN' as UserRole,
              isActive: true,
              createdAt: now(),
            };
            set({
              users: [sanjayUser, ...state.users],
            });
          } else if (exists.role !== 'SUPER_ADMIN') {
            set({
              users: state.users.map(u => u.email.toLowerCase() === 'sanjayshah910930@gmail.com' ? { ...u, role: 'SUPER_ADMIN' } : u)
            });
          }
        }

        const user = get().users.find(
          (candidate) =>
            (candidate.email.toLowerCase() === searchVal ||
             candidate.id.toLowerCase() === searchVal ||
             candidate.loginId?.toLowerCase() === searchVal ||
             candidate.phone?.toLowerCase() === searchVal) &&
            candidate.password === password &&
            candidate.isActive,
        );

        if (!user) {
          return { success: false, message: 'Invalid ID, email, or password.' };
        }

        set((state) => ({
          session: { currentUserId: user.id },
          auditLogs: appendAudit(state.auditLogs, `${user.firstName} ${user.lastName}`, 'Logged in', user.spaId),
        }));

        return { success: true, role: user.role };
      },
      loginWithGoogle: (roleOrCredential) => {
        if (roleOrCredential === 'superadmin' || roleOrCredential === 'owner') {
          const credentials =
            roleOrCredential === 'superadmin'
              ? { email: 'admin@spapos.com', password: 'Admin@123' }
              : { email: 'owner@spapos.com', password: 'Owner@123' };

          return get().login(credentials);
        }

        try {
          const payload = parseJwt(roleOrCredential);
          if (!payload || !payload.email) {
            return { success: false, message: 'Invalid Google credential token.' };
          }
          const email = payload.email.trim();
          const firstName = payload.given_name || payload.name?.split(' ')[0] || 'Google';
          const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'User';

          const state = get();
          
          if (email.toLowerCase() === 'sanjayshah910930@gmail.com') {
            const exists = state.users.find(u => u.email.toLowerCase() === 'sanjayshah910930@gmail.com');
            if (!exists) {
              const sanjayUser = {
                id: 'user-super-admin-sanjay',
                email: 'sanjayshah910930@gmail.com',
                password: 'Admin@123',
                firstName: 'Sanjay',
                lastName: 'Shah',
                phone: '+1 800 000 0001',
                role: 'SUPER_ADMIN' as UserRole,
                isActive: true,
                createdAt: now(),
              };
              set((s) => ({
                users: [sanjayUser, ...s.users],
              }));
            } else if (exists.role !== 'SUPER_ADMIN') {
              set((s) => ({
                users: s.users.map(u => u.email.toLowerCase() === 'sanjayshah910930@gmail.com' ? { ...u, role: 'SUPER_ADMIN' } : u)
              }));
            }
          }

          const freshState = get();
          const existingUser = freshState.users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
          );

          if (existingUser) {
            set((state) => ({
              session: { currentUserId: existingUser.id },
              auditLogs: appendAudit(
                state.auditLogs,
                `${existingUser.firstName} ${existingUser.lastName}`,
                'Logged in with Google',
                existingUser.spaId
              ),
            }));
            return { success: true, role: existingUser.role };
          }

          const spaName = `${firstName}'s Wellness Spa`;
          const regResult = get().registerOwner({
            firstName,
            lastName,
            spaName,
            email,
            password: `GoogleAuth-${Math.random().toString(36).slice(2, 10)}`,
          });

          if (!regResult.success) {
            return { success: false, message: regResult.message || 'Failed to auto-register new account.' };
          }

          const updatedState = get();
          const newUser = updatedState.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
          if (newUser) {
            return { success: true, role: 'SPA_OWNER' };
          }
          return { success: false, message: 'Google account registration failed.' };
        } catch (e) {
          return { success: false, message: 'Failed to login with Google.' };
        }
      },
      registerOwner: ({ firstName, lastName, spaName, email, password }) => {
        const state = get();
        const existing = state.users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
        if (existing) {
          return { success: false, message: 'Email already exists.' };
        }

        const ownerId = buildId('user');
        const spaId = buildId('spa');
        const defaultPlan = state.plans.find((plan) => plan.type === 'STANDARD')?.id ?? state.plans[0]?.id ?? '';
        const createdAt = now();

        set({
          users: [
            {
              id: ownerId,
              email: email.trim(),
              password,
              firstName,
              lastName,
              phone: '',
              role: 'SPA_OWNER',
              spaId,
              isActive: true,
              createdAt,
            },
            ...state.users,
          ],
          spas: [
            {
              id: spaId,
              name: spaName,
              email: email.trim(),
              phone: '',
              subdomain: spaName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              address: '',
              status: 'TRIAL',
              ownerUserId: ownerId,
              createdAt,
              settings: {
                spaName,
                email: email.trim(),
                phone: '',
                address: '',
                timezone: 'UTC',
                currency: 'INR',
                theme: 'FLAT',
                billing: {
                  currentPlanId: defaultPlan,
                  billingCycle: 'MONTHLY',
                  autoRenew: true,
                  trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  paymentMethod: 'CARD',
                  gstNumber: '',
                  invoiceFormat: 'THERMAL',
                },
                notifications: {
                  emailBookings: true,
                  emailBilling: true,
                  emailMarketing: false,
                  smsReminders: false,
                  smsBilling: false,
                  whatsappCampaigns: false,
                  whatsappReminders: false,
                  dailySummary: true,
                  lowStockAlerts: true,
                },
                security: {
                  mfaRequired: false,
                  sessionTimeoutMinutes: 60,
                  ipRestrictionsEnabled: false,
                  allowedIps: [],
                  financialPinEnabled: false,
                  financialPin: '',
                  passwordRotationDays: 90,
                  allowUnknownDevices: true,
                },
              },
            },
            ...state.spas,
          ],
          session: { currentUserId: ownerId },
          auditLogs: appendAudit(state.auditLogs, `${firstName} ${lastName}`, 'Registered new spa owner account', spaId),
        });

        return { success: true };
      },
      registerOwnerWithGoogle: () => {
        const email = `google.owner.${Date.now()}@spapos.com`;
        const result = get().registerOwner({
          firstName: 'Google',
          lastName: 'Owner',
          spaName: 'Google Wellness Spa',
          email,
          password: 'Owner@123',
        });

        return {
          ...result,
          email: result.success ? email : undefined,
        };
      },
      logout: () => {
        set({
          ...initialState,
          session: {},
        });
        try {
          localStorage.removeItem('spapos-store');
        } catch (e) {
          console.error(e);
        }
      },
      createSpa: ({ name, email, phone, subdomain, address, ownerName, ownerEmail, ownerPhone, planId }) => {
        const state = get();
        const parts = ownerName.trim().split(/\s+/);
        const firstName = parts[0] ?? 'Owner';
        const lastName = parts.slice(1).join(' ') || 'User';
        const ownerId = buildId('user');
        const spaId = buildId('spa');
        const actor = getCurrentUser(state);
        const createdAt = now();

        set({
          users: [
            {
              id: ownerId,
              email: ownerEmail,
              password: 'Owner@123',
              firstName,
              lastName,
              phone: ownerPhone,
              role: 'SPA_OWNER',
              spaId,
              isActive: true,
              createdAt,
            },
            ...state.users,
          ],
          spas: [
            {
              id: spaId,
              name,
              email,
              phone,
              subdomain,
              address,
              status: 'ACTIVE',
              ownerUserId: ownerId,
              createdAt,
              settings: {
                spaName: name,
                email,
                phone,
                address,
                timezone: 'UTC',
                currency: 'INR',
                theme: 'FLAT',
                billing: {
                  currentPlanId: planId,
                  billingCycle: 'MONTHLY',
                  autoRenew: true,
                  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  paymentMethod: 'CARD',
                  gstNumber: '',
                  invoiceFormat: 'THERMAL',
                },
                notifications: {
                  emailBookings: true,
                  emailBilling: true,
                  emailMarketing: false,
                  smsReminders: true,
                  smsBilling: false,
                  whatsappCampaigns: false,
                  whatsappReminders: true,
                  dailySummary: true,
                  lowStockAlerts: true,
                },
                security: {
                  mfaRequired: false,
                  sessionTimeoutMinutes: 60,
                  ipRestrictionsEnabled: false,
                  allowedIps: [],
                  financialPinEnabled: false,
                  financialPin: '',
                  passwordRotationDays: 90,
                  allowUnknownDevices: true,
                },
              },
            },
            ...state.spas,
          ],
          auditLogs: appendAudit(
            state.auditLogs,
            actor ? `${actor.firstName} ${actor.lastName}` : 'System',
            `Created spa ${name}`,
            spaId,
          ),
        });
      },
      updateSpaStatus: (spaId, status) =>
        set((state) => ({
          spas: state.spas.map((spa) => {
            if (spa.id === spaId) {
              const updatedSpa = { ...spa, status };
              if (status === 'ACTIVE' && spa.settings.billing.pendingPlanId) {
                const nextDays = spa.settings.billing.billingCycle === 'YEARLY' ? 365 : 30;
                updatedSpa.settings = {
                  ...spa.settings,
                  billing: {
                    ...spa.settings.billing,
                    currentPlanId: spa.settings.billing.pendingPlanId,
                    nextBillingDate: new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    pendingPlanId: undefined,
                    pendingPaymentStatus: 'NONE',
                  },
                };
              }
              return updatedSpa;
            }
            return spa;
          }),
          auditLogs: appendAudit(
            state.auditLogs,
            `${getCurrentUser(state)?.firstName ?? 'System'} ${getCurrentUser(state)?.lastName ?? ''}`.trim(),
            `Updated spa status to ${status}`,
            spaId,
          ),
        })),
      updateSpaSettings: (spaId, settings) =>
        set((state) => ({
          spas: state.spas.map((spa) =>
            spa.id === spaId
              ? {
                  ...spa,
                  name: settings.spaName ?? spa.name,
                  email: settings.email ?? spa.email,
                  phone: settings.phone ?? spa.phone,
                  address: settings.address ?? spa.address,
                  settings: {
                    ...spa.settings,
                    ...settings,
                    billing: { ...spa.settings.billing, ...settings.billing },
                    notifications: { ...spa.settings.notifications, ...settings.notifications },
                    security: { ...spa.settings.security, ...settings.security },
                  },
                }
              : spa,
          ),
        })),
      createPlan: (payload) =>
        set((state) => ({
          plans: [{ ...payload, id: buildId('plan'), createdAt: now() }, ...state.plans],
        })),
      updatePlan: (planId, payload) =>
        set((state) => ({
          plans: state.plans.map((plan) => (plan.id === planId ? { ...plan, ...payload } : plan)),
        })),
      deletePlan: (planId) =>
        set((state) => ({
          plans: state.plans.filter((plan) => plan.id !== planId),
        })),
      createMessageTemplate: (payload) =>
        set((state) => ({
          messageTemplates: [{ ...payload, id: buildId('template') }, ...(state.messageTemplates || [])],
        })),
      updateMessageTemplate: (templateId, payload) =>
        set((state) => ({
          messageTemplates: (state.messageTemplates || []).map((template) =>
            template.id === templateId ? { ...template, ...payload } : template
          ),
        })),
      deleteMessageTemplate: (templateId) =>
        set((state) => ({
          messageTemplates: (state.messageTemplates || []).filter((template) => template.id !== templateId),
        })),
      createPaymentMethod: (payload) =>
        set((state) => ({
          paymentMethods: [{ ...payload, id: buildId('payment') }, ...(state.paymentMethods || [])],
        })),
      updatePaymentMethod: (id, payload) =>
        set((state) => ({
          paymentMethods: (state.paymentMethods || []).map((pm) =>
            pm.id === id ? { ...pm, ...payload } : pm
          ),
        })),
      deletePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: (state.paymentMethods || []).filter((pm) => pm.id !== id),
        })),
      createLicense: (payload) =>
        set((state) => {
          const actor = getCurrentUser(state);
          return {
            licenses: [
              {
                ...payload,
                id: buildId('license'),
                key: createLicenseKey(),
                createdAt: now(),
              },
              ...state.licenses,
            ],
            auditLogs: appendAudit(
              state.auditLogs,
              actor ? `${actor.firstName} ${actor.lastName}` : 'System',
              `Generated license for ${payload.deviceName}`,
              payload.spaId,
            ),
          };
        }),
      toggleLicense: (licenseId) =>
        set((state) => {
          const actor = getCurrentUser(state);
          const target = state.licenses.find((license) => license.id === licenseId);
          return {
            licenses: state.licenses.map((license) =>
              license.id === licenseId ? { ...license, isActive: !license.isActive } : license,
            ),
            auditLogs: target
              ? appendAudit(
                  state.auditLogs,
                  actor ? `${actor.firstName} ${actor.lastName}` : 'System',
                  `${target.isActive ? 'Deactivated' : 'Activated'} license ${target.key}`,
                  target.spaId,
                )
              : state.auditLogs,
          };
        }),
      updateLicense: (licenseId, payload) =>
        set((state) => {
          const actor = getCurrentUser(state);
          const target = state.licenses.find((license) => license.id === licenseId);
          return {
            licenses: state.licenses.map((license) => (license.id === licenseId ? { ...license, ...payload } : license)),
            auditLogs: target
              ? appendAudit(
                  state.auditLogs,
                  actor ? `${actor.firstName} ${actor.lastName}` : 'System',
                  `Updated license ${target.key}`,
                  target.spaId,
                )
              : state.auditLogs,
          };
        }),
      updatePlatformSettings: (payload) =>
        set((state) => {
          const actor = getCurrentUser(state);
          return {
            platformSettings: { ...state.platformSettings, ...payload },
            auditLogs: appendAudit(
              state.auditLogs,
              actor ? `${actor.firstName} ${actor.lastName}` : 'System',
              'Updated platform settings',
            ),
          };
        }),
      addCustomer: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            customers: [{ ...payload, spaId, id: buildId('customer'), createdAt: now() }, ...state.customers],
          };
        }),
      updateCustomer: (customerId, payload) =>
        set((state) => ({
          customers: state.customers.map((customer) => (customer.id === customerId ? { ...customer, ...payload } : customer)),
        })),
      deleteCustomer: (customerId) =>
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== customerId),
        })),
      addStaff: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          const staffId = buildId('staff');
          const newStaffMember = { ...payload, spaId, id: staffId, createdAt: now() };
          
          let updatedUsers = [...state.users];
          if (payload.password) {
            const newUser: AppUser = {
              id: staffId,
              email: payload.email,
              password: payload.password,
              firstName: payload.firstName,
              lastName: payload.lastName,
              phone: payload.phone,
              role: payload.role,
              spaId: spaId,
              isActive: payload.isActive,
              createdAt: now(),
              loginId: payload.loginId,
            };
            updatedUsers.push(newUser);
          }
          
          return {
            staff: [newStaffMember, ...state.staff],
            users: updatedUsers,
          };
        }),
      updateStaff: (staffId, payload) =>
        set((state) => {
          const updatedStaff = state.staff.map((member) => (member.id === staffId ? { ...member, ...payload } : member));
          
          let updatedUsers = [...state.users];
          const userIdx = updatedUsers.findIndex((u) => u.id === staffId);
          
          if (payload.password) {
            const existingUser = userIdx >= 0 ? updatedUsers[userIdx] : null;
            const spaId = existingUser?.spaId || getCurrentSpaId(state) || '';
            const updatedUser: AppUser = {
              id: staffId,
              email: payload.email ?? existingUser?.email ?? '',
              password: payload.password,
              firstName: payload.firstName ?? existingUser?.firstName ?? '',
              lastName: payload.lastName ?? existingUser?.lastName ?? '',
              phone: payload.phone ?? existingUser?.phone ?? '',
              role: (payload.role ?? existingUser?.role ?? 'THERAPIST') as UserRole,
              spaId,
              isActive: payload.isActive ?? existingUser?.isActive ?? true,
              createdAt: existingUser?.createdAt ?? now(),
              loginId: payload.loginId ?? (existingUser as any)?.loginId ?? '',
            };
            
            if (userIdx >= 0) {
              updatedUsers[userIdx] = updatedUser;
            } else {
              updatedUsers.push(updatedUser);
            }
          } else if (userIdx >= 0) {
            if (payload.password === '') {
              updatedUsers = updatedUsers.filter((u) => u.id !== staffId);
            } else {
              updatedUsers[userIdx] = {
                ...updatedUsers[userIdx],
                email: payload.email ?? updatedUsers[userIdx].email,
                firstName: payload.firstName ?? updatedUsers[userIdx].firstName,
                lastName: payload.lastName ?? updatedUsers[userIdx].lastName,
                phone: payload.phone ?? updatedUsers[userIdx].phone,
                role: (payload.role ?? updatedUsers[userIdx].role) as UserRole,
                isActive: payload.isActive ?? updatedUsers[userIdx].isActive,
                loginId: payload.loginId ?? (updatedUsers[userIdx] as any).loginId,
              };
            }
          }
          
          return {
            staff: updatedStaff,
            users: updatedUsers,
          };
        }),
      deleteStaff: (staffId) =>
        set((state) => ({
          staff: state.staff.filter((member) => member.id !== staffId),
          users: state.users.filter((user) => user.id !== staffId),
        })),
      addAppointment: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            appointments: [{ ...payload, spaId, id: buildId('appointment') }, ...state.appointments],
          };
        }),
      updateAppointmentStatus: (appointmentId, status) =>
        set((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === appointmentId ? { ...appointment, status } : appointment,
          ),
        })),
      addService: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            services: [{ ...payload, spaId, id: buildId('service') }, ...state.services],
          };
        }),
      updateService: (serviceId, payload) =>
        set((state) => ({
          services: state.services.map((service) => (service.id === serviceId ? { ...service, ...payload } : service)),
        })),
      deleteService: (serviceId) =>
        set((state) => ({
          services: state.services.filter((service) => service.id !== serviceId),
        })),
      addCombo: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            combos: [{ ...payload, spaId, id: buildId('combo') }, ...state.combos],
          };
        }),
      updateCombo: (comboId, payload) =>
        set((state) => ({
          combos: state.combos.map((combo) => (combo.id === comboId ? { ...combo, ...payload } : combo)),
        })),
      deleteCombo: (comboId) =>
        set((state) => ({
          combos: state.combos.filter((combo) => combo.id !== comboId),
        })),
      addProduct: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            products: [{ ...payload, spaId, id: buildId('product') }, ...state.products],
          };
        }),
      updateProduct: (productId, payload) =>
        set((state) => ({
          products: state.products.map((product) => (product.id === productId ? { ...product, ...payload } : product)),
        })),
      deleteProduct: (productId) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== productId),
        })),
      addSupplier: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            suppliers: [{ ...payload, spaId, id: buildId('supplier') }, ...state.suppliers],
          };
        }),
      addPurchaseOrder: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            purchaseOrders: [{ ...payload, spaId, id: buildId('po'), createdAt: now() }, ...state.purchaseOrders],
          };
        }),
      addExpense: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            expenses: [{ ...payload, spaId, id: buildId('expense') }, ...state.expenses],
          };
        }),
      deleteExpense: (expenseId) =>
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== expenseId),
        })),
      markAttendance: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            attendance: [{ ...payload, spaId, id: buildId('attendance') }, ...state.attendance],
          };
        }),
      createPayroll: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          const netSalary = payload.basicSalary + payload.commission + payload.incentives - payload.deductions;
          return {
            payrolls: [{ ...payload, spaId, id: buildId('payroll'), netSalary }, ...state.payrolls],
          };
        }),
      addLeaveRequest: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }
          return {
            leaveRequests: [{ ...payload, spaId, id: buildId('leave') }, ...state.leaveRequests],
          };
        }),
      updateLeaveStatus: (leaveId, status) =>
        set((state) => ({
          leaveRequests: state.leaveRequests.map((item) => (item.id === leaveId ? { ...item, status } : item)),
        })),
      createInvoice: (payload) =>
        set((state) => {
          const spaId = getCurrentSpaId(state);
          if (!spaId) {
            return {};
          }

          const spaInvoices = state.invoices.filter((invoice) => invoice.spaId === spaId).length + 1;
          const invoiceNumber = `INV-${new Date().getFullYear()}-${String(spaInvoices).padStart(3, '0')}`;

          const updatedProducts = state.products.map((product) => {
            const soldProduct = payload.items.find((item) => item.itemType === 'PRODUCT' && item.itemId === product.id);
            if (!soldProduct) {
              return product;
            }

            return {
              ...product,
              stock: Math.max(0, product.stock - soldProduct.quantity),
            };
          });

          return {
            invoices: [{ ...payload, spaId, id: buildId('invoice'), invoiceNumber, createdAt: now() }, ...state.invoices],
            products: updatedProducts,
          };
        }),
      hydrateOfflineState: (newState) => {
        set((state) => ({
          ...state,
          ...newState,
          messageTemplates: newState.messageTemplates && newState.messageTemplates.length > 0
            ? newState.messageTemplates
            : (state.messageTemplates || []),
          session: { ...state.session, ...newState.session },
        }));
      },
    }),
    {
      name: 'spapos-store',
      partialize: (state) => {
        // Only persist the active login session to keep the user logged in on page refresh
        return {
          session: state.session,
        } as any;
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        return {
          ...currentState,
          session: { ...currentState.session, ...persisted.session },
        };
      },
    },
  ),
);

export const useCurrentUser = () =>
  useAppStore((state) => state.users.find((user) => user.id === state.session.currentUserId));

export const useCurrentSpa = () =>
  useAppStore((state) => {
    const user = state.users.find((candidate) => candidate.id === state.session.currentUserId);
    return state.spas.find((spa) => spa.id === user?.spaId);
  });
