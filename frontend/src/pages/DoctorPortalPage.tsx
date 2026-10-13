import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  FileText, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Pill, 
  Activity, 
  ExternalLink, 
  Building2, 
  X, 
  CheckCircle2, 
  Eye 
} from 'lucide-react';
import { api } from '../services/api';

interface DoctorPortalPageProps {
  token: string;
  onExit: () => void;
}

export const DoctorPortalPage: React.FC<DoctorPortalPageProps> = ({ token, onExit }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evidence Modal
  const [activeEvidence, setActiveEvidence] = useState<any | null>(null);

  useEffect(() => {
    fetchSharedData();
  }, [token]);

  const fetchSharedData = async () => {
    try {
      setLoading(true);
      setError(null);
      const portalData = await api.getDoctorPortalData(token);
      setData(portalData);
    } catch (err: any) {
      setError(err.message || 'Unable to access shared medical records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm font-semibold">Validating doctor access token & decrypting patient authorization...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-red-200 p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Access Restricted / Revoked</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'This clinical access link has expired or has been revoked by the patient for privacy.'}
          </p>
          <button
            onClick={onExit}
            className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            Return to Sehat Sathi
          </button>
        </div>
      </div>
    );
  }

  const briefing = data.briefing;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* Clinician Top Banner */}
      <header className="bg-brand-900 text-white px-4 sm:px-8 py-3 flex items-center justify-between border-b border-brand-800 shadow-md">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="Sehat Sathi Logo" 
            className="w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-xs"
          />
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight">Sehat Sathi AI • Clinician Portal</span>
            <span className="text-[11px] text-brand-300 ml-2 hidden sm:inline">Authorized Doctor Access</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right text-[11px] hidden sm:block">
            <span className="text-emerald-400 font-bold block">✓ Patient Authorized: {data.patient_name}</span>
            <span className="text-brand-300 font-mono">Expires: {new Date(data.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition"
          >
            Exit Portal
          </button>
        </div>
      </header>

      {/* Main Review Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Clinician Alert Box */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Reviewing verified medical history for <strong>{data.patient_name}</strong>. Access is audited and strictly scoped to this consultation.
            </span>
          </div>
        </div>

        {briefing && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            
            {/* Demographics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Patient</span>
                <span className="font-bold text-slate-900 text-sm">{briefing.patient_info?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">DOB / Age</span>
                <span className="font-bold text-slate-800">{briefing.patient_info?.dob} (54 Y)</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Gender & Blood Group</span>
                <span className="font-bold text-slate-800">{briefing.patient_info?.gender} • {briefing.patient_info?.blood_group}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Emergency Contact</span>
                <span className="font-bold text-slate-800 truncate block">{briefing.patient_info?.emergency_contact}</span>
              </div>
            </div>

            {/* Clinical Overview */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Executive Clinical Overview
              </h3>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {briefing.clinical_narrative}
              </p>
            </div>

            {/* Allergies & Chronic Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 text-xs">
                <span className="font-bold text-red-900 block mb-1">Documented Allergies</span>
                {briefing.documented_allergies?.length > 0 ? (
                  <ul className="list-disc list-inside text-red-950 font-medium">
                    {briefing.documented_allergies.map((a: string, i: number) => <li key={i}>{a}</li>)}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No explicit drug allergies documented in uploaded records.</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                <span className="font-bold text-slate-800 block mb-1">Confirmed Chronic Diagnoses</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {briefing.chronic_conditions?.map((c: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800 text-[11px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Regimen */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>Active Prescriptions (Traceable to Source Document)</span>
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Medication</th>
                      <th className="py-2.5 px-3">Dosage</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Source Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {briefing.active_medications?.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.medicine_name}</td>
                        <td className="py-2.5 px-3 font-mono">{m.dosage}</td>
                        <td className="py-2.5 px-3 text-slate-600">{m.frequency}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                            Active
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setActiveEvidence({
                              title: `Prescription Record: ${m.medicine_name} ${m.dosage || ''}`,
                              docId: m.source_document_id,
                              docName: m.source_document_name
                            })}
                            className="text-brand-600 font-bold hover:underline inline-flex items-center space-x-1"
                          >
                            <span>View Original PDF</span>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Labs */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-brand-600" />
                <span>Laboratory Tests (Highlighted Out of Range)</span>
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Test</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3">Ref Range</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Source Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {briefing.recent_lab_results?.map((l: any) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center space-x-1">
                          <span>{l.test_name}</span>
                          {l.is_abnormal && <span className="text-red-600 font-black text-[10px]">⚠️ HIGH</span>}
                        </td>
                        <td className={`py-2.5 px-3 font-mono font-bold ${l.is_abnormal ? 'text-red-600' : 'text-slate-800'}`}>
                          {l.result_value}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{l.reference_range}</td>
                        <td className="py-2.5 px-3 text-slate-500">{l.test_date}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setActiveEvidence({
                              title: `Laboratory Diagnostic Report: ${l.test_name}`,
                              docId: l.source_document_id,
                              docName: l.source_document_name
                            })}
                            className="text-brand-600 font-bold hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Inspect Lab PDF</span>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shared Medical Documents Vault */}
            {data.documents && data.documents.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>Shared Medical Documents & Prescriptions ({data.documents.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition shadow-xs flex items-center justify-between space-x-3 text-xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate" title={doc.original_filename}>
                            {doc.original_filename || doc.filename}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                              {doc.category}
                            </span>
                            {doc.document_date && <span>• {doc.document_date}</span>}
                            {doc.doctor_name && <span>• Dr: {doc.doctor_name}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveEvidence({
                          title: doc.original_filename || 'Medical Document',
                          docId: doc.id,
                          docName: doc.original_filename
                        })}
                        className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg transition inline-flex items-center space-x-1 shrink-0 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions for Clinician */}
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 text-xs text-amber-950 space-y-1.5">
              <span className="font-bold block text-amber-900">Recommended Clinician Verification Items:</span>
              <ul className="list-disc list-inside space-y-1">
                {briefing.questions_for_clinician?.map((q: string, i: number) => <li key={i}>{q}</li>)}
              </ul>
            </div>

          </div>
        )}

      </main>

      {/* Doctor Evidence PDF Viewer Modal */}
      {activeEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Original Medical Record PDF</span>
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
              <div className="rounded-2xl border-2 border-slate-300 overflow-hidden shadow-inner bg-slate-900">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Source Document: {activeEvidence.docName || 'Prescription / Lab Record'}</span>
                  <a
                    href={api.getDoctorFileUrl(token, activeEvidence.docId)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-700 font-bold hover:underline flex items-center space-x-1"
                  >
                    <span>Open in Full Window</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                {activeEvidence.docName?.toLowerCase().endsWith('.png') ||
                activeEvidence.docName?.toLowerCase().endsWith('.jpg') ||
                activeEvidence.docName?.toLowerCase().endsWith('.jpeg') ||
                activeEvidence.docName?.toLowerCase().endsWith('.webp') ? (
                  <div className="p-4 flex items-center justify-center bg-slate-950 min-h-[450px]">
                    <img
                      src={api.getDoctorFileUrl(token, activeEvidence.docId)}
                      alt="Source Medical Document"
                      className="max-h-[520px] w-auto max-w-full object-contain rounded shadow-lg"
                    />
                  </div>
                ) : (
                  <iframe
                    src={api.getDoctorFileUrl(token, activeEvidence.docId)}
                    title="Doctor Document Viewer"
                    className="w-full h-[520px] bg-white"
                  />
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveEvidence(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                Done Reviewing
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
