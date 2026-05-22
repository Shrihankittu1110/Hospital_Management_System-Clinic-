import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import SignUp from './components/SignUp.jsx';
import Patient from './components/Patient.jsx';
import Doctor from './components/Doctors.jsx';
import Admin from './components/Admins.jsx';
import PatientManagement from './components/PatientManagement.jsx';
import DoctorManagement from './components/DoctorManagement.jsx';
import AppointmentManagement from './components/AppointmentManagement.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/patient" element={<Patient />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/patient-management" element={<PatientManagement />} />
          <Route path="/doctor-management" element={<DoctorManagement />} />
          <Route path="/appointment-management" element={<AppointmentManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
