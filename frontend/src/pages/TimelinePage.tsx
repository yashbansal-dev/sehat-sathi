import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Pill, 
  Activity, 
  User, 
  Calendar 
} from 'lucide-react';
import { api } from '../services/api';
import { TimelineEvent } from '../types';

export const TimelinePage: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [verificationStatus, setVerificationStatus] = useState('All');
  const [search, setSearch] = useState('');

  // Source preview modal state
  const [activeSourceEvent, setActiveSourceEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [category, verificationStatus]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const data = await api.getTimeline(category, verificationStatus, search);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTimeline();
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'Prescription': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Lab Test': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Discharge': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hospitalization': return 'bg-red-50 text-red-700 border-red-200';
      case 'Visit': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Clock className="w-6 h-6 text-brand-600" />
          <span>Unified Medical Timeline</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Chronological synthesis of clinical encounters, diagnostic tests, discharges, and medication history with traceable source links.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 text-xs">
          {['All', 'Prescription', 'Lab Test', 'Discharge', 'Hospitalization', 'Visit'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                category === cat
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Verification Status Filter & Search */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-300 rounded-xl focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="All">All Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 focus:border-brand-500"
            />
          </form>
        </div>

      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs">Reconstructing chronological medical events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No events matched your filters</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the category or search criteria.</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-brand-200 space-y-8 my-8 ml-3 sm:ml-4">
          {events.map((event) => (
            <div key={event.id} className="relative group">
              
              {/* Timeline Node Bullet */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-brand-600 flex items-center justify-center shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
              </div>

              {/* Event Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {event.event_date}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getEventBadgeColor(event.event_type)}`}>
                      {event.event_type}
                    </span>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                    event.verification_status === 'verified'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {event.verification_status === 'verified' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                    )}
                    <span>{event.verification_status}</span>
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-slate-900">{event.title}</h3>
                  {event.facility_or_doctor && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{event.facility_or_doctor}</span>
                    </p>
                  )}
                  {event.description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Evidence Traceability Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Source: {event.document_name || 'Medical Document Record'} • Page {event.source_page}
                  </span>

                  {event.document_id && (
                    <button
                      onClick={() => setActiveSourceEvent(event)}
                      className="text-brand-600 font-semibold hover:text-brand-800 flex items-center space-x-1"
                    >
                      <span>Inspect Source Evidence</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Source Evidence Inspection Modal */}
      {activeSourceEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Source Evidence Audit</span>
                <h3 className="text-sm font-bold text-slate-900">{activeSourceEvent.title}</h3>
              </div>
              <button
                onClick={() => setActiveSourceEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1 font-semibold">Extracted Source Snippet:</span>
                <p className="font-mono text-slate-800 italic">
                  "{activeSourceEvent.source_snippet || activeSourceEvent.description}"
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl text-brand-900 font-medium">
                <span>Document: {activeSourceEvent.document_name} (Page {activeSourceEvent.source_page})</span>
                <a
                  href={api.getDocumentFileUrl(activeSourceEvent.document_id!)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold"
                >
                  View Original Document
                </a>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveSourceEvent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
