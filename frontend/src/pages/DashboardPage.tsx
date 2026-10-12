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
  HeartPulse,
  Volume2,
  VolumeX,
  Check,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CreditCard,
  QrCode,
  Printer,
  X,
  ShieldCheck,
  PhoneCall,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { firebaseDb } from '../services/firebase';
import { DashboardStats } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenUploadModal: () => void;
}

interface PillItem {
  id: string;
  name: string;
  dosage: string;
  slot: 'morning' | 'afternoon' | 'night';
  instruction: string;
  instructionHi: string;
  purpose: string;
  purposeHi: string;
}

const DEFAULT_PILLS: PillItem[] = [
  {
    id: 'pill-1',
    name: 'Metformin',
    dosage: '500 mg',
    slot: 'morning',
    instruction: '1 tablet with or after breakfast',
    instructionHi: '1 गोली नाश्ते के बाद पानी के साथ',
    purpose: 'Blood Sugar control',
    purposeHi: 'शुगर नियंत्रण'
  },
  {
    id: 'pill-2',
    name: 'Telmisartan',
    dosage: '40 mg',
    slot: 'morning',
    instruction: '1 tablet morning with water',
    instructionHi: '1 गोली सुबह नाश्ते से पहले या बाद',
    purpose: 'Blood Pressure regulation',
    purposeHi: 'ब्लड प्रेशर नियंत्रण'
  },
  {
    id: 'pill-3',
    name: 'Atorvastatin',
    dosage: '20 mg',
    slot: 'afternoon',
    instruction: '1 tablet after lunch',
    instructionHi: '1 गोली दोपहर के खाने के बाद',
    purpose: 'Cholesterol management',
    purposeHi: 'कोलेस्ट्रॉल नियंत्रण'
  },
  {
    id: 'pill-4',
    name: 'Metformin',
    dosage: '500 mg',
    slot: 'night',
    instruction: '1 tablet after dinner',
    instructionHi: '1 गोली रात के खाने के बाद',
    purpose: 'Overnight glucose stabilization',
    purposeHi: 'रात में शुगर नियंत्रण'
  }
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onNavigate, 
  onOpenUploadModal 
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Daily Pill Tracker State (persisted for the current date)
  const todayKey = new Date().toISOString().slice(0, 10);
  const [takenPills, setTakenPills] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`sehat_pills_${todayKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Voice Speech Synthesizer State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHealthPass, setShowHealthPass] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Sync from Firebase Firestore if available
    if (user?.id) {
      firebaseDb.getPillTracking(user.id, todayKey).then(remotePills => {
        if (remotePills && Object.keys(remotePills).length > 0) {
          setTakenPills(prev => ({ ...prev, ...remotePills }));
        }
      }).catch(e => console.warn('Pill sync skipped:', e));
    }
  }, [user]);

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

  const togglePill = (id: string) => {
    setTakenPills(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(`sehat_pills_${todayKey}`, JSON.stringify(next));

      // Also persist to Firebase Cloud Firestore
      if (user?.id) {
        firebaseDb.savePillTracking(user.id, todayKey, next).catch(e => {
          console.warn('Firebase pill sync warning:', e);
        });
      }

      return next;
    });
  };

  const takenCount = DEFAULT_PILLS.filter(p => takenPills[p.id]).length;
  const progressPercent = Math.round((takenCount / DEFAULT_PILLS.length) * 100);

  // Native Browser Web Speech API Audio Routine
  const handleToggleVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let speechText = '';
    let voiceLang = 'en-US';

    if (language === 'hi') {
      voiceLang = 'hi-IN';
      speechText = `नमस्ते ${user?.full_name?.split(' ')[0] || 'राजेश जी'}। आपकी आज की दवाइयों की समय सारणी: 
      सुबह के समय: नाश्ते के बाद मेटफ़ॉर्मिन 500 मिलीग्राम, और टेल्मिसार्टन 40 मिलीग्राम लें। 
      दोपहर के समय: भोजन के बाद एटोरवास्टेटिन 20 मिलीग्राम लें। 
      रात के समय: रात के खाने के बाद मेटफ़ॉर्मिन 500 मिलीग्राम लें। 
      ध्यान रखें: आपको पेनिसिलिन से गंभीर एलर्जी है, कोई भी इंजेक्शन लगवाने से पहले डॉक्टर को ज़रूर बताएं।`;
    } else {
      speechText = `Hello ${user?.full_name?.split(' ')[0] || 'Rajesh'}. Here is your medicine schedule for today: 
      Morning: Metformin 500 milligrams after breakfast, and Telmisartan 40 milligrams. 
      Afternoon: Atorvastatin 20 milligrams after lunch for cholesterol. 
      Night: Metformin 500 milligrams after dinner. 
      Important alert: You have a documented allergy to Penicillin. Please inform your doctor before receiving any antibiotics.`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(language === 'hi' ? 'hi' : 'en'));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Reassuring Hospital Greeting Card — Modern Hospital Gradient */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-sky-800 rounded-3xl p-6 sm:p-7 text-white shadow-sm border border-teal-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold border border-white/20 backdrop-blur-xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Max & Fortis Records Connected</span>
            </span>
            <span className="text-[11px] text-teal-200 font-mono">ID: PT-84910</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('greeting_prefix')}, {user?.full_name?.split(' ')[0] || user?.full_name || 'Patient'}!
          </h1>
          <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
            {language === 'hi' 
              ? 'आपकी सभी दवाइयां और स्वास्थ्य रिकॉर्ड सुरक्षित हैं। डॉक्टर को दिखाने के लिए नीचे से QR कोड शेयर करें।'
              : 'All your prescriptions, lab tests, and medical records are safely organized in one place.'}
          </p>
        </div>

        {/* Action Buttons: Audio Prescription & Emergency Pass */}
        <div className="relative z-10 flex flex-wrap sm:flex-col items-start sm:items-end gap-2.5 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHealthPass(true)}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 shadow-xs border bg-teal-900/50 hover:bg-teal-900/80 text-white border-white/20 backdrop-blur-xs"
              title="View Digital Emergency Health ID Card"
            >
              <CreditCard className="w-4 h-4 text-emerald-300" />
              <span>{language === 'hi' ? 'आपातकालीन हेल्थ कार्ड' : 'Emergency Health Pass'}</span>
            </button>

            <button
              onClick={handleToggleVoice}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 shadow-xs border ${
                isSpeaking
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-white hover:bg-teal-50 text-teal-900 border-white'
              }`}
              title="Read prescription aloud"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-white" />
                  <span>{language === 'hi' ? 'रोकें' : 'Stop'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-teal-700" />
                  <span>{language === 'hi' ? '🔊 सुनें' : '🔊 Listen'}</span>
                </>
              )}
            </button>
          </div>

          <span className="text-[10px] text-teal-200">
            {language === 'hi' ? '1-क्लिक ऑडियो व सत्यापित डिजिटल हेल्थ कार्ड' : 'Verified health pass & voice readout'}
          </span>
        </div>

        {/* Soft decorative glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
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
                {language === 'hi' ? 'आज की दवाइयां मार्क करें' : `${takenCount} of ${DEFAULT_PILLS.length} pills taken today`}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>{progressPercent}% {language === 'hi' ? 'पूर्ण' : 'Completed'}</span>
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
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3.5 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
              ⚠️ {t('allergy_warning')}
            </h4>
            <span className="text-[10px] bg-rose-200/70 text-rose-800 px-2 py-0.2 rounded-full font-bold">
              High Severity
            </span>
          </div>
          <p className="text-xs text-rose-800 mt-0.5 font-medium leading-relaxed">
            {t('allergy_warning_text')}
          </p>
        </div>
      </div>

      {/* Today's Daily Pill Organizer with Interactive Check-Off Tracker */}
      <div id="patient-medicines-section" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <span>{t('today_medicines')}</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {takenCount}/{DEFAULT_PILLS.length} {language === 'hi' ? 'दवा ली गई' : 'Taken'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi' 
                ? 'दवा खाने के बाद चेकबॉक्स पर क्लिक करें ताकि कोई खुराक न छूटे।' 
                : 'Check off each pill once taken so you never miss a dose.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Progress bar */}
            <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200 hidden sm:block">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
            >
              <span>{language === 'hi' ? 'पूरी पर्चियां देखें' : 'View All Prescriptions'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          {/* Morning Slot */}
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between text-amber-900 font-bold text-xs pb-2 border-b border-amber-200/70">
              <div className="flex items-center space-x-2">
                <Sunrise className="w-4 h-4 text-amber-600" />
                <span>{t('morning')}</span>
              </div>
              <span className="text-[10px] text-amber-800/80 font-normal">8:00 AM - 9:30 AM</span>
            </div>
            
            <div className="space-y-2.5">
              {DEFAULT_PILLS.filter(p => p.slot === 'morning').map(pill => {
                const isTaken = takenPills[pill.id];
                return (
                  <div 
                    key={pill.id}
                    onClick={() => togglePill(pill.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isTaken 
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs' 
                        : 'bg-white border-amber-200/70 hover:border-amber-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-xs ${isTaken ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {pill.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded">
                          {pill.dosage}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {language === 'hi' ? pill.instructionHi : pill.instruction}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                        {language === 'hi' ? pill.purposeHi : pill.purpose}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle pill taken"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition ${
                        isTaken
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-300 hover:border-teal-500 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Afternoon Slot */}
          <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-200/80 space-y-3">
            <div className="flex items-center justify-between text-sky-900 font-bold text-xs pb-2 border-b border-sky-200/70">
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-sky-600" />
                <span>{t('afternoon')}</span>
              </div>
              <span className="text-[10px] text-sky-800/80 font-normal">1:00 PM - 2:00 PM</span>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_PILLS.filter(p => p.slot === 'afternoon').map(pill => {
                const isTaken = takenPills[pill.id];
                return (
                  <div 
                    key={pill.id}
                    onClick={() => togglePill(pill.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isTaken 
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs' 
                        : 'bg-white border-sky-200/70 hover:border-sky-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-xs ${isTaken ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {pill.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-100 text-sky-900 rounded">
                          {pill.dosage}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {language === 'hi' ? pill.instructionHi : pill.instruction}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                        {language === 'hi' ? pill.purposeHi : pill.purpose}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle pill taken"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition ${
                        isTaken
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-300 hover:border-teal-500 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Night Slot */}
          <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between text-teal-900 font-bold text-xs pb-2 border-b border-teal-200/70">
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-teal-600" />
                <span>{t('night')}</span>
              </div>
              <span className="text-[10px] text-teal-800/80 font-normal">8:30 PM - 10:00 PM</span>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_PILLS.filter(p => p.slot === 'night').map(pill => {
                const isTaken = takenPills[pill.id];
                return (
                  <div 
                    key={pill.id}
                    onClick={() => togglePill(pill.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isTaken 
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs' 
                        : 'bg-white border-teal-200/70 hover:border-teal-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-xs ${isTaken ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {pill.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-100 text-teal-900 rounded">
                          {pill.dosage}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {language === 'hi' ? pill.instructionHi : pill.instruction}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                        {language === 'hi' ? pill.purposeHi : pill.purpose}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle pill taken"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition ${
                        isTaken
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-300 hover:border-teal-500 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Simple Health Status with Color Indicators */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-teal-600" />
            <span>{t('health_vitals_title')}</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {language === 'hi' ? 'अंतिम टेस्ट: 17 सितंबर 2026' : 'Last Tested: 17 Sep 2026'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-amber-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('blood_sugar')}</span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <span>Elevated</span>
              </span>
            </div>
            <p className="text-xl font-black text-slate-900">142 mg/dL</p>
            <p className="text-xs text-amber-700 font-semibold mt-1">
              {language === 'hi' ? 'HbA1c 7.8% • भोजन में मीठा नियंत्रित रखें' : 'HbA1c 7.8% (Target < 7.0%) • Diet review'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('blood_pressure')}</span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <span>Normal</span>
              </span>
            </div>
            <p className="text-xl font-black text-slate-900">134/84 mmHg</p>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              {language === 'hi' ? 'टेल्मिसार्टन से नियंत्रित • सामान्य' : 'Controlled with Telmisartan • Stable'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-amber-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('cholesterol')}</span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <span>Borderline</span>
              </span>
            </div>
            <p className="text-xl font-black text-slate-900">218 mg/dL</p>
            <p className="text-xs text-amber-700 font-semibold mt-1">
              {language === 'hi' ? 'एटोरवास्टेटिन द्वारा प्रबंधित' : 'Managed with Atorvastatin 20mg'}
            </p>
          </div>
        </div>
      </div>

      {/* Digital Emergency Health Pass Modal */}
      {showHealthPass && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {language === 'hi' ? 'आपातकालीन स्वास्थ्य पहचान' : 'Official Emergency Health Pass'}
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight mt-1">
                  {language === 'hi' ? 'डिजिटल रोगी कार्ड' : 'Verified Patient Medical ID'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHealthPass(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Digital Card */}
            <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-sky-950 text-white rounded-3xl p-6 shadow-xl border border-teal-500/30 space-y-5 relative overflow-hidden font-sans">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-wider uppercase text-teal-300">SEHAT SATHI SMART HEALTH PASS</h4>
                    <p className="text-[10px] text-slate-400 font-mono">ABDM / EHR STANDARDS COMPLIANT</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30">
                  ACTIVE
                </span>
              </div>

              {/* Patient Profile Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Patient Name</span>
                  <h3 className="text-xl font-black text-white">{user?.full_name || 'Rajesh Sharma'}</h3>
                  <div className="flex items-center space-x-3 text-xs text-teal-200/90 pt-0.5">
                    <span>54 Yrs • Male</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                      Blood Group: B+
                    </span>
                  </div>
                </div>

                {/* Simulated QR Code for Emergency Scan */}
                <div className="p-2 bg-white rounded-2xl shrink-0 shadow-md">
                  <div className="w-20 h-20 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-1 text-center relative overflow-hidden">
                    <QrCode className="w-16 h-16 text-white" />
                  </div>
                  <span className="text-[8px] font-mono text-slate-700 text-center block mt-1 font-bold">SCAN IN ER</span>
                </div>
              </div>

              {/* CRITICAL ALLERGY ALERT BANNER */}
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-xs flex items-start space-x-2.5 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-black uppercase text-rose-300 tracking-wider block">
                    CRITICAL CONTRAINDICATION
                  </span>
                  <p className="font-bold text-white text-xs mt-0.5">
                    Severe Anaphylaxis to Penicillin & Ampicillin
                  </p>
                  <p className="text-[10px] text-rose-200/80 mt-0.5">
                    Flagged across Max Healthcare & Fortis records. Do not administer beta-lactams.
                  </p>
                </div>
              </div>

              {/* Grid: Conditions & Emergency Contact */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-white/10">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Verified Conditions</span>
                  <p className="text-[11px] text-slate-200 font-medium">Type 2 Diabetes • Hypertension • Dyslipidemia</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Emergency ICE Contact</span>
                  <a href="tel:+919876543210" className="text-[11px] text-teal-300 font-bold hover:underline flex items-center space-x-1">
                    <PhoneCall className="w-3 h-3 text-emerald-400" />
                    <span>Sunita (Wife): +91 98765-43210</span>
                  </a>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1 border-t border-white/10">
                <span>ABHA ID: 91-8491-0428-9102</span>
                <span>DOC HASH: SHA256-V881</span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center space-x-2 shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>{language === 'hi' ? 'कार्ड प्रिंट करें' : 'Print / Save Health Pass'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHealthPass(false)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                {language === 'hi' ? 'बंद करें' : 'Done'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
