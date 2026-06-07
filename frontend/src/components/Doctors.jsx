// Full Doctors component implementation (kept in sync with original Doctors.js)
import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { Calendar, Clock, FileText, User, Users, ChevronDown, Home, UserCircle, Hospital, Stethoscope, Activity, DollarSign, UserPlus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessagePopup from './MessagePopup';
import { API_BASE_URL } from '../utils/apiBase';

const Button = ({ children, variant = 'primary', className = '', ...props }) => (
	<button
		className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
			variant === 'primary'
				? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
				: variant === 'outline'
				? 'text-blue-600 border-blue-600 hover:bg-blue-50 focus:ring-blue-500'
				: 'text-blue-600 border-blue-600 hover:bg-blue-50 focus:ring-blue-500'
		} ${className}`}
		{...props}
	>
		{children}
	</button>
);

const Card = ({ children, className = '' }) => (
	<div className={`bg-white rounded-lg shadow-md ${className}`}>
		{children}
	</div>
);

const CardHeader = ({ children, icon: Icon }) => (
	<div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex items-center justify-between">
		{children}
		{Icon && <Icon className="h-5 w-5 text-blue-600 ml-2" />}
	</div>
);

const CardTitle = ({ children }) => (
	<h3 className="text-lg leading-6 font-medium text-gray-900">{children}</h3>
);

const CardContent = ({ children }) => (
	<div className="px-4 py-5 sm:p-6">{children}</div>
);

const CardFooter = ({ children }) => (
	<div className="px-4 py-4 sm:px-6">{children}</div>
);

const Input = ({ ...props }) => (
	<input
		className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-1 h-6"
		{...props}
	/>
);

const Label = ({ children, htmlFor }) => (
	<label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
		{children}
	</label>
);

const Select = ({ children, ...props }) => (
	<select
		className="mt-1 block w-full pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
		{...props}
	>
		{children}
	</select>
);

const doctorNavItems = [
	{ id: 'Dashboard', label: 'Dashboard', icon: Activity },
	{ id: 'Patients', label: 'Patients', icon: Users },
	{ id: 'Appointments', label: 'Appointments', icon: Calendar },
	{ id: 'Availability', label: 'Availability', icon: Clock },
	{ id: 'History', label: 'History', icon: FileText },
	{ id: 'Bills', label: 'Bills', icon: DollarSign },
	{ id: 'Profile', label: 'Profile', icon: UserCircle },
];

const weekDays = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
];

const defaultAvailability = {
	monday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
	tuesday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
	wednesday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
	thursday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
	friday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
	saturday: { startTime: '10:00', endTime: '14:00', isAvailable: false },
	sunday: { startTime: '00:00', endTime: '00:00', isAvailable: false },
};

const formatDay = (day) => day.charAt(0).toUpperCase() + day.slice(1);

const EmptyState = ({ children }) => (
	<p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-md px-4 py-6 text-center">
		{children}
	</p>
);

export default function DoctorDashboard() {
	const [showAppointments, setShowAppointments] = useState(false);
	const [showPatients, setShowPatients] = useState(false);
	const [activeTab, setActiveTab] = useState('Dashboard');
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingAvailability, setIsEditingAvailability] = useState(false);
	const [popup, setPopup] = useState(null);
	const [cancelConfirm, setCancelConfirm] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [completeConfirm, setCompleteConfirm] = useState(null);
	const [billDeleteConfirm, setBillDeleteConfirm] = useState(null);
	const [doctorInfo, setDoctorInfo] = useState(null);
	const [editedInfo, setEditedInfo] = useState(null);
	const [availability, setAvailability] = useState(null);
	const [editedAvailability, setEditedAvailability] = useState(null);
	const [patients, setPatients] = useState([]);
	const [appointmentData, setAppointmentData] = useState({
		patientId: '',
		date: '',
		time: '',
		reason: '',
		prescriptionId: '',
		medication: '',
		dosage: '',
		frequency: ''
	});
	const [availableSlots, setAvailableSlots] = useState([]);
	const [showScheduleForm, setShowScheduleForm] = useState(false);
	const [schedulingData, setSchedulingData] = useState({ patientId: '', date: '', time: '', reason: '' });
	const [prescribingFor, setPrescribingFor] = useState(null);
	const [prescriptionData, setPrescriptionData] = useState({ medication: '', dosage: '', frequency: '' });
	const [selectedAction, setSelectedAction] = useState('');
	const [existingPrescriptions, setExistingPrescriptions] = useState([]);
	const [appointments, setAppointments] = useState([]);
	const [historyData, setHistoryData] = useState({ appointments: [], prescriptions: [] });
	const [bills, setBills] = useState([]);
	const [selectedBill, setSelectedBill] = useState(null);
	const [selectedAppointmentForBill, setSelectedAppointmentForBill] = useState('');
	const [billConsultationFee, setBillConsultationFee] = useState(500);
	const navigate = useNavigate();

	const calculateBillTotal = (fee, taxRate) => {
		const tax = (fee * taxRate) / 100;
		return { tax: Math.round(tax), total: Math.round(fee + tax) };
	};
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
				setPopup(null);
				navigate('/login');
			},
			onCancel: () => setPopup(null),
		});
	};

	useEffect(() => {
		fetchDoctorProfile();
		fetchPatientsWithAppointments();
		fetchAppointments();
		fetchAvailability();
		fetchHistory();
		fetchBills();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (selectedAction === 'schedule-appointment' && appointmentData.patientId && appointmentData.date) {
			fetchAvailableSlots(appointmentData.patientId, appointmentData.date);
		} else {
			setAvailableSlots([]);
		}
	}, [appointmentData.patientId, appointmentData.date, selectedAction]);

	useEffect(() => {
		if (appointmentData.patientId) {
			fetchExistingPrescriptions(appointmentData.patientId);
		}
	}, [appointmentData.patientId]);

	const fetchAvailableSlots = async (patientId, date) => {
		if (!patientId || !date) return;
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}/doctor/available-slots?patientId=${patientId}&date=${date}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const slots = await response.json();
				setAvailableSlots(slots);
			} else {
				console.error('Failed to fetch available slots');
				setAvailableSlots([]);
			}
		} catch (error) {
			console.error('Error fetching available slots:', error);
			setAvailableSlots([]);
		}
	};

	const scheduleAppointment = async () => {
		try {
			const token = localStorage.getItem('token');
			const body = {
				patientId: schedulingData.patientId,
				date: schedulingData.date,
				time: schedulingData.time,
				reason: schedulingData.reason,
			};
			const response = await fetch(`${API_BASE_URL}/doctor/schedule-appointment`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});
			const data = await response.json();
			if (!response.ok) {
				showErrorPopup('Schedule Failed', data.error || 'Could not schedule appointment');
				return;
			}
			setPopup({ title: 'Scheduled', message: data.message || 'Appointment scheduled', variant: 'success', confirmLabel: 'OK' });
			setShowScheduleForm(false);
			setSchedulingData({ patientId: '', date: '', time: '', reason: '' });
			fetchAppointments();
			fetchPatientsWithAppointments();
		} catch (error) {
			showErrorPopup('Schedule Failed', 'Could not connect to server');
		}
	};

	const handleStartPrescribe = (appointment) => {
		setPrescribingFor(appointment);
		setPrescriptionData({ medication: '', dosage: '', frequency: '' });
	};

	const submitPrescription = async () => {
		if (!prescribingFor) return;
		try {
			const token = localStorage.getItem('token');
			const body = {
				patientId: prescribingFor.patientId?._id || prescribingFor.patientId,
				medication: prescriptionData.medication,
				dosage: prescriptionData.dosage,
				frequency: prescriptionData.frequency,
			};
			const response = await fetch(`${API_BASE_URL}/doctor/prescribe-medication`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});
			const data = await response.json();
			if (!response.ok) {
				showErrorPopup('Prescribe Failed', data.error || 'Could not save prescription');
				return;
			}
			setPopup({ title: 'Prescription Saved', message: data.message || 'Prescription recorded', variant: 'success', confirmLabel: 'OK' });
			setPrescribingFor(null);
			setPrescriptionData({ medication: '', dosage: '', frequency: '' });
			fetchHistory();
		} catch (error) {
			showErrorPopup('Prescribe Failed', 'Could not connect to server');
		}
	};

	const markBillPaid = async (billId) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}/bills/${billId}/payment-status`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ paymentStatus: 'paid' }),
			});
			const data = await response.json();
			if (!response.ok) {
				showErrorPopup('Update Failed', data.error || 'Could not update payment status');
				return;
			}
			setPopup({ title: 'Payment Updated', message: data.message || 'Bill marked as paid', variant: 'success', confirmLabel: 'OK' });
			fetchBills();
		} catch (error) {
			showErrorPopup('Update Failed', 'Could not connect to server');
		}
	};

	const fetchExistingPrescriptions = async (patientId) => {
		if (!patientId) return;
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}/doctor/prescriptions/${patientId}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const prescriptions = await response.json();
				setExistingPrescriptions(prescriptions);
			} else {
				console.error('Failed to fetch existing prescriptions');
				setExistingPrescriptions([]);
			}
		} catch (error) {
			console.error('Error fetching existing prescriptions:', error);
			setExistingPrescriptions([]);
		}
	};

	const showErrorPopup = (title, message) => {
		setPopup({
			title: title,
			message: message,
			variant: 'error',
			confirmLabel: 'OK',
		});
	};

	const fetchDoctorProfile = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				navigate('/login');
				return;
			}
			const response = await fetch(`${API_BASE_URL}/doctor/profile`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				setDoctorInfo(data);
				setEditedInfo(data);
			} else {
				console.error('Failed to fetch doctor profile');
			}
		} catch (error) {
			console.error('Error fetching doctor profile:', error);
		}
	};

	const fetchPatientsWithAppointments = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				navigate('/login');
				return;
			}
			const response = await fetch(`${API_BASE_URL}/doctor/patients-with-appointments`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				setPatients(await response.json());
			} else {
				console.error('Failed to fetch patients');
				setPatients([]);
			}
		} catch (error) {
			console.error('Error fetching patients:', error);
			setPatients([]);
		}
	};

	const fetchAppointments = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				navigate('/login');
				return;
			}
			const response = await fetch(`${API_BASE_URL}/doctor/appointments`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				setAppointments(await response.json());
			} else {
				console.error('Failed to fetch appointments');
				setAppointments([]);
			}
		} catch (error) {
			console.error('Error fetching appointments:', error);
			setAppointments([]);
		}
	};

	const fetchAvailability = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;
			const response = await fetch(`${API_BASE_URL}/doctor/availability`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				const normalizedAvailability = { ...defaultAvailability, ...(data || {}) };
				setAvailability(normalizedAvailability);
				setEditedAvailability(normalizedAvailability);
			}
		} catch (error) {
			console.error('Error fetching availability:', error);
		}
	};

	const fetchHistory = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;
			const response = await fetch(`${API_BASE_URL}/doctor/history`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				setHistoryData(await response.json());
			}
		} catch (error) {
			console.error('Error fetching history:', error);
		}
	};

	const fetchBills = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;
			const response = await fetch(`${API_BASE_URL}/bills/doctor/bills`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				setBills(await response.json());
			} else {
				setBills([]);
			}
		} catch (error) {
			console.error('Error fetching bills:', error);
			setBills([]);
		}
	};

	const updateAppointmentStatus = async (appointmentId, status) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}/doctor/appointments/${appointmentId}/status`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status }),
			});
			const data = await response.json();

			if (!response.ok) {
				showErrorPopup('Appointment Update Failed', data.error || 'Unable to update appointment.');
				return;
			}

			setPopup({
				title: 'Appointment Updated',
				message: data.message || `Appointment marked as ${status}.`,
				variant: 'success',
				confirmLabel: 'OK',
			});
			fetchAppointments();
			fetchHistory();
			fetchBills();
			fetchPatientsWithAppointments();
		} catch (error) {
			showErrorPopup('Appointment Update Failed', 'Could not connect to the server. Please try again.');
		}
	};

	const handleCompleteAppointment = (appointment) => {
		setPopup({
			title: 'Complete Appointment',
			message: `Mark ${appointment.patientId?.firstName || 'this patient'}'s appointment as completed?`,
			variant: 'confirm',
			confirmLabel: 'Complete',
			cancelLabel: 'Cancel',
			onConfirm: () => updateAppointmentStatus(appointment._id, 'completed'),
			onCancel: () => setPopup(null),
		});
	};

	const handleCancelAppointment = (appointment) => {
		setPopup({
			title: 'Cancel Appointment',
			message: `Cancel ${appointment.patientId?.firstName || 'this patient'}'s appointment?`,
			variant: 'confirm',
			confirmLabel: 'Cancel Appointment',
			cancelLabel: 'Keep',
			onConfirm: () => updateAppointmentStatus(appointment._id, 'cancelled'),
			onCancel: () => setPopup(null),
		});
	};

	const doctorName = doctorInfo ? `Dr. ${doctorInfo.firstName} ${doctorInfo.lastName}` : 'Doctor';
	const paidBills = bills.filter((bill) => bill.paymentStatus === 'paid').length;
	const unpaidBills = bills.filter((bill) => bill.paymentStatus !== 'paid').length;

	const handleAvailabilityChange = (day, field, value) => {
		setEditedAvailability((current) => ({
			...(current || defaultAvailability),
			[day]: {
				...((current || defaultAvailability)[day]),
				[field]: field === 'isAvailable' ? Boolean(value) : value,
			},
		}));
	};

	const handleSaveAvailability = async () => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}/doctor/availability`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ availability: editedAvailability || defaultAvailability }),
			});
			const data = await response.json();

			if (!response.ok) {
				showErrorPopup('Availability Update Failed', data.error || 'Unable to update availability.');
				return;
			}

			setAvailability(data.availability);
			setEditedAvailability(data.availability);
			setPopup({
				title: 'Availability Updated',
				message: 'Your appointment availability has been saved.',
				variant: 'success',
				confirmLabel: 'OK',
			});
		} catch (error) {
			showErrorPopup('Availability Update Failed', 'Could not connect to the server. Please try again.');
		}
	};

	const renderDashboard = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card><CardContent><p className="text-sm text-slate-500">Scheduled appointments</p><p className="text-3xl font-bold text-slate-900 mt-2">{appointments.length}</p></CardContent></Card>
				<Card><CardContent><p className="text-sm text-slate-500">Patients</p><p className="text-3xl font-bold text-slate-900 mt-2">{patients.length}</p></CardContent></Card>
				<Card><CardContent><p className="text-sm text-slate-500">Completed visits</p><p className="text-3xl font-bold text-slate-900 mt-2">{historyData.appointments.filter((appointment) => appointment.status === 'completed').length}</p></CardContent></Card>
				<Card><CardContent><p className="text-sm text-slate-500">Unpaid bills</p><p className="text-3xl font-bold text-slate-900 mt-2">{unpaidBills}</p></CardContent></Card>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader icon={Calendar}><CardTitle>Upcoming Appointments</CardTitle></CardHeader>
					<CardContent>
						{appointments.length === 0 ? <EmptyState>No scheduled appointments.</EmptyState> : (
							<div className="space-y-3">
								{appointments.slice(0, 4).map((appointment) => (
									<div key={appointment._id} className="rounded-md border border-slate-100 p-3">
										<p className="font-semibold text-slate-900">{appointment.patientId?.firstName} {appointment.patientId?.lastName}</p>
										<p className="text-sm text-slate-500">{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
										<p className="text-sm text-slate-600 mt-1">{appointment.reason}</p>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader icon={Users}><CardTitle>Recent Patients</CardTitle></CardHeader>
					<CardContent>
						{patients.length === 0 ? <EmptyState>No patients with appointments yet.</EmptyState> : (
							<div className="space-y-3">
								{patients.slice(0, 4).map((patient) => (
									<div key={patient._id} className="rounded-md border border-slate-100 p-3">
										<p className="font-semibold text-slate-900">{patient.firstName} {patient.lastName}</p>
										<p className="text-sm text-slate-500">{patient.email}</p>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);

	const renderPatients = () => (
		<Card>
			<CardHeader icon={Users}><CardTitle>Patients</CardTitle></CardHeader>
			<CardContent>
				{patients.length === 0 ? <EmptyState>No patients with appointments yet.</EmptyState> : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{patients.map((patient) => (
							<div key={patient._id} className="rounded-md border border-slate-100 p-4">
								<p className="font-semibold text-slate-900">{patient.firstName} {patient.lastName}</p>
								<p className="text-sm text-slate-500">{patient.email}</p>
								<p className="text-sm text-blue-700 mt-2">Next: {patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString() : 'None'}</p>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);

	const renderAppointments = () => (
		<Card>
			<CardHeader icon={Calendar}>
				<div className="flex items-center justify-between w-full gap-3">
					<CardTitle>Manage Appointments</CardTitle>
					<div className="flex items-center gap-2">
						<Button variant="outline" className="px-3 py-1" onClick={fetchAppointments}>Refresh</Button>
						<Button className="px-3 py-1" onClick={() => setShowScheduleForm((s) => !s)}>Schedule Appointment</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{showScheduleForm && (
					<div className="mb-4 p-4 border rounded-md bg-slate-50">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
							<div>
								<label className="block text-sm text-slate-700">Patient</label>
								<select value={schedulingData.patientId} onChange={(e) => { const v = e.target.value; setSchedulingData((s) => ({ ...s, patientId: v })); if (v && schedulingData.date) fetchAvailableSlots(v, schedulingData.date); }} className="mt-1 block w-full rounded-md border-gray-300">
									<option value="">Select patient</option>
									{patients.map((p) => (
										<option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm text-slate-700">Date</label>
								<input type="date" value={schedulingData.date} onChange={(e) => { const v = e.target.value; setSchedulingData((s) => ({ ...s, date: v })); if (schedulingData.patientId && v) fetchAvailableSlots(schedulingData.patientId, v); }} className="mt-1 block w-full rounded-md border-gray-300" />
							</div>
							<div>
								<label className="block text-sm text-slate-700">Time</label>
								<select value={schedulingData.time} onChange={(e) => setSchedulingData((s) => ({ ...s, time: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300">
									<option value="">Select time</option>
									{availableSlots.map((slot) => (
										<option key={slot} value={slot}>{slot}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm text-slate-700">Reason</label>
								<input value={schedulingData.reason} onChange={(e) => setSchedulingData((s) => ({ ...s, reason: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300" />
							</div>
						</div>
						<div className="mt-3 flex gap-2 justify-end">
							<Button onClick={scheduleAppointment}>Schedule</Button>
							<Button variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
						</div>
					</div>
				)}
				{appointments.length === 0 ? <EmptyState>No scheduled appointments.</EmptyState> : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-50 text-slate-600">
								<tr>
									<th className="text-left p-3">Patient</th>
									<th className="text-left p-3">Date</th>
									<th className="text-left p-3">Time</th>
									<th className="text-left p-3">Reason</th>
									<th className="text-left p-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{appointments.map((appointment) => (
									<React.Fragment key={appointment._id}>
										<tr className="border-t">
											<td className="p-3">{appointment.patientId?.firstName} {appointment.patientId?.lastName}</td>
											<td className="p-3">{new Date(appointment.date).toLocaleDateString()}</td>
											<td className="p-3">{appointment.time}</td>
											<td className="p-3">{appointment.reason}</td>
											<td className="p-3">
												<div className="flex flex-wrap gap-2">
													<Button className="px-3 py-1" onClick={() => handleCompleteAppointment(appointment)}>Complete</Button>
													<Button variant="outline" className="px-3 py-1" onClick={() => handleCancelAppointment(appointment)}>Cancel</Button>
													<Button variant="outline" className="px-3 py-1" onClick={() => handleStartPrescribe(appointment)}>Prescribe</Button>
												</div>
											</td>
										</tr>
										{prescribingFor && prescribingFor._id === appointment._id && (
											<tr>
												<td colSpan={5} className="p-3 bg-slate-50">
													<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
														<input placeholder="Medication" value={prescriptionData.medication} onChange={(e) => setPrescriptionData((s) => ({ ...s, medication: e.target.value }))} className="px-2 py-1 border rounded-md" />
														<input placeholder="Dosage" value={prescriptionData.dosage} onChange={(e) => setPrescriptionData((s) => ({ ...s, dosage: e.target.value }))} className="px-2 py-1 border rounded-md" />
														<input placeholder="Frequency" value={prescriptionData.frequency} onChange={(e) => setPrescriptionData((s) => ({ ...s, frequency: e.target.value }))} className="px-2 py-1 border rounded-md" />
													</div>
													<div className="mt-3 flex justify-end gap-2">
														<Button onClick={submitPrescription}>Save Prescription</Button>
														<Button variant="outline" onClick={() => setPrescribingFor(null)}>Cancel</Button>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);

	const renderAvailability = () => {
		const currentAvailability = editedAvailability || availability || defaultAvailability;

		return (
			<Card>
				<CardHeader icon={Clock}><CardTitle>Availability</CardTitle></CardHeader>
				<CardContent>
					<div className="space-y-3">
						{weekDays.map((day) => {
							const dayAvailability = currentAvailability[day] || defaultAvailability[day];
							return (
								<div key={day} className="grid grid-cols-1 md:grid-cols-[10rem_1fr_1fr] gap-3 items-center rounded-md border border-slate-100 p-4">
									<label className="inline-flex items-center gap-2 font-medium text-slate-900">
										<input
											type="checkbox"
											checked={dayAvailability.isAvailable}
											onChange={(event) => handleAvailabilityChange(day, 'isAvailable', event.target.checked)}
											className="h-4 w-4 accent-blue-600"
										/>
										{formatDay(day)}
									</label>
									<div>
										<Label htmlFor={`${day}-start`}>Start Time</Label>
										<Input
											id={`${day}-start`}
											type="time"
											value={dayAvailability.startTime}
											onChange={(event) => handleAvailabilityChange(day, 'startTime', event.target.value)}
											disabled={!dayAvailability.isAvailable}
										/>
									</div>
									<div>
										<Label htmlFor={`${day}-end`}>End Time</Label>
										<Input
											id={`${day}-end`}
											type="time"
											value={dayAvailability.endTime}
											onChange={(event) => handleAvailabilityChange(day, 'endTime', event.target.value)}
											disabled={!dayAvailability.isAvailable}
										/>
									</div>
								</div>
							);
						})}
					</div>
					<div className="mt-5 flex justify-end">
						<Button onClick={handleSaveAvailability}>Save Availability</Button>
					</div>
				</CardContent>
			</Card>
		);
	};

	const renderHistory = () => (
		<Card>
			<CardHeader icon={FileText}><CardTitle>History</CardTitle></CardHeader>
			<CardContent>
				{historyData.appointments.length === 0 ? <EmptyState>No completed or cancelled appointments yet.</EmptyState> : (
					<div className="space-y-3">
						{historyData.appointments.map((appointment) => (
							<div key={appointment._id} className="rounded-md border border-slate-100 p-3">
								<p className="font-semibold text-slate-900">{appointment.patientId?.firstName} {appointment.patientId?.lastName}</p>
								<p className="text-sm text-slate-500">{new Date(appointment.date).toLocaleDateString()} - {appointment.status}</p>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);

	const renderBills = () => (
		<Card>
			<CardHeader icon={DollarSign}><CardTitle>Bills</CardTitle></CardHeader>
			<CardContent>
				{bills.length === 0 ? <EmptyState>No bills generated yet.</EmptyState> : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{bills.map((bill) => (
							<div key={bill._id} className="rounded-md border border-slate-100 p-4">
								<div className="flex items-center justify-between">
									<p className="font-semibold text-slate-900">{bill.billNumber}</p>
									<span className={`text-xs uppercase px-2 py-1 rounded ${bill.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{bill.paymentStatus}</span>
								</div>
								<p className="text-sm text-slate-500 mt-2">{bill.patientId?.firstName} {bill.patientId?.lastName}</p>
								<p className="text-2xl font-bold text-slate-900 mt-3">Rs. {bill.totalAmount}</p>
								<div className="mt-3 flex items-center justify-end gap-2">
									{bill.paymentStatus !== 'paid' && (
										<Button onClick={() => setPopup({ title: 'Mark Bill Paid', message: `Mark bill ${bill.billNumber} as paid?`, variant: 'confirm', confirmLabel: 'Mark Paid', cancelLabel: 'Cancel', onConfirm: () => { setPopup(null); markBillPaid(bill._id); }, onCancel: () => setPopup(null) })}>Mark Paid</Button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
				<p className="text-sm text-slate-500 mt-4">Paid bills: {paidBills}</p>
			</CardContent>
		</Card>
	);

	const renderProfile = () => (
		<Card>
			<CardHeader icon={UserCircle}><CardTitle>Profile</CardTitle></CardHeader>
			<CardContent>
				{!doctorInfo ? <EmptyState>Profile details are loading.</EmptyState> : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div><p className="text-sm text-slate-500">Name</p><p className="font-semibold text-slate-900">{doctorName}</p></div>
						<div><p className="text-sm text-slate-500">Email</p><p className="font-semibold text-slate-900">{doctorInfo.email}</p></div>
						<div><p className="text-sm text-slate-500">Specialty</p><p className="font-semibold text-slate-900">{doctorInfo.specialty}</p></div>
					</div>
				)}
			</CardContent>
		</Card>
	);

	const renderActiveTab = () => {
		if (activeTab === 'Patients') return renderPatients();
		if (activeTab === 'Appointments') return renderAppointments();
		if (activeTab === 'Availability') return renderAvailability();
		if (activeTab === 'History') return renderHistory();
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
				onCancel={popup?.onCancel || (() => setPopup(null))}
				onClose={() => setPopup(null)}
			/>
			<header className="bg-white border-b border-slate-200 sticky top-0 z-10">
				<div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div className="flex items-center gap-3">
						<Hospital className="h-7 w-7 text-blue-600" />
						<div>
							<p className="font-bold text-xl text-slate-950">Hospital Management System</p>
							<p className="text-sm text-slate-500">Welcome, {doctorName}</p>
						</div>
					</div>
					<Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
				</div>
				<nav className="px-5 pb-3 flex gap-2 overflow-x-auto">
					{doctorNavItems.map(({ id, label, icon: Icon }) => (
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
					<p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Doctor Portal</p>
					<h1 className="text-3xl font-bold text-slate-950">{activeTab}</h1>
				</div>
				{renderActiveTab()}
			</main>
		</div>
	);

}
