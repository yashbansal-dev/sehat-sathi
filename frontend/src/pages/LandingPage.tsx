import React from 'react';
import { 
  Activity, 
  FileText, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  UploadCloud, 
  Search, 
  FileCheck2,
  User,
  QrCode,
  Pill,
  Lock
} from 'lucide-react';
import logoImg from '../assets/logo.png';

interface LandingPageProps {
  onGetStartedPatient: () => void;
  onGetStartedDoctor: () => void;
  onExplorePatientDemo: () => void;
  onExploreDoctorDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStartedPatient, 
  onGetStartedDoctor, 
  onExplorePatientDemo, 
  onExploreDoctorDemo 
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation Bar with Logo */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 p-1 border border-teal-200 shadow-xs flex items-center justify-center">
              <img 
                src={logoImg} 
                alt="Sehat Sathi Logo" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center">
                Sehat Sathi <span className="text-teal-600 ml-1.5">AI</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 block -mt-0.5">
                Two-Minute Doctor Clinical Record Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onGetStartedPatient}
              className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
            >
              Patient Sign In
            </button>
            <button
              onClick={onGetStartedDoctor}
              className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition"
            >
              Doctor Sign In
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-6 border border-teal-200">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Two Dedicated Portals — Strictly Separated for Patient & Clinician</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
              Every Medical Record. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-emerald-600 to-sky-600">
                One Clear Story.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Patients get an easy-to-use personal health locker and daily pill organizer. Doctors get a 2-minute verified clinical summary with source evidence and contradiction alerts.
            </p>
          </div>

          {/* TWO DEDICATED PORTAL ENTRY CARDS */}
          <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. PATIENT PORTAL CARD */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-200/80 shadow-xl shadow-emerald-900/5 flex flex-col justify-between hover:border-emerald-400 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shadow-xs">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Patient Area
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900">
                  Patient Health Portal
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Simple, private vault for you and your family. Upload prescriptions, track medicines, see lab trends, and share records with any doctor via secure QR code.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Upload doctor slips, lab PDFs, and WhatsApp photos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Daily medicine reminder & pill schedule</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Share full history with doctors in 1 tap (revocable QR)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Hindi & English bilingual health explanations</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2.5 pt-4 border-t border-slate-100">
                <button
                  onClick={onExplorePatientDemo}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition transform group-hover:scale-[1.01]"
                >
                  <User className="w-4 h-4" />
                  <span>Enter Patient Portal (Live Demo)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <button
                  onClick={onGetStartedPatient}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition"
                >
                  Sign In or Create Patient Account
                </button>
              </div>
            </div>

            {/* 2. DOCTOR / CLINICIAN PORTAL CARD */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-sky-200/80 shadow-xl shadow-sky-900/5 flex flex-col justify-between hover:border-sky-400 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xl shadow-xs">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    Clinician Workstation
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900">
                  Doctor & Clinician Portal
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  High-speed decision support workstation for outpatient clinics and emergency visits. Review whole patient journeys in under 2 minutes.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Two-Minute Doctor Brief (Conditions, Active Meds, Questions)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>1-Click Source Traceability (Jump to bounding box on PDF)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Contradiction Detection & Clinical Conflict Alerts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>One-click print brief for OPD records</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2.5 pt-4 border-t border-slate-100">
                <button
                  onClick={onExploreDoctorDemo}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center space-x-2 transition transform group-hover:scale-[1.01]"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Enter Doctor Portal (Live Demo)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <button
                  onClick={onGetStartedDoctor}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition"
                >
                  Sign In or Create Clinician Account
                </button>
              </div>
            </div>

          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            🔒 Strict Privacy: Patient accounts cannot access doctor clinical tools, and doctors only access verified patient briefings.
          </p>

        </div>
      </section>

      {/* Problem & Solution Flow */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-teal-700 tracking-wider uppercase">How It Connects Both Portals</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              Patients own the records. Doctors get the intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-4">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">1. Patient Uploads</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Patient snaps a photo of their paper prescription or uploads digital hospital PDFs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">2. Optical Extraction</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                PyMuPDF OCR reads medications, test results, doctor advice, and timestamps.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-lg mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">3. Time-Limited Share</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Patient shows a secure QR code or shares an access token at the doctor clinic.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-lg mb-4">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">4. 2-Min Doctor Brief</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Doctor sees conditions, contradictions, and source citations without wading through paper folders.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-white py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">Sehat Sathi AI</span>
            <span>— The Two-Minute Doctor Clinical Record Intelligence</span>
          </div>
          <p>
            🔒 Privacy First: All health data is strictly segregated by role and protected with cryptographic tokens.
          </p>
        </div>
      </footer>

    </div>
  );
};
