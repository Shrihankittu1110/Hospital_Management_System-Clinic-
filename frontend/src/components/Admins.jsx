// Full Admins component implementation (from Admins.js)
import React, { useState, useEffect } from 'react';
import { Calendar, Users, UserCircle, Eye, EyeOff, Hospital, Stethoscope, Activity, UserPlus, ShieldCheck } from 'lucide-react';
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

const LoadingMetric = () => (
	<div className="space-y-3 animate-pulse">
		<div className="h-8 w-20 rounded bg-slate-200" />
		<div className="h-3 w-32 rounded bg-slate-100" />
	</div>
);

const LoadingList = () => (
	<div className="space-y-3 animate-pulse">
		<div className="h-4 w-28 rounded bg-slate-200" />
		<div className="h-3 w-full rounded bg-slate-100" />
		<div className="h-3 w-2/3 rounded bg-slate-100" />
	</div>
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

const adminNavItems = [
	{ id: 'Dashboard', label: 'Dashboard', icon: Activity },
	{ id: 'Appointments', label: 'Appointments', icon: Calendar },
	{ id: 'Doctor', label: 'Doctor', icon: Stethoscope },
	{ id: 'Admin', label: 'Admin', icon: ShieldCheck },
	{ id: 'Patients', label: 'Patients', icon: Users },
	{ id: 'Profile', label: 'Profile', icon: UserCircle },
];

export default function AdminDashboard() {
	const [activeTab, setActiveTab] = useState('Dashboard');
	const [popup, setPopup] = useState(null);
	const [adminInfo, setAdminInfo] = useState(null);
	const [doctorData, setDoctorData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		specialty: '',
		licenseNumber: '',
		phoneNumber: '',
		password: ''
	});
	const [adminData, setAdminData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: ''
	});
	const [showDoctorPassword, setShowDoctorPassword] = useState(false);
	const [showAdminPassword, setShowAdminPassword] = useState(false);
	const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);
	const [totalDoctors, setTotalDoctors] = useState(0);
	const [totalPatients, setTotalPatients] = useState(0);
	const [doctorOverview, setDoctorOverview] = useState([]);
	const [patientOverview, setPatientOverview] = useState([]);
	const [appointments, setAppointments] = useState([]);
	const [dashboardLoading, setDashboardLoading] = useState(true);
	const [appointmentsLoading, setAppointmentsLoading] = useState(true);
	const [hospitalCapacity] = useState(10000);
	const navigate = useNavigate();

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

	const showErrorPopup = (title, message) => {
		setPopup({
			title: title,
			message: message,
			variant: 'error',
			confirmLabel: 'OK',
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

	useEffect(() => {
		fetchAdminProfile();
		loadDashboardData();
		fetchAppointments();
	}, []);

	const loadDashboardData = async () => {
		setDashboardLoading(true);
		await Promise.all([
			fetchTotalDoctors(),
			fetchTotalPatients(),
			fetchDoctorOverview(),
			fetchPatientOverview(),
		]);
		setDashboardLoading(false);
	};

	const fetchAdminProfile = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				// Handle not authenticated case
				return;
			}
			const response = await fetch(`${API_BASE_URL}/admin/profile`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				setAdminInfo(data);
			} else {
				// Handle error
				console.error('Failed to fetch admin profile');
			}
		} catch (error) {
			console.error('Error fetching admin profile:', error);
		}
	};

	const fetchTotalDoctors = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				return;
			}
			const response = await fetch(`${API_BASE_URL}/admin/total-doctors`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				setTotalDoctors(data.totalDoctors);
			} else {
				console.error('Failed to fetch total doctors');
			}
		} catch (error) {
			console.error('Error fetching total doctors:', error);
		}
	};

	const fetchTotalPatients = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				return;
			}
			const response = await fetch(`${API_BASE_URL}/admin/total-patients`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				setTotalPatients(data.totalPatients);
			} else {
				console.error('Failed to fetch total patients');
			}
		} catch (error) {
			console.error('Error fetching total patients:', error);
		}
	};

	const fetchDoctorOverview = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				return;
			}
			const response = await fetch(`${API_BASE_URL}/admin/doctor-overview`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				setDoctorOverview(data);
			} else {
				console.error('Failed to fetch doctor overview');
			}
		} catch (error) {
			console.error('Error fetching doctor overview:', error);
		}
	};

	const fetchPatientOverview = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				return;
			}
			const response = await fetch(`${API_BASE_URL}/admin/patient-overview`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				setPatientOverview(data);
			} else {
				console.error('Failed to fetch patient overview');
			}
		} catch (error) {
			console.error('Error fetching patient overview:', error);
		}
	};

	const fetchAppointments = async () => {
		try {
			setAppointmentsLoading(true);
			const token = localStorage.getItem('token');
			if (!token) {
				return;
			}
			const response = await fetch(`${API_BASE_URL}/admin/appointments`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				setAppointments(data);
			} else {
				console.error('Failed to fetch appointments');
			}
		} catch (error) {
			console.error('Error fetching appointments:', error);
		} finally {
			setAppointmentsLoading(false);
		}
	};

	const handleCompleteAppointment = (appointmentId) => {
		setPopup({
			title: 'Complete Appointment',
			message: 'Mark this appointment as completed?',
			variant: 'confirm',
			confirmLabel: 'Complete',
			cancelLabel: 'Cancel',
			onConfirm: () => updateAppointmentStatus(appointmentId, 'completed'),
			onCancel: () => setPopup(null),
		});
	};

	const updateAppointmentStatus = async (appointmentId, status) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}/admin/appointments/${appointmentId}/status`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			});
			const data = await response.json();

			if (response.ok) {
				setPopup({
					title: status === 'completed' ? 'Appointment Completed' : 'Appointment Cancelled',
					message: data.message || `Appointment marked as ${status}.`,
					variant: 'success',
					confirmLabel: 'OK',
				});
				fetchAppointments();
				loadDashboardData();
				return;
			}

			showErrorPopup(
				status === 'completed' ? 'Completion Failed' : 'Cancellation Failed',
				data.error || `Failed to mark appointment as ${status}.`
			);
		} catch (error) {
			showErrorPopup('Error', 'Error updating appointment. Please try again.');
		}
	};

	const handleCancelAppointment = (appointmentId) => {
		setPopup({
			title: 'Cancel Appointment',
			message: 'Are you sure you want to cancel this appointment?',
			variant: 'confirm',
			confirmLabel: 'Cancel Appointment',
			cancelLabel: 'Keep',
			onConfirm: () => updateAppointmentStatus(appointmentId, 'cancelled'),
			onCancel: () => setPopup(null),
		});
	};

	const renderDashboard = () => {
		const occupancyRate = ((totalPatients / hospitalCapacity) * 100).toFixed(2);
		return (
			<>
				{dashboardLoading && (
					<p className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
						Loading dashboard data, please wait...
					</p>
				)}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card>
						<CardHeader icon={Stethoscope}>
							<CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
						</CardHeader>
						<CardContent>
							{dashboardLoading ? <LoadingMetric /> : (
								<>
									<div className="text-2xl font-bold">{totalDoctors}</div>
									<p className="text-xs text-gray-500">Active medical staff</p>
								</>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardHeader icon={Users}>
							<CardTitle className="text-sm font-medium">Total Patients</CardTitle>
						</CardHeader>
						<CardContent>
							{dashboardLoading ? <LoadingMetric /> : (
								<>
									<div className="text-2xl font-bold">{totalPatients}</div>
									<p className="text-xs text-gray-500">Currently admitted</p>
								</>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardHeader icon={Activity}>
							<CardTitle className="text-sm font-medium">Hospital Occupancy</CardTitle>
						</CardHeader>
						<CardContent>
							{dashboardLoading ? <LoadingMetric /> : (
								<>
									<div className="text-2xl font-bold">{occupancyRate}%</div>
									<p className="text-xs text-gray-500">Bed occupancy rate</p>
								</>
							)}
						</CardContent>
					</Card>
				</div>
				<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
					<Card>
						<CardHeader icon={Stethoscope}>
							<CardTitle className="text-sm font-medium">Doctor Overview</CardTitle>
						</CardHeader>
						<CardContent>
							{dashboardLoading ? <LoadingList /> : (
								<>
									<div className="text-2xl font-bold">{doctorOverview.length}</div>
									<p className="text-xs text-gray-500">Total doctors on staff</p>
								</>
							)}
						</CardContent>
						<CardFooter className="p-2">...
						</CardFooter>
					</Card>
				</div>
			</>
		);
	};

	const handleDoctorInputChange = (event) => {
		const { name, value } = event.target;
		setDoctorData((current) => ({ ...current, [name]: value }));
	};

	const handleAdminInputChange = (event) => {
		const { name, value } = event.target;
		setAdminData((current) => ({ ...current, [name]: value }));
	};

	const handleAddDoctor = async (event) => {
		event.preventDefault();

		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}/admin/add-doctor`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(doctorData),
			});
			const data = await response.json();

			if (!response.ok) {
				showErrorPopup('Doctor Creation Failed', data.error || 'Unable to add doctor.');
				return;
			}

			setDoctorData({
				firstName: '',
				lastName: '',
				email: '',
				specialty: '',
				licenseNumber: '',
				phoneNumber: '',
				password: '',
			});
			showSuccessPopup('Doctor Created Successfully', data.message || 'Doctor account created successfully.');
			loadDashboardData();
		} catch (error) {
			showErrorPopup('Doctor Creation Failed', 'Could not connect to the server. Please try again.');
		}
	};

	const handleAddAdmin = async (event) => {
		event.preventDefault();

		if (adminData.password !== adminData.confirmPassword) {
			showErrorPopup('Admin Creation Failed', 'Passwords do not match.');
			return;
		}

		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_BASE_URL}/admin/add-admin`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					firstName: adminData.firstName,
					lastName: adminData.lastName,
					email: adminData.email,
					password: adminData.password,
				}),
			});
			const data = await response.json();

			if (!response.ok) {
				showErrorPopup('Admin Creation Failed', data.error || 'Unable to add admin.');
				return;
			}

			setAdminData({
				firstName: '',
				lastName: '',
				email: '',
				password: '',
				confirmPassword: '',
			});
			showSuccessPopup('Admin Created Successfully', data.message || 'Admin account created successfully.');
		} catch (error) {
			showErrorPopup('Admin Creation Failed', 'Could not connect to the server. Please try again.');
		}
	};

	const renderAppointments = () => (
		<Card>
			<CardHeader icon={Calendar}>
				<CardTitle>Appointment Management</CardTitle>
			</CardHeader>
			<CardContent>
				{appointmentsLoading ? (
					<div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-6 text-center">
						<p className="text-sm font-medium text-blue-700">Loading appointments, please wait...</p>
						<div className="mt-4 grid gap-3 animate-pulse">
							<div className="h-4 rounded bg-blue-100" />
							<div className="h-4 rounded bg-blue-100" />
							<div className="h-4 rounded bg-blue-100" />
						</div>
					</div>
				) : appointments.length === 0 ? (
					<p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-md px-4 py-6 text-center">
						No scheduled appointments.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-50 text-slate-600">
								<tr>
									<th className="text-left p-3">Patient</th>
									<th className="text-left p-3">Doctor</th>
									<th className="text-left p-3">Date</th>
									<th className="text-left p-3">Time</th>
									<th className="text-left p-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{appointments.map((appointment) => (
									<tr key={appointment._id} className="border-t">
										<td className="p-3">{appointment.patientId?.firstName} {appointment.patientId?.lastName}</td>
										<td className="p-3">Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</td>
										<td className="p-3">{new Date(appointment.date).toLocaleDateString()}</td>
										<td className="p-3">{appointment.time}</td>
										<td className="p-3">
											<div className="flex gap-2">
												<Button className="px-3 py-1" onClick={() => handleCompleteAppointment(appointment._id)}>Complete</Button>
												<Button variant="outline" className="px-3 py-1" onClick={() => handleCancelAppointment(appointment._id)}>Cancel</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);

	const renderDoctor = () => (
		<div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-6">
			<Card>
				<CardHeader icon={UserPlus}>
					<CardTitle>Doctor</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleAddDoctor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="doctorFirstName">First Name</Label>
							<Input id="doctorFirstName" name="firstName" value={doctorData.firstName} onChange={handleDoctorInputChange} required />
						</div>
						<div>
							<Label htmlFor="doctorLastName">Last Name</Label>
							<Input id="doctorLastName" name="lastName" value={doctorData.lastName} onChange={handleDoctorInputChange} required />
						</div>
						<div>
							<Label htmlFor="doctorEmail">Email</Label>
							<Input id="doctorEmail" name="email" type="email" value={doctorData.email} onChange={handleDoctorInputChange} required />
						</div>
						<div>
							<Label htmlFor="doctorSpecialty">Specialty</Label>
							<Input id="doctorSpecialty" name="specialty" value={doctorData.specialty} onChange={handleDoctorInputChange} required />
						</div>
						<div>
							<Label htmlFor="licenseNumber">License Number</Label>
							<Input id="licenseNumber" name="licenseNumber" value={doctorData.licenseNumber} onChange={handleDoctorInputChange} required />
						</div>
						<div>
							<Label htmlFor="phoneNumber">Phone Number</Label>
							<Input id="phoneNumber" name="phoneNumber" value={doctorData.phoneNumber} onChange={handleDoctorInputChange} required />
						</div>
						<div className="md:col-span-2">
							<Label htmlFor="doctorPassword">Password</Label>
							<div className="relative">
								<Input id="doctorPassword" name="password" type={showDoctorPassword ? 'text' : 'password'} value={doctorData.password} onChange={handleDoctorInputChange} required />
								<button type="button" onClick={() => setShowDoctorPassword((value) => !value)} className="absolute inset-y-0 right-3 flex items-center text-slate-400">
									{showDoctorPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>
						<div className="md:col-span-2">
							<Button type="submit">Add Doctor</Button>
						</div>
					</form>
				</CardContent>
			</Card>
			<Card>
				<CardHeader icon={Stethoscope}>
					<CardTitle>Doctor Overview</CardTitle>
				</CardHeader>
				<CardContent>
					{dashboardLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{[1, 2, 3, 4].map((item) => (
								<div key={item} className="rounded-md border border-slate-100 p-4 animate-pulse">
									<div className="h-4 w-32 rounded bg-slate-200" />
									<div className="mt-3 h-3 w-24 rounded bg-slate-100" />
									<div className="mt-4 h-3 w-20 rounded bg-blue-100" />
								</div>
							))}
						</div>
					) : doctorOverview.length === 0 ? (
						<p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-md px-4 py-6 text-center">
							No doctor overview data yet.
						</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{doctorOverview.map((doctor) => (
								<div key={`${doctor.name}-${doctor.specialty}`} className="rounded-md border border-slate-100 p-4">
									<p className="font-semibold text-slate-900">{doctor.name}</p>
									<p className="text-sm text-slate-500">{doctor.specialty}</p>
									<p className="text-sm text-blue-700 mt-2">{doctor.patients} patients</p>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);

	const renderAdmin = () => (
		<Card>
			<CardHeader icon={ShieldCheck}>
				<CardTitle>Admin</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
					<div>
						<Label htmlFor="adminFirstName">First Name</Label>
						<Input id="adminFirstName" name="firstName" value={adminData.firstName} onChange={handleAdminInputChange} required />
					</div>
					<div>
						<Label htmlFor="adminLastName">Last Name</Label>
						<Input id="adminLastName" name="lastName" value={adminData.lastName} onChange={handleAdminInputChange} required />
					</div>
					<div className="md:col-span-2">
						<Label htmlFor="adminEmail">Email</Label>
						<Input id="adminEmail" name="email" type="email" value={adminData.email} onChange={handleAdminInputChange} required />
					</div>
					<div>
						<Label htmlFor="adminPassword">Password</Label>
						<div className="relative">
							<Input id="adminPassword" name="password" type={showAdminPassword ? 'text' : 'password'} value={adminData.password} onChange={handleAdminInputChange} required />
							<button type="button" onClick={() => setShowAdminPassword((value) => !value)} className="absolute inset-y-0 right-3 flex items-center text-slate-400">
								{showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>
					<div>
						<Label htmlFor="adminConfirmPassword">Confirm Password</Label>
						<div className="relative">
							<Input id="adminConfirmPassword" name="confirmPassword" type={showAdminConfirmPassword ? 'text' : 'password'} value={adminData.confirmPassword} onChange={handleAdminInputChange} required />
							<button type="button" onClick={() => setShowAdminConfirmPassword((value) => !value)} className="absolute inset-y-0 right-3 flex items-center text-slate-400">
								{showAdminConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>
					<div className="md:col-span-2">
						<Button type="submit">Add Admin</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);

	const renderPatientOverview = () => (
		<Card>
			<CardHeader icon={Users}>
				<CardTitle>Patient Overview</CardTitle>
			</CardHeader>
			<CardContent>
				{dashboardLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{[1, 2, 3].map((item) => (
							<div key={item} className="rounded-md border border-slate-100 p-4 animate-pulse">
								<div className="h-4 w-32 rounded bg-slate-200" />
								<div className="mt-3 h-3 w-24 rounded bg-slate-100" />
							</div>
						))}
					</div>
				) : patientOverview.length === 0 ? (
					<p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-md px-4 py-6 text-center">
						No patient overview data yet.
					</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{patientOverview.map((patient) => (
							<div key={patient.name} className="rounded-md border border-slate-100 p-4">
								<p className="font-semibold text-slate-900">{patient.name}</p>
								<p className="text-sm text-blue-700 mt-2">{patient.appointments} appointments</p>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);

	const renderProfile = () => (
		<Card>
			<CardHeader icon={ShieldCheck}>
				<CardTitle>Admin Profile</CardTitle>
			</CardHeader>
			<CardContent>
				{!adminInfo ? (
					<p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-md px-4 py-6 text-center">
						Profile details are loading.
					</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div><p className="text-sm text-slate-500">Name</p><p className="font-semibold text-slate-900">{adminInfo.firstName} {adminInfo.lastName}</p></div>
						<div><p className="text-sm text-slate-500">Email</p><p className="font-semibold text-slate-900">{adminInfo.email}</p></div>
						<div><p className="text-sm text-slate-500">Role</p><p className="font-semibold text-slate-900 capitalize">{adminInfo.role}</p></div>
					</div>
				)}
			</CardContent>
		</Card>
	);

	const renderActiveTab = () => {
		if (activeTab === 'Appointments') return renderAppointments();
		if (activeTab === 'Doctor') return renderDoctor();
		if (activeTab === 'Admin') return renderAdmin();
		if (activeTab === 'Patients') return renderPatientOverview();
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
				onConfirm={popup?.onConfirm}
				onCancel={popup?.onCancel}
				onClose={() => setPopup(null)}
			/>
			<header className="bg-white border-b border-slate-200 sticky top-0 z-10">
				<div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div className="flex items-center space-x-3">
						<Hospital className="h-7 w-7 text-blue-600" />
						<div>
							<p className="font-bold text-xl text-slate-950">Hospital Management System</p>
							<p className="text-sm text-slate-500">Admin control center</p>
						</div>
					</div>
					<Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
				</div>
				<nav className="px-5 pb-3 flex gap-2 overflow-x-auto">
					{adminNavItems.map(({ id, label, icon: Icon }) => (
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
					<p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Admin Portal</p>
					<h1 className="text-3xl font-bold text-slate-950">{activeTab}</h1>
				</div>
				{renderActiveTab()}
			</main>
		</div>
	);
}
