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
  X 
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
          <div className="p-5 rounded-2xl border-2 border-red-300 bg-red-50/40 space-y-4">
            <div className="flex items-center space-x-2 text-red-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Meaningful Clinical Contradictions Detected Across Records</span>
            </div>

            <div className="space-y-3">
              {briefing.clinical_contradictions.map((c: any) => (
                <div key={c.id} className="p-4 bg-white rounded-xl border border-red-200 text-xs space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-900 text-sm">{c.title}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-full border border-red-200">
                      {c.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                    <div className="text-slate-800">
                      <span className="font-bold text-red-700 block font-sans">Finding A:</span>
                      {c.finding_a}
                      <p className="text-slate-400 text-[10px] mt-0.5 font-sans">Source: {c.source_doc_a}</p>
                    </div>
                    <div className="text-slate-800">
                      <span className="font-bold text-amber-700 block font-sans">Finding B:</span>
                      {c.finding_b}
                      <p className="text-slate-400 text-[10px] mt-0.5 font-sans">Source: {c.source_doc_b}</p>
                    </div>
                  </div>

                  <div className="text-slate-700 bg-amber-50/60 p-2 rounded border border-amber-200/80">
                    <strong className="text-amber-900">Clinical Impact & Recommendation:</strong> {c.clinical_impact}
                  </div>
                </div>
              ))}
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

      {/* Source Evidence Inspection Modal */}
      {activeEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 no-print">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Traceable Source Evidence & PDF</span>
                <h3 className="text-sm font-bold text-slate-900">{activeEvidence.title}</h3>
              </div>
              <button
                onClick={() => setActiveEvidence(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1 font-semibold">Extracted Source Evidence Snippet:</span>
                <p className="font-mono text-slate-800 italic">
                  "{activeEvidence.snippet || 'Extracted via PyMuPDF OCR from primary document.'}"
                </p>
              </div>

              {activeEvidence.docId && (
                <div className="rounded-2xl border-2 border-slate-300 overflow-hidden shadow-inner bg-slate-900">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Original Document: {activeEvidence.docName} (Page {activeEvidence.page || 1})</span>
                    <a
                      href={api.getDocumentFileUrl(activeEvidence.docId)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Open Full PDF in New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <iframe
                    src={api.getDocumentFileUrl(activeEvidence.docId)}
                    title="Source Evidence PDF Viewer"
                    className="w-full h-[400px] bg-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveEvidence(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
