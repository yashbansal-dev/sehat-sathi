import React, { useState } from 'react';
import { 
  Activity, 
  FileText, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  Share2, 
  LogOut, 
  HelpCircle,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../assets/logo.png';

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
  pendingReviewsCount = 0 
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        {/* Subtle Hospital Accent Top Line */}
        <div className={`h-1 w-full ${
          portal === 'patient' 
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500' 
            : 'bg-gradient-to-r from-sky-600 via-indigo-600 to-teal-500'
        }`} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Clean Logo & Brand (No Clutter) */}
            <div 
              className="flex items-center space-x-3 cursor-pointer shrink-0" 
              onClick={() => {
                if (portal === 'patient') setPatientTab('home');
                else setDoctorTab('brief');
              }}
              title="Sehat Sathi"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50/70 p-1 border border-teal-200/80 shadow-2xs flex items-center justify-center">
                <img 
                  src={logoImg} 
                  alt="Sehat Sathi Logo" 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Sehat Sathi
                </span>
                
                {/* Clean Portal Badge */}
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  portal === 'patient'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}>
                  {portal === 'patient' 
                    ? (language === 'hi' ? 'मरीज पोर्टल' : 'Patient Portal') 
                    : (language === 'hi' ? 'डॉक्टर पोर्टल' : 'Doctor Portal')}
                </span>
              </div>
            </div>

            {/* Center: Clean & Uniform Nav Tabs */}
            <nav className="hidden lg:flex items-center space-x-1 shrink-0">
              {portal === 'patient' ? (
                <>
                  <button
                    onClick={() => setPatientTab('home')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition ${
                      patientTab === 'home'
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>{t('nav_home')}</span>
                  </button>

                  <button
                    onClick={() => setPatientTab('documents')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition ${
                      patientTab === 'documents'
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>{language === 'hi' ? 'दस्तावेज' : 'My Documents'}</span>
                  </button>

                  <button
                    onClick={() => setPatientTab('timeline')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition ${
                      patientTab === 'timeline'
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>{language === 'hi' ? 'स्वास्थ्य इतिहास' : 'My Timeline'}</span>
                  </button>

                  <button
                    onClick={() => setPatientTab('share')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition ${
                      patientTab === 'share'
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Share2 className="w-4 h-4 text-teal-600" />
                    <span>{language === 'hi' ? 'डॉक्टर को शेयर करें' : 'Share with Doctor'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setDoctorTab('brief')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition ${
                      doctorTab === 'brief'
                        ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-sky-600" />
                    <span>{language === 'hi' ? '2-मिनट डॉक्टर ब्रीफ' : '2-Min Doctor Brief'}</span>
                  </button>

                  <button
                    onClick={() => setDoctorTab('records')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition ${
                      doctorTab === 'records'
                        ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>{language === 'hi' ? 'रोगी रिकॉर्ड्स' : 'Patient Records & PDFs'}</span>
                  </button>

                  <button
                    onClick={() => setDoctorTab('timeline')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition ${
                      doctorTab === 'timeline'
                        ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>{language === 'hi' ? 'क्लीनिकल टाइमलाइन' : 'Clinical Timeline'}</span>
                  </button>

                  <button
                    onClick={() => setDoctorTab('audit')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition ${
                      doctorTab === 'audit'
                        ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    <span>{language === 'hi' ? 'विरोधाभास व ऑडिट' : 'Contradictions & Audit'}</span>
                    {pendingReviewsCount > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                        {pendingReviewsCount}
                      </span>
                    )}
                  </button>
                </>
              )}
            </nav>

            {/* Right: Actions, Language & User Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              
              {/* "How It Works" Help Button (Positioned cleanly on the right) */}
              <button
                onClick={() => setShowGuideModal(true)}
                className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                title="How Sehat Sathi works"
              >
                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('nav_guide')}</span>
              </button>

              {/* Language Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-xs ${
                    language === 'en'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="English"
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-xs ${
                    language === 'hi'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="हिंदी"
                >
                  हिंदी
                </button>
              </div>

              {/* User Avatar & Logout */}
              {user && (
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden xl:block text-xs font-bold text-slate-800 truncate max-w-[110px]">
                    {user.full_name?.split(' ')[0] || user.full_name}
                  </span>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
        
        {/* Mobile Navigation Strip */}
        <div className="lg:hidden border-t border-slate-200 px-3 py-2 flex items-center overflow-x-auto text-xs space-x-2 scrollbar-none bg-slate-50/70">
          {portal === 'patient' ? (
            <>
              <button 
                onClick={() => setPatientTab('home')} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold ${
                  patientTab === 'home' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                🏠 {t('nav_home')}
              </button>
              <button 
                onClick={() => setPatientTab('documents')} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold ${
                  patientTab === 'documents' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                📄 {language === 'hi' ? 'दस्तावेज' : 'Documents'}
              </button>
              <button 
                onClick={() => setPatientTab('timeline')} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold ${
                  patientTab === 'timeline' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                ⏱️ {t('nav_timeline')}
              </button>
              <button 
                onClick={() => setPatientTab('share')} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold ${
                  patientTab === 'share' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                🔗 {language === 'hi' ? 'शेयर' : 'Share'}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setDoctorTab('brief')} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold ${
                  doctorTab === 'brief' ? 'bg-sky-600 text-white' : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                🩺 {language === 'hi' ? '2-मिनट ब्रीफ' : '2-Min Brief'}
              </button>
              <button 
                onClick={() => setDoctorTab('records')} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold ${
                  doctorTab === 'records' ? 'bg-sky-600 text-white' : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                📄 {language === 'hi' ? 'रिकॉर्ड्स' : 'Records'}
              </button>
              <button 
                onClick={() => setDoctorTab('timeline')} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold ${
                  doctorTab === 'timeline' ? 'bg-sky-600 text-white' : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                ⏱️ {language === 'hi' ? 'टाइमलाइन' : 'Timeline'}
              </button>
              <button 
                onClick={() => setDoctorTab('audit')} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold ${
                  doctorTab === 'audit' ? 'bg-sky-600 text-white' : 'text-slate-600 bg-white border border-slate-200'
                }`}
              >
                ⚠️ {language === 'hi' ? 'विरोधाभास' : 'Contradictions'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 bg-gradient-to-r from-teal-800 via-teal-700 to-sky-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    {language === 'hi' ? 'सेहत साथी कैसे काम करता है?' : 'How Sehat Sathi Works'}
                  </h3>
                  <p className="text-xs text-teal-100">
                    {language === 'hi' ? 'मरीज और डॉक्टर दोनों के लिए' : 'For Patients and Clinicians'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700">
              <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200 text-teal-950 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-teal-950">
                    {language === 'hi' ? 'दस्तावेज अपलोड करें' : 'Upload Prescriptions & Reports'}
                  </h4>
                  <p className="text-xs text-teal-900 mt-0.5 leading-relaxed">
                    {language === 'hi'
                      ? 'अपनी पर्ची या टेस्ट की फोटो अपलोड करें। हमारा सिस्टम दवाइयां और रिपोर्ट अपने आप समझ लेता है।'
                      : 'Take a photo or upload PDF of your medical documents. Optical character recognition extracts medicines and tests automatically.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-emerald-950 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950">
                    {language === 'hi' ? 'दवाइयों की समय सारणी' : 'Daily Pill Tracker'}
                  </h4>
                  <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
                    {language === 'hi'
                      ? 'सुबह, दोपहर और रात की दवाइयों का साफ समय देखें।'
                      : 'View what medicines to take in morning, noon, and night.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-sky-50/80 rounded-2xl border border-sky-200 text-sky-950 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sky-950">
                    {language === 'hi' ? 'डॉक्टर को 1 टैप में शेयर करें' : '1-Tap Secure Sharing with Doctor'}
                  </h4>
                  <p className="text-xs text-sky-900 mt-0.5 leading-relaxed">
                    {language === 'hi'
                      ? 'क्लीनिक में डॉक्टर को QR कोड दिखाएं ताकि डॉक्टर 2 मिनट में आपका पूरा इतिहास देख सकें।'
                      : 'Show the doctor your QR code at the clinic so they can review your 2-minute summary.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
