import React, { useState } from 'react';
import { Shield, User, Stethoscope, Eye, EyeOff, Home as HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessagePopup from './MessagePopup';
import { API_BASE_URL } from '../utils/apiBase';

const Login = ({ onClose }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState(null);

  const roles = [
    { id: 'admin', label: 'Admin', icon: Shield },
    { id: 'patient', label: 'Patient', icon: User },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userEmail', email);
        const roleLabel = roles.find((role) => role.id === data.role)?.label || 'User';
        const nextRoute = data.role === 'admin' ? '/admin' : data.role === 'doctor' ? '/doctor' : '/patient';
        setPopup({
          title: `Welcome, ${roleLabel}`,
          message: `You have logged in successfully as ${roleLabel.toLowerCase()}.`,
          variant: 'success',
          confirmLabel: 'Continue',
          onConfirm: () => navigate(nextRoute),
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className={onClose ? "w-full bg-white flex flex-col" : "min-h-screen bg-blue-50 flex items-center justify-center p-4"}>
      <MessagePopup
        open={Boolean(popup)}
        title={popup?.title}
        message={popup?.message}
        variant={popup?.variant || 'success'}
        confirmLabel={popup?.confirmLabel || 'OK'}
        onConfirm={popup?.onConfirm}
        onClose={() => setPopup(null)}
      />
      {!onClose && (
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 transition-all duration-200 text-blue-600 font-medium"
          >
            <HomeIcon size={18} />
            Back to Home
          </button>
        </div>
      )}
      <div className={onClose ? "w-full" : "w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden"}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h2 className="text-2xl font-bold text-center">Login to HealthCare Portal</h2>
          <p className="text-center text-blue-100 mt-1">Access your account</p>
        </div>
        <div className={onClose ? "p-6 max-h-[calc(90vh-200px)] overflow-y-auto" : "p-6"}>
          <div className="flex bg-blue-100 rounded-lg p-1 mb-6">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all duration-200 ${
                  selectedRole === role.id
                    ? 'bg-blue-600 text-white shadow-lg scale-[1.02] ring-2 ring-white/60'
                    : 'text-blue-600 hover:bg-white/70 hover:shadow-sm'
                }`}
              >
                <role.icon size={16} />
                <span>{role.label}</span>
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-1 text-left">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-1 text-left">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Login as {roles.find((r) => r.id === selectedRole)?.label}
            </button>
          </form>
        </div>
        <div className={onClose ? "bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 text-center border-t border-blue-100" : "bg-gray-50 px-6 py-4 text-center"}>
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button 
              onClick={() => onClose ? onClose() : navigate('/signup')} 
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;