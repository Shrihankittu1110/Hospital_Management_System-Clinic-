import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Users, ChevronDown, Home, UserCircle, Eye, EyeOff, Hospital, Stethoscope, Activity, DollarSign, UserPlus, ShieldCheck } from 'lucide-react';
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

export default function AdminDashboard() {
  const [showDoctors, setShowDoctors] = useState(false);
  const [showPatients, setShowPatients] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [popup, setPopup] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [editedInfo, setEditedInfo] = useState(null);
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
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [doctorOverview, setDoctorOverview] = useState([]);
  const [patientOverview, setPatientOverview] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [completeConfirm, setCompleteConfirm] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
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

  useEffect(() => {
    fetchAdminProfile();
    fetchTotalDoctors();
    fetchTotalPatients();
    fetchDoctorOverview();
    fetchPatientOverview();
    fetchAppointments();
  }, []);

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
        setEditedInfo(data);
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
    }
  };

  const handleCompleteAppointment = (appointmentId) => {
    setCompleteConfirm({
      title: 'Complete Appointment',
      message: 'Mark this appointment as completed?',
      appointmentId: appointmentId
    });
  };

  const confirmCompleteAppointment = async () => {
    if (!completeConfirm) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/appointments/${completeConfirm.appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      });
      if (response.ok) {
        setCompleteConfirm(null);
        setPopup({
          title: 'Appointment Completed',
          message: 'Appointment marked as completed successfully.',
          variant: 'success',
          confirmLabel: 'OK',
        });
        fetchAppointments();
      } else {
        const errorData = await response.json();
        setCompleteConfirm(null);
        showErrorPopup('Completion Failed', `Failed to mark appointment as complete: ${errorData.error}`);
      }
    } catch (error) {
      setCompleteConfirm(null);
      showErrorPopup('Error', 'Error marking appointment complete. Please try again.');
    }
  };

  const handleCancelAppointment = (appointmentId) => {
    setCancelConfirm({
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment?',
      appointmentId: appointmentId
    });
  };

  const confirmCancelAppointment = async () => {
    if (!cancelConfirm) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/appointments/${cancelConfirm.appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (response.ok) {
        setCancelConfirm(null);
        setPopup({
          title: 'Appointment Cancelled',
          message: 'Appointment cancelled successfully.',
          variant: 'success',
          confirmLabel: 'OK',
        });
        fetchAppointments();
      } else {
        const errorData = await response.json();
        setCancelConfirm(null);
        showErrorPopup('Cancellation Failed', `Failed to cancel appointment: ${errorData.error}`);
      }
    } catch (error) {
      setCancelConfirm(null);
      showErrorPopup('Error', 'Error cancelling appointment. Please try again.');
    }
  };

  const renderDashboard = () => {
    const occupancyRate = ((totalPatients / hospitalCapacity) * 100).toFixed(2);
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader icon={Stethoscope}>
              <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDoctors}</div>
              <p className="text-xs text-gray-500">Active medical staff</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader icon={Users}>
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatients}</div>
              <p className="text-xs text-gray-500">Currently admitted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader icon={Activity}>
              <CardTitle className="text-sm font-medium">Hospital Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupancyRate}%</div>
              <p className="text-xs text-gray-500">Bed occupancy rate</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader icon={Stethoscope}>
              <CardTitle className="text-sm font-medium">Doctor Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctorOverview.length}</div>
              <p className="text-xs text-gray-500">Total doctors on staff</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button 
                variant="ghost" 
                className="w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
                onClick={() => setShowDoctors(!showDoctors)}
              >
                {showDoctors ? "Hide" : "View All"} Doctors
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showDoctors ? "rotate-180" : ""}`} />
              </Button>
            </CardFooter>
            {showDoctors && (
              <div className="px-4 pb-4">
                {doctorOverview.map((doctor, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-t">
                    <div>
                      <p className="text-sm font-medium">{doctor.name}</p>
                      <p className="text-xs text-gray-500">{doctor.specialty}</p>
                    </div>
                    <p className="text-sm">{doctor.patients} patients</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <CardHeader icon={Users}>
              <CardTitle className="text-sm font-medium">Patient Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientOverview.length}</div>
              <p className="text-xs text-gray-500">Total admitted patients</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button 
                variant="ghost" 
                className="w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
                onClick={() => setShowPatients(!showPatients)}
              >
                {showPatients ? "Hide" : "View All"} Patients
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showPatients ? "rotate-180" : ""}`} />
              </Button>
            </CardFooter>
            {showPatients && (
              <div className="px-4 pb-4">
                {patientOverview.map((patient, index) => (
                  <div key={index} className="py-2 border-t">
                    <p className="text-sm font-medium">{patient.name}</p>
                    <p className="text-xs text-gray-500">
                      Total Appointments: {patient.appointments}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span>New doctor onboarded: Dr. Emily Taylor</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>Emergency ward capacity increased by 10 beds</span>
                </li>
                <li className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span>Monthly budget report generated</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Staff performance review - Next week</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Update hospital policies - Due in 3 days</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Department heads meeting - Tomorrow, 10:00 AM</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const renderProfile = () => {
    if (!adminInfo) {
      return <div>Loading profile...</div>;
    }

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setEditedInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await fetch(`${API_BASE_URL}/admin/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: editedInfo.firstName,
            lastName: editedInfo.lastName,
            email: editedInfo.email
          })
        });
        if (response.ok) {
          const updatedAdmin = await response.json();
          setAdminInfo(updatedAdmin.admin);
          setIsEditing(false);
        } else {
          const errorData = await response.json();
          showErrorPopup('Update Failed', `Error: ${errorData.error}`);
        }
      } catch (error) {
        showErrorPopup('Error', 'An error occurred. Please try again.');
      }
    };

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={isEditing ? editedInfo.firstName : adminInfo.firstName}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={isEditing ? editedInfo.lastName : adminInfo.lastName}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={isEditing ? editedInfo.email : adminInfo.email}
                onChange={handleInputChange}
                readOnly={!isEditing}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="mr-2">Save</Button>
              <Button onClick={() => setIsEditing(false)} variant="outline">Cancel</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="ml-auto">Edit Profile</Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderAddDoctor = () => {
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setDoctorData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showErrorPopup('Not Authenticated', 'You are not authenticated. Please log in.');
          navigate('/login');
          return;
        }
        const response = await fetch(`${API_BASE_URL}/admin/add-doctor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(doctorData)
        });
        if (response.ok) {
          setPopup({
            title: 'Doctor Added',
            message: 'Doctor added successfully',
            variant: 'success',
            confirmLabel: 'OK',
          });
          setDoctorData({
            firstName: '',
            lastName: '',
            email: '',
            specialty: '',
            licenseNumber: '',
            phoneNumber: '',
            password: ''
          });
        } else if (response.status === 401) {
          showErrorPopup('Session Expired', 'Your session has expired. Please log in again.');
          navigate('/login');
        } else {
          const errorData = await response.json();
          showErrorPopup('Error', `Error: ${errorData.error}`);
        }
      } catch (error) {
        showErrorPopup('Error', 'An error occurred. Please try again.');
      }
    };

    return (
      <>
        <MessagePopup
          open={Boolean(popup)}
          title={popup?.title}
          message={popup?.message}
          variant={popup?.variant || 'success'}
          confirmLabel={popup?.confirmLabel || 'OK'}
          onClose={() => setPopup(null)}
        />
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Add New Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" value={doctorData.firstName} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" value={doctorData.lastName} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={doctorData.email} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Select id="specialty" name="specialty" value={doctorData.specialty} onChange={handleInputChange} required>
                  <option value="">Choose a specialty</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="oncology">Oncology</option>
                  <option value="orthopedics">Orthopedics</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input id="licenseNumber" name="licenseNumber" value={doctorData.licenseNumber} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" name="phoneNumber" type="tel" value={doctorData.phoneNumber} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showDoctorPassword ? "text" : "password"}
                    value={doctorData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                  >
                    {showDoctorPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="sr-only">
                      {showDoctorPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              <Button type="submit" className="ml-auto">Add Doctor</Button>
            </form>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderAddAdmin = () => {
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setAdminData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (adminData.password !== adminData.confirmPassword) {
        showErrorPopup('Validation Error', "Passwords don't match");
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showErrorPopup('Not Authenticated', 'You are not authenticated. Please log in.');
          navigate('/login');
          return;
        }
        const response = await fetch(`${API_BASE_URL}/admin/add-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(adminData)
        });
        if (response.ok) {
          setPopup({
            title: 'Admin Added',
            message: 'Admin added successfully',
            variant: 'success',
            confirmLabel: 'OK',
          });
          setAdminData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
          });
        } else if (response.status === 401) {
          showErrorPopup('Session Expired', 'Your session has expired. Please log in again.');
          navigate('/login');
        } else {
          const errorData = await response.json();
          showErrorPopup('Error', `Error: ${errorData.error}`);
        }
      } catch (error) {
        showErrorPopup('Error', 'An error occurred. Please try again.');
      }
    };

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={adminData.firstName} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={adminData.lastName} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={adminData.email} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showAdminPassword ? "text" : "password"}
                  value={adminData.password}
                  onChange={handleInputChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                >
                  {showAdminPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">
                    {showAdminPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showAdminPassword ? "text" : "password"}
                  value={adminData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="ml-auto">Add Admin</Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  const renderAppointments = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {appointments.map((appointment, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {appointment.patientId?.firstName} {appointment.patientId?.lastName} → {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.date ? `${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}` : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleCompleteAppointment(appointment._id)}
                      className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleCancelAppointment(appointment._id)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No active appointments
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-blue-600">
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
      <MessagePopup
        open={Boolean(completeConfirm)}
        title={completeConfirm?.title}
        message={completeConfirm?.message}
        variant="confirm"
        confirmLabel="Mark Complete"
        cancelLabel="Cancel"
        onConfirm={confirmCompleteAppointment}
        onCancel={() => setCompleteConfirm(null)}
        onClose={() => setCompleteConfirm(null)}
      />
      <MessagePopup
        open={Boolean(cancelConfirm)}
        title={cancelConfirm?.title}
        message={cancelConfirm?.message}
        variant="confirm"
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep It"
        onConfirm={confirmCancelAppointment}
        onCancel={() => setCancelConfirm(null)}
        onClose={() => setCancelConfirm(null)}
      />
      <header className="bg-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Hospital className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl">Hospital Management System</span>
        </div>
        <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
      </header>
      <nav className="bg-blue-700 text-white p-4">
        <ul className="flex space-x-4 justify-center">
          <li>
            <Button
              variant={activeTab === 'Dashboard' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Dashboard' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Dashboard')}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </li>
          <li>
            <Button
              variant={activeTab === 'Profile' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Profile' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Profile')}
            >
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </li>
          <li>
            <Button
              variant={activeTab === 'Add Doctor' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Add Doctor' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Add Doctor')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Doctor
            </Button>
          </li>
          <li>
            <Button
              variant={activeTab === 'Add Admin' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Add Admin' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Add Admin')}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </li>
          <li>
            <Button
              variant={activeTab === 'Appointments' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Appointments' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Appointments')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </Button>
          </li>
        </ul>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Welcome, {adminInfo ? `${adminInfo.firstName} ${adminInfo.lastName}` : 'Admin'}</h1>
        {activeTab === 'Dashboard' && renderDashboard()}
        {activeTab === 'Profile' && renderProfile()}
        {activeTab === 'Add Doctor' && renderAddDoctor()}
        {activeTab === 'Add Admin' && renderAddAdmin()}
        {activeTab === 'Appointments' && renderAppointments()}
      </main>
    </div>
  );
}