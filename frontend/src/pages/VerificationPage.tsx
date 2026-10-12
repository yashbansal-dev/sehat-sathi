import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  FileText, 
  Edit3, 
  Check, 
  ExternalLink, 
  RotateCcw, 
  ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';
import { UncertaintyItem } from '../types';

export const VerificationPage: React.FC = () => {
  const [uncertainties, setUncertainties] = useState<UncertaintyItem[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);

  // Resolution state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState<string>('');
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const data = await api.getUncertainties();
        setUncertainties(data);
      } else {
        const hist = await api.getCorrectionHistory();
        setCorrections(hist);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveOption = async (item: UncertaintyItem, valueToUse: string) => {
    try {
      await api.resolveUncertainty(item.id, valueToUse);
      setResolutionSuccess(`Resolved '${item.field_name}' as '${valueToUse}'. Verification audit logged.`);
      setTimeout(() => setResolutionSuccess(null), 4000);
      setResolvingId(null);
      setCustomValue('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <CheckCircle2 className="w-6 h-6 text-brand-600" />
            <span>Verification & Clinical Fact-Checking Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review low-confidence OCR scans, faded dosages, missing timestamps, and conflicting data. All corrections preserve original extractions for auditability.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Requires Review ({uncertainties.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit History
          </button>
        </div>
      </div>

      {resolutionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{resolutionSuccess}</span>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs">Loading verification records...</p>
        </div>
      ) : activeTab === 'pending' ? (
        
        uncertainties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm">
            <ShieldCheck className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">All Clinical Records Verified</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no pending low-confidence OCR items or conflicting diagnoses. All uploaded data is consistent.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {uncertainties.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Flagged: {item.field_name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Source Document: {item.document_name}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-medium mb-0.5">Detected OCR / Extracted Value:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{item.detected_value || 'Missing / Ambiguous'}</span>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-amber-900">
                    <span className="text-amber-800 block font-medium mb-0.5">Reason for Review:</span>
                    <span className="font-medium">{item.reason}</span>
                  </div>
                </div>

                {/* Resolution Action Area */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Select Verified Value or Type Manual Correction:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.suggested_options && item.suggested_options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleResolveOption(item, opt)}
                        className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-800 rounded-xl text-xs font-bold border border-brand-200 transition"
                      >
                        ✓ {opt}
                      </button>
                    ))}

                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <input
                        type="text"
                        placeholder="Custom correct value..."
                        value={resolvingId === item.id ? customValue : ''}
                        onFocus={() => setResolvingId(item.id)}
                        onChange={(e) => setCustomValue(e.target.value)}
                        className="text-xs py-1.5 px-3 border border-slate-300 rounded-xl focus:ring-brand-500 focus:border-brand-500 w-48"
                      />
                      <button
                        onClick={() => {
                          if (customValue.trim()) handleResolveOption(item, customValue.trim());
                        }}
                        disabled={resolvingId !== item.id || !customValue.trim()}
                        className="px-3 py-1.5 bg-slate-900 disabled:opacity-40 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                      >
                        Save & Verify
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )

      ) : (
        
        /* Audit History Tab */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <History className="w-4 h-4 text-brand-600" />
              <span>Immutable Verification & Correction Audit Logs</span>
            </h2>
            <span className="text-[11px] text-slate-500">Preserves original vs corrected value</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {corrections.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No corrections logged yet.</p>
            ) : (
              corrections.map((corr) => (
                <div key={corr.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 px-2 py-0.5 rounded mr-2">
                      {corr.field_name}
                    </span>
                    <span className="text-slate-600">{corr.reason || 'User corrected'}</span>
                    <div className="mt-1 flex items-center space-x-3 text-[11px]">
                      <span className="text-red-600 line-through">Old: {corr.old_value || 'None'}</span>
                      <span className="text-emerald-700 font-bold">New: {corr.new_value}</span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <p>Verified by {corr.corrected_by}</p>
                    <p className="font-mono">{new Date(corr.corrected_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      )}

    </div>
  );
};
