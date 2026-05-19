import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, User, Users, ChevronDown, LayoutDashboard, UserCircle, Calendar as CalendarIcon, Hospital } from 'lucide-react';
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

export default function PatientDashboard() {
  const [showAppointments, setShowAppointments] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [popup, setPopup] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [editedInfo, setEditedInfo] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointmentData, setAppointmentData] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [careTeam, setCareTeam] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [historyData, setHistoryData] = useState({ appointments: [], prescriptions: [] });
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
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

  useEffect(() => {
    fetchPatientProfile();
    fetchDoctors();
    fetchAppointments();
    fetchCareTeam();
    fetchPrescriptions();
    fetchHistory();
    fetchBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (appointmentData.doctorId && appointmentData.date) {
      fetchAvailableSlots(appointmentData.doctorId, appointmentData.date);
    } else {
      setAvailableSlots([]);
    }
  }, [appointmentData.doctorId, appointmentData.date]);

  const showErrorPopup = (title, message) => {
    setPopup({
      title: title,
      message: message,
      variant: 'error',
      confirmLabel: 'OK',
    });
  };

  const fetchPatientProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/patient/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatientInfo(data);
        setEditedInfo(data);
      } else {
        showErrorPopup('Profile Error', 'Failed to load your patient profile. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      showErrorPopup('Connection Error', 'Unable to connect to the server. Please check your internet connection.');
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/doctor/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        console.error('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/patient/available-slots?doctorId=${doctorId}&date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const slots = await response.json();
        setAvailableSlots(slots);
      } else {
        console.error('Failed to fetch available slots');
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/patient/appointments', {
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

  const fetchCareTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/patient/care-team', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCareTeam(data);
      } else {
        console.error('Failed to fetch care team');
      }
    } catch (error) {
      console.error('Error fetching care team:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/patient/prescriptions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      } else {
        console.error('Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/patient/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        console.error('Failed to fetch history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/bills/patient/my-bills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      } else {
        console.error('Failed to fetch bills');
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const renderDashboard = () => (
    <>
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
                        Dr. {appointment.doctorId.firstName} {appointment.doctorId.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <p className="text-sm text-right whitespace-nowrap">
                        {appointment.date ? `${new Date(appointment.date).toLocaleDateString()} • ` : ''}
                        {appointment.time}
                      </p>
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
          <CardHeader icon={FileText}>
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
            <p className="text-xs text-gray-500">Active prescriptions</p>
          </CardContent>
          <CardFooter className="p-2">
            <Button 
              variant="ghost" 
              className="w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
              onClick={() => setShowPrescriptions(!showPrescriptions)}
            >
              {showPrescriptions ? "Hide" : "View All"} Prescriptions
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showPrescriptions ? "rotate-180" : ""}`} />
            </Button>
          </CardFooter>
          {showPrescriptions && (
            <div className="px-4 pb-4">
              {prescriptions.map((prescription, index) => (
                <div key={index} className="py-2 border-t">
                  <p className="text-sm font-medium">{prescription.medication}</p>
                  <p className="text-xs text-gray-500">
                    {prescription.dosage} - {prescription.frequency}
                  </p>
                  <p className="text-xs text-gray-500">
                    Prescribed by: Dr. {prescription.doctorId.firstName} {prescription.doctorId.lastName}
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
                <span>Blood test results collected</span>
              </li>
              <li className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span>Appointment with Dr. Johnson completed</span>
              </li>
              <li className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>New prescription added</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Care Team</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {careTeam.map((member, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Dr. {member.firstName} {member.lastName} - {member.specialty}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderProfile = () => {
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setEditedInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/patient/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editedInfo)
        });
        if (response.ok) {
          const updatedProfile = await response.json();
          setPatientInfo(updatedProfile);
          setIsEditing(false);
          setPopup({
            title: 'Profile Updated',
            message: 'Your patient profile has been saved successfully.',
            variant: 'success',
            confirmLabel: 'OK',
          });
        } else {
          const errorData = await response.json();
          showErrorPopup('Update Failed', `Failed to update patient profile: ${errorData.error}`);
        }
      } catch (error) {
        showErrorPopup('Error', 'Error updating patient profile. Please try again.');
      }
    };

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={isEditing ? editedInfo.firstName : patientInfo?.firstName}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={isEditing ? editedInfo.lastName : patientInfo?.lastName}
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
                value={isEditing ? editedInfo.email : patientInfo?.email}
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
                      Dr. {appointment.doctorId?.firstName || 'Unknown'} {appointment.doctorId?.lastName || 'Doctor'}
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
              <p className="text-sm text-gray-500">No past appointments found.</p>
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
                      Prescribed by: Dr. {prescription.doctorId?.firstName || 'Unknown'} {prescription.doctorId?.lastName || 'Doctor'}
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
      const response = await fetch(`http://localhost:5000/api/patient/appointments/${cancelConfirm.appointmentId}`, {
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

  const renderBills = () => {
    const unpaidBills = bills.filter(bill => bill.paymentStatus === 'unpaid' || bill.paymentStatus === 'partial');

    return (
      <div className="space-y-6">
        {unpaidBills.length > 0 && (
          <Card className="border-l-4 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">Outstanding Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unpaidBills.map((bill) => (
                  <div key={bill._id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{bill.billNumber}</p>
                        <p className="text-xs text-gray-600">
                          Dr. {bill.doctorId?.firstName || 'Unknown'} {bill.doctorId?.lastName || 'Doctor'}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded-full">Unpaid</span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-sm">
                        <p className="text-gray-600">Amount Due: <span className="font-bold text-lg text-red-600">₹{bill.totalAmount.toFixed(2)}</span></p>
                        <p className="text-xs text-gray-500">Issued: {new Date(bill.issueDate).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {bills.length > 0 ? (
              <div className="space-y-3">
                {bills.map((bill) => (
                  <div key={bill._id} className="border p-3 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{bill.billNumber}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(bill.appointmentDate).toLocaleDateString()} • Dr. {bill.doctorId?.firstName || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right mr-3">
                        <p className="font-bold text-lg">₹{bill.totalAmount.toFixed(2)}</p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          bill.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : bill.paymentStatus === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.paymentStatus === 'paid' ? 'Paid' : bill.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No bills generated yet.</p>
            )}
          </CardContent>
        </Card>

        {selectedBill && (
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Bill Details</CardTitle>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Bill Number</p>
                  <p className="font-semibold">{selectedBill.billNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(selectedBill.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Doctor</p>
                  <p className="font-semibold">Dr. {selectedBill.doctorId?.firstName} {selectedBill.doctorId?.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Specialty</p>
                  <p className="font-semibold">{selectedBill.doctorId?.specialty}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Charges Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Consultation Fee</span>
                    <span>₹{selectedBill.consultationFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({selectedBill.taxRate}%)</span>
                    <span>₹{selectedBill.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-blue-600">₹{selectedBill.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-3 rounded text-sm">
                <p><strong>Status:</strong> <span className={selectedBill.paymentStatus === 'paid' ? 'text-green-600' : selectedBill.paymentStatus === 'partial' ? 'text-yellow-600' : 'text-red-600'}>{selectedBill.paymentStatus.toUpperCase()}</span></p>
                <p><strong>Due Date:</strong> {new Date(selectedBill.dueDate).toLocaleDateString()}</p>
              </div>

              <Button className="w-full" onClick={() => window.print()}>
                📥 Download/Print Bill
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderAppointmentBooking = () => {
    const fetchDoctorAvailability = async (doctorId) => {
      if (!doctorId) {
        setDoctorAvailability(null);
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/doctor/${doctorId}/availability`);
        if (response.ok) {
          const availability = await response.json();
          setDoctorAvailability(availability);
        }
      } catch (error) {
        console.error('Error fetching doctor availability:', error);
      }
    };

    const getDateAvailability = () => {
      if (!appointmentData.date || !doctorAvailability) return null;
      const appointmentDate = new Date(appointmentData.date);
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return doctorAvailability[dayOfWeek];
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setAppointmentData(prev => {
        const nextData = { ...prev, [name]: value };
        if (name === 'date' || name === 'doctorId') {
          nextData.time = '';
        }
        return nextData;
      });

      if (name === 'doctorId') {
        fetchDoctorAvailability(value);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validate form fields
      if (!appointmentData.doctorId || !appointmentData.date || !appointmentData.time || !appointmentData.reason.trim()) {
        showErrorPopup('Incomplete Form', 'Please fill in all appointment details including reason.');
        return;
      }
      
      // Validate date is not in the past
      const selectedDate = new Date(appointmentData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        showErrorPopup('Invalid Date', 'Please select a future date for your appointment.');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/patient/book-appointment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(appointmentData)
        });
        if (response.ok) {
          // eslint-disable-next-line no-unused-vars
          const result = await response.json();
          setPopup({
            title: 'Appointment Booked',
            message: 'Appointment booked successfully.',
            variant: 'success',
            confirmLabel: 'OK',
          });
          setAppointmentData({
            doctorId: '',
            date: '',
            time: '',
            reason: ''
          });
          setAvailableSlots([]);
          fetchAppointments();
          setActiveTab('Dashboard');
        } else if (response.status === 409) {
          const errorData = await response.json();
          showErrorPopup('Conflict', errorData.error);
        } else {
          const errorData = await response.json();
          showErrorPopup('Booking Failed', `Failed to book appointment: ${errorData.error}`);
        }
      } catch (error) {
        showErrorPopup('Error', 'Error booking appointment. Please try again.');
      }
    };

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Book an Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctorId">Select Doctor</Label>
              <Select id="doctorId" name="doctorId" value={appointmentData.doctorId} onChange={handleInputChange}>
                <option value="">Choose a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialty}
                  </option>
                ))}
              </Select>
            </div>
            {doctorAvailability && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900">Doctor's Availability Schedule</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(doctorAvailability)
                    .filter(([day]) => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day))
                    .map(([day, schedule]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize font-medium text-gray-700">{day}</span>
                      <span className={schedule.isAvailable ? 'text-green-600' : 'text-red-600'}>
                        {schedule.isAvailable ? `${schedule.startTime} - ${schedule.endTime}` : 'Not Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="date">Appointment Date</Label>
              <Input id="date" name="date" type="date" value={appointmentData.date} onChange={handleInputChange}/>
              {appointmentData.date && getDateAvailability() && !getDateAvailability().isAvailable && (
                <p className="text-red-600 text-sm font-medium">⚠️ Doctor is not available on this day</p>
              )}
              {appointmentData.date && getDateAvailability() && getDateAvailability().isAvailable && (
                <p className="text-green-600 text-sm font-medium">✓ Available {getDateAvailability().startTime} - {getDateAvailability().endTime}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Preferred Time</Label>
              <Select
                id="time"
                name="time"
                value={appointmentData.time}
                onChange={handleInputChange}
                disabled={!appointmentData.doctorId || !appointmentData.date || availableSlots.length === 0}
              >
                <option value="">{appointmentData.doctorId && appointmentData.date ? 'Choose a time slot' : 'Select doctor and date first'}</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Input id="reason" name="reason" value={appointmentData.reason} onChange={handleInputChange} placeholder="Brief description of your concern"/>
            </div>
            <Button type="submit" className="ml-auto">Book Appointment</Button>
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
      <header className="bg-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Hospital className="h-6 w-6 text-blue-600" />
          <div>
            <span className="font-bold text-xl block">Patient Portal</span>
            <span className="text-xs text-gray-500 block">Hospital Management System</span>
          </div>
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
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
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
              variant={activeTab === 'Appointment Booking' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Appointment Booking' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Appointment Booking')}

            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Appointment Booking
            </Button>
          </li>
          <li>
            <Button
              variant={activeTab === 'Bills' ? "outline" : "ghost"}
              className={`hover:bg-white hover:text-blue-600 ${activeTab === 'Bills' ? 'bg-white text-blue-600' : 'text-white'}`}
              onClick={() => setActiveTab('Bills')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Bills
            </Button>
          </li>
        </ul>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Welcome to your patient dashboard, {patientInfo?.firstName} {patientInfo?.lastName}</h1>
        {activeTab === 'Dashboard' && renderDashboard()}
        {activeTab === 'Profile' && renderProfile()}
        {activeTab === 'History' && renderHistory()}
        {activeTab === 'Bills' && renderBills()}
        {activeTab === 'Appointment Booking' && renderAppointmentBooking()}
      </main>
    </div>
  );
}