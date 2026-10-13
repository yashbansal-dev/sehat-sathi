import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  FileText, 
  Clock, 
  Share2, 
  Pill, 
  ShieldAlert, 
  HeartPulse, 
  Check, 
  TrendingUp, 
  AlertTriangle, 
  Printer, 
  X, 
  Mic, 
  Home, 
  Calendar, 
  Copy, 
  Info, 
  ArrowRight, 
  Paperclip, 
  MoreVertical, 
  Droplets, 
  FileCheck,
  Upload,
  Send,
  Stethoscope,
  Plus,
  Eye,
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats, MedicalDocument } from '../types';
import { EmergencyCardModal } from '../components/EmergencyCardModal';
import { VoiceAssistantModal } from '../components/VoiceAssistantModal';
import patientAvatar from '../assets/patient_avatar.jpg';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenUploadModal: () => void;
}

interface PillItem {
  id: string;
  name: string;
  dosage: string;
  timeSlot: string;
  timeLabel: string;
  instructions: string;
  purpose: string;
}

const DEFAULT_MEDS: PillItem[] = [
  {
    id: 'med-1',
    name: 'Metformin',
    dosage: '500 mg',
    timeSlot: 'Morning',
    timeLabel: '8:00 AM',
    instructions: '1 tablet after breakfast',
    purpose: 'Blood sugar control'
  },
  {
    id: 'med-2',
    name: 'Telmisartan',
    dosage: '40 mg',
    timeSlot: 'Morning',
    timeLabel: '8:00 AM',
    instructions: '1 tablet with water',
    purpose: 'Blood pressure regulation'
  },
  {
    id: 'med-3',
    name: 'Atorvastatin',
    dosage: '20 mg',
    timeSlot: 'Afternoon',
    timeLabel: '2:00 PM',
    instructions: '1 tablet after lunch',
    purpose: 'Cholesterol management'
  },
  {
    id: 'med-4',
    name: 'Metformin',
    dosage: '500 mg',
    timeSlot: 'Night',
    timeLabel: '8:00 PM',
    instructions: '1 tablet after dinner',
    purpose: 'Overnight glucose stabilisation'
  }
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onNavigate, 
  onOpenUploadModal: _onOpenUploadModal 
}) => {
  const { user, demoDoctorLogin } = useAuth();
  const [_stats, setStats] = useState<DashboardStats | null>(null);
  const [_loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);

  // Daily Medication Tracker State (persisted in localStorage)
  const todayKey = new Date().toISOString().slice(0, 10);
  const [takenMeds, setTakenMeds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`sehat_meds_${todayKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [copiedAbha, setCopiedAbha] = useState(false);
  const [showHealthPass, setShowHealthPass] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('overview');

  // Direct Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState('Prescription');
  const [uploadDocDate, setUploadDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessDoc, setUploadSuccessDoc] = useState<MedicalDocument | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<MedicalDocument | null>(null);

  // Send to Doctor Modal State
  const [showSendDoctorModal, setShowSendDoctorModal] = useState(false);
  const [sendingToDoctor, setSendingToDoctor] = useState(false);
  const [doctorSentSuccess, setDoctorSentSuccess] = useState(false);
  const [sentToken, setSentToken] = useState<string | null>(() => {
    try {
      const q = JSON.parse(localStorage.getItem('sehat_checked_in_patients') || '[]');
      const r = q.find((p: any) => p.name.toLowerCase().includes('rajesh'));
      return r ? r.token_number : null;
    } catch {
      return null;
    }
  });
  const [chiefComplaint, setChiefComplaint] = useState(
    'Routine 3-month follow-up for Type 2 Diabetes & Hypertension. Glycemic review with latest reports.'
  );

  const loadDocuments = async () => {
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch (e) {
      console.warn('Failed to load documents:', e);
    }
  };

  useEffect(() => {
    loadDocuments();
    setStats({
      total_documents: 13,
      processed_documents: 13,
      verified_records_count: 32,
      records_requiring_review: 5,
      total_timeline_events: 14,
      active_medications: 4,
      abnormal_lab_results: 2,
      recent_uploads: [],
      recent_events: []
    });
    setLoading(false);
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      let lastUploaded: any = null;
      for (const file of uploadFiles) {
        lastUploaded = await api.uploadDocument(file, uploadCategory, uploadDocDate);
      }
      await loadDocuments();
      setUploadSuccessDoc(lastUploaded);
      setUploadFiles([]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSampleDoc = async (sampleType: 'prescription' | 'lab') => {
    setUploading(true);
    setUploadError(null);
    try {
      const sampleFile = sampleType === 'prescription'
        ? new File(['Mock prescription data'], 'Apex_FollowUp_Prescription_Oct2026.pdf', { type: 'application/pdf' })
        : new File(['Mock lab report data'], 'Metropolis_Comprehensive_Metabolic_Oct2026.pdf', { type: 'application/pdf' });
      const cat = sampleType === 'prescription' ? 'Prescription' : 'Lab Report';
      const uploaded = await api.uploadDocument(sampleFile, cat, new Date().toISOString().slice(0, 10));
      await loadDocuments();
      setUploadSuccessDoc(uploaded);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to add sample document');
    } finally {
      setUploading(false);
    }
  };

  const handleSendToDoctor = async () => {
    setSendingToDoctor(true);
    try {
      const checkedIn = await api.checkInPatient({
        name: user?.full_name || 'Rajesh Sharma',
        chief_complaint: chiefComplaint,
        vitals: {
          bp: '128 / 82 mmHg',
          pulse: '72 bpm',
          blood_sugar: '124 mg/dL',
          temp: '98.4°F',
          spo2: '98%'
        },
        documents: documents
      });
      setSentToken(checkedIn.token_number);
      setDoctorSentSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingToDoctor(false);
    }
  };

  const toggleMed = (id: string) => {
    setTakenMeds(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`sehat_meds_${todayKey}`, JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  const takenCount = Object.values(takenMeds).filter(Boolean).length;

  const handleCopyAbha = () => {
    navigator.clipboard.writeText('91-4320-1938-7011-2846');
    setCopiedAbha(true);
    setTimeout(() => setCopiedAbha(false), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 font-sans">
      <div className="flex gap-6 items-start">

        {/* ========================================================================= */}
        {/* LEFT SIDEBAR (Matching User's Mockup)                                     */}
        {/* ========================================================================= */}
        <aside className="w-48 shrink-0 hidden lg:block space-y-6 pt-1">
          {/* Section: PATIENT */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              PATIENT
            </span>

            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('overview');
                onNavigate('home');
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSidebarTab === 'overview'
                  ? 'bg-[#e6f4ea] text-[#0d6832]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4 text-[#0d6832]" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('documents');
                onNavigate('documents');
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Documents</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('medications');
                document.getElementById('medication-schedule')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Pill className="w-4 h-4 text-slate-500" />
              <span>Medications</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('trends');
                onNavigate('trends');
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <span>Trends</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('labs');
                onNavigate('documents');
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Activity className="w-4 h-4 text-slate-500" />
              <span>Lab Reports</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('timeline');
                onNavigate('timeline');
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Section: ACTIONS */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              ACTIONS
            </span>

            {/* Direct 1-Click Send to Doctor */}
            <button
              type="button"
              onClick={() => {
                setDoctorSentSuccess(false);
                setShowSendDoctorModal(true);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#0d6832] bg-[#e6f4ea] hover:bg-[#ceead6] transition cursor-pointer border border-[#ceead6]"
            >
              <Stethoscope className="w-4 h-4 text-[#0d6832]" />
              <span>Send to Doctor (1-Click)</span>
            </button>

            {/* Direct Upload Document */}
            <button
              type="button"
              onClick={() => {
                setUploadSuccessDoc(null);
                setShowUploadModal(true);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Upload Record</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('summary')}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-slate-500" />
              <span>Clinical Summary</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('share')}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Share Records</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Mic className="w-4 h-4 text-slate-500" />
              <span>Voice Assistant</span>
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA                                               */}
        {/* ========================================================================= */}
        <main className="flex-1 min-w-0 space-y-4">

          {/* 1. PATIENT HEADER CARD (Pixel-accurate matching mockup) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            
            {/* Left: Avatar & Demographics */}
            <div className="flex items-start space-x-4">
              <img
                src={patientAvatar}
                alt="Rajesh Sharma"
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
              />

              <div className="space-y-1.5">
                {/* Name & Verified Badge */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {user?.full_name || 'Rajesh Sharma'}
                  </h1>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#0d6832] text-xs font-semibold border border-[#ceead6]">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Verified Identity</span>
                  </span>
                  {sentToken && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>In Doctor Queue: {sentToken}</span>
                    </span>
                  )}
                </div>

                {/* ABHA ID with Copy button */}
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <span className="font-medium">ABHA ID: 91-4320-1938-7011-2846</span>
                  <button
                    type="button"
                    onClick={handleCopyAbha}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title={copiedAbha ? "Copied to clipboard!" : "Copy ABHA ID"}
                  >
                    {copiedAbha ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {copiedAbha && (
                    <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                  )}
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                  <span>52 years</span>
                  <span className="text-slate-300">|</span>
                  <span>Male</span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center space-x-1">
                    <span>Blood Group:</span>
                    <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 text-[11px]">
                      B+
                    </span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>Last updated: 12 Oct 2026, 10:24 AM</span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center space-x-1 text-slate-600">
                    <span>Sources: Apex Clinic, MaxCare, Metropolis (3 clinics)</span>
                    <Info className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              {/* Primary 1-Click Send to Doctor */}
              <button
                type="button"
                onClick={() => {
                  setDoctorSentSuccess(false);
                  setShowSendDoctorModal(true);
                }}
                className="px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 bg-[#0d652d] hover:bg-[#094d22] text-white shadow-sm cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>{sentToken ? `✓ Sent to Dr. Meera Singh (${sentToken})` : 'Send Records to Dr. Meera Singh'}</span>
              </button>

              {/* Upload Medical Record */}
              <button
                type="button"
                onClick={() => {
                  setUploadSuccessDoc(null);
                  setShowUploadModal(true);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Upload Medical Record</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('summary')}
                  className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <span>Summary</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowVoiceModal(true)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <Mic className="w-3 h-3 text-slate-600" />
                  <span>Voice</span>
                </button>
              </div>
            </div>

          </div>

          {/* 2. CRITICAL ALLERGY ALERT BANNER (Pixel-accurate matching mockup) */}
          <div className="bg-[#fef7f6] border border-[#fad2cf] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-full bg-[#d93025] text-white flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[#b3261e]">
                  Severe penicillin anaphylaxis — avoid penicillin-class antibiotics
                </h3>
                <p className="text-xs text-[#601410] mt-0.5">
                  Beta-lactam antibiotics strictly prohibited. Documented anaphylactic reaction.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllergyModal(true)}
              className="text-xs font-semibold text-[#b3261e] hover:text-[#791b15] flex items-center space-x-1 shrink-0 self-end sm:self-auto cursor-pointer"
            >
              <span>View allergy details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. THREE VITALS METRIC CARDS (Pixel-accurate matching mockup) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Vital 1: Blood Pressure */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] text-[#0d6832] flex items-center justify-center">
                    <HeartPulse className="w-5 h-5 text-[#0d6832]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Blood Pressure</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-[#0d6832] flex items-center justify-end space-x-0.5">
                    <span>↓ from 134/86</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">2 weeks ago</span>
                </div>
              </div>

              <div className="my-2.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">128 / 82</span>
                <span className="text-xs font-normal text-slate-500 ml-1.5">mmHg</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#0d6832] bg-[#e6f4ea] px-2.5 py-0.5 rounded-md inline-block border border-[#ceead6]">
                  ✓ Controlled (Apex Clinic)
                </span>
              </div>
            </div>

            {/* Vital 2: Fasting Glucose */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-[#1a73e8]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Fasting Glucose</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-[#0d6832] flex items-center justify-end space-x-0.5">
                    <span>↓ from 142</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">1 month ago</span>
                </div>
              </div>

              <div className="my-2.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">124</span>
                <span className="text-xs font-normal text-slate-500 ml-1.5">mg/dL</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#7a4b04] bg-[#fef7e0] px-2.5 py-0.5 rounded-md inline-block border border-[#feefa3]">
                  Target: &lt; 130 mg/dL
                </span>
              </div>
            </div>

            {/* Vital 3: HbA1c */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#e0f2f1] text-[#00796b] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#00796b]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">HbA1c</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-[#0d6832] flex items-center justify-end space-x-0.5">
                    <span>↓ from 8.2%</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">3 months ago</span>
                </div>
              </div>

              <div className="my-2.5 flex items-baseline">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">7.4 %</span>
                <span className="text-xs font-semibold text-[#0d6832] bg-[#e6f4ea] px-2 py-0.5 rounded ml-2 border border-[#ceead6]">
                  Improved
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#0d6832] bg-[#e6f4ea] px-2.5 py-0.5 rounded-md inline-block border border-[#ceead6]">
                  Reduced from 8.2% (baseline)
                </span>
              </div>
            </div>

          </div>

          {/* 4. TWO-COLUMN MIDDLE SECTION (Meds Schedule & Doctor Handoff) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Left: Today's Medication Schedule (7 cols) */}
            <div id="medication-schedule" className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-[#e6f4ea] text-[#0d6832]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Today's Medication Schedule
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#0d6832] border border-[#ceead6]">
                    {takenCount} / {DEFAULT_MEDS.length} taken
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Sun, 12 Oct 2026
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-2 font-bold">MEDICINE</th>
                      <th className="pb-2 font-bold">DOSAGE</th>
                      <th className="pb-2 font-bold">INSTRUCTIONS</th>
                      <th className="pb-2 font-bold">TIME</th>
                      <th className="pb-2 font-bold text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {DEFAULT_MEDS.map(med => {
                      const isTaken = !!takenMeds[med.id];
                      return (
                        <tr 
                          key={med.id}
                          className="hover:bg-slate-50/70 transition cursor-pointer"
                          onClick={() => toggleMed(med.id)}
                        >
                          <td className="py-3 pr-3">
                            <span className="font-bold text-slate-900 block">{med.name}</span>
                            <span className="text-[11px] text-slate-500 block">{med.purpose}</span>
                          </td>
                          <td className="py-3 pr-3 font-semibold text-slate-800">
                            {med.dosage}
                          </td>
                          <td className="py-3 pr-3 text-slate-600 font-medium">
                            {med.instructions}
                          </td>
                          <td className="py-3 pr-3 text-slate-600">
                            <span className="font-medium block">{med.timeSlot}</span>
                            <span className="text-[11px] text-slate-400">{med.timeLabel}</span>
                          </td>
                          <td className="py-3 text-center">
                            <div 
                              className={`w-5 h-5 rounded mx-auto flex items-center justify-center transition border ${
                                isTaken
                                  ? 'bg-[#0d652d] border-[#0d652d] text-white shadow-2xs'
                                  : 'border-slate-300 bg-white hover:border-slate-400'
                              }`}
                            >
                              {isTaken && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Right: Doctor Handoff Card (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-[#e6f4ea] text-[#0d6832]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Doctor Handoff
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('summary')}
                  className="text-xs font-semibold text-[#0d6832] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View full summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Two Sub-panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Left Sub-panel: Clinical Narrative & Issues */}
                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-[#0d6832] block mb-1">
                      Clinical Summary (Concise)
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      52-year-old male with Type 2 Diabetes Mellitus, Hypertension and Dyslipidemia. Blood pressure controlled on Telmisartan. HbA1c improving (8.2% → 7.4%). No recent hospitalizations. Known severe penicillin anaphylaxis.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block mb-1.5">
                      Current Issues
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      <li className="flex items-start space-x-1.5">
                        <span className="text-slate-400">•</span>
                        <span>Type 2 Diabetes Mellitus (HbA1c 7.4%)</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-slate-400">•</span>
                        <span>Hypertension (controlled)</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-slate-400">•</span>
                        <span>Dyslipidemia</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-rose-500">•</span>
                        <span className="text-rose-700 font-medium">Severe penicillin allergy (anaphylaxis)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Sub-panel: QR Code Handover */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-between text-center space-y-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Patient handoff QR
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      Share this QR with other clinicians to access verified records.
                    </span>
                  </div>

                  {/* Sharp Authentic QR Code Pattern SVG */}
                  <div className="w-24 h-24 bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                      {/* Standard 2D QR finder patterns */}
                      <rect x="0" y="0" width="28" height="28" rx="2" fill="#0f172a" />
                      <rect x="4" y="4" width="20" height="20" rx="1" fill="white" />
                      <rect x="8" y="8" width="12" height="12" rx="1" fill="#0f172a" />

                      <rect x="72" y="0" width="28" height="28" rx="2" fill="#0f172a" />
                      <rect x="76" y="4" width="20" height="20" rx="1" fill="white" />
                      <rect x="80" y="8" width="12" height="12" rx="1" fill="#0f172a" />

                      <rect x="0" y="72" width="28" height="28" rx="2" fill="#0f172a" />
                      <rect x="4" y="76" width="20" height="20" rx="1" fill="white" />
                      <rect x="8" y="80" width="12" height="12" rx="1" fill="#0f172a" />

                      {/* Data Dots & Matrix */}
                      <rect x="36" y="4" width="6" height="6" fill="#0f172a" />
                      <rect x="48" y="8" width="6" height="6" fill="#0f172a" />
                      <rect x="58" y="4" width="6" height="6" fill="#0f172a" />
                      <rect x="36" y="18" width="6" height="6" fill="#0f172a" />
                      <rect x="48" y="24" width="6" height="6" fill="#0f172a" />

                      <rect x="8" y="38" width="6" height="6" fill="#0f172a" />
                      <rect x="20" y="44" width="6" height="6" fill="#0f172a" />
                      <rect x="36" y="38" width="8" height="8" fill="#0f172a" />
                      <rect x="50" y="42" width="6" height="6" fill="#0f172a" />
                      <rect x="64" y="38" width="6" height="6" fill="#0f172a" />
                      <rect x="78" y="44" width="6" height="6" fill="#0f172a" />

                      <rect x="38" y="58" width="6" height="6" fill="#0f172a" />
                      <rect x="52" y="56" width="8" height="8" fill="#0f172a" />
                      <rect x="68" y="60" width="6" height="6" fill="#0f172a" />
                      <rect x="84" y="58" width="6" height="6" fill="#0f172a" />

                      <rect x="36" y="76" width="6" height="6" fill="#0f172a" />
                      <rect x="48" y="84" width="6" height="6" fill="#0f172a" />
                      <rect x="62" y="78" width="6" height="6" fill="#0f172a" />
                      <rect x="78" y="84" width="6" height="6" fill="#0f172a" />
                    </svg>
                  </div>

                  <span className="text-[9px] font-mono text-slate-500">
                    ABHA ID: 91-4320-1938-7011-2846
                  </span>

                  {/* 1-Click Send to Doctor Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDoctorSentSuccess(false);
                      setShowSendDoctorModal(true);
                    }}
                    className="w-full py-2 px-2.5 bg-[#0d652d] hover:bg-[#094d22] text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{sentToken ? `In Queue (${sentToken})` : 'Send to Doctor (1-Click)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('share')}
                    className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200 transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Share summary</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* 5. BOTTOM RECENT ENCOUNTERS TABLE (Pixel-accurate matching mockup) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-[#e6f4ea] text-[#0d6832]">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Recent Encounters & Medical Records
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadSuccessDoc(null);
                    setShowUploadModal(true);
                  }}
                  className="px-3 py-1 bg-[#e6f4ea] hover:bg-[#ceead6] text-[#0d6832] font-semibold text-xs rounded-lg border border-[#ceead6] transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Upload Record</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('timeline')}
                  className="text-xs font-semibold text-[#0d6832] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View all encounters</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 font-bold">DATE</th>
                    <th className="pb-2 font-bold">CLINIC / HOSPITAL</th>
                    <th className="pb-2 font-bold">TYPE</th>
                    <th className="pb-2 font-bold">KEY FINDINGS</th>
                    <th className="pb-2 font-bold">ATTACHMENTS</th>
                    <th className="pb-2 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* Newly Uploaded Documents Prepended Dynamically */}
                  {documents.filter(d => !['doc-1', 'doc-2', 'doc-3', 'doc-4'].includes(d.id)).map(doc => (
                    <tr key={doc.id} className="bg-emerald-50/50 hover:bg-emerald-50/80 transition border-l-2 border-[#0d6832]">
                      <td className="py-3 font-semibold text-slate-900">{doc.document_date || 'Today'}</td>
                      <td className="py-3 font-bold text-slate-900">Patient Uploaded Record</td>
                      <td className="py-3 font-bold text-[#0d6832]">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 max-w-xs font-medium">
                        {doc.original_filename || doc.filename} • Verified OCR Record
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewDoc(doc)}
                          className="inline-flex items-center space-x-1 text-[#0d6832] bg-[#e6f4ea] hover:bg-[#ceead6] px-2 py-0.5 rounded text-[11px] font-bold border border-[#ceead6] transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Image / File</span>
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPreviewDoc(doc)}
                            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-2 py-1 rounded shadow-2xs transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDoctorSentSuccess(false);
                              setShowSendDoctorModal(true);
                            }}
                            className="text-[11px] font-bold text-[#0d652d] hover:text-[#094d22] bg-white border border-emerald-300 px-2 py-1 rounded shadow-2xs transition cursor-pointer"
                          >
                            Send to Doctor →
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-3 font-medium text-slate-900">28 Sep 2026</td>
                    <td className="py-3 font-semibold text-slate-800">Apex Clinic</td>
                    <td className="py-3 text-slate-600 font-medium">Routine Follow-up</td>
                    <td className="py-3 text-slate-600 max-w-xs">
                      BP 128/82, HbA1c 7.4%, continue current medications
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => onNavigate('documents')}
                        className="inline-flex items-center space-x-1 text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>3 files</span>
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-slate-400 hover:text-slate-700 p-1 rounded">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-3 font-medium text-slate-900">12 Aug 2026</td>
                    <td className="py-3 font-semibold text-slate-800">MaxCare Hospital</td>
                    <td className="py-3 text-slate-600 font-medium">Lab Report</td>
                    <td className="py-3 text-slate-600 max-w-xs">
                      Fasting glucose 124 mg/dL, Lipid profile stable
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => onNavigate('documents')}
                        className="inline-flex items-center space-x-1 text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>2 files</span>
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-slate-400 hover:text-slate-700 p-1 rounded">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-3 font-medium text-slate-900">15 Jun 2026</td>
                    <td className="py-3 font-semibold text-slate-800">Metropolis</td>
                    <td className="py-3 text-slate-600 font-medium">Lab Report</td>
                    <td className="py-3 text-slate-600 max-w-xs">
                      HbA1c 8.2%, LDL 132 mg/dL
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => onNavigate('documents')}
                        className="inline-flex items-center space-x-1 text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>2 files</span>
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-slate-400 hover:text-slate-700 p-1 rounded">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </main>

      </div>

      {/* ========================================================================= */}
      {/* 1. UPLOAD MEDICAL RECORD MODAL                                            */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] text-[#0d6832] flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#0d6832]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Upload Medical Record or Prescription
                  </h3>
                  <span className="text-xs text-slate-500">
                    Secure OCR processing • Auto-sync with Dr. Meera Singh
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success banner after upload */}
            {uploadSuccessDoc ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Document uploaded and verified successfully!</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1">
                  <p className="font-bold text-slate-800">{uploadSuccessDoc.filename}</p>
                  <p className="text-slate-500">Category: <span className="font-semibold text-emerald-700">{uploadSuccessDoc.category}</span> • Status: Verified (OCR 96%)</p>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const docToView = uploadSuccessDoc;
                      setShowUploadModal(false);
                      setSelectedPreviewDoc(docToView);
                    }}
                    className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg border border-slate-300 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>View Uploaded File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadSuccessDoc(null);
                      setShowUploadModal(false);
                      setShowSendDoctorModal(true);
                    }}
                    className="flex-1 py-2.5 px-3 bg-[#0d652d] hover:bg-[#094d22] text-white font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Send to Doctor in 1 Click →</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                {uploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                    {uploadError}
                  </div>
                )}

                {/* File Dropzone */}
                <div 
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-6 text-center space-y-2 bg-slate-50/60 transition cursor-pointer"
                  onClick={() => document.getElementById('dash-file-picker')?.click()}
                >
                  <input
                    id="dash-file-picker"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setUploadFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 mx-auto flex items-center justify-center shadow-2xs">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {uploadFiles.length > 0 ? `${uploadFiles.length} file(s) selected` : 'Click to select prescription or lab report'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supports PDF, PNG, JPG (up to 15MB)
                    </span>
                  </div>
                  {uploadFiles.length > 0 && (
                    <div className="mt-2 text-left bg-white p-2 rounded-lg border border-slate-200">
                      {uploadFiles.map((f, i) => (
                        <div key={i} className="text-[11px] text-slate-700 font-medium truncate">
                          📄 {f.name} ({(f.size / 1024).toFixed(0)} KB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Sample Buttons for Instant Testing */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    Or Quick Add Demo Sample Document:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => handleAddSampleDoc('prescription')}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Apex Clinic Prescription</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Telmisartan & Metformin Rx
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => handleAddSampleDoc('lab')}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <Activity className="w-3.5 h-3.5 text-teal-600" />
                        <span>Metropolis Lab Report</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        HbA1c & Fasting Glucose
                      </span>
                    </button>
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="Prescription">Prescription</option>
                      <option value="Lab Report">Lab Report</option>
                      <option value="Hospital Discharge">Hospital Discharge</option>
                      <option value="Radiology / Scan">Radiology / Scan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Document Date</label>
                    <input
                      type="date"
                      value={uploadDocDate}
                      onChange={(e) => setUploadDocDate(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || uploadFiles.length === 0}
                    className="px-5 py-2 bg-[#0d652d] hover:bg-[#094d22] disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Processing OCR...' : 'Upload & Verify'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEND TO DOCTOR (1-CLICK DIRECT OPD TRANSFER) MODAL                      */}
      {/* ========================================================================= */}
      {showSendDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] text-[#0d6832] flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-[#0d6832]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Send Records to Dr. Meera Singh, MD
                  </h3>
                  <span className="text-xs text-slate-500">
                    Instant 1-Click Consultation Handover & Queue Check-In
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowSendDoctorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {doctorSentSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-4 text-xs">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>Transferred to Dr. Meera Singh's OPD Queue!</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2 text-slate-700">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900">Queue Token:</span>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold rounded-lg text-xs">
                      {sentToken || '#OPD-01'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Consultant:</span>
                    <span className="font-bold text-slate-900">Dr. Meera Singh, MD (Cardiologist)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Clinic Room:</span>
                    <span>OPD Block, Consultation Chamber 104</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Transferred Data:</span>
                    <span>4 Active Meds, 1 Allergy Alert, Vitals, {documents.length} Records</span>
                  </div>
                </div>

                {/* Instant Live Switch to Doctor View Button */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowSendDoctorModal(false);
                      await demoDoctorLogin();
                    }}
                    className="w-full py-3 px-4 bg-[#0d652d] hover:bg-[#094d22] text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-md cursor-pointer text-xs"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Open Doctor Workstation to Verify Live Now 🩺 →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSendDoctorModal(false)}
                    className="w-full py-2 px-3 text-slate-600 hover:text-slate-900 font-semibold text-center transition cursor-pointer"
                  >
                    Keep Browsing Patient Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Summary of What's Being Shared */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                    Verified Clinical Packet Being Sent:
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Patient</span>
                      <span className="font-bold text-slate-800">Rajesh Sharma (52Y, B+)</span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Latest Vitals</span>
                      <span className="font-bold text-[#0d6832]">BP 128/82 • Gluc 124</span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Active Regimen</span>
                      <span className="font-bold text-slate-800">4 Active Medications</span>
                    </div>

                    <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
                      <span className="text-rose-600 block text-[10px] font-bold">Critical Alert</span>
                      <span className="font-bold text-rose-800">Penicillin Anaphylaxis</span>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Attached documents: <strong>{documents.length} records</strong> (including uploaded files)</span>
                    <span className="text-emerald-700 font-bold">✓ Encrypted Transfer</span>
                  </div>
                </div>

                {/* Chief Complaint / Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reason for Consultation / Notes for Dr. Meera Singh:
                  </label>
                  <textarea
                    rows={2}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Enter reason for visit or questions for the doctor..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSendDoctorModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={sendingToDoctor}
                    onClick={handleSendToDoctor}
                    className="px-5 py-2.5 bg-[#0d652d] hover:bg-[#094d22] disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendingToDoctor ? 'Connecting to Doctor Queue...' : 'Confirm & Send to Dr. Meera Singh'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ALLERGY DETAILS MODAL                                                     */}
      {/* ========================================================================= */}
      {showAllergyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 font-sans animate-in fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-[#d93025] text-white flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Documented Allergy Record
                  </h3>
                  <span className="text-xs text-rose-700 font-semibold">
                    Life-Threatening Anaphylaxis Risk
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowAllergyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-2 text-rose-950">
              <div className="flex justify-between">
                <span className="font-bold">Substance:</span>
                <span className="font-semibold">Penicillin & Beta-Lactam Class</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Clinical Reaction:</span>
                <span>Anaphylactic shock, airway obstruction</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Severity:</span>
                <span className="font-bold text-rose-700">Critical / Fatal Risk</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Verified By:</span>
                <span>Apex Clinic (Dr. Meera Singh)</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-900 block">Contraindicated Medications:</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                Amoxicillin, Ampicillin, Augmentin, Penicillin V/G, Piperacillin, Cephalosporins (1st & 2nd Gen cross-reactivity risk).
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAllergyModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PATIENT DOCUMENT PREVIEW MODAL (IMAGE & PDF VIEWER)                       */}
      {/* ========================================================================= */}
      {selectedPreviewDoc && (() => {
        const fileUrl = selectedPreviewDoc.preview_url || api.getDocumentFileUrl(selectedPreviewDoc.id);
        const isImg = Boolean(
          (selectedPreviewDoc.original_filename || selectedPreviewDoc.filename || '').match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
          selectedPreviewDoc.file_type?.toLowerCase().includes('image') ||
          (fileUrl && fileUrl.startsWith('data:image'))
        );

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] flex flex-col font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-[#e6f4ea] text-[#0d6832]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {selectedPreviewDoc.original_filename || selectedPreviewDoc.filename}
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      {selectedPreviewDoc.category} • Recorded: {selectedPreviewDoc.document_date || 'Today'} • OCR Verified
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isImg ? 'Open Full Resolution' : 'Open in New Tab'}</span>
                  </a>
                  <button 
                    onClick={() => setSelectedPreviewDoc(null)} 
                    className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Image or PDF Viewport */}
              <div className="overflow-y-auto flex-1">
                {isImg ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center p-3 min-h-[380px] max-h-[540px] overflow-hidden">
                    <img
                      src={fileUrl}
                      alt={selectedPreviewDoc.original_filename || 'Uploaded Medical Record'}
                      className="max-h-[500px] max-w-full object-contain rounded-lg shadow-md"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                    <iframe
                      src={fileUrl}
                      title="Medical Document Preview"
                      className="w-full h-[480px] bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreviewDoc(null);
                    setShowSendDoctorModal(true);
                  }}
                  className="px-4 py-2 bg-[#0d652d] hover:bg-[#094d22] text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Send to Dr. Meera Singh in 1 Click</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Emergency Pass Modal */}
      <EmergencyCardModal 
        isOpen={showHealthPass} 
        onClose={() => setShowHealthPass(false)} 
      />

      {/* Bilingual Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />

    </div>
  );
};
