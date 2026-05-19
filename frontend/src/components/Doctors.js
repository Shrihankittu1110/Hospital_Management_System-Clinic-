import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { Calendar, Clock, FileText, User, Users, ChevronDown, Home, UserCircle, Hospital, Stethoscope, Activity, DollarSign, UserPlus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessagePopup from './MessagePopup';

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
      const response = await fetch(`http://localhost:5000/api/doctor/available-slots?patientId=${patientId}&date=${date}`, {
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

  const fetchExistingPrescriptions = async (patientId) => {
    if (!patientId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/doctor/prescriptions/${patientId}`, {
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
      const response = await fetch('http://localhost:5000/api/doctor/profile', {
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

  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const response = await fetch('http://localhost:5000/api/doctor/availability', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
        setEditedAvailability(data);
      } else {
        console.error('Failed to fetch availability');
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const saveAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/doctor/availability', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ availability: editedAvailability })
      });
      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability);
        setIsEditingAvailability(false);
        setPopup({
          title: 'Success',
          message: 'Availability updated successfully',
          variant: 'success',
          confirmLabel: 'OK'
        });
      } else {
        showErrorPopup('Error', 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      showErrorPopup('Error', 'Server error while updating availability');
    }
  };

  const fetchPatientsWithAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/doctor/patients-with-appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        console.error('Failed to fetch patients with appointments');
      }
    } catch (error) {
      console.error('Error fetching patients with appointments:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/doctor/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter for scheduled appointments and sort by date/time ascending
        const sortedAppointments = data
          .filter(appointment => appointment.status === 'scheduled')
          .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateA.getTime() - dateB.getTime();
            }
            // If same date, compare times (assuming HH:MM format or 12-hour format)
            return a.time.localeCompare(b.time);
          });
        setAppointments(sortedAppointments);
      } else {
        console.error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/doctor/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        console.error('Failed to fetch doctor history');
      }
    } catch (error) {
      console.error('Error fetching doctor history:', error);
    }
  };

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/bills/doctor/bills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      } else {
        console.error('Failed to fetch doctor bills');
      }
    } catch (error) {
      console.error('Error fetching doctor bills:', error);
    }
  };

  const handleGenerateBill = async () => {
    if (!selectedAppointmentForBill) {
      setPopup({
        title: 'Error',
        message: 'Please select an appointment',
        variant: 'error',
        confirmLabel: 'OK'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bills/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: selectedAppointmentForBill,
          consultationFee: billConsultationFee
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPopup({
          title: 'Success',
          message: `Bill ${data.bill.billNumber} generated successfully!`,
          variant: 'success',
          confirmLabel: 'OK'
        });
        setSelectedAppointmentForBill('');
        setBillConsultationFee(500);
        fetchBills();
      } else {
        const error = await response.json();
        setPopup({
          title: 'Error',
          message: error.error || 'Failed to generate bill',
          variant: 'error',
          confirmLabel: 'OK'
        });
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      setPopup({
        title: 'Error',
        message: 'Server error while generating bill',
        variant: 'error',
        confirmLabel: 'OK'
      });
    }
  };
  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader icon={Calendar}>
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.length}
            </div>
          </CardContent>
          <CardFooter className="p-2">
            <Button 
              variant="ghost" 
              className="w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
              onClick={() => setShowAppointments(!showAppointments)}
            >
              {showAppointments ? "Hide" : "View"} Appointments
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAppointments ? "rotate-180" : ""}`} />
            </Button>
          </CardFooter>
          {showAppointments && (
            <div className="px-4 pb-4">
              {appointments.length > 0 ? (
                appointments.map((appointment, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-t">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {appointment.patientId?.firstName || 'Unknown'} {appointment.patientId?.lastName || 'Patient'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.reason || 'No reason provided'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <p className="text-sm text-right whitespace-nowrap">
                        {appointment.date ? `${new Date(appointment.date).toLocaleDateString()} • ` : ''}
                        {appointment.time}
                      </p>
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
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                    No appointments scheduled
                </p>
              )}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader icon={Users}>
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-gray-500">Total patients under care</p>
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
              {patients.map((patient, index) => (
                <div key={index} className="py-2 border-t">
                  <p className="text-sm font-medium">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('en-GB') : 'N/A'} | Next: {patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString('en-GB') : 'N/A'}
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
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Completed appointment with John Doe</span>
              </li>
              <li className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Updated medical records for Alice Johnson</span>
              </li>
              <li className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span>New patient registered: David Lee</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Staff meeting - Tomorrow, 9:00 AM</span>
              </li>
              <li className="flex items-center space-x-2">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                <span>Cardiology conference - 20th May</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>On-call duty - 22nd May</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfile = () => {
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setEditedInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/doctor/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editedInfo)
        });
        if (response.ok) {
          const updatedProfile = await response.json();
          setDoctorInfo(updatedProfile);
          setIsEditing(false);
          setPopup({
            title: 'Profile Updated',
            message: 'Your doctor profile has been saved successfully.',
            variant: 'success',
            confirmLabel: 'OK',
          });
        } else {
          const errorData = await response.json();
          showErrorPopup('Update Failed', `Failed to update doctor profile: ${errorData.error}`);
        }
      } catch (error) {
        showErrorPopup('Error', 'Error updating doctor profile. Please try again.');
      }
    };

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Doctor Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={isEditing ? editedInfo.firstName : doctorInfo?.firstName}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={isEditing ? editedInfo.lastName : doctorInfo?.lastName}
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
                value={isEditing ? editedInfo.email : doctorInfo?.email}
                onChange={handleInputChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                name="specialty"
                value={isEditing ? editedInfo.specialty : doctorInfo?.specialty}
                onChange={handleInputChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                value={isEditing ? editedInfo.licenseNumber : doctorInfo?.licenseNumber}
                onChange={handleInputChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={isEditing ? editedInfo.phoneNumber : doctorInfo?.phoneNumber}
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

  const renderHistory = () => {
    const appointmentsHistory = historyData.appointments || [];
    const prescriptionsHistory = historyData.prescriptions || [];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader icon={Calendar}>
            <CardTitle>Appointment History</CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsHistory.length > 0 ? (
              <div className="space-y-4">
                {appointmentsHistory.map((appointment) => (
                  <div key={appointment._id} className="border-t pt-3 first:border-t-0 first:pt-0">
                    <p className="text-sm font-medium">
                      {appointment.patientId?.firstName || 'Unknown'} {appointment.patientId?.lastName || 'Patient'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'} • {appointment.time}
                    </p>
                    <p className="text-xs text-gray-500">Reason: {appointment.reason}</p>
                    <p className="text-xs font-semibold capitalize text-blue-600">Status: {appointment.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No completed appointments found.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader icon={FileText}>
            <CardTitle>Prescription History</CardTitle>
          </CardHeader>
          <CardContent>
            {prescriptionsHistory.length > 0 ? (
              <div className="space-y-4">
                {prescriptionsHistory.map((prescription) => (
                  <div key={prescription._id} className="border-t pt-3 first:border-t-0 first:pt-0">
                    <p className="text-sm font-medium">{prescription.medication}</p>
                    <p className="text-xs text-gray-500">{prescription.dosage} - {prescription.frequency}</p>
                    <p className="text-xs text-gray-500">
                      Patient: {prescription.patientId?.firstName || 'Unknown'} {prescription.patientId?.lastName || 'Patient'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Date: {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No prescriptions found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const handleDeleteBill = (billId) => {
    setBillDeleteConfirm({ billId });
  };

  const confirmDeleteBill = async () => {
    const billId = billDeleteConfirm.billId;
    setBillDeleteConfirm(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bills/${billId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setPopup({
          title: 'Success',
          message: 'Bill deleted successfully',
          variant: 'success',
          confirmLabel: 'OK',
          onConfirm: () => {
            setPopup(null);
            fetchBills();
          }
        });
      } else {
        const error = await response.json();
        setPopup({
          title: 'Error',
          message: error.error || 'Failed to delete bill',
          variant: 'error',
          confirmLabel: 'OK',
          onConfirm: () => setPopup(null)
        });
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      setPopup({
        title: 'Error',
        message: 'Error deleting bill',
        variant: 'error',
        confirmLabel: 'OK',
        onConfirm: () => setPopup(null)
      });
    }
  };

  const renderBills = () => {
    const unpaidBills = bills.filter(bill => bill.paymentStatus === 'unpaid' || bill.paymentStatus === 'partial');

    const handlePaymentStatusUpdate = async (billId, newStatus) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/bills/${billId}/payment-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ paymentStatus: newStatus })
        });
        if (response.ok) {
          const result = await response.json();
          const updatedBill = result.bill;

          setBills(prevBills => prevBills.map(bill => (
            bill._id === updatedBill._id ? updatedBill : bill
          )));

          setSelectedBill(prevSelectedBill => (
            prevSelectedBill && prevSelectedBill._id === updatedBill._id
              ? updatedBill
              : prevSelectedBill
          ));

          fetchAppointments();
          fetchHistory();
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
    };

    const handlePrint = (bill) => {
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill ${bill.billNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .bill-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              .section-title { font-weight: bold; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f0f0f0; }
              .total { font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>HOSPITAL MANAGEMENT SYSTEM</h2>
              <h3>Medical Bill</h3>
            </div>
            <div class="bill-info">
              <div>
                <strong>Bill Number:</strong> ${bill.billNumber}<br/>
                <strong>Date:</strong> ${new Date(bill.issueDate).toLocaleDateString()}<br/>
                <strong>Due Date:</strong> ${new Date(bill.dueDate).toLocaleDateString()}
              </div>
              <div>
                <strong>Doctor:</strong> Dr. ${bill.doctorId?.firstName || 'N/A'} ${bill.doctorId?.lastName || ''}<br/>
                <strong>Patient:</strong> ${bill.patientId?.firstName || 'N/A'} ${bill.patientId?.lastName || ''}<br/>
                <strong>Status:</strong> <span style="color: ${bill.paymentStatus === 'paid' ? 'green' : 'red'}">${bill.paymentStatus.toUpperCase()}</span>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Charges</div>
              <table>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
                <tr>
                  <td>Consultation Fee</td>
                  <td>₹${bill.consultationFee || 0}</td>
                </tr>
                <tr>
                  <td>Tax (${bill.taxRate || 0}%)</td>
                  <td>₹${bill.taxAmount || 0}</td>
                </tr>
                <tr class="total">
                  <td>Total Amount</td>
                  <td>₹${bill.totalAmount || 0}</td>
                </tr>
              </table>
            </div>
            <div class="footer">
              <p>This is an electronically generated document. No signature required.</p>
              <p>For inquiries, please contact the hospital administration.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    };

    return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Generate New Bill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="select-appointment">Select Appointment</Label>
                <Select
                  id="select-appointment"
                  value={selectedAppointmentForBill}
                  onChange={(e) => setSelectedAppointmentForBill(e.target.value)}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Choose an appointment --</option>
                  {appointments.map(apt => (
                    <option key={apt._id} value={apt._id}>
                      {new Date(apt.date).toLocaleDateString()} at {apt.time} - {apt.patientId?.firstName || 'Patient'} ({apt.reason})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="consultation-fee">Consultation Fee (₹)</Label>
                <Input
                  id="consultation-fee"
                  type="number"
                  value={billConsultationFee}
                  onChange={(e) => setBillConsultationFee(Number(e.target.value))}
                  min="0"
                  step="100"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">Tax (10%) will be calculated automatically</p>
              </div>

              <div className="bg-blue-50 p-4 rounded border-2 border-blue-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Consultation Fee:</span>
                  <span className="font-medium">₹{billConsultationFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Tax (10%):</span>
                  <span className="font-medium">₹{calculateBillTotal(billConsultationFee, 10).tax}</span>
                </div>
                <div className="border-t border-blue-300 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-lg text-blue-600">₹{calculateBillTotal(billConsultationFee, 10).total}</span>
                </div>
              </div>
              <Button
                onClick={handleGenerateBill}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Generate Bill
              </Button>
            </div>
          </CardContent>
        </Card>

        {unpaidBills.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Outstanding Bills ({unpaidBills.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unpaidBills.map(bill => (
                  <div key={bill._id} className="bg-white p-4 rounded border-l-4 border-red-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{bill.billNumber}</p>
                        <p className="text-sm text-gray-600">Patient: {bill.patientId?.firstName || 'Unknown'} {bill.patientId?.lastName || ''}</p>
                        <p className="text-sm text-gray-600">Amount: ₹{bill.totalAmount || 0}</p>
                        <p className="text-xs text-gray-500">Issued: {new Date(bill.issueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handlePrint(bill)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Print
                        </button>
                        {bill.paymentStatus !== 'paid' && (
                          <button
                            onClick={() => handlePaymentStatusUpdate(bill._id, 'paid')}
                            className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                          >
                            Mark as Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBill(bill._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Bills ({bills.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {bills.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3">Bill Number</th>
                      <th className="text-left p-3">Patient</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map(bill => (
                      <tr key={bill._id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{bill.billNumber}</td>
                        <td className="p-3">{bill.patientId?.firstName || 'Unknown'} {bill.patientId?.lastName || ''}</td>
                        <td className="text-right p-3">₹{bill.totalAmount || 0}</td>
                        <td className="text-center p-3">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            bill.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {bill.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="text-blue-600 hover:underline text-xs mr-2"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handlePrint(bill)}
                            className="text-green-600 hover:underline text-xs mr-2"
                          >
                            Print
                          </button>
                          {bill.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => handleDeleteBill(bill._id)}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No bills issued yet.</p>
            )}
          </CardContent>
        </Card>

        {selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Bill Details - {selectedBill.billNumber}</CardTitle>
                  <button
                    onClick={() => setSelectedBill(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">PATIENT</p>
                    <p className="font-semibold">{selectedBill.patientId?.firstName || 'N/A'} {selectedBill.patientId?.lastName || ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">DOCTOR</p>
                    <p className="font-semibold">Dr. {selectedBill.doctorId?.firstName || 'N/A'} {selectedBill.doctorId?.lastName || ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">BILL NUMBER</p>
                    <p className="font-semibold">{selectedBill.billNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">STATUS</p>
                    <p className={`font-semibold ${
                      selectedBill.paymentStatus === 'paid' ? 'text-green-600' :
                      selectedBill.paymentStatus === 'partial' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedBill.paymentStatus.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consultation Fee:</span>
                    <span className="font-medium">₹{selectedBill.consultationFee || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({selectedBill.taxRate || 0}%):</span>
                    <span className="font-medium">₹{selectedBill.taxAmount || 0}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between bg-blue-50 p-2 rounded">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-lg">₹{selectedBill.totalAmount || 0}</span>
                  </div>
                </div>

                <div className="border-t pt-4 text-sm text-gray-600 space-y-1">
                  <p>Issued: {new Date(selectedBill.issueDate).toLocaleDateString()}</p>
                  <p>Due: {new Date(selectedBill.dueDate).toLocaleDateString()}</p>
                </div>

                <div className="border-t pt-4 flex gap-2">
                  <button
                    onClick={() => handlePrint(selectedBill)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Print Bill
                  </button>
                  <select
                    value={selectedBill.paymentStatus}
                    onChange={(e) => handlePaymentStatusUpdate(selectedBill._id, e.target.value)}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    <option value="unpaid">Mark as Unpaid</option>
                    <option value="partial">Mark as Partial</option>
                    <option value="paid">Mark as Paid</option>
                  </select>
                  <button
                    onClick={() => setSelectedBill(null)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderAvailability = () => {
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleAvailabilityChange = (day, field, value) => {
      setEditedAvailability(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value
        }
      }));
    };

    const handleIsAvailableToggle = (day) => {
      setEditedAvailability(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          isAvailable: !prev[day].isAvailable
        }
      }));
    };

    if (!availability) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Doctor Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading availability...</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Doctor Availability Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {daysOfWeek.map((day, index) => (
              <div key={day} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{dayLabels[index]}</h3>
                  {isEditingAvailability && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedAvailability[day]?.isAvailable || false}
                        onChange={() => handleIsAvailableToggle(day)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Available</span>
                    </label>
                  )}
                </div>
                
                {editedAvailability[day]?.isAvailable && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${day}-start`}>Start Time</Label>
                      <Input
                        id={`${day}-start`}
                        type="time"
                        value={isEditingAvailability ? editedAvailability[day]?.startTime : availability[day]?.startTime}
                        onChange={(e) => handleAvailabilityChange(day, 'startTime', e.target.value)}
                        readOnly={!isEditingAvailability}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${day}-end`}>End Time</Label>
                      <Input
                        id={`${day}-end`}
                        type="time"
                        value={isEditingAvailability ? editedAvailability[day]?.endTime : availability[day]?.endTime}
                        onChange={(e) => handleAvailabilityChange(day, 'endTime', e.target.value)}
                        readOnly={!isEditingAvailability}
                      />
                    </div>
                  </div>
                )}
                {!editedAvailability[day]?.isAvailable && (
                  <p className="text-gray-500 italic">Not available</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          {isEditingAvailability ? (
            <>
              <Button onClick={saveAvailability} className="mr-2">Save Availability</Button>
              <Button onClick={() => {
                setEditedAvailability(availability);
                setIsEditingAvailability(false);
              }} variant="outline">Cancel</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditingAvailability(true)} className="ml-auto">Edit Availability</Button>
          )}
        </CardFooter>
      </Card>
    );
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
      const response = await fetch(`http://localhost:5000/api/doctor/appointments/${cancelConfirm.appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const response = await fetch(`http://localhost:5000/api/doctor/appointments/${completeConfirm.appointmentId}/status`, {
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
        // Remove from state immediately then refresh
        setAppointments(prevAppointments => prevAppointments.filter(appointment => appointment._id !== completeConfirm.appointmentId));
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

  const confirmDeletePrescription = async () => {
    if (!deleteConfirm) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/doctor/prescriptions/${deleteConfirm.prescriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setDeleteConfirm(null);
        setPopup({
          title: 'Prescription Deleted',
          message: 'Prescription deleted successfully.',
          variant: 'success',
          confirmLabel: 'OK',
        });
        fetchExistingPrescriptions(appointmentData.patientId);
      } else {
        const errorData = await response.json();
        setDeleteConfirm(null);
        showErrorPopup('Delete Failed', `Failed to delete prescription: ${errorData.error}`);
        console.error('Error details:', errorData.details);
      }
    } catch (error) {
      setDeleteConfirm(null);
      showErrorPopup('Error', 'Error deleting prescription. Please try again.');
      console.error('Error deleting prescription:', error);
    }
  };

  const renderPatientManagement = () => {
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setAppointmentData(prev => {
        const nextData = { ...prev, [name]: value };
        if (name === 'patientId' || name === 'date') {
          nextData.time = '';
        }
        return nextData;
      });

      if (name === 'action') {
        setSelectedAction(value);
      }

      if (name === 'patientId') {
        fetchExistingPrescriptions(value);
      }
    };

    const handleEditPrescription = (prescription) => {
      setAppointmentData({
        ...appointmentData,
        prescriptionId: prescription._id,
        medication: prescription.medication || '',
        dosage: prescription.dosage || '',
        frequency: prescription.frequency || ''
      });
      setSelectedAction('prescribe-medication');
    };

    const handleDeletePrescription = async (prescriptionId) => {
      setDeleteConfirm({
        title: 'Delete Prescription',
        message: 'Are you sure you want to delete this prescription?',
        prescriptionId: prescriptionId
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (selectedAction === 'prescribe-medication') {
        try {
          const token = localStorage.getItem('token');
          const url = appointmentData.prescriptionId
            ? `http://localhost:5000/api/doctor/prescriptions/${appointmentData.prescriptionId}`
            : 'http://localhost:5000/api/doctor/prescribe-medication';
          const method = appointmentData.prescriptionId ? 'PUT' : 'POST';
          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              patientId: appointmentData.patientId,
              medication: appointmentData.medication,
              dosage: appointmentData.dosage,
              frequency: appointmentData.frequency
            })
          });
          if (response.ok) {
            // eslint-disable-next-line no-unused-vars
            const result = await response.json();
            setPopup({
              title: appointmentData.prescriptionId ? 'Medication Updated' : 'Medication Prescribed',
              message: appointmentData.prescriptionId ? 'Medication updated successfully.' : 'Medication prescribed successfully.',
              variant: 'success',
              confirmLabel: 'OK',
            });
            setAppointmentData({
              ...appointmentData,
              prescriptionId: '',
              medication: '',
              dosage: '',
              frequency: ''
            });
            fetchExistingPrescriptions(appointmentData.patientId);
            fetchAppointments();
            setSelectedAction('');
          } else {
            const errorData = await response.json();
            const actionType = appointmentData.prescriptionId ? 'update' : 'prescribe';
            showErrorPopup('Failed', `Failed to ${actionType} medication: ${errorData.error}`);
          }
        } catch (error) {
          const actionType = appointmentData.prescriptionId ? 'updating' : 'prescribing';
          showErrorPopup('Error', `Error ${actionType} medication. Please try again.`);
        }
      } else if (selectedAction === 'schedule-appointment') {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/doctor/schedule-appointment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              patientId: appointmentData.patientId,
              date: appointmentData.date,
              time: appointmentData.time,
              reason: appointmentData.reason
            })
          });
          if (response.ok) {
            setPopup({
              title: 'Appointment Scheduled',
              message: 'Appointment scheduled successfully.',
              variant: 'success',
              confirmLabel: 'OK',
            });
            setAppointmentData({
              patientId: '',
              date: '',
              time: '',
              reason: '',
              prescriptionId: '',
              medication: '',
              dosage: '',
              frequency: ''
            });
            setSelectedAction('');
          } else {
            const errorData = await response.json();
            showErrorPopup('Scheduling Failed', `Failed to schedule appointment: ${errorData.error}`);
          }
        } catch (error) {
          showErrorPopup('Error', 'Error scheduling appointment. Please try again.');
        }
      }
    };

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Select Patient</Label>
              <Select id="patient" name="patientId" value={appointmentData.patientId} onChange={handleInputChange}>
                <option value="">Choose a patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select id="action" name="action" value={selectedAction} onChange={handleInputChange}>
                <option value="">Choose an action</option>
                <option value="schedule-appointment">Schedule Appointment</option>
                <option value="prescribe-medication">Prescribe Medication</option>
              </Select>
            </div>
            {selectedAction === 'schedule-appointment' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="date">Appointment Date</Label>
                  <Input id="date" name="date" type="date" value={appointmentData.date} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Preferred Time</Label>
                  <Select
                    id="time"
                    name="time"
                    value={appointmentData.time}
                    onChange={handleInputChange}
                    disabled={!appointmentData.patientId || !appointmentData.date || availableSlots.length === 0}
                  >
                    <option value="">{appointmentData.patientId && appointmentData.date ? 'Choose a time slot' : 'Select patient and date first'}</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Input id="reason" name="reason" value={appointmentData.reason} onChange={handleInputChange} placeholder="Brief description of your concern" />
                </div>
              </>
            )}
            {selectedAction === 'prescribe-medication' && (
              <>
                {existingPrescriptions.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <Label>Existing Prescriptions</Label>
                    {existingPrescriptions.map((prescription) => (
                      <div key={prescription._id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span>{prescription.medication} - {prescription.dosage} - {prescription.frequency}</span>
                        <div>
                          <Button type="button" onClick={() => handleEditPrescription(prescription)} variant="outline" size="sm" className="mr-2">Edit</Button>
                          <Button onClick={() => handleDeletePrescription(prescription._id)} variant="outline" size="sm">Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="medication">Medication</Label>
                  <Input id="medication" name="medication" value={appointmentData.medication || ''} onChange={handleInputChange} placeholder="Medication name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input id="dosage" name="dosage" value={appointmentData.dosage || ''} onChange={handleInputChange} placeholder="Dosage" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input id="frequency" name="frequency" value={appointmentData.frequency || ''} onChange={handleInputChange} placeholder="Frequency" />
                </div>
              </>
            )}
            <Button type="submit" className="ml-auto">
              {selectedAction === 'prescribe-medication' ? (appointmentData.prescriptionId ? 'Update Prescription' : 'Prescribe Medication') : 'Schedule Appointment'}
            </Button>
          </form>
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
      <MessagePopup
        open={Boolean(deleteConfirm)}
        title={deleteConfirm?.title}
        message={deleteConfirm?.message}
        variant="confirm"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeletePrescription}
        onCancel={() => setDeleteConfirm(null)}
        onClose={() => setDeleteConfirm(null)}
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
        open={Boolean(billDeleteConfirm)}
        title="Delete Bill"
        message="Are you sure you want to delete this bill?"
        variant="confirm"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteBill}
        onCancel={() => setBillDeleteConfirm(null)}
        onClose={() => setBillDeleteConfirm(null)}
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
              variant={activeTab === 'History' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'History' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('History')}
            >
              <FileText className="w-4 h-4 mr-2" />
              View History
            </Button>
          </li>
          <li>
            <Button
              variant={activeTab === 'Availability' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Availability' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Availability')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Availability
            </Button>
          </li>
          <li>
            <Button
              variant={activeTab === 'Patient Management' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Patient Management' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Patient Management')}
            >
              <Users className="w-4 h-4 mr-2" />
              Patient Management
            </Button>
          </li>
          <li>
            <Button
              variant={activeTab === 'Bills' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Bills' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Bills')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Bills
            </Button>
          </li>
        </ul>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Welcome, Dr. {doctorInfo?.firstName} {doctorInfo?.lastName}</h1>
        {activeTab === 'Dashboard' && renderDashboard()}
        {activeTab === 'Profile' && renderProfile()}
        {activeTab === 'History' && renderHistory()}
        {activeTab === 'Bills' && renderBills()}
        {activeTab === 'Availability' && renderAvailability()}
        {activeTab === 'Patient Management' && renderPatientManagement()}
      </main>
    </div>
  );
}