import { useMemo, useState } from 'react';
import { Calendar, CheckCircle, Filter, Plus, Search, Users, X } from 'lucide-react';
import { useAppStore, useCurrentSpa } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';

type HrStatusFilter = 'ALL' | 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export const HR = () => {
  const spa = useCurrentSpa();
  const staff = useAppStore((state) => state.staff);
  const attendance = useAppStore((state) => state.attendance);
  const payrolls = useAppStore((state) => state.payrolls);
  const leaveRequests = useAppStore((state) => state.leaveRequests);
  const markAttendance = useAppStore((state) => state.markAttendance);
  const createPayroll = useAppStore((state) => state.createPayroll);
  const addLeaveRequest = useAppStore((state) => state.addLeaveRequest);
  const updateLeaveStatus = useAppStore((state) => state.updateLeaveStatus);

  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'PAYROLL' | 'LEAVE_REQUESTS'>('ATTENDANCE');
  const [modalMode, setModalMode] = useState<'ATTENDANCE' | 'PAYROLL' | 'LEAVE' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState<HrStatusFilter>('ALL');
  const [attendanceForm, setAttendanceForm] = useState({
    staffId: '',
    employee: '',
    status: 'PRESENT',
    date: new Date().toISOString().split('T')[0],
  });
  const [payrollForm, setPayrollForm] = useState({
    staffId: '',
    employee: '',
    month: new Date().toISOString().slice(0, 7),
    basicSalary: 0,
    commission: 0,
    incentives: 0,
    deductions: 0,
    status: 'PENDING',
  });
  const [leaveForm, setLeaveForm] = useState({
    staffId: '',
    employee: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'PENDING',
  });

  const spaId = spa?.id ?? '';
  const spaStaff = useMemo(() => staff.filter((member) => member.spaId === spaId), [staff, spaId]);
  const attendanceRecords = attendance.filter((record) => record.spaId === spaId);
  const payrollRecords = payrolls.filter((record) => record.spaId === spaId);
  const leaveRecords = leaveRequests.filter((record) => record.spaId === spaId);

  const filteredAttendance = attendanceRecords.filter(
    (record) =>
      record.employee.toLowerCase().includes(searchTerm.toLowerCase()) &&
      record.date.startsWith(selectedMonth) &&
      (statusFilter === 'ALL' || record.status === statusFilter),
  );
  const filteredPayroll = payrollRecords.filter(
    (record) =>
      record.employee.toLowerCase().includes(searchTerm.toLowerCase()) &&
      record.month === selectedMonth &&
      (statusFilter === 'ALL' || record.status === statusFilter),
  );
  const filteredLeave = leaveRecords.filter(
    (record) =>
      record.employee.toLowerCase().includes(searchTerm.toLowerCase()) &&
      record.startDate.slice(0, 7) === selectedMonth &&
      (statusFilter === 'ALL' || record.status === statusFilter),
  );

  const hrSummary = useMemo(
    () => ({
      presentCount: filteredAttendance.filter((record) => record.status === 'PRESENT').length,
      pendingPayroll: filteredPayroll.filter((record) => record.status === 'PENDING').length,
      approvedLeaves: filteredLeave.filter((record) => record.status === 'APPROVED').length,
    }),
    [filteredAttendance, filteredLeave, filteredPayroll],
  );

  const syncEmployee = (staffId: string) => {
    const member = spaStaff.find((item) => item.id === staffId);
    return member ? `${member.firstName} ${member.lastName}` : '';
  };

  const handleAttendanceSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markAttendance({
      ...attendanceForm,
      status: attendanceForm.status as 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE',
    });
    setModalMode(null);
  };

  const handlePayrollSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createPayroll({
      staffId: payrollForm.staffId,
      employee: payrollForm.employee,
      month: payrollForm.month,
      basicSalary: Number(payrollForm.basicSalary),
      commission: Number(payrollForm.commission),
      incentives: Number(payrollForm.incentives),
      deductions: Number(payrollForm.deductions),
      status: payrollForm.status as 'PENDING' | 'PAID',
    });
    setModalMode(null);
  };

  const handleLeaveSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addLeaveRequest({
      staffId: leaveForm.staffId,
      employee: leaveForm.employee,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: leaveForm.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    });
    setModalMode(null);
  };

  if (!spa) {
    return <SpaWorkspaceFallback title="HR unavailable" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll</h1>
          <p className="text-gray-500 mt-1">Manage employee attendance, salaries, and leave requests.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setModalMode('ATTENDANCE')}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <CheckCircle className="w-4 h-4" /> Mark Attendance
          </button>
          <button onClick={() => setModalMode('PAYROLL')} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Process Payroll
          </button>
          <button onClick={() => setModalMode('LEAVE')} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Users className="w-4 h-4" /> New Leave
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Present This Month</div>
          <div className="mt-2 text-2xl font-bold text-green-700">{hrSummary.presentCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Pending Payroll</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{hrSummary.pendingPayroll}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Approved Leaves</div>
          <div className="mt-2 text-2xl font-bold text-primary-700">{hrSummary.approvedLeaves}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'ATTENDANCE' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'PAYROLL' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Payroll & Slips
          </button>
          <button
            onClick={() => setActiveTab('LEAVE_REQUESTS')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'LEAVE_REQUESTS' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Leave Requests
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employee..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
              <Filter className="w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as HrStatusFilter)}
                className="bg-transparent outline-none"
              >
                <option value="ALL">All statuses</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PAID">Paid</option>
              </select>
            </label>
          </div>
        </div>

        {activeTab === 'ATTENDANCE' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendance.map(rec => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-500 text-sm">{rec.date}</td>
                    <td className="p-4 font-medium text-gray-900">{rec.employee}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        rec.status === 'PRESENT'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : rec.status === 'HALF_DAY'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : rec.status === 'ON_LEAVE'
                              ? 'bg-primary-50 text-primary-700 border-primary-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-500 text-sm">Saved</td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'PAYROLL' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Month</th>
                  <th className="p-4 font-semibold">Net Salary</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayroll.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{record.employee}</td>
                    <td className="p-4 text-gray-600">{record.month}</td>
                    <td className="p-4 font-medium text-gray-900">{formatCurrency(record.netSalary)}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        record.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPayroll.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">No payroll records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Leave Window</th>
                  <th className="p-4 font-semibold">Reason</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeave.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{record.employee}</td>
                    <td className="p-4 text-gray-600">{record.startDate} to {record.endDate}</td>
                    <td className="p-4 text-gray-500">{record.reason}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        record.status === 'APPROVED'
                          ? 'bg-green-50 text-green-700'
                          : record.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => updateLeaveStatus(record.id, 'APPROVED')} disabled={record.status === 'APPROVED'} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed">Approve</button>
                        <button onClick={() => updateLeaveStatus(record.id, 'REJECTED')} disabled={record.status === 'REJECTED'} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLeave.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No leave requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                {modalMode === 'ATTENDANCE' ? 'Mark Attendance' : modalMode === 'PAYROLL' ? 'Process Payroll' : 'Create Leave Request'}
              </h2>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {modalMode === 'ATTENDANCE' && (
                <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                  <select value={attendanceForm.staffId} onChange={e => setAttendanceForm({...attendanceForm, staffId: e.target.value, employee: syncEmployee(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">Select employee</option>
                    {spaStaff.map((member) => (
                      <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="date" value={attendanceForm.date} onChange={e => setAttendanceForm({...attendanceForm, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                    <select value={attendanceForm.status} onChange={e => setAttendanceForm({...attendanceForm, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="HALF_DAY">Half Day</option>
                      <option value="ON_LEAVE">On Leave</option>
                    </select>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">Save Attendance</button>
                  </div>
                </form>
              )}
              {modalMode === 'PAYROLL' && (
                <form onSubmit={handlePayrollSubmit} className="space-y-4">
                  <select value={payrollForm.staffId} onChange={e => setPayrollForm({...payrollForm, staffId: e.target.value, employee: syncEmployee(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">Select employee</option>
                    {spaStaff.map((member) => (
                      <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
                    ))}
                  </select>
                  <input required type="month" value={payrollForm.month} onChange={e => setPayrollForm({...payrollForm, month: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="number" min="0" value={payrollForm.basicSalary} onChange={e => setPayrollForm({...payrollForm, basicSalary: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Basic salary" />
                    <input type="number" min="0" value={payrollForm.commission} onChange={e => setPayrollForm({...payrollForm, commission: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Commission" />
                    <input type="number" min="0" value={payrollForm.incentives} onChange={e => setPayrollForm({...payrollForm, incentives: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Incentives" />
                    <input type="number" min="0" value={payrollForm.deductions} onChange={e => setPayrollForm({...payrollForm, deductions: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Deductions" />
                  </div>
                  <select value={payrollForm.status} onChange={e => setPayrollForm({...payrollForm, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">Save Payroll</button>
                  </div>
                </form>
              )}
              {modalMode === 'LEAVE' && (
                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <select value={leaveForm.staffId} onChange={e => setLeaveForm({...leaveForm, staffId: e.target.value, employee: syncEmployee(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">Select employee</option>
                    {spaStaff.map((member) => (
                      <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                    <input required type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <textarea required rows={3} value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Reason" />
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">Save Leave</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
