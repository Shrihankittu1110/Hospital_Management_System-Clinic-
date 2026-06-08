import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ClipboardList,
  HeartPulse,
  Hospital,
  LogOut,
  Pill,
  Stethoscope,
  UserCircle,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessagePopup from './MessagePopup';
import { API_BASE_URL } from '../utils/apiBase';

const navItems = [
  { id: 'Dashboard', label: 'Dashboard', icon: HeartPulse },
  { id: 'Book Appointment', label: 'Book Appointment', icon: Calendar },
  { id: 'Doctors', label: 'Care Team', icon: Stethoscope },
  { id: 'Prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'Bills', label: 'Bills', icon: Wallet },
  { id: 'Profile', label: 'Profile', icon: UserCircle },
];

const Card = ({ children, className = '' }) => (
  <section className={`bg-white rounded-lg shadow-sm border border-blue-100 ${className}`}>
    {children}
  </section>
);

const CardHeader = ({ title, icon: Icon }) => (
  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {Icon && <Icon className="h-5 w-5 text-blue-600" />}
  </div>
);

const CardBody = ({ children }) => <div className="p-5">{children}</div>;

const EmptyState = ({ children }) => (
  <p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-md px-4 py-6 text-center">
    {children}
  </p>
);

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState({ appointments: [], prescriptions: [] });
  const [careTeam, setCareTeam] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: '',
  });
  const [cancelingAppointmentId, setCancelingAppointmentId] = useState(null);
  const [popup, setPopup] = useState(null);

  const getToken = () => localStorage.getItem('token');

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  const fetchJson = async (path, fallback) => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return fallback;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: authHeaders(),
    });

    if (response.status === 401 || response.status === 403) {
      navigate('/login');
      return fallback;
    }

    if (!response.ok) {
      return fallback;
    }

    return response.json();
  };

  const loadDashboard = async () => {
    const [profileData, appointmentData, historyData, teamData, doctorData, prescriptionData, billData] = await Promise.all([
      fetchJson('/patient/profile', null),
      fetchJson('/patient/appointments', []),
      fetchJson('/patient/history', { appointments: [], prescriptions: [] }),
      fetchJson('/patient/care-team', []),
      fetchJson('/doctor/all', []),
      fetchJson('/patient/prescriptions', []),
      fetchJson('/bills/patient/my-bills', []),
    ]);

    setPatient(profileData);
    setAppointments(appointmentData);
    setHistory(historyData);
    setCareTeam(teamData);
    setDoctors(doctorData);
    setPrescriptions(prescriptionData);
    setBills(billData);
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = () => {
    setPopup({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      variant: 'confirm',
      confirmLabel: 'Yes, Sign Out',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        navigate('/login');
      },
      onCancel: () => setPopup(null),
    });
  };

  const showSuccessPopup = (title, message) => {
    window.setTimeout(() => {
      setPopup({
        title,
        message,
        variant: 'success',
        confirmLabel: 'OK',
      });
    }, 0);
  };

  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
  const paidBills = bills.filter((bill) => bill.paymentStatus === 'paid').length;
  const unpaidBills = bills.filter((bill) => bill.paymentStatus !== 'paid').length;
  const today = new Date().toISOString().slice(0, 10);

  const handleBookingChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'doctorId' || name === 'date' ? { time: '' } : {}),
    }));
  };

  const loadAvailableSlots = async () => {
    if (!bookingForm.doctorId || !bookingForm.date) {
      setAvailableSlots([]);
      return;
    }

    setSlotsLoading(true);
    const slots = await fetchJson(
      `/patient/available-slots?doctorId=${bookingForm.doctorId}&date=${bookingForm.date}`,
      []
    );
    setAvailableSlots(slots);
    setSlotsLoading(false);
  };

  useEffect(() => {
    loadAvailableSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingForm.doctorId, bookingForm.date]);

  const handleBookAppointment = async (event) => {
    event.preventDefault();

    if (!bookingForm.doctorId || !bookingForm.date || !bookingForm.time || !bookingForm.reason.trim()) {
      setPopup({
        title: 'Missing Details',
        message: 'Please select a doctor, date, time, and reason before booking.',
        variant: 'error',
        confirmLabel: 'OK',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/patient/book-appointment`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setPopup({
          title: 'Booking Failed',
          message: data.error || 'Could not book appointment. Please try again.',
          variant: 'error',
          confirmLabel: 'OK',
        });
        return;
      }

      showSuccessPopup('Appointment Booked Successfully', data.message || 'Your appointment has been booked successfully.');
      setBookingForm({ doctorId: '', date: '', time: '', reason: '' });
      setAvailableSlots([]);
      loadDashboard();
    } catch (error) {
      setPopup({
        title: 'Booking Failed',
        message: 'Could not connect to the server. Please try again.',
        variant: 'error',
        confirmLabel: 'OK',
      });
    }
  };

  const cancelAppointment = async (appointmentId) => {
    setCancelingAppointmentId(appointmentId);

    try {
      const response = await fetch(`${API_BASE_URL}/patient/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        setPopup({
          title: 'Cancellation Failed',
          message: data.error || 'Could not cancel appointment. Please try again.',
          variant: 'error',
          confirmLabel: 'OK',
        });
        return;
      }

      showSuccessPopup('Appointment Cancelled', data.message || 'Your appointment has been cancelled.');
      loadDashboard();
    } catch (error) {
      setPopup({
        title: 'Cancellation Failed',
        message: 'Could not connect to the server. Please try again.',
        variant: 'error',
        confirmLabel: 'OK',
      });
    } finally {
      setCancelingAppointmentId(null);
    }
  };

  const requestCancelAppointment = (appointment) => {
    setPopup({
      title: 'Cancel Appointment',
      message: `Cancel your appointment with Dr. ${appointment.doctorId?.firstName || ''} ${appointment.doctorId?.lastName || ''}?`,
      variant: 'confirm',
      confirmLabel: 'Cancel Appointment',
      cancelLabel: 'Keep Appointment',
      onConfirm: () => cancelAppointment(appointment._id),
      onCancel: () => setPopup(null),
    });
  };

  const renderCancelButton = (appointment) => (
    <button
      type="button"
      onClick={() => requestCancelAppointment(appointment)}
      disabled={cancelingAppointmentId === appointment._id}
      className="inline-flex items-center justify-center rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {cancelingAppointmentId === appointment._id ? 'Cancelling...' : 'Cancel'}
    </button>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardBody><p className="text-sm text-slate-500">Upcoming appointments</p><p className="text-3xl font-bold text-slate-900 mt-2">{appointments.length}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">Care team</p><p className="text-3xl font-bold text-slate-900 mt-2">{careTeam.length}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">Prescriptions</p><p className="text-3xl font-bold text-slate-900 mt-2">{prescriptions.length}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">Unpaid bills</p><p className="text-3xl font-bold text-slate-900 mt-2">{unpaidBills}</p></CardBody></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Next Appointments" icon={Calendar} />
          <CardBody>
            {appointments.length === 0 ? <EmptyState>No upcoming appointments.</EmptyState> : (
              <div className="space-y-3">
                {appointments.slice(0, 4).map((appointment) => (
                  <div key={appointment._id} className="rounded-md border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</p>
                        <p className="text-sm text-slate-500">{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
                      </div>
                      {renderCancelButton(appointment)}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{appointment.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent Care History" icon={ClipboardList} />
          <CardBody>
            {history.appointments.length === 0 ? <EmptyState>No completed or cancelled visits yet.</EmptyState> : (
              <div className="space-y-3">
                {history.appointments.slice(0, 4).map((appointment) => (
                  <div key={appointment._id} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                    <div>
                      <p className="font-semibold text-slate-900">Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</p>
                      <p className="text-sm text-slate-500">{new Date(appointment.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-blue-700 bg-blue-50 px-2 py-1 rounded">{appointment.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );

  const renderBookAppointment = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] gap-6">
      <Card>
        <CardHeader title="Book Appointment" icon={Calendar} />
        <CardBody>
          <form onSubmit={handleBookAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="doctorId" className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
              <select
                id="doctorId"
                name="doctorId"
                value={bookingForm.doctorId}
                onChange={handleBookingChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                min={today}
                value={bookingForm.date}
                onChange={handleBookingChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-1">Available Time</label>
              <select
                id="time"
                name="time"
                value={bookingForm.time}
                onChange={handleBookingChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!bookingForm.doctorId || !bookingForm.date || slotsLoading || availableSlots.length === 0}
                required
              >
                <option value="">{slotsLoading ? 'Loading slots...' : availableSlots.length === 0 ? 'No slots available' : 'Select time'}</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {bookingForm.doctorId && bookingForm.date && (
                <div className="mt-3">
                  {slotsLoading ? (
                    <p className="text-sm text-slate-500">Checking doctor availability...</p>
                  ) : availableSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setBookingForm((current) => ({ ...current, time: slot }))}
                          className={`px-3 py-1.5 rounded-md text-sm border ${bookingForm.time === slot ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                      No slots for this date. Ask the doctor to enable this day in Availability or select another date.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <input
                id="reason"
                name="reason"
                value={bookingForm.reason}
                onChange={handleBookingChange}
                placeholder="Brief reason for visit"
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Book Appointment
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Scheduled Appointments" icon={ClipboardList} />
        <CardBody>
          {appointments.length === 0 ? <EmptyState>No scheduled appointments.</EmptyState> : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="rounded-md border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</p>
                      <p className="text-sm text-slate-500">{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
                    </div>
                    {renderCancelButton(appointment)}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{appointment.reason}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );

  const renderCareTeam = () => (
    <Card>
      <CardHeader title="Care Team" icon={Stethoscope} />
      <CardBody>
        {careTeam.length === 0 ? <EmptyState>Your care team will appear after appointments are booked.</EmptyState> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {careTeam.map((doctor) => (
              <div key={doctor._id} className="rounded-md border border-slate-100 p-4">
                <p className="font-semibold text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</p>
                <p className="text-sm text-slate-500">{doctor.specialty}</p>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );

  const renderPrescriptions = () => (
    <Card>
      <CardHeader title="Prescriptions" icon={Pill} />
      <CardBody>
        {prescriptions.length === 0 ? <EmptyState>No prescriptions found.</EmptyState> : (
          <div className="space-y-3">
            {prescriptions.map((prescription) => (
              <div key={prescription._id} className="rounded-md border border-slate-100 p-4">
                <p className="font-semibold text-slate-900">{prescription.medication}</p>
                <p className="text-sm text-slate-600">{prescription.dosage} - {prescription.frequency}</p>
                <p className="text-sm text-slate-500 mt-1">Dr. {prescription.doctorId?.firstName} {prescription.doctorId?.lastName}</p>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );

  const renderBills = () => (
    <Card>
      <CardHeader title="Bills" icon={Wallet} />
      <CardBody>
        {bills.length === 0 ? <EmptyState>No bills available.</EmptyState> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bills.map((bill) => (
              <div key={bill._id} className="rounded-md border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{bill.billNumber}</p>
                  <span className={`text-xs uppercase px-2 py-1 rounded ${bill.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{bill.paymentStatus}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Dr. {bill.doctorId?.firstName} {bill.doctorId?.lastName}</p>
                <p className="text-2xl font-bold text-slate-900 mt-3">Rs. {bill.totalAmount}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-slate-500 mt-4">Paid bills: {paidBills}</p>
      </CardBody>
    </Card>
  );

  const renderProfile = () => (
    <Card>
      <CardHeader title="Profile" icon={UserCircle} />
      <CardBody>
        {!patient ? <EmptyState>Profile details are loading.</EmptyState> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><p className="text-sm text-slate-500">Name</p><p className="font-semibold text-slate-900">{patientName}</p></div>
            <div><p className="text-sm text-slate-500">Email</p><p className="font-semibold text-slate-900">{patient.email}</p></div>
            <div><p className="text-sm text-slate-500">Role</p><p className="font-semibold text-slate-900 capitalize">{patient.role}</p></div>
          </div>
        )}
      </CardBody>
    </Card>
  );

  const renderContent = () => {
    if (activeTab === 'Book Appointment') return renderBookAppointment();
    if (activeTab === 'Doctors') return renderCareTeam();
    if (activeTab === 'Prescriptions') return renderPrescriptions();
    if (activeTab === 'Bills') return renderBills();
    if (activeTab === 'Profile') return renderProfile();
    return renderDashboard();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <MessagePopup
        open={Boolean(popup)}
        title={popup?.title}
        message={popup?.message}
        variant={popup?.variant || 'success'}
        confirmLabel={popup?.confirmLabel || 'OK'}
        cancelLabel={popup?.cancelLabel}
        onConfirm={popup?.onConfirm || (() => setPopup(null))}
        onCancel={popup?.onCancel}
        onClose={() => setPopup(null)}
      />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Hospital className="h-7 w-7 text-blue-600" />
            <div>
              <p className="font-bold text-xl text-slate-950">Hospital Management System</p>
              <p className="text-sm text-slate-500">Welcome, {patientName}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
        <nav className="px-5 pb-3 flex gap-2 overflow-x-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-5 py-6">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Patient Portal</p>
          <h1 className="text-3xl font-bold text-slate-950">{activeTab}</h1>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
