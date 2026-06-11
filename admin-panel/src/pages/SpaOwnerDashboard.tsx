import { Activity, Calendar, DollarSign, Users } from 'lucide-react';
import { useAppStore, useCurrentSpa } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';

export const SpaOwnerDashboard = () => {
  const spa = useCurrentSpa();
  const customers = useAppStore((state) => state.customers);
  const staff = useAppStore((state) => state.staff);
  const appointments = useAppStore((state) => state.appointments);
  const invoices = useAppStore((state) => state.invoices);

  const spaId = spa?.id ?? '';
  const spaCustomers = customers.filter((customer) => customer.spaId === spaId);
  const spaStaff = staff.filter((member) => member.spaId === spaId && member.isActive);
  const spaAppointments = appointments.filter((appointment) => appointment.spaId === spaId);
  const spaInvoices = invoices.filter((invoice) => invoice.spaId === spaId && invoice.status === 'PAID');

  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = spaAppointments.filter((appointment) => appointment.start.startsWith(today)).length;
  const todaysRevenue = spaInvoices
    .filter((invoice) => invoice.createdAt.startsWith(today))
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const upcomingAppointments = [...spaAppointments]
    .sort((a, b) => a.start.localeCompare(b.start))
    .filter((appointment) => appointment.status === 'SCHEDULED')
    .slice(0, 5);

  if (!spa) {
    return <SpaWorkspaceFallback title="Owner dashboard unavailable" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Spa Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back to {spa.name}. Your operating metrics update live as the app changes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
            <h3 className="text-2xl font-bold text-gray-900">{todaysAppointments}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Customers</p>
            <h3 className="text-2xl font-bold text-gray-900">{spaCustomers.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(todaysRevenue)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Staff</p>
            <h3 className="text-2xl font-bold text-gray-900">{spaStaff.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
        <div className="space-y-3">
          {upcomingAppointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div>
                <div className="font-semibold text-gray-900">{appointment.customerName}</div>
                <div className="text-sm text-gray-500">
                  {appointment.serviceName} with {appointment.therapistName}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600">
                {new Date(appointment.start).toLocaleString()}
              </div>
            </div>
          ))}
          {upcomingAppointments.length === 0 && <div className="text-gray-500 text-center py-8">No scheduled appointments yet.</div>}
        </div>
      </div>
    </div>
  );
};
