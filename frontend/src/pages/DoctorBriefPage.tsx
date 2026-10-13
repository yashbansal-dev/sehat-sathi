import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Printer, 
  ExternalLink, 
  AlertTriangle, 
  Clock, 
  Pill, 
  Activity, 
  FileText, 
  Share2, 
  Eye, 
  X, 
  ShieldCheck, 
  Check, 
  Copy, 
  Sparkles, 
  FileCheck, 
  Users, 
  Plus, 
  HeartPulse, 
  Droplets, 
  TrendingUp, 
  Home, 
  Calendar, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Paperclip, 
  MoreVertical 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DoctorBriefing, CheckedInPatient, PrescriptionInput } from '../types';
import patientAvatar from '../assets/patient_avatar.jpg';

export const DoctorBriefPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const [briefing, setBriefing] = useState<DoctorBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientsQueue, setPatientsQueue] = useState<CheckedInPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pt-rajesh-1');
  const [queueFilter, setQueueFilter] = useState<'all' | 'waiting' | 'in_consultation' | 'completed'>('all');
  const [activeSidebarTab, setActiveSidebarTab] = useState('briefing');
  const [doctorTab, setDoctorTab] = useState<'briefing' | 'documents' | 'trends' | 'notes'>('briefing');
  const [copiedAbha, setCopiedAbha] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);

  // Prescriptions modal & actions
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [newRx, setNewRx] = useState<PrescriptionInput>({
    medicine_name: '',
    dosage: '10 mg',
    frequency: 'Once Daily (OD)',
    timing: 'Morning after breakfast',
    duration: '30 days',
    indication: 'Glycemic & metabolic stabilization',
    instructions: 'Take with a glass of water after meals'
  });
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);
  const [rxSuccessMsg, setRxSuccessMsg] = useState<string | null>(null);

  // Doctor Consultation assessment
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [isConsultationCompleted, setIsConsultationCompleted] = useState<boolean>(false);
  const [verifiedCitations, setVerifiedCitations] = useState<Record<string, boolean>>({});

  // Source evidence drawer / modal state
  const [activeEvidence, setActiveEvidence] = useState<{
    title: string;
    snippet?: string;
    docId?: string;
    docName?: string;
    page?: number;
    fileUrl?: string;
    isImage?: boolean;
    doc?: any;
  } | null>(null);
  const [evidenceTab, setEvidenceTab] = useState<'scan' | 'pdf'>('scan');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    loadQueueAndPatient(selectedPatientId);
  }, [selectedPatientId]);

  const loadQueueAndPatient = async (targetId: string) => {
    try {
      setLoading(true);
      const queue = await api.getCheckedInPatients();
      setPatientsQueue(queue);
      const patient = queue.find(p => p.id === targetId) || queue[0];
      if (patient) {
        setSelectedPatientId(patient.id);
        setBriefing(patient.briefing);
        setDoctorNotes(patient.doctor_notes || '');
        setIsConsultationCompleted(patient.status === 'completed');
      } else {
        const data = await api.getDoctorBriefing();
        setBriefing(data);
      }
    } catch (err) {
      console.error('Error loading clinic queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRx.medicine_name.trim()) return;
    setIsSubmittingRx(true);
    try {
      await api.addPrescription(selectedPatientId, newRx);
      const queue = await api.getCheckedInPatients();
      setPatientsQueue(queue);
      const updatedPatient = queue.find(p => p.id === selectedPatientId);
      if (updatedPatient) {
        setBriefing({ ...updatedPatient.briefing });
      }
      setShowPrescriptionModal(false);
      setRxSuccessMsg(`✓ Successfully prescribed ${newRx.medicine_name} ${newRx.dosage}! Synced to patient record.`);
      setTimeout(() => setRxSuccessMsg(null), 4000);
      setNewRx({
        medicine_name: '',
        dosage: '10 mg',
        frequency: 'Once Daily (OD)',
        timing: 'Morning after breakfast',
        duration: '30 days',
        indication: '',
        instructions: ''
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add prescription');
    } finally {
      setIsSubmittingRx(false);
    }
  };

  const handleCompleteConsultation = async () => {
    await api.updateConsultationStatus(selectedPatientId, 'completed', doctorNotes);
    setIsConsultationCompleted(true);
    const queue = await api.getCheckedInPatients();
    setPatientsQueue(queue);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentPatient = patientsQueue.find(p => p.id === selectedPatientId) || patientsQueue[0];

  // Penicillin allergy safety check
  const isPenicillinAlert = () => {
    if (!currentPatient?.allergies) return false;
    const hasPenicillinAllergy = currentPatient.allergies.some(a => a.toLowerCase().includes('penicillin'));
    const rxName = newRx.medicine_name.toLowerCase();
    const isPenicillinFamily = rxName.includes('amox') || rxName.includes('penic') || rxName.includes('ampic') || rxName.includes('augmentin');
    return hasPenicillinAllergy && isPenicillinFamily;
  };

  const filteredQueue = patientsQueue.filter(p => {
    if (queueFilter === 'all') return true;
    return p.status === queueFilter;
  });

  const waitingCount = patientsQueue.filter(p => p.status === 'waiting').length;
  const inConsultCount = patientsQueue.filter(p => p.status === 'in_consultation').length;

  const handleCopyAbha = () => {
    navigator.clipboard.writeText('91-4320-1938-7011-2846');
    setCopiedAbha(true);
    setTimeout(() => setCopiedAbha(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500 font-sans">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-sm font-semibold">Loading Doctor Clinician Workstation...</p>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500 font-sans">
        <p>No clinical briefing available yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 py-5 font-sans">
      <div className="flex gap-5 items-start">

        {/* ========================================================================= */}
        {/* LEFT PANE: LIVE OPD PATIENT QUEUE & TRIAGE DESK (Width 320px)            */}
        {/* ========================================================================= */}
        <aside className="w-80 shrink-0 hidden md:block space-y-4 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Live OPD Queue
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {patientsQueue.length} Registered Today
                  </span>
                </div>
              </div>

              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center space-x-1 text-xs bg-slate-100 p-1 rounded-xl">
              {(['all', 'waiting', 'in_consultation', 'completed'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setQueueFilter(filter)}
                  className={`flex-1 py-1 rounded-lg font-bold text-[11px] capitalize transition cursor-pointer text-center ${
                    queueFilter === filter
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {filter === 'all' ? 'All' : (filter === 'in_consultation' ? 'Consult' : (filter === 'waiting' ? 'Wait' : 'Done'))}
                </button>
              ))}
            </div>

            {/* Patient Cards in Queue */}
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {filteredQueue.map(p => {
                const isSelected = p.id === selectedPatientId;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setBriefing(p.briefing);
                      setDoctorNotes(p.doctor_notes || '');
                      setIsConsultationCompleted(p.status === 'completed');
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {p.token_number}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block leading-tight">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {p.gender}, {p.age}Y • {p.vitals?.bp || '128/82'}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'in_consultation'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : p.status === 'completed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {p.status === 'in_consultation' ? 'In Chamber' : (p.status === 'completed' ? 'Done' : 'Waiting')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-1 italic bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                      "{p.chief_complaint}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{p.documents?.length || 4} records attached</span>
                      </span>
                      <span className="font-medium text-slate-500">{p.checkin_time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions in Left Panel */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <button
                type="button"
                onClick={() => setShowPrescriptionModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Write E-Prescription</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Official Summary</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* RIGHT PANE: ACTIVE PATIENT CLINICAL EHR CHART & DECISION WORKSPACE        */}
        {/* ========================================================================= */}
        <main className="flex-1 min-w-0 space-y-4">

          {/* 1. CLINICAL PATIENT IDENTIFIER & CONSULTATION RIBBON */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            {/* Top Bar with Hospital Branding & Chamber Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded border border-blue-200">
                  Apex Specialty Healthcare • OPD Station 104
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 font-mono text-[11px]">Encounter Ref #{currentPatient.id}</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="text-slate-500">Consulting Physician:</span>
                <strong className="text-slate-900">Dr. Arvind Verma, MD</strong>
              </div>
            </div>

            {/* Patient Demographics & Action Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <img
                  src={patientAvatar}
                  alt={briefing.patient_info.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs shrink-0"
                />

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                      {briefing.patient_info.name}
                    </h1>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>ABDM Verified</span>
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                      {currentPatient.token_number}
                    </span>
                  </div>

                  {/* ABHA ID */}
                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <span className="font-mono">ABHA: 91-4320-1938-7011-2846</span>
                    <button
                      type="button"
                      onClick={handleCopyAbha}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title={copiedAbha ? "Copied!" : "Copy ABHA ID"}
                    >
                      {copiedAbha ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {copiedAbha && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                  </div>

                  {/* Demographics Strip */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                    <span>52 Yrs</span>
                    <span>•</span>
                    <span>Male</span>
                    <span>•</span>
                    <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 text-[11px]">
                      Blood: B+ve
                    </span>
                    <span>•</span>
                    <span className="text-slate-800 font-medium">Chief Complaint: {currentPatient.chief_complaint}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Prescribe Medicine</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteConsultation}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 border shadow-2xs cursor-pointer ${
                    isConsultationCompleted
                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isConsultationCompleted ? 'Consultation Finished' : 'Complete Visit'}</span>
                </button>

                <button
                  type="button"
                  onClick={demoLogin}
                  className="px-4 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Switch to Patient View</span>
                </button>
              </div>
            </div>

            {/* CRITICAL CONTRAINDICATION ALERT BANNER */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-red-900">
                    CONTRAINDICATION ALERT: Severe Penicillin Anaphylaxis
                  </h3>
                  <p className="text-xs text-red-800 mt-0.5">
                    Penicillin & Beta-lactam antibiotics strictly contraindicated. Do not prescribe Amoxicillin, Augmentin, or Ampicillin.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAllergyModal(true)}
                className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <span>View Full Allergy Card</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* LIVE CLINICAL VITALS MATRIX (6 Key Metrics) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Blood Pressure</span>
                <span className="text-base font-extrabold text-slate-900 block my-0.5">{currentPatient.vitals?.bp || '128/82'}</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">Controlled</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Fasting Sugar</span>
                <span className="text-base font-extrabold text-slate-900 block my-0.5">{currentPatient.vitals?.blood_sugar?.replace(' mg/dL', '') || '124'}</span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded">mg/dL</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">HbA1c</span>
                <span className="text-base font-extrabold text-slate-900 block my-0.5">7.4%</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">↓ from 8.2%</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Pulse Rate</span>
                <span className="text-base font-extrabold text-slate-900 block my-0.5">{currentPatient.vitals?.pulse?.replace(' bpm', '') || '72'}</span>
                <span className="text-[10px] text-slate-600 font-semibold">bpm</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">SpO2</span>
                <span className="text-base font-extrabold text-slate-900 block my-0.5">{currentPatient.vitals?.spo2 || '98%'}</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">Room Air</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Renal eGFR</span>
                <span className="text-base font-extrabold text-slate-900 block my-0.5">84</span>
                <span className="text-[10px] text-slate-600 font-semibold">mL/min</span>
              </div>
            </div>

          </div>

          {/* 2. CLINICAL WORKSTATION TABS NAVIGATION */}
          <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDoctorTab('briefing')}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                doctorTab === 'briefing'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ 2-Minute Executive Briefing</span>
            </button>

            <button
              type="button"
              onClick={() => setDoctorTab('documents')}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                doctorTab === 'documents'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📁 Patient Records & Scans ({currentPatient.documents?.length || 4})</span>
            </button>

            <button
              type="button"
              onClick={() => setDoctorTab('trends')}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                doctorTab === 'trends'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>📈 Lab Biomarker Trends</span>
            </button>

            <button
              type="button"
              onClick={() => setDoctorTab('notes')}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                doctorTab === 'notes'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>✍️ Consultation Notes & Prescribe</span>
            </button>
          </div>

          {/* 3. TAB 1: 2-MINUTE EXECUTIVE AI SYNTHESIS & ACTIVE REGIMEN */}
          {doctorTab === 'briefing' && (
            <div className="space-y-4">
              
              {/* Executive Clinical Synthesis Narrative */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Two-Minute Clinical Synthesis (AI Synthesized Medical Brief)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Synthesized from {currentPatient.documents?.length || 4} verified health records
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                  "{briefing.clinical_narrative}"
                </p>

                {/* Chronic Diagnoses Tags */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Documented Chronic Diagnoses & Active Conditions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {briefing.chronic_conditions?.map((cond, i) => (
                      <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Regimen Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Pill className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Established Active Regimen & Dosages ({briefing.active_medications.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPrescriptionModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Prescribe Medicine</span>
                  </button>
                </div>

                {rxSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between font-semibold">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>{rxSuccessMsg}</span>
                    </div>
                    <button onClick={() => setRxSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-2 font-bold">MEDICATION</th>
                        <th className="pb-2 font-bold">DOSAGE</th>
                        <th className="pb-2 font-bold">FREQUENCY & TIMING</th>
                        <th className="pb-2 font-bold">PRESCRIBED DATE</th>
                        <th className="pb-2 font-bold text-right">EVIDENCE & SOURCE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {briefing.active_medications.map((med) => (
                        <tr key={med.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 font-bold text-slate-900">{med.medicine_name}</td>
                          <td className="py-3 font-semibold text-slate-800">{med.dosage}</td>
                          <td className="py-3 text-slate-600 font-medium">{med.frequency}</td>
                          <td className="py-3 text-slate-400 font-mono">{med.prescribed_date || 'Current'}</td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const fUrl = api.getDocumentFileUrl(med.source_document_id || '');
                                setActiveEvidence({
                                  title: `Prescription: ${med.medicine_name} ${med.dosage}`,
                                  snippet: med.source_snippet,
                                  docId: med.source_document_id,
                                  docName: med.source_document_name,
                                  page: med.source_page,
                                  fileUrl: fUrl,
                                  isImage: Boolean((med.source_document_name || '').match(/\.(png|jpe?g|webp|gif)$/i))
                                });
                              }}
                              className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                            >
                              <span>p.{med.source_page}</span>
                              <Eye className="w-3 h-3 ml-0.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Historical Courses */}
                {briefing.historical_or_unverified_medications.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Historical / Completed Regimens:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {briefing.historical_or_unverified_medications.map((med) => (
                        <span 
                          key={med.id} 
                          className="px-2.5 py-1 bg-slate-50 rounded-md text-slate-600 border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-100"
                          onClick={() => {
                            const fUrl = api.getDocumentFileUrl(med.source_document_id || '');
                            setActiveEvidence({
                              title: `Historical: ${med.medicine_name}`,
                              snippet: med.source_snippet,
                              docId: med.source_document_id,
                              docName: med.source_document_name,
                              page: med.source_page,
                              fileUrl: fUrl,
                              isImage: Boolean((med.source_document_name || '').match(/\.(png|jpe?g|webp|gif)$/i))
                            });
                          }}
                        >
                          {med.medicine_name} ({med.dosage}) • {med.status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 4. TAB 2: PATIENT ATTACHED DOCUMENTS & SCANS */}
          {doctorTab === 'documents' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Patient Attached Documents & Diagnostic Reports ({currentPatient.documents?.length || 4})
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Verified for Consultation
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(currentPatient.documents && currentPatient.documents.length > 0 ? currentPatient.documents : [
                  {
                    id: 'doc-1',
                    filename: 'Dr_Verma_Cardiology_Oct2026.pdf',
                    original_filename: 'Dr_Verma_Cardiology_Oct2026.pdf',
                    category: 'Prescription',
                    document_date: '2026-10-02',
                    status: 'completed',
                    ocr_confidence: 0.94
                  },
                  {
                    id: 'doc-2',
                    filename: 'Apex_Lipid_Panel_Sep2026.pdf',
                    original_filename: 'Apex_Lipid_Panel_Sep2026.pdf',
                    category: 'Lab Report',
                    document_date: '2026-09-17',
                    status: 'completed',
                    ocr_confidence: 0.99
                  }
                ]).map((doc: any) => (
                  <div 
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-600 transition flex items-start justify-between gap-3 shadow-2xs cursor-pointer group"
                    onClick={() => {
                      const docFileUrl = doc.preview_url || api.getDocumentFileUrl(doc.id);
                      const isImg = Boolean(
                        (doc.original_filename || doc.filename || '').match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
                        doc.file_type?.toLowerCase().includes('image') ||
                        (docFileUrl && docFileUrl.startsWith('data:image'))
                      );
                      setActiveEvidence({
                        title: `${doc.category}: ${doc.original_filename || doc.filename}`,
                        snippet: `Verified Medical Record • Category: ${doc.category} • Date: ${doc.document_date || 'Current'}\nExtracted and verified for Dr. Arvind Verma's OPD consultation.`,
                        docId: doc.id,
                        docName: doc.original_filename || doc.filename,
                        page: 1,
                        fileUrl: docFileUrl,
                        isImage: isImg,
                        doc: doc
                      });
                    }}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-blue-700 shrink-0 group-hover:border-blue-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {doc.original_filename || doc.filename}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {doc.category}
                          </span>
                          <span>•</span>
                          <span>{doc.document_date || '2026-10-12'}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">Verified (96%)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-lg bg-white group-hover:bg-blue-50 group-hover:text-blue-700 border border-slate-200 text-slate-600 text-[11px] font-semibold transition shrink-0 flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. TAB 3: LONGITUDINAL BIOMARKER TRENDS */}
          {doctorTab === 'trends' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Longitudinal Biomarker Laboratory Progression
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">Verified Metropolis & Apex Lab Data</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <span className="text-xs font-bold text-slate-600 block">HbA1c Progression</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-slate-900">7.4%</span>
                      <span className="text-xs text-emerald-700 font-bold">↓ Down from 8.2%</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Target: &lt; 7.0%. Improved by 0.8% following Metformin BD.</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <span className="text-xs font-bold text-slate-600 block">Fasting Blood Glucose</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-slate-900">124 mg/dL</span>
                      <span className="text-xs text-emerald-700 font-bold">↓ Down from 142</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Normal Fasting: 70–99 mg/dL. Well controlled on current regimen.</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <span className="text-xs font-bold text-slate-600 block">Lipid Panel (LDL Cholesterol)</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-slate-900">118 mg/dL</span>
                      <span className="text-xs text-emerald-700 font-bold">Stable</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Target for Diabetic Patient: &lt; 100 mg/dL. Atorvastatin 20mg advised.</p>
                  </div>
                </div>

                {/* Encounters History */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Verified Encounter History & Lab Findings:
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-2 font-bold">DATE</th>
                          <th className="pb-2 font-bold">FACILITY</th>
                          <th className="pb-2 font-bold">TYPE</th>
                          <th className="pb-2 font-bold">KEY FINDINGS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 font-medium text-slate-900">28 Sep 2026</td>
                          <td className="py-2.5 font-semibold text-slate-800">Apex Clinic</td>
                          <td className="py-2.5 text-slate-600 font-medium">Routine Follow-up</td>
                          <td className="py-2.5 text-slate-600">BP 128/82, HbA1c 7.4%, continue current medications</td>
                        </tr>
                        <tr className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 font-medium text-slate-900">12 Aug 2026</td>
                          <td className="py-2.5 font-semibold text-slate-800">MaxCare Hospital</td>
                          <td className="py-2.5 text-slate-600 font-medium">Lab Report</td>
                          <td className="py-2.5 text-slate-600">Fasting glucose 124 mg/dL, Lipid profile stable</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. TAB 4: CONSULTATION NOTES & PRESCRIBE PAD */}
          {doctorTab === 'notes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Clinician Consultation Assessment & Prescribing Pad
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-900 block mb-1 text-xs">
                    Physician Clinical Impression & Action Plan:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter clinical assessment, diagnostic impressions, lifestyle counseling, or follow-up instructions..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none leading-relaxed font-sans"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionModal(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Prescribe New Medication</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteConsultation}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isConsultationCompleted ? 'Consultation Saved & Completed' : 'Save & Mark Consultation Complete'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

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
                    Clinical Allergy Record: Penicillin
                  </h3>
                  <span className="text-xs text-rose-700 font-semibold">
                    Life-Threatening Anaphylaxis Risk
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowAllergyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
                <span>Anaphylactic shock, airway obstruction, angioedema</span>
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
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EVIDENCE CITATION & ATTACHED DOCUMENT VIEWER MODAL                        */}
      {/* ========================================================================= */}
      {activeEvidence && (() => {
        const fileUrl = activeEvidence.fileUrl || (activeEvidence.docId ? api.getDocumentFileUrl(activeEvidence.docId) : '');
        const isImg = Boolean(
          activeEvidence.isImage ||
          (activeEvidence.docName || '').match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
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
                    <h3 className="font-bold text-sm text-slate-900">{activeEvidence.title}</h3>
                    <span className="text-[11px] text-slate-500">Source: {activeEvidence.docName || 'Verified Medical Record'} (Page {activeEvidence.page || 1})</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isImg ? 'Open Image' : 'Open PDF'}</span>
                    </a>
                  )}
                  <button onClick={() => setActiveEvidence(null)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs inside Modal */}
              <div className="flex border-b border-slate-200 gap-2 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setEvidenceTab('scan')}
                  className={`pb-2 px-3 font-bold border-b-2 transition cursor-pointer ${
                    evidenceTab === 'scan' ? 'border-[#0d6832] text-[#0d6832]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isImg ? '🖼️ Document Image Preview' : '📄 Document File Viewer'}
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceTab('pdf')}
                  className={`pb-2 px-3 font-bold border-b-2 transition cursor-pointer ${
                    evidenceTab === 'pdf' ? 'border-[#0d6832] text-[#0d6832]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📝 Extracted Clinical Facts & OCR
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto flex-1 space-y-3">
                {evidenceTab === 'scan' ? (
                  <div>
                    {isImg ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center p-3 min-h-[380px] max-h-[540px] overflow-hidden">
                        <img
                          src={fileUrl}
                          alt={activeEvidence.docName || 'Uploaded Medical Record'}
                          className="max-h-[500px] max-w-full object-contain rounded-lg shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                        <iframe
                          src={fileUrl}
                          title="Doctor Document Viewer"
                          className="w-full h-[480px] bg-white"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {activeEvidence.snippet || 'Rx: Tab Metformin 500mg PO BD after meals. Continue Telmisartan 40mg OD morning. Avoid beta-lactam antibiotics due to documented penicillin allergy.'}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">
                  Verified by Sehat Sathi OCR • Secure Clinical Access
                </span>
                <button
                  type="button"
                  onClick={() => setActiveEvidence(null)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  Done / Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* DOCTOR E-PRESCRIPTION MODAL                                               */}
      {/* ========================================================================= */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d6832] bg-[#e6f4ea] px-2 py-0.5 rounded border border-[#ceead6]">
                  Prescribing Workstation
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Issue Prescription for {currentPatient?.name || briefing.patient_info.name}
                </h3>
              </div>
              <button onClick={() => setShowPrescriptionModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Drug Suggestions */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                Quick Selection:
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { name: 'Empagliflozin', dose: '10 mg', freq: 'Once Daily (OD)', timing: 'Morning after breakfast' },
                  { name: 'Telmisartan', dose: '40 mg', freq: 'Once Daily (OD)', timing: 'Morning with water' },
                  { name: 'Metformin', dose: '500 mg', freq: 'Twice Daily (BD)', timing: 'After meals' },
                  { name: 'Atorvastatin', dose: '20 mg', freq: 'Once Daily (HS)', timing: 'Night at bedtime' }
                ].map(chip => (
                  <button
                    key={chip.name}
                    type="button"
                    onClick={() => setNewRx({
                      ...newRx,
                      medicine_name: chip.name,
                      dosage: chip.dose,
                      frequency: chip.freq,
                      timing: chip.timing
                    })}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-[#e6f4ea] hover:text-[#0d6832] border border-slate-200 rounded-lg text-slate-700 font-medium transition text-[11px] cursor-pointer"
                  >
                    + {chip.name} {chip.dose}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Allergy Contraindication Guard */}
            {isPenicillinAlert() && (
              <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-1 text-xs">
                <div className="flex items-center space-x-2 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>CRITICAL ALLERGY CONTRAINDICATION!</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Patient <strong>{currentPatient?.name}</strong> has a documented severe allergy to <strong>Penicillin (Anaphylaxis Risk)</strong>. 
                  Prescribing penicillin-class antibiotics may cause an immediate severe reaction.
                </p>
              </div>
            )}

            <form onSubmit={handlePrescribe} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medication Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Empagliflozin"
                    value={newRx.medicine_name}
                    onChange={(e) => setNewRx({ ...newRx, medicine_name: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 mg"
                    value={newRx.dosage}
                    onChange={(e) => setNewRx({ ...newRx, dosage: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency *</label>
                  <select
                    value={newRx.frequency}
                    onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Once Daily (OD)">Once Daily (OD)</option>
                    <option value="Twice Daily (BD)">Twice Daily (BD)</option>
                    <option value="Thrice Daily (TDS)">Thrice Daily (TDS)</option>
                    <option value="At Bedtime (HS)">At Bedtime (HS)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 30 days"
                    value={newRx.duration}
                    onChange={(e) => setNewRx({ ...newRx, duration: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions for Patient</label>
                <input
                  type="text"
                  placeholder="e.g. 1 tablet morning after breakfast with water"
                  value={newRx.instructions}
                  onChange={(e) => setNewRx({ ...newRx, instructions: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRx || !newRx.medicine_name.trim()}
                  className="px-5 py-2 bg-[#0d652d] hover:bg-[#094d22] disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSubmittingRx ? 'Prescribing...' : 'Issue Prescription'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
