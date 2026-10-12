import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight, Stethoscope, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

interface AuthPageProps {
  initialRole?: 'patient' | 'doctor';
  onSuccess: () => void;
  onBackToHome: () => void;
}

export const AuthPages: React.FC<AuthPageProps> = ({ 
  initialRole = 'patient', 
  onSuccess, 
  onBackToHome 
}) => {
  const { login, register, loginWithGoogle, demoLogin, demoDoctorLogin } = useAuth();
  const [role, setRole] = useState<'patient' | 'doctor'>(initialRole);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        if (!fullName.trim()) throw new Error('Please enter your full name');
        await register(email, password, fullName, role);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle(role);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign-in was not completed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePatientDemo = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await demoLogin();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Could not load demo patient data.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoctorDemo = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await demoDoctorLogin();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Could not load doctor workstation data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-teal-700 hover:text-teal-900 mb-5 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200 transition"
        >
          <span>&larr; Back to Sehat Sathi Home</span>
        </button>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 p-1 border border-teal-200 shadow-2xs flex items-center justify-center">
          <img 
            src={logoImg} 
            alt="Sehat Sathi Logo" 
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <h2 className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
          {isRegister ? 'Create Your Account' : 'Sign in to Sehat Sathi'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Firebase Authenticated • Clinical Record Intelligence
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        
        {/* Role Selector Pill */}
        <div className="mb-5 p-1 bg-slate-200/80 rounded-2xl flex items-center shadow-inner">
          <button
            type="button"
            onClick={() => { setRole('patient'); setError(null); }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition ${
              role === 'patient'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>Patient Portal</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('doctor'); setError(null); }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition ${
              role === 'doctor'
                ? 'bg-white text-sky-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span>Doctor Portal</span>
          </button>
        </div>

        {/* Instant 1-Click Fast Demo Testing */}
        <div className="mb-5 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Fast 1-Click Test (Instant Login):</span>
            </span>
            <span className="text-[10px] text-teal-700 font-semibold px-2 py-0.5 bg-teal-50 rounded-full border border-teal-200">
              Demo Data
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handlePatientDemo}
              disabled={submitting}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition flex flex-col items-center justify-center text-center space-y-0.5"
            >
              <div className="flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Patient Demo</span>
              </div>
              <span className="text-[10px] font-normal text-emerald-100">Rajesh Sharma (52M)</span>
            </button>

            <button
              type="button"
              onClick={handleDoctorDemo}
              disabled={submitting}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition flex flex-col items-center justify-center text-center space-y-0.5"
            >
              <div className="flex items-center space-x-1">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor Demo</span>
              </div>
              <span className="text-[10px] font-normal text-sky-100">Dr. Verma, MD</span>
            </button>
          </div>
        </div>

        {/* Standard Auth Box */}
        <div className="bg-white py-6 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-8">
          
          <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {isRegister 
                ? (role === 'patient' ? 'Register New Patient' : 'Register Clinician / Doctor') 
                : (role === 'patient' ? 'Patient Sign In' : 'Clinician / Doctor Sign In')}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              role === 'patient' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-sky-100 text-sky-800'
            }`}>
              {role === 'patient' ? '👤 Patient' : '🩺 Doctor'}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed font-medium">
              {error}
            </div>
          )}

          {/* Firebase Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full py-2.5 px-4 mb-4 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or with Email</span>
            </div>
          </div>

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {role === 'patient' ? 'Patient Full Name' : 'Doctor Full Name & Title'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'patient' ? 'e.g. Ramesh Kumar' : 'e.g. Dr. Priya Rao, MD'}
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition flex items-center justify-center space-x-2 mt-4 ${
                role === 'patient'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
              }`}
            >
              <span>
                {submitting 
                  ? 'Connecting to Firebase...' 
                  : isRegister 
                    ? `Create ${role === 'patient' ? 'Patient' : 'Doctor'} Account` 
                    : `Sign In as ${role === 'patient' ? 'Patient' : 'Doctor'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              {isRegister
                ? 'Already have an account? Sign in here'
                : "Don't have an account? Sign up with Firebase"}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
