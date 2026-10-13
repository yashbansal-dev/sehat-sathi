import React, { useState } from 'react';
import { 
  HeartPulse, 
  QrCode, 
  Printer, 
  X, 
  PhoneCall, 
  AlertTriangle, 
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Pill,
  Sparkles,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface EmergencyCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyCardModal: React.FC<EmergencyCardModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const erPortalUrl = `${window.location.origin}/doctor-portal/demo-share-token-48h`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(erPortalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestErView = () => {
    window.open('/doctor-portal/demo-share-token-48h', '_blank');
  };

  const isHindi = language === 'hi';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 max-h-[94vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 shadow-2xs">
              <HeartPulse className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {isHindi ? 'आपातकालीन इन-केस-ऑफ-इमरजेंसी (ICE)' : 'In-Case-of-Emergency (ICE) Pass'}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hidden sm:inline">
                  ABDM Verified
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                {isHindi ? 'त्वरित आपातकालीन मेडिकल कार्ड और क्यूआर' : 'Verified Emergency Responder Health Pass'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Physical Smart Card Representation */}
        <div 
          id="emergency-wallet-card" 
          className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-teal-500/30 space-y-4 relative overflow-hidden font-sans"
        >
          {/* Subtle glowing watermark */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Card Top Strip */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-[11px] font-black tracking-wider uppercase text-teal-300">SEHAT SATHI SMART HEALTH PASS</h4>
                <p className="text-[9px] text-slate-400 font-mono tracking-tight">ABHA ID: 91-4820-1928-3012@abdm</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30">
                ACTIVE • 24/7
              </span>
            </div>
          </div>

          {/* Patient Details & Instant QR Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            
            <div className="sm:col-span-2 space-y-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Patient Name & Demographics</span>
                <h3 className="text-xl font-black text-white">{user?.full_name || 'Rajesh Sharma'}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-teal-200/90 pt-1">
                  <span>54 Yrs • Male</span>
                  <span>•</span>
                  <span className="font-extrabold text-white bg-rose-600 px-2.5 py-0.5 rounded-full border border-rose-400 shadow-xs">
                    Blood Group: B+
                  </span>
                  <span>•</span>
                  <span className="text-[11px] text-emerald-300 font-medium">Organ Donor: Yes</span>
                </div>
              </div>

              {/* Verified Diagnoses */}
              <div className="pt-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Chronic Conditions</span>
                <p className="text-xs text-slate-200 font-semibold">
                  Type 2 Diabetes Mellitus • Essential Hypertension • Dyslipidemia
                </p>
              </div>
            </div>

            {/* ER QR Code Preview */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-md text-slate-900 shrink-0">
              <div className="w-24 h-24 bg-slate-900 rounded-xl p-1.5 flex items-center justify-center relative overflow-hidden">
                <QrCode className="w-20 h-20 text-white" />
              </div>
              <span className="text-[8px] font-mono text-slate-700 text-center font-black mt-1">
                SCAN FOR 2-MIN ER BRIEF
              </span>
              <span className="text-[7px] text-slate-400 font-mono text-center">ZERO APP INSTALL NEEDED</span>
            </div>
          </div>

          {/* CRITICAL CONTRAINDICATIONS & ALLERGIES */}
          <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/80 text-xs flex items-start space-x-3 shadow-md">
            <div className="p-1 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase text-rose-300 tracking-wider">
                  CRITICAL CONTRAINDICATION & ALLERGIES
                </span>
                <span className="text-[9px] bg-rose-900 text-rose-200 px-1.5 py-0.2 rounded font-bold">
                  HIGH ALERT
                </span>
              </div>
              <p className="font-extrabold text-white text-xs mt-0.5">
                Severe Anaphylaxis to Penicillin & Ampicillin.
              </p>
              <p className="text-[11px] text-rose-200/90 mt-0.5">
                Do NOT administer beta-lactams. Cross-checked across 4 clinical discharge summaries. Mild sensitivity to Sulfa antibiotics.
              </p>
            </div>
          </div>

          {/* Active Life-Sustaining Medications */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
            <div className="flex items-center space-x-1.5 text-teal-300 font-bold text-[11px]">
              <Pill className="w-3.5 h-3.5" />
              <span>Current Daily Medications:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-200">
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                <p className="font-bold text-white">Metformin</p>
                <p className="text-[10px] text-slate-400">500mg BID (Meals)</p>
              </div>
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                <p className="font-bold text-white">Glimepiride</p>
                <p className="text-[10px] text-slate-400">1mg OD (Morning)</p>
              </div>
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                <p className="font-bold text-white">Atorvastatin</p>
                <p className="text-[10px] text-slate-400">20mg HS (Night)</p>
              </div>
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                <p className="font-bold text-white">Telmisartan</p>
                <p className="text-[10px] text-slate-400">40mg OD (BP)</p>
              </div>
            </div>
          </div>

          {/* Emergency Contacts Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Primary ICE Contact (Family)</span>
              <a href="tel:+919876543210" className="text-[11px] text-teal-300 font-bold hover:underline flex items-center space-x-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sunita Sharma (Spouse): +91 98765-43210</span>
              </a>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Treating Physician</span>
              <a href="tel:+919811234567" className="text-[11px] text-teal-300 font-bold hover:underline flex items-center space-x-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dr. Arvind Mehta (Cardio): +91 98112-34567</span>
              </a>
            </div>
          </div>

        </div>

        {/* Live ER Testing & Sharing Action Bar */}
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-teal-900 font-bold">Live Demonstration Mode:</span>
            <span className="text-slate-600 hidden sm:inline">Simulate what an emergency physician sees when scanning the card.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleTestErView}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <span>Test Live ER Doctor Brief</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-teal-100 text-teal-800 font-semibold border border-teal-300 text-xs transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center space-x-2 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Wallet Card</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            Close Pass
          </button>
        </div>

      </div>
    </div>
  );
};
