import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Lock, 
  Clock, 
  Trash2, 
  Copy, 
  Check, 
  ShieldCheck, 
  QrCode, 
  ExternalLink, 
  UserCheck, 
  Eye, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { ShareToken } from '../types';

interface SharingPageProps {
  onOpenDoctorPortal: (token: string) => void;
}

export const SharingPage: React.FC<SharingPageProps> = ({ onOpenDoctorPortal }) => {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(true);

  // New share form
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [durationHours, setDurationHours] = useState(24);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const data = await api.listShareTokens();
      setTokens(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.createShareToken(title, durationHours, doctorName);
      setTitle('');
      setDoctorName('');
      await fetchTokens();
    } catch (err: any) {
      alert(err.message || 'Failed to create share authorization');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    if (!confirm('Revoke doctor access immediately? The link will expire instantly.')) return;
    try {
      await api.revokeShareToken(tokenId);
      await fetchTokens();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke token');
    }
  };

  const copyToClipboard = (tokenStr: string) => {
    const fullUrl = `${window.location.origin}/doctor-portal/${tokenStr}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(tokenStr);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Share2 className="w-6 h-6 text-brand-600" />
          <span>Patient-Controlled Doctor Sharing</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Share your Two-Minute Doctor Brief and verified records via temporary, revocable clinical access links. Never permanent or public.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Share Form */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 text-brand-900 font-bold text-sm pb-3 border-b border-slate-100">
            <Lock className="w-4 h-4 text-brand-600" />
            <span>Generate Doctor Access Link</span>
          </div>

          <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Consultation Purpose / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiology OPD Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Doctor or Hospital Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Verma / MaxCare Hospital"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Link Expiration Window
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-brand-500 focus:border-brand-500"
              >
                <option value={2}>2 Hours (Immediate Bedside Consult)</option>
                <option value={12}>12 Hours (Same Day OPD)</option>
                <option value={24}>24 Hours (Standard Review)</option>
                <option value={48}>48 Hours (Weekend Coverage)</option>
                <option value={168}>7 Days (Post-op Follow-up)</option>
              </select>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
              <p className="font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Security Protections Active:</span>
              </p>
              <p>• Only includes verified Doctor Brief & permitted records</p>
              <p>• You can revoke access at any second with 1 click</p>
              <p>• Logs doctor IP address & timestamp</p>
            </div>

            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/25 transition"
            >
              {creating ? 'Generating Secure Token...' : 'Create Share Link'}
            </button>
          </form>
        </div>

        {/* Active & Revoked Links Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Active & Previous Doctor Authorizations</span>
              </h2>
              <span className="text-xs text-slate-500">{tokens.length} total generated</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-xs">Loading authorization tokens...</p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs">No doctor share links created yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-3 text-xs">
                {tokens.map((tok) => {
                  const isExpired = new Date(tok.expires_at) < new Date();
                  const isActive = !tok.is_revoked && !isExpired;

                  return (
                    <div key={tok.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{tok.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tok.is_revoked ? 'bg-red-50 text-red-700 border border-red-200' :
                            isExpired ? 'bg-slate-100 text-slate-600' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                          }`}>
                            {tok.is_revoked ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                          </span>
                        </div>

                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {tok.doctor_name_or_purpose || 'Clinician Review'} • Expires: {new Date(tok.expires_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isActive && (
                          <>
                            <button
                              onClick={() => copyToClipboard(tok.token)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center space-x-1"
                              title="Copy Doctor Access URL"
                            >
                              {copiedToken === tok.token ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => onOpenDoctorPortal(tok.token)}
                              className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-lg flex items-center space-x-1"
                              title="Preview doctor interface"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>

                            <button
                              onClick={() => handleRevoke(tok.id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg flex items-center space-x-1"
                              title="Immediately revoke access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          </>
                        )}

                        {tok.is_revoked && (
                          <span className="text-slate-400 text-[11px] italic">Access terminated</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 mt-6 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Doctors will see an uncluttered, read-only interface with verified medical facts and original document links.</span>
          </div>

        </div>

      </div>

    </div>
  );
};
