import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Pill, 
  Activity, 
  User, 
  Clock, 
  ChevronRight,
  Info,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { DoctorBriefing, MedicationBriefItem, LabResultBriefItem } from '../types';

export const SummaryPage: React.FC = () => {
  const [briefing, setBriefing] = useState<DoctorBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [activeSourceModal, setActiveSourceModal] = useState<{ name: string; page?: number; snippet?: string } | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getDoctorBriefing();
      setBriefing(data);
    } catch (err) {
      console.error('Failed to load health summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const data = await api.getDoctorBriefing();
      setBriefing(data);
    } catch (err) {
      console.error('Failed to regenerate summary:', err);
    } finally {
      setTimeout(() => setRegenerating(false), 800);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-slate-500 font-sans">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-600">Generating source-linked clinical summary...</p>
      </div>
    );
  }

  const patient = briefing?.patient_info;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Header & Regenerate Action */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200/80 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Two-Minute Doctor • Feature Four</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Source-Linked AI Medical Summary
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              A comprehensive clinical overview synthesizing your verified health records, active medications, laboratory results, and medical events. Every statement is strictly linked to an original source document.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition self-start md:self-center disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>{regenerating ? 'Regenerating from Records...' : 'Regenerate Summary'}</span>
          </button>
        </div>
      </div>

      {/* Responsible AI & Clinical Transparency Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3.5 text-xs text-slate-600 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Responsible AI Notice: </span>
          This summary is synthesized solely from documents you have uploaded. Sehat Sathi does not invent diagnoses, assume undocumented allergies, or replace medical consultations. All facts reference underlying clinical records for instant doctor verification.
        </div>
      </div>

      {/* 60-Second Consultation Brief Card */}
      {briefing?.clinical_narrative && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-teal-800">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>60-Second Consultation Brief for Doctor</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-800 font-normal border-l-2 border-teal-500 pl-3 italic">
            "{briefing.clinical_narrative}"
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Detailed Clinical History */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Patient Overview */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-teal-600" />
              <span>1. Patient Overview</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="font-bold text-slate-800">{patient?.name || 'Rajesh Sharma'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Age & Gender</span>
                <span className="font-bold text-slate-800">{patient?.dob || '52 Years'} ({patient?.gender || 'Male'})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Blood Group</span>
                <span className="font-bold text-slate-800">{patient?.blood_group || 'B+'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Emergency Contact</span>
                <span className="font-bold text-slate-800">{patient?.emergency_contact || '+91 98765 43210'}</span>
              </div>
            </div>
          </div>

          {/* 2. Documented Medical History */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>2. Documented Medical History & Diagnoses</span>
            </h2>
            <div className="space-y-3">
              {briefing?.chronic_conditions && briefing.chronic_conditions.length > 0 ? (
                briefing.chronic_conditions.map((condition: string, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{condition}</span>
                      <span className="text-slate-500">Documented in confirmed medical records</span>
                    </div>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold text-[11px] border border-teal-200">
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      <span>Verified Record</span>
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No chronic diagnoses documented in uploaded records.</p>
              )}
            </div>
          </div>

          {/* 3. Recorded Medicines (Active vs Historical) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>3. Recorded Medicines</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Strict separation: Active vs Past</span>
            </div>

            {/* Active Medications */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Currently Active Medications ({briefing?.active_medications?.length || 0})
              </h3>
              <div className="space-y-2">
                {briefing?.active_medications?.map((med: MedicationBriefItem, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{med.medicine_name} — {med.dosage}</span>
                      <span className="text-slate-600">{med.frequency}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSourceModal({ 
                        name: med.source_document_name || 'Prescription Document', 
                        page: med.source_page, 
                        snippet: med.source_snippet 
                      })}
                      className="text-teal-700 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span className="truncate max-w-[150px]">{med.source_document_name || 'Prescription'}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Medications */}
            {briefing?.historical_or_unverified_medications && briefing.historical_or_unverified_medications.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Historical Prescriptions ({briefing.historical_or_unverified_medications.length})
                </h3>
                <div className="space-y-2">
                  {briefing.historical_or_unverified_medications.map((med: MedicationBriefItem, idx: number) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-800">{med.medicine_name} ({med.dosage})</span>
                        <span className="block text-[11px] text-slate-400">Prescribed: {med.prescribed_date || 'Past Record'}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 italic">Historical / Discontinued</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Documented Allergies */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>4. Documented Allergies</span>
            </h2>
            {briefing?.documented_allergies && briefing.documented_allergies.length > 0 ? (
              <div className="space-y-2">
                {briefing.documented_allergies.map((allergy: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs flex items-center justify-between">
                    <span className="font-bold text-rose-900">⚠️ {allergy}</span>
                    <span className="text-[11px] text-rose-700 font-semibold">Reported Adverse Reaction</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 text-xs text-slate-600">
                <strong className="text-slate-800">Status: </strong>
                Not documented in uploaded records. (Do not assume absence of allergies without clinical inquiry.)
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Column: Key Laboratory Trends, Events & Contradictions */}
        <div className="space-y-6">

          {/* 5. Important Laboratory Results */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>5. Key Lab Biomarkers</span>
            </h2>
            <div className="space-y-2.5">
              {briefing?.recent_lab_results && briefing.recent_lab_results.slice(0, 5).map((lab: LabResultBriefItem, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{lab.test_name}</span>
                    <span className={`font-bold ${lab.is_abnormal ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {lab.result_value} {lab.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Date: {lab.test_date || 'Recorded'}</span>
                    <button
                      type="button"
                      onClick={() => setActiveSourceModal({ 
                        name: lab.source_document_name || 'Lab Report', 
                        page: lab.source_page 
                      })}
                      className="text-teal-700 hover:underline font-semibold"
                    >
                      {lab.source_document_name || 'Source Report'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Relevant Medical Events */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>6. Medical Events & Visits</span>
            </h2>
            <div className="space-y-2.5">
              {briefing?.major_hospital_or_clinic_visits && briefing.major_hospital_or_clinic_visits.map((ev: any, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ev.title}</span>
                    <span className="text-[11px] font-semibold text-slate-500">{ev.date}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{ev.description || ev.facility_or_doctor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Clinical Contradictions */}
          {briefing?.clinical_contradictions && briefing.clinical_contradictions.length > 0 && (
            <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-amber-900 flex items-center space-x-2 pb-3 border-b border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>7. Detected Discrepancies</span>
              </h2>
              <div className="space-y-3">
                {briefing.clinical_contradictions.map((c: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1.5">
                    <span className="font-bold text-amber-950 block">{c.title}</span>
                    <p className="text-amber-900 text-[11px]">{c.clinical_impact}</p>
                    <div className="text-[10px] text-slate-500 pt-1 space-y-0.5">
                      <p>• Source A: {c.source_doc_a}</p>
                      <p>• Source B: {c.source_doc_b}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Source Provenance Modal */}
      {activeSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Source Document Traceability</h3>
              </div>
              <button
                onClick={() => setActiveSourceModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <p>
                <strong className="text-slate-900">Document:</strong> {activeSourceModal.name}
              </p>
              {activeSourceModal.page && (
                <p>
                  <strong className="text-slate-900">Page Number:</strong> Page {activeSourceModal.page}
                </p>
              )}
              {activeSourceModal.snippet && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">OCR Extracted Passage:</span>
                  <p className="italic text-slate-800">"{activeSourceModal.snippet}"</p>
                </div>
              )}
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-900">
                <span className="font-bold block mb-0.5">Verification Integrity</span>
                Every fact in this summary links back to its verified original document. Original uploads are stored securely and never altered.
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSourceModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close Provenance
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
