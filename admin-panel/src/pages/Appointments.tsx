import { useMemo, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, X } from 'lucide-react';
import { useAppStore, useCurrentSpa } from '../lib/store';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

export const Appointments = () => {
  const spa = useCurrentSpa();
  const appointments = useAppStore((state) => state.appointments);
  const addAppointment = useAppStore((state) => state.addAppointment);
  const updateAppointmentStatus = useAppStore((state) => state.updateAppointmentStatus);
  const allTemplates = useAppStore((state) => state.messageTemplates);
  const templates = allTemplates || [];
  const customers = useAppStore((state) => state.customers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickSend = (appointment: any, channel: 'WA' | 'SMS' | 'MAIL') => {
    const customer = customers.find(
      (c) => `${c.firstName} ${c.lastName}`.toLowerCase() === appointment.customerName.toLowerCase()
    );
    const phone = customer?.phone || '9876543210';
    const email = customer?.email || 'customer@example.com';

    const confirmTemplate = templates.find((t) => t.templateType === 'APPOINTMENT_CONFIRMATION')?.message || 
      'Hello {{customer_name}}, your slot for {{service_name}} is confirmed. Date: {{appointment_date}} Time: {{appointment_time}}';

    const formattedMessage = confirmTemplate
      .replace(/{{customer_name}}/g, appointment.customerName)
      .replace(/{{service_name}}/g, appointment.serviceName)
      .replace(/{{appointment_date}}/g, new Date(appointment.start).toLocaleDateString())
      .replace(/{{appointment_time}}/g, new Date(appointment.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      .replace(/{{spa_name}}/g, spa?.name || 'Zen Wellness');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (channel === 'WA') {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(formattedMessage)}`, '_blank');
    } else if (channel === 'SMS') {
      window.open(`sms:${cleanPhone}?&body=${encodeURIComponent(formattedMessage)}`, '_blank');
    } else if (channel === 'MAIL') {
      window.open(`mailto:${email}?subject=Appointment Confirmation&body=${encodeURIComponent(formattedMessage)}`, '_blank');
    }
  };

  const [formData, setFormData] = useState({
    customerName: '',
    service: '',
    therapist: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    duration: 60
  });

  const spaId = spa?.id ?? '';
  const events = useMemo<CalendarEvent[]>(
    () =>
      appointments
        .filter((appointment) => appointment.spaId === spaId)
        .map((appointment) => ({
          id: appointment.id,
          title: `${appointment.serviceName} - ${appointment.customerName} (Therapist: ${appointment.therapistName})`,
          start: new Date(appointment.start),
          end: new Date(appointment.end),
        })),
    [appointments, spaId],
  );

  const upcomingAppointments = appointments
    .filter((appointment) => appointment.spaId === spaId)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);

  if (!spa) {
    return <SpaWorkspaceFallback title="Appointments unavailable" />;
  }

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${formData.date}T${formData.startTime}:00`);
    const end = new Date(start.getTime() + formData.duration * 60000);

    addAppointment({
      customerName: formData.customerName,
      serviceName: formData.service,
      therapistName: formData.therapist,
      start: start.toISOString(),
      end: end.toISOString(),
      status: 'SCHEDULED',
      notes: '',
    });
    setIsModalOpen(false);
    setFormData({
      customerName: '',
      service: '',
      therapist: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      duration: 60
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-1">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Upcoming</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upcomingAppointments.map((appointment) => (
            <div key={appointment.id} className="rounded-xl border border-gray-100 p-4">
              <div className="font-semibold text-gray-900">{appointment.customerName}</div>
              <div className="text-sm text-gray-500">{appointment.serviceName}</div>
              <div className="mt-2 text-sm text-gray-600">{appointment.therapistName}</div>
              <div className="mt-1 text-sm text-gray-500">{new Date(appointment.start).toLocaleString()}</div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
                  className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
                >
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => updateAppointmentStatus(appointment.id, 'CANCELLED')}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span className="font-semibold">Remind:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleQuickSend(appointment, 'WA')}
                    className="text-emerald-600 hover:underline font-bold"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleQuickSend(appointment, 'SMS')}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    SMS
                  </button>
                  <button
                    onClick={() => handleQuickSend(appointment, 'MAIL')}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Email
                  </button>
                </div>
              </div>
            </div>
          ))}
          {upcomingAppointments.length === 0 && <div className="text-sm text-gray-500">No appointments scheduled.</div>}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">New Appointment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input required type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Alice Johnson" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <input required type="text" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Massage" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Therapist</label>
                    <input required type="text" value={formData.therapist} onChange={e => setFormData({...formData, therapist: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. John Doe" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <select value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">Save Appointment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
