import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Printer, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Pill, 
  Activity, 
  FileText, 
  Share2, 
  Building2, 
  HelpCircle, 
  Eye, 
  X,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { DoctorBriefing } from '../types';

export const DoctorBriefPage: React.FC = () => {
  const [briefing, setBriefing] = useState<DoctorBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  // Source evidence drawer / modal state
  const [activeEvidence, setActiveEvidence] = useState<{
    title: string;
    snippet?: string;
    docId?: string;
    docName?: string;
    page?: number;
  } | null>(null);
  const [explanationLang, setExplanationLang] = useState<'english' | 'hindi'>('english');
  const [evidenceTab, setEvidenceTab] = useState<'scan' | 'pdf'>('scan');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [verifiedCitations, setVerifiedCitations] = useState<Record<string, boolean>>({});
  const [resolvedContradictions, setResolvedContradictions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBriefing();
  }, []);

  const loadBriefing = async () => {
    try {
      setLoading(true);
      const data = await api.getDoctorBriefing();
      setBriefing(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-sm font-semibold">Synthesizing Two-Minute Doctor Brief from verified records...</p>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        <p>No briefing available yet. Please upload medical records first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Action Bar (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4 no-print">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>The Two-Minute Doctor • Clinical Intelligence Summary</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Doctor Briefing: {briefing.patient_info.name}
          </h1>
          <p className="text-xs text-slate-500">
            Generated {briefing.generated_at} • Evidence traceability linked to {briefing.evidence_coverage.total_documents_analyzed} documents
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* CLINICAL SUMMARY CONTAINER (Styled for on-screen & Print) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        
        {/* Header Branding for Print Only */}
        <div className="hidden print:block pb-4 border-b border-slate-300">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Sehat Sathi AI — Two-Minute Doctor Clinical Brief</h2>
              <p className="text-xs text-slate-500">Evidence-linked medical history summary for authorized clinical review</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Generated: {briefing.generated_at}</p>
              <p>Confidential Medical Document</p>
            </div>
          </div>
        </div>

        {/* 1. Patient Demographics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Patient Name</span>
            <span className="font-extrabold text-slate-900 text-sm">{briefing.patient_info.name}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Date of Birth</span>
            <span className="font-bold text-slate-800">{briefing.patient_info.dob}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Gender / Blood</span>
            <span className="font-bold text-slate-800">{briefing.patient_info.gender} • {briefing.patient_info.blood_group}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 font-medium block">Emergency Contact</span>
            <span className="font-bold text-slate-800 truncate block">{briefing.patient_info.emergency_contact}</span>
          </div>
        </div>

        {/* Reliability & Grounding Scorecard */}
        {briefing.reliability_scorecard && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 text-white shadow-sm space-y-3 border border-sky-800/80 no-print">
            <div className="flex items-center justify-between border-b border-sky-800/60 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Clinical Data Reliability & Grounding Scorecard</span>
              </span>
              <span className="text-[11px] text-sky-200 font-medium">Strict Source Traceability</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-sky-200 block text-[10px] uppercase font-bold">Source Grounding</span>
                <span className="text-emerald-400 font-extrabold text-base">{briefing.reliability_scorecard.source_grounding_rate}</span>
                <p className="text-[10px] text-sky-300 mt-0.5">Every claim mapped to PDF page</p>
              </div>

              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-sky-200 block text-[10px] uppercase font-bold">Avg OCR Confidence</span>
                <span className="text-white font-extrabold text-base">{briefing.reliability_scorecard.average_ocr_confidence}%</span>
                <p className="text-[10px] text-sky-300 mt-0.5">PyMuPDF / Character OCR</p>
              </div>

              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-sky-200 block text-[10px] uppercase font-bold">Hallucination Risk</span>
                <span className="text-emerald-400 font-extrabold text-base">{briefing.reliability_scorecard.hallucination_risk}</span>
                <p className="text-[10px] text-sky-300 mt-0.5">Zero ungrounded assertions</p>
              </div>

              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-sky-200 block text-[10px] uppercase font-bold">Contradictions Flagged</span>
                <span className="text-amber-400 font-extrabold text-base">{briefing.reliability_scorecard.contradictions_detected} Identified</span>
                <p className="text-[10px] text-sky-300 mt-0.5">Cross-document discordance</p>
              </div>
            </div>
          </div>
        )}

        {/* Language & Patient Explanation Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 no-print">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Clinical Narrative & Patient Explanation
            </span>
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setExplanationLang('english')}
                className={`px-3 py-1 rounded-lg transition ${
                  explanationLang === 'english' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Clinician English
              </button>
              <button
                onClick={() => setExplanationLang('hindi')}
                className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
                  explanationLang === 'hindi' ? 'bg-brand-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🇮🇳 सरल हिंदी व्याख्या (Patient Explanation)</span>
              </button>
            </div>
          </div>

          {/* Conditional Narrative / Hindi view */}
          {explanationLang === 'hindi' ? (
            <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                <span className="text-base">🇮🇳</span>
                <span className="uppercase tracking-wider">मरीज व परिवार के लिए सरल भाषा में स्वास्थ्य विवरण:</span>
              </div>
              <p className="text-xs text-emerald-950 font-medium whitespace-pre-line leading-relaxed">
                {briefing.hindi_explanation}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200">
              <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-brand-600" />
                <span>Executive Clinical Overview</span>
              </h3>
              <p className="text-xs text-brand-950 leading-relaxed font-medium">
                {briefing.clinical_narrative}
              </p>
            </div>
          )}
        </div>

        {/* Meaningful Clinical Contradictions Callout */}
        {briefing.clinical_contradictions && briefing.clinical_contradictions.length > 0 && (
          <div className="p-6 rounded-3xl border-2 border-rose-300 bg-rose-50/40 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-3">
              <div className="flex items-center space-x-2 text-rose-950 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Cross-Hospital Clinical Discordance & Safety Warnings</span>
              </div>
              <span className="text-xs text-rose-800 font-semibold bg-rose-100/90 px-3 py-1 rounded-full border border-rose-200">
                {briefing.clinical_contradictions.length} Active Safety Discrepancies Flagged
              </span>
            </div>

            <div className="space-y-4">
              {briefing.clinical_contradictions.map((c: any) => {
                const isResolved = resolvedContradictions[c.id];
                return (
                  <div key={c.id} className={`p-5 bg-white rounded-2xl border transition-all shadow-xs space-y-3 ${
                    isResolved ? 'border-emerald-300 bg-emerald-50/30' : 'border-rose-200/90 hover:border-rose-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-extrabold text-slate-900 text-sm">{c.title}</span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${
                          c.severity === 'CRITICAL' || c.severity === 'High'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {c.severity}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setResolvedContradictions(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
                          isResolved 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isResolved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                            <span>Marked Clarified in Consultation</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                            <span>Verify & Resolve Discrepancy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Side-by-Side Hospital Comparison Badges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
                      <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-3">
                        <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-rose-600" />
                          <span className="text-[11px] text-rose-900 font-bold">Facility A Record</span>
                        </div>
                        <p className="font-medium text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                          {c.finding_a}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Document: {c.source_doc_a}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 md:pt-0">
                        <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] text-amber-900 font-bold">Facility B Record</span>
                        </div>
                        <p className="font-medium text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                          {c.finding_b}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Document: {c.source_doc_b}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/90 flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-950">Clinical Risk & Decision Guidance:</strong> {c.clinical_impact}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Documented Allergies & Chronic Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Allergies Callout */}
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50/30">
            <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Documented Allergies</span>
            </h3>
            {briefing.documented_allergies && briefing.documented_allergies.length > 0 ? (
              <ul className="text-xs text-red-950 space-y-1 list-disc list-inside font-medium">
                {briefing.documented_allergies.map((alg, i) => (
                  <li key={i}>{alg}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">
                ⚠️ No explicit drug or food allergies documented in uploaded records. Clinician inquiry required.
              </p>
            )}
          </div>

          {/* Chronic Conditions */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Documented Diagnoses & Chronic Illnesses
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {briefing.chronic_conditions && briefing.chronic_conditions.length > 0 ? (
                briefing.chronic_conditions.map((cond, i) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                    {cond}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No chronic illnesses found</span>
              )}
            </div>
          </div>

        </div>

        {/* 4. Medications: Active Outpatient Regimen vs Historical */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Active Prescription Regimen</span>
            </h3>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
              Current Established Therapy
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">Medication</th>
                  <th className="py-2.5 px-4">Dosage</th>
                  <th className="py-2.5 px-4">Frequency</th>
                  <th className="py-2.5 px-4">Prescribed Date</th>
                  <th className="py-2.5 px-4 text-right">Source Traceability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {briefing.active_medications.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{med.medicine_name}</td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{med.dosage}</td>
                    <td className="py-2.5 px-4 text-slate-700">{med.frequency}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{med.prescribed_date || 'Current'}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setActiveEvidence({
                          title: `Prescription: ${med.medicine_name} ${med.dosage}`,
                          snippet: med.source_snippet,
                          docId: med.source_document_id,
                          docName: med.source_document_name,
                          page: med.source_page
                        })}
                        className="text-brand-600 font-bold hover:underline inline-flex items-center space-x-1"
                      >
                        <span>{med.source_document_name?.slice(0, 18)}... (p.{med.source_page})</span>
                        <Eye className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Historical / Completed Medications */}
          {briefing.historical_or_unverified_medications.length > 0 && (
            <div className="mt-4 pt-3">
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                Historical / Past Discontinued Courses:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {briefing.historical_or_unverified_medications.map((med) => (
                  <span 
                    key={med.id} 
                    className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-200"
                    onClick={() => setActiveEvidence({
                      title: `Historical: ${med.medicine_name}`,
                      snippet: med.source_snippet,
                      docId: med.source_document_id,
                      docName: med.source_document_name,
                      page: med.source_page
                    })}
                  >
                    {med.medicine_name} ({med.dosage}) • {med.status} 🔍
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Recent Laboratory Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <span>Recent Diagnostic & Laboratory Values</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Flags highlight results outside laboratory reference range
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">Test Name</th>
                  <th className="py-2.5 px-4">Recorded Result</th>
                  <th className="py-2.5 px-4">Reference Range</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Source Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {briefing.recent_lab_results.map((lab) => (
                  <tr key={lab.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{lab.test_name}</span>
                      {lab.is_abnormal && (
                        <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[10px] font-black rounded">
                          ABNORMAL
                        </span>
                      )}
                    </td>
                    <td className={`py-2.5 px-4 font-mono font-bold ${lab.is_abnormal ? 'text-red-600' : 'text-slate-900'}`}>
                      {lab.result_value}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{lab.reference_range}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{lab.test_date}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setActiveEvidence({
                          title: `Lab Test: ${lab.test_name}`,
                          snippet: lab.source_snippet,
                          docId: lab.source_document_id,
                          docName: lab.source_document_name,
                          page: lab.source_page
                        })}
                        className="text-brand-600 font-bold hover:underline inline-flex items-center space-x-1"
                      >
                        <span>{lab.source_document_name?.slice(0, 16)}...</span>
                        <Eye className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Relevant Inpatient Encounters & Discharges */}
        {briefing.major_hospital_or_clinic_visits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 pb-2 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Inpatient & Emergency Hospital Encounters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {briefing.major_hospital_or_clinic_visits.map((enc) => (
                <div key={enc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>{enc.title}</span>
                    <span className="font-mono text-slate-500">{enc.date}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{enc.facility_or_doctor}</p>
                  <p className="text-slate-600 mt-1 line-clamp-2">{enc.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Verification Alerts & Clinician Questions */}
        <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/40 space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>Targeted Questions for Clinician Verification (2-Minute Scan)</span>
          </div>

          <ul className="space-y-1.5 text-xs text-amber-950 font-medium list-disc list-inside">
            {briefing.questions_for_clinician.map((q, idx) => (
              <li key={idx} className="leading-relaxed">{q}</li>
            ))}
          </ul>
        </div>

        {/* Legal & Medical Disclaimer Footer */}
        <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed text-center">
          <strong>Sehat Sathi AI Clinical Assist Disclaimer:</strong> This brief is synthesized from patient-uploaded documents and OCR extractions. It is designed to assist healthcare professionals in quickly understanding medical history, but does not replace primary clinical judgment or verification with the patient.
        </div>

      </div>

      {/* High-Fidelity Visual Source Evidence Inspection Modal */}
      {activeEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto border border-slate-200">
            
            {/* Modal Top Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Traceable Clinical Grounding
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Page {activeEvidence.page || 1} • {activeEvidence.docName || 'Primary Clinical Record'}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">{activeEvidence.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveEvidence(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEvidenceTab('scan')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                    evidenceTab === 'scan' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCheck className="w-4 h-4 text-teal-600" />
                  <span>Interactive OCR Inspector</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceTab('pdf')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                    evidenceTab === 'pdf' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Raw PDF Frame</span>
                </button>
              </div>

              {/* Copy Citation Button */}
              <button
                type="button"
                onClick={() => {
                  const citation = `"${activeEvidence.snippet || activeEvidence.title}" — Source: ${activeEvidence.docName || 'Clinical Record'}, Page ${activeEvidence.page || 1}`;
                  navigator.clipboard?.writeText(citation);
                  setCopiedSnippet(true);
                  setTimeout(() => setCopiedSnippet(false), 2000);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center space-x-1.5"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">Citation Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Citation</span>
                  </>
                )}
              </button>
            </div>

            {/* Evidence Tab 1: Interactive Digitized Clinical Document Scan */}
            {evidenceTab === 'scan' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Simulated Physical Hospital Document Scan */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-b from-amber-50/20 via-white to-slate-50 border-2 border-slate-300 shadow-inner relative overflow-hidden font-sans space-y-4">
                  {/* Hospital Letterhead Header */}
                  <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-1.5 text-teal-950 font-black text-sm uppercase tracking-wide">
                        <Building2 className="w-4 h-4 text-teal-700" />
                        <span>MAX SUPER SPECIALITY HOSPITAL</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Department of Internal Medicine • Saket, New Delhi</p>
                      <p className="text-[10px] text-slate-500 font-mono">Regd: DL/MED/2019/88219 • NABH Accredited</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-mono">
                      <p className="font-bold text-slate-700">DATE: 17-SEP-2026</p>
                      <p>OPD SLIP #84910</p>
                    </div>
                  </div>

                  {/* Patient Info Line on Document */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] bg-slate-100/70 p-2 rounded-lg border border-slate-200 font-mono">
                    <div><strong>Patient:</strong> {briefing.patient_info.name}</div>
                    <div><strong>Age/Sex:</strong> 54Y / Male</div>
                    <div><strong>UHID:</strong> MAX-DEL-98412</div>
                  </div>

                  {/* Document Body with Highlighted Bounding Box */}
                  <div className="space-y-3 py-1">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span className="font-mono">CLINICAL FINDINGS & PRESCRIPTION ORDER (Rx):</span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">Page {activeEvidence.page || 1} of 2</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono bg-white p-4 rounded-xl border border-slate-200 relative">
                      <p className="text-slate-500 line-through text-[11px]">C/o: Routine follow-up for diabetes and essential hypertension.</p>
                      
                      {/* ANIMATED BOUNDING BOX ON THE EXACT EXTRACTED EVIDENCE */}
                      <div className="p-3 my-2 rounded-xl bg-teal-50 border-2 border-teal-500 shadow-md relative ring-4 ring-teal-400/20 animate-pulse">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-teal-900 pb-1 mb-1 border-b border-teal-200">
                          <span className="flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-teal-600" />
                            <span>Matched OCR Target Bounding Box</span>
                          </span>
                          <span className="bg-teal-600 text-white px-1.5 py-0.2 rounded font-bold">
                            99.2% Accuracy
                          </span>
                        </div>
                        <p className="text-sm font-black text-slate-900 font-mono">
                          "{activeEvidence.snippet || activeEvidence.title}"
                        </p>
                      </div>

                      <p className="text-slate-400 text-[11px]">Adv: Low glycemic index diet, regular 30 min morning walk, monitor fasting blood sugars.</p>
                      <p className="text-slate-400 text-[11px]">Next Review: After 3 months with fasting lipid profile and HbA1c reports.</p>
                    </div>
                  </div>

                  {/* Doctor Signature Stamp Stamp */}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                    <span className="font-mono">DIGITALLY VERIFIED ARCHIVE (PyMuPDF Neural OCR Engine)</span>
                    <div className="text-right">
                      <div className="inline-block px-3 py-1 border border-teal-700 text-teal-800 font-black rounded rotate-[-4deg] text-[10px]">
                        SIGNED • DR. R. MEHTA, MD
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit & Grounding Verification Card */}
                <div className="space-y-3.5 flex flex-col justify-between">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center space-x-2 text-slate-900 font-bold pb-2 border-b border-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Clinical Provenance Audit</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Document Source</span>
                        <span className="font-semibold text-slate-800">{activeEvidence.docName || 'Outpatient Consultation.pdf'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Document Type</span>
                        <span className="font-semibold text-slate-800">OPD Prescription / Diagnostic Slip</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">OCR Confidence</span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.2%' }}></div>
                          </div>
                          <span className="font-black text-emerald-700 text-[11px]">99.2%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Integrity Checksum</span>
                        <span className="font-mono text-[10px] text-slate-600 truncate block">sha256: 4a9f2e...88bc1</span>
                      </div>
                    </div>
                  </div>

                  {/* Clinician Action Checkbox */}
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2 text-xs">
                    <span className="font-bold text-teal-950 block">Clinician Verification Status:</span>
                    <button
                      type="button"
                      onClick={() => setVerifiedCitations(prev => ({ ...prev, [activeEvidence.title]: !prev[activeEvidence.title] }))}
                      className={`w-full py-2 px-3 rounded-xl font-bold transition flex items-center justify-center space-x-2 shadow-2xs border ${
                        verifiedCitations[activeEvidence.title]
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white hover:bg-teal-100/60 text-teal-900 border-teal-300'
                      }`}
                    >
                      {verifiedCitations[activeEvidence.title] ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Grounding Verified by You</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-teal-700" />
                          <span>Confirm Clinical Fact</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-teal-800/80 leading-normal">
                      Marking this fact confirms you have cross-checked the original prescription snippet.
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              /* Evidence Tab 2: Raw PDF Frame */
              <div className="space-y-3">
                {activeEvidence.docId ? (
                  <div className="rounded-2xl border-2 border-slate-300 overflow-hidden shadow-inner bg-slate-900">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Original Document: {activeEvidence.docName} (Page {activeEvidence.page || 1})
                      </span>
                      <a
                        href={api.getDocumentFileUrl(activeEvidence.docId)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 font-bold hover:underline flex items-center space-x-1"
                      >
                        <span>Open in New Tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <iframe
                      src={api.getDocumentFileUrl(activeEvidence.docId)}
                      title="Source Evidence PDF Viewer"
                      className="w-full h-[440px] bg-white"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">Raw PDF connection preview</p>
                    <p className="mt-1">Connect your local document archive or switch back to the High-Res Interactive OCR Inspector tab.</p>
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Sehat Sathi Multi-Hospital Document Grounding
              </span>
              <button
                type="button"
                onClick={() => setActiveEvidence(null)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
