import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Stethoscope,
  Share2,
  LogOut,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  HeartPulse,
  Mic,
  Home,
  Plus,
  Pill,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { EmergencyCardModal } from './EmergencyCardModal';
import { VoiceAssistantModal } from './VoiceAssistantModal';

export interface NavbarProps {
  portal: 'patient' | 'doctor';
  patientTab: string;
  setPatientTab: (tab: string) => void;
  doctorTab: string;
  setDoctorTab: (tab: string) => void;
  pendingReviewsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  patientTab,
  setPatientTab,
  doctorTab,
  setDoctorTab,
}) => {
  const { user, logout, demoLogin, demoDoctorLogin } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  if (portal === 'doctor') {
    return (
      <header className="bg-[#0f172a] text-white border-b border-slate-800 sticky top-0 z-30 font-sans shadow-md">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Left: Hospital EHR Branding */}
            <div
              className="flex items-center space-x-3 cursor-pointer shrink-0"
              onClick={() => setDoctorTab('brief')}
              title="Apex Specialty Clinic - Clinician Decision Station"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Stethoscope className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold tracking-tight text-white">
                    Sehat Sathi <span className="text-blue-400 font-mono text-[11px] uppercase px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-800/80">EHR WORKSTATION</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>OPD SESSION ACTIVE</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:block">
                  Apex Specialty Clinics • Chamber 104 • Dr. Arvind Verma, MD
                </span>
              </div>
            </div>

            {/* Center: Live Station Status & Quick Nav */}
            <div className="hidden lg:flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium">Clinician Station:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-700/60 font-semibold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Dr. Arvind Verma, MD (Cardiologist)</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-mono text-[11px] bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/40">GMC #MH-28491</span>
            </div>

            {/* Right: Switch to Patient View & Profile */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  await demoLogin();
                  setPatientTab('home');
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                title="Switch back to patient personal health record"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Switch to Patient View</span>
              </button>

              {/* Clinician Profile Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                  className="flex items-center space-x-2 pl-1 sm:pl-2 py-1 pr-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    AV
                  </div>
                  <div className="text-left hidden md:block leading-tight">
                    <span className="text-xs font-bold text-white block">
                      Dr. Arvind Verma
                    </span>
                    <span className="text-[10px] text-blue-300 block">
                      Cardiology OPD
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showDoctorDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in text-xs font-sans text-slate-800">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Clinician Session</span>
                      <span className="font-bold text-slate-900">Dr. Arvind Verma, MD</span>
                      <span className="text-[11px] text-slate-500 block">Apex Healthcare • Chamber 104</span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setShowDoctorDropdown(false);
                        await demoLogin();
                        setPatientTab('home');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-emerald-800 font-medium cursor-pointer"
                    >
                      <Home className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Switch to Patient Portal (Rajesh)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowDoctorDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center space-x-2 cursor-pointer border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Clinician</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 font-sans">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Left: Clean Brand Cross & Title */}
            <div
              className="flex items-center space-x-2.5 cursor-pointer shrink-0"
              onClick={() => {
                if (portal === 'patient') setPatientTab('home');
                else setDoctorTab('brief');
              }}
              title="Sehat Sathi"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0d652d] text-white flex items-center justify-center font-bold shadow-2xs">
                <Plus className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Sehat Sathi
              </span>
            </div>

            {/* Center: Top Navigation Tabs matching screenshot */}
            <nav className="hidden lg:flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => setPatientTab('home')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  patientTab === 'home'
                    ? 'bg-[#e6f4ea] text-[#0d6832] font-semibold border border-[#ceead6]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setPatientTab('documents')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  patientTab === 'documents'
                    ? 'bg-[#e6f4ea] text-[#0d6832] font-semibold border border-[#ceead6]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Records</span>
              </button>

              <button
                onClick={() => {
                  setPatientTab('home');
                  setTimeout(() => {
                    document.getElementById('medication-schedule')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Medications</span>
              </button>

              <button
                onClick={() => setPatientTab('trends')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  patientTab === 'trends'
                    ? 'bg-[#e6f4ea] text-[#0d6832] font-semibold border border-[#ceead6]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trends</span>
              </button>

              <button
                onClick={() => setPatientTab('summary')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  patientTab === 'summary'
                    ? 'bg-[#e6f4ea] text-[#0d6832] font-semibold border border-[#ceead6]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Clinical Summary</span>
              </button>
            </nav>

            {/* Right: Voice AI, Share, Emergency, and Doctor Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Voice Assistant button */}
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs shadow-2xs transition cursor-pointer"
                title="Bilingual Voice Health Assistant"
              >
                <Mic className="w-3.5 h-3.5 text-teal-700" />
                <span>Voice AI</span>
              </button>

              {/* Share button */}
              <button
                type="button"
                onClick={() => setPatientTab('share')}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs transition cursor-pointer"
                title="Share records with doctors or clinics"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Share</span>
              </button>

              {/* Emergency ICE Button */}
              <button
                type="button"
                onClick={() => setShowEmergencyModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#d93025] hover:bg-[#b31412] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                title="Emergency In-Case-of-Emergency Card"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
                <span>Emergency</span>
              </button>

              {/* Doctor Profile Pill with Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                  className="flex items-center space-x-2 pl-1 sm:pl-2 py-1 pr-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-200"
                  title="Switch between Doctor and Patient mode"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                    DR
                  </div>
                  <div className="text-left hidden md:block leading-tight">
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">
                      Dr. Meera Singh
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">
                      Apex Clinic
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showDoctorDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in text-xs font-sans">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Role</span>
                      <span className="font-bold text-slate-800 capitalize">Patient Mode</span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setShowDoctorDropdown(false);
                        await demoDoctorLogin();
                        setDoctorTab('brief');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                      <span>Switch to Doctor View 🩺</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDoctorDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Emergency Modal */}
      <EmergencyCardModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </>
  );
};
