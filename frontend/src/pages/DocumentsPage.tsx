import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  RotateCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  X, 
  Eye, 
  Pill, 
  Activity, 
  Stethoscope, 
  Building2, 
  Maximize2 
} from 'lucide-react';
import { api } from '../services/api';
import { MedicalDocument } from '../types';

interface DocumentsPageProps {
  initialOpenUpload?: boolean;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ initialOpenUpload = false }) => {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(initialOpenUpload);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState('Prescription');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Detail view state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'pdf' | 'facts' | 'ocr'>('pdf');

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.listDocuments(selectedCategory);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateAndAddFiles = (fileList: FileList | File[]) => {
    setUploadError(null);
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      if (!hasValidExt) {
        errors.push(`${file.name}: Invalid format. Supported formats: PDF, PNG, JPEG.`);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        errors.push(`${file.name}: Size exceeds 15MB limit.`);
        return;
      }
      // Avoid duplicate filenames in current batch
      if (!uploadFiles.some(f => f.name === file.name)) {
        newFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join(' '));
    }
    if (newFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setUploadProgress(`Processing ${i + 1} of ${uploadFiles.length}: ${file.name}...`);
        await api.uploadDocument(file, uploadCategory);
      }
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadProgress(null);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleOpenDetails = async (docId: string, defaultTab: 'pdf' | 'facts' = 'pdf') => {
    try {
      const details = await api.getDocumentDetails(docId);
      setSelectedDoc(details);
      setModalTab(defaultTab);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.retryDocument(docId);
      await fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this medical record and all associated extracted facts?')) return;
    try {
      await api.deleteDocument(docId);
      if (selectedDoc?.document?.id === docId) setSelectedDoc(null);
      await fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.facility_name && doc.facility_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (doc.doctor_name && doc.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Medical Documents & Prescriptions Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View original PDF prescriptions and lab reports side-by-side with automated AI clinical extractions.
          </p>
        </div>

        <button
          onClick={() => { setShowUploadModal(true); setUploadError(null); }}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-600/25 flex items-center justify-center space-x-2 transition"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Medical Record</span>
        </button>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 text-xs">
          {['All', 'Prescription', 'Lab Report', 'Discharge Summary', 'Doctor Notes', 'Other'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents or doctors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs">Loading medical documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No medical records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload your first prescription, laboratory test, or hospital discharge summary to start automatic OCR extraction.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700"
          >
            Upload Document Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleOpenDetails(doc.id, 'pdf')}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    doc.category === 'Prescription' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    doc.category === 'Lab Report' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    doc.category === 'Discharge Summary' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {doc.category}
                  </span>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    doc.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    doc.status === 'processing' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {doc.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    {doc.status === 'processing' && <Clock className="w-3 h-3" />}
                    {doc.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                    <span>{doc.status}</span>
                  </span>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-red-100">
                    PDF
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-brand-600 transition" title={doc.original_filename}>
                      {doc.original_filename}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {doc.facility_name || doc.doctor_name || 'Medical Facility'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>📅 {doc.document_date || 'Date recorded'}</span>
                  <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                </div>
              </div>

              {/* Action Buttons on Card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(doc.id, 'pdf');
                    }}
                    className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View PDF</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(doc.id, 'facts');
                    }}
                    className="px-2 py-1 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium"
                  >
                    Extracted Data
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  {doc.status === 'failed' && (
                    <button
                      onClick={(e) => handleRetry(doc.id, e)}
                      title="Retry Processing"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    title="Delete Record"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENT & PRESCRIPTION INSPECTION MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-brand-500"></span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                      {selectedDoc.document?.category}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {selectedDoc.document?.document_date || 'Date recorded'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md sm:max-w-xl">
                    {selectedDoc.document?.original_filename}
                  </h2>
                </div>
              </div>

              {/* View Switcher Tabs & Close */}
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setModalTab('pdf')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      modalTab === 'pdf' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📄 Original PDF Viewer
                  </button>
                  <button
                    onClick={() => setModalTab('facts')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      modalTab === 'facts' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔬 Extracted Facts
                  </button>
                  <button
                    onClick={() => setModalTab('ocr')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      modalTab === 'ocr' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📝 Raw OCR
                  </button>
                </div>

                <a
                  href={api.getDocumentFileUrl(selectedDoc.document?.id)}
                  target="_blank"
                  rel="noreferrer"
                  title="Open PDF in new tab"
                  className="p-2 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Maximize2 className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="sm:hidden flex border-b border-slate-200 bg-slate-100 px-4 py-2 gap-2 text-xs">
              <button
                onClick={() => setModalTab('pdf')}
                className={`flex-1 py-1 rounded-lg text-center ${modalTab === 'pdf' ? 'bg-white font-bold' : 'text-slate-600'}`}
              >
                📄 PDF
              </button>
              <button
                onClick={() => setModalTab('facts')}
                className={`flex-1 py-1 rounded-lg text-center ${modalTab === 'facts' ? 'bg-white font-bold' : 'text-slate-600'}`}
              >
                🔬 Facts
              </button>
              <button
                onClick={() => setModalTab('ocr')}
                className={`flex-1 py-1 rounded-lg text-center ${modalTab === 'ocr' ? 'bg-white font-bold' : 'text-slate-600'}`}
              >
                📝 OCR
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              
              {/* TAB 1: PDF VIEWER & CLINICAL PRESCRIPTION SHEET */}
              {modalTab === 'pdf' && (
                <div className="space-y-6">
                  
                  {/* Top Bar with download & full view */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 text-xs">
                    <span className="text-slate-600">
                      Viewing document: <strong className="text-slate-900">{selectedDoc.document?.original_filename}</strong>
                    </span>
                    <a
                      href={api.getDocumentFileUrl(selectedDoc.document?.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Download / Open Full PDF</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Embedded PDF iframe / Document Viewer */}
                  <div className="rounded-2xl border-2 border-slate-300 overflow-hidden shadow-inner bg-slate-900">
                    <iframe
                      src={api.getDocumentFileUrl(selectedDoc.document?.id)}
                      title="Medical Document PDF Viewer"
                      className="w-full h-[520px] bg-white"
                    />
                  </div>

                  {/* Clinical Prescription Sheet Layout (Reconstructed from verified extraction) */}
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-brand-600 pb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {selectedDoc.document?.facility_name || 'Medical Clinic'}
                        </h3>
                        <p className="text-xs text-brand-700 font-semibold">
                          {selectedDoc.document?.doctor_name || 'Consulting Physician'}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500 font-mono">
                        <p>Date: {selectedDoc.document?.document_date || 'Current'}</p>
                        <p>Ref: #{selectedDoc.document?.id?.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Prescription Rx Symbol & Medications */}
                    <div>
                      <span className="text-2xl font-serif font-black text-brand-700 block mb-2">℞</span>
                      
                      {selectedDoc.extracted_medications && selectedDoc.extracted_medications.length > 0 ? (
                        <div className="space-y-2">
                          {selectedDoc.extracted_medications.map((med: any, idx: number) => (
                            <div key={med.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-black text-slate-900 text-sm">{idx + 1}. {med.medicine_name}</span>
                                <span className="text-slate-600 font-mono ml-2">({med.dosage || 'Standard dose'})</span>
                                <p className="text-slate-500 text-[11px] mt-0.5">Instructions: {med.frequency} • Duration: {med.duration || 'Ongoing'}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                med.is_current ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {med.is_current ? 'Active' : 'Completed'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">See attached laboratory / clinical report details above.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: EXTRACTED CLINICAL FACTS */}
              {modalTab === 'facts' && (
                <div className="space-y-6">
                  
                  {/* Medications */}
                  {selectedDoc.extracted_medications && selectedDoc.extracted_medications.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center space-x-1.5">
                        <Pill className="w-4 h-4 text-emerald-600" />
                        <span>Prescribed Medications ({selectedDoc.extracted_medications.length})</span>
                      </h3>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                        {selectedDoc.extracted_medications.map((m: any) => (
                          <div key={m.id} className="p-3 bg-white flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{m.medicine_name}</span>
                              <span className="text-slate-600 ml-2">Dosage: {m.dosage} • {m.frequency}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              m.is_current ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {m.is_current ? 'Active Regimen' : 'Historical'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab Results */}
                  {selectedDoc.extracted_lab_results && selectedDoc.extracted_lab_results.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center space-x-1.5">
                        <Activity className="w-4 h-4 text-brand-600" />
                        <span>Laboratory Test Values ({selectedDoc.extracted_lab_results.length})</span>
                      </h3>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                        {selectedDoc.extracted_lab_results.map((l: any) => (
                          <div key={l.id} className="p-3 bg-white flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{l.test_name}</span>
                              <span className="text-slate-500 ml-2 font-mono">(Ref: {l.reference_range})</span>
                            </div>
                            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              l.is_abnormal ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {l.result_value} {l.is_abnormal && '⚠️'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Diagnoses */}
                  {selectedDoc.extracted_diagnoses && selectedDoc.extracted_diagnoses.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Recorded Diagnoses
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoc.extracted_diagnoses.map((d: any) => (
                          <span key={d.id} className="px-3 py-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">
                            {d.condition_name} ({d.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: RAW OCR EXTRACTED TEXT */}
              {modalTab === 'ocr' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Engine: PyMuPDF / Tesseract OCR</span>
                    <span>Confidence: {(selectedDoc.document?.ocr_confidence * 100 || 95).toFixed(0)}%</span>
                  </div>
                  <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                    {selectedDoc.document?.ocr_text || 'OCR processing in progress...'}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Sehat Sathi AI Clinical Document Viewer
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Upload Drag & Drop Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-brand-600" />
                <span>Upload Medical Document</span>
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="Prescription">Prescription</option>
                  <option value="Lab Report">Lab Report</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Doctor Notes">Doctor Notes</option>
                  <option value="Other">Other Clinical Document</option>
                </select>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-brand-500 transition cursor-pointer bg-slate-50/50"
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  multiple
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Drag and drop documents here, or <span className="text-brand-600 underline">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Upload multiple files simultaneously • Accepts PDF, PNG, JPG (up to 15MB each)
                  </p>
                </label>
              </div>

              {/* Selected Files List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Selected Documents ({uploadFiles.length})
                  </p>
                  {uploadFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{f.name}</span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={uploading}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-200 transition"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-brand-50 rounded-xl text-[11px] text-brand-800 space-y-1">
                <p className="font-semibold">⚡ Automatic Processing Pipeline:</p>
                <p>1. PyMuPDF text & scanned image parsing</p>
                <p>2. AI extraction of medicines, dosages, and lab ranges</p>
                <p>3. Dynamic update of your Two-Minute Doctor Brief</p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadFiles.length === 0 || uploading}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/25 transition"
                >
                  {uploading
                    ? (uploadProgress || 'Processing Documents...')
                    : (uploadFiles.length > 1
                        ? `Upload & Analyze ${uploadFiles.length} Documents`
                        : 'Upload & Analyze Document')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
