import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  FileText, 
  Clock, 
  Upload, 
  ArrowRight, 
  Share2, 
  Pill, 
  Building2,
  Sunrise,
  Sun,
  Moon,
  ShieldAlert,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { DashboardStats } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenUploadModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onNavigate, 
  onOpenUploadModal 
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsData = await api.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="animate-spin w-9 h-9 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-600">
          {language === 'hi' ? 'स्वास्थ्य विवरण लोड हो रहा है...' : 'Loading health profile...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Reassuring Hospital Greeting Card — Clean & Uncluttered */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-sky-800 rounded-3xl p-6 sm:p-7 text-white shadow-sm border border-teal-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('greeting_prefix')}, {user?.full_name?.split(' ')[0] || user?.full_name || 'Patient'}!
          </h1>
          <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl font-normal">
            {language === 'hi' 
              ? 'आपकी सभी दवाइयां और स्वास्थ्य रिकॉर्ड सुरक्षित हैं।'
              : 'Your health records, lab reports, and medication schedule are safely organized.'}
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold border border-white/20 backdrop-blur-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Max & Fortis Records</span>
          </span>
        </div>
      </div>

      {/* 4 Clean, Orderly Action Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
          {t('quick_actions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Upload Prescription */}
          <div
            onClick={onOpenUploadModal}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-500 shadow-2xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Upload className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">
                {t('action_upload')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('action_upload_sub')}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
              <span>{language === 'hi' ? 'अपलोड करें' : '+ Add Document'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: My Medicines & Pill Schedule */}
          <div
            onClick={() => {
              const el = document.getElementById('patient-medicines-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-2xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Pill className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                {t('action_medicines')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('action_medicines_sub')}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>5 {language === 'hi' ? 'दवाइयां सक्रिय' : 'Active Medicines'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Health Timeline */}
          <div
            onClick={() => onNavigate('timeline')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-500 shadow-2xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition">
                {language === 'hi' ? 'स्वास्थ्य इतिहास' : 'Medical Timeline'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' ? 'पिछली अस्पताल यात्राएं व पर्चियां' : 'Past visits, diagnoses & history'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
              <span>{language === 'hi' ? 'इतिहास देखें' : 'View History'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 4: Share Records with Doctor */}
          <div
            onClick={() => onNavigate('share')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-500 shadow-2xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Share2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
                {t('action_share')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('action_share_sub')}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
              <span>{language === 'hi' ? 'QR व लिंक' : 'QR & Link'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

        </div>
      </div>

      {/* Critical Allergy Alert Banner */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
            ⚠️ {t('allergy_warning')}
          </h4>
          <p className="text-xs text-rose-800 mt-0.5 font-medium leading-relaxed">
            {t('allergy_warning_text')}
          </p>
        </div>
      </div>

      {/* Today's Daily Pill Organizer (सुबह, दोपहर, रात) */}
      <div id="patient-medicines-section" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <span>{t('today_medicines')}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('today_medicines_sub')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
          >
            <span>{language === 'hi' ? 'पूरी पर्चियां देखें' : 'View All Prescriptions'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* Morning Slot */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-3">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs pb-2 border-b border-amber-200/70">
              <Sunrise className="w-4 h-4 text-amber-600" />
              <span>{t('morning')}</span>
            </div>
            
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Metformin</span>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">500 mg</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  1 {language === 'hi' ? 'गोली नाश्ते के बाद (शुगर)' : 'tablet after breakfast (Sugar)'}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Telmisartan</span>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">40 mg</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  1 {language === 'hi' ? 'गोली सुबह (ब्लड प्रेशर)' : 'tablet morning (BP)'}
                </p>
              </div>
            </div>
          </div>

          {/* Afternoon Slot */}
          <div className="bg-sky-50/60 rounded-2xl p-4 border border-sky-200/80 space-y-3">
            <div className="flex items-center space-x-2 text-sky-900 font-bold text-xs pb-2 border-b border-sky-200/70">
              <Sun className="w-4 h-4 text-sky-600" />
              <span>{t('afternoon')}</span>
            </div>

            <div className="space-y-2">
              <div className="bg-white p-3 rounded-xl border border-sky-200/60 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Atorvastatin</span>
                  <span className="text-[11px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">20 mg</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  1 {language === 'hi' ? 'गोली दोपहर भोजन के बाद (कोलेस्ट्रॉल)' : 'tablet after lunch (Cholesterol)'}
                </p>
              </div>
            </div>
          </div>

          {/* Night Slot */}
          <div className="bg-teal-50/60 rounded-2xl p-4 border border-teal-200/80 space-y-3">
            <div className="flex items-center space-x-2 text-teal-900 font-bold text-xs pb-2 border-b border-teal-200/70">
              <Moon className="w-4 h-4 text-teal-600" />
              <span>{t('night')}</span>
            </div>

            <div className="space-y-2">
              <div className="bg-white p-3 rounded-xl border border-teal-200/60 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Metformin</span>
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">500 mg</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  1 {language === 'hi' ? 'गोली रात के खाने के बाद (शुगर)' : 'tablet after dinner (Sugar)'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Simple Health Status */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
          <HeartPulse className="w-5 h-5 text-teal-600" />
          <span>{t('health_vitals_title')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('blood_sugar')}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            </div>
            <p className="text-lg font-bold text-slate-900">142 mg/dL</p>
            <p className="text-xs text-amber-700 font-semibold mt-1">
              {language === 'hi' ? 'थोड़ा अधिक (HbA1c 7.8%)' : 'Slightly high (HbA1c 7.8%)'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('blood_pressure')}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-lg font-bold text-slate-900">134/84 mmHg</p>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              {language === 'hi' ? 'सामान्य और नियंत्रित' : 'Controlled & stable'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('cholesterol')}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            </div>
            <p className="text-lg font-bold text-slate-900">218 mg/dL</p>
            <p className="text-xs text-amber-700 font-semibold mt-1">
              {language === 'hi' ? 'एटोरवास्टेटिन द्वारा प्रबंधित' : 'Managed with Atorvastatin'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
