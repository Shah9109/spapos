import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { SpaOwnerLayout } from './layouts/SpaOwnerLayout';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SpaOwnerDashboard } from './pages/SpaOwnerDashboard';
import { Customers } from './pages/Customers';
import { Staff } from './pages/Staff';
import { Appointments } from './pages/Appointments';
import { POS } from './pages/POS';
import { Invoices } from './pages/Invoices';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { HR } from './pages/HR';
import { Settings } from './pages/Settings';
import { Billing } from './pages/Billing';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SuperAdminLicenses } from './pages/SuperAdminLicenses';
import { SuperAdminPlans } from './pages/SuperAdminPlans';
import { SuperAdminSettings } from './pages/SuperAdminSettings';
import { SuperAdminSpas } from './pages/SuperAdminSpas';
import { SuperAdminMarketing } from './pages/SuperAdminMarketing';
import { PlanGate } from './components/PlanGate';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Marketing } from './pages/Marketing';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Legacy route redirect */}
          <Route path="/dashboard" element={<Navigate to="/owner" replace />} />

          {/* Protected Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="spas" element={<SuperAdminSpas />} />
            <Route path="plans" element={<SuperAdminPlans />} />
            <Route path="licenses" element={<SuperAdminLicenses />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="marketing" element={<SuperAdminMarketing />} />
          </Route>

          {/* Protected Spa Owner Routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute role="SPA_OWNER">
                <SpaOwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SpaOwnerDashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="staff" element={<PlanGate requiredPlanType="PREMIUM"><Staff /></PlanGate>} />
            <Route path="appointments" element={<PlanGate requiredPlanType="STANDARD"><Appointments /></PlanGate>} />
            <Route path="pos" element={<PlanGate requiredPlanType="STANDARD"><POS /></PlanGate>} />
            <Route path="invoices" element={<PlanGate requiredPlanType="STANDARD"><Invoices /></PlanGate>} />
            <Route path="inventory" element={<PlanGate requiredPlanType="STANDARD"><Inventory /></PlanGate>} />
            <Route path="finance" element={<PlanGate requiredPlanType="PREMIUM"><Finance /></PlanGate>} />
            <Route path="hr" element={<PlanGate requiredPlanType="PREMIUM"><HR /></PlanGate>} />
            <Route path="settings" element={<Settings />} />
            <Route path="billing" element={<Billing />} />
            <Route path="marketing" element={<Marketing />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
