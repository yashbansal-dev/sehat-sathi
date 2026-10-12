import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { TimelinePage } from './pages/TimelinePage';
import { DoctorBriefPage } from './pages/DoctorBriefPage';
import { VerificationPage } from './pages/VerificationPage';
import { SharingPage } from './pages/SharingPage';
import { DoctorPortalPage } from './pages/DoctorPortalPage';
import { api } from './services/api';
import { Printer, Stethoscope, User } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading, demoLogin, demoDoctorLogin } = useAuth();
  const { language } = useLanguage();

  // STRICT ROLE ISOLATION:
  // Patient CANNOT see doctor tools. Doctor CANNOT see patient personal tools.
  // The portal is strictly determined by user.role.
  const portal: 'patient' | 'doctor' = user?.role === 'doctor' ? 'doctor' : 'patient';

  // Sub-tabs per portal
  const [patientTab, setPatientTab] = useState<string>('home');
  const [doctorTab, setDoctorTab] = useState<string>('brief');

  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [openUploadDirectly, setOpenUploadDirectly] = useState(false);
  const [doctorToken, setDoctorToken] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'none' | 'login'>('none');
  const [initialAuthRole, setInitialAuthRole] = useState<'patient' | 'doctor'>('patient');

  // Check URL pathname for direct doctor portal link (e.g. from QR scan)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/doctor-portal/')) {
      const tok = path.replace('/doctor-portal/', '').trim();
      if (tok) {
        setDoctorToken(tok);
      }
    }
  }, []);

  // Poll for pending review count if logged in as doctor
  useEffect(() => {
    if (user && user.role === 'doctor') {
      api.getUncertainties()
        .then(data => setPendingReviewsCount(data.length))
        .catch(() => {});
    }
  }, [user, doctorTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Direct Shared Doctor Access Token mode (e.g. from patient's QR scan at doctor clinic)
  if (doctorToken) {
    return (
      <DoctorPortalPage
        token={doctorToken}
        onExit={() => {
          setDoctorToken(null);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  // Unauthenticated user
  if (!user) {
    if (authView === 'login') {
      return (
        <AuthPages
          initialRole={initialAuthRole}
          onSuccess={() => {
            setAuthView('none');
          }}
          onBackToHome={() => setAuthView('none')}
        />
      );
    }
    return (
      <LandingPage
        onGetStartedPatient={() => {
          setInitialAuthRole('patient');
          setAuthView('login');
        }}
        onGetStartedDoctor={() => {
          setInitialAuthRole('doctor');
          setAuthView('login');
        }}
        onExplorePatientDemo={async () => {
          await demoLogin();
          setPatientTab('home');
        }}
        onExploreDoctorDemo={async () => {
          await demoDoctorLogin();
          setDoctorTab('brief');
        }}
      />
    );
  }

  // Authenticated Application with Strict Role Isolation
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Doctor Clinical Workstation Header Strip (ONLY visible for Doctors) */}
      {portal === 'doctor' && (
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 text-xs border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-inner no-print">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CLINICAL WORKSTATION</span>
            </span>
            <span className="font-semibold text-slate-200">
              {language === 'hi' ? 'रोगी:' : 'Viewing Patient:'} <strong className="text-white">Rajesh Sharma</strong> (52Y, M) • Fortis Mohali & Max Healthcare EHR
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition border border-slate-700 text-xs shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>{language === 'hi' ? 'प्रिंट सारांश' : 'Print Brief'}</span>
            </button>
            <span className="text-slate-400 text-[11px] px-2 py-0.5 bg-slate-800/80 rounded-lg border border-slate-700">
              👨‍⚕️ Dr. Arvind Verma, MD
            </span>
          </div>
        </div>
      )}

      {/* Navbar — Strictly displays links matching current authenticated user's role */}
      <Navbar
        portal={portal}
        patientTab={patientTab}
        setPatientTab={setPatientTab}
        doctorTab={doctorTab}
        setDoctorTab={setDoctorTab}
        pendingReviewsCount={pendingReviewsCount}
      />

      <main className="flex-1 pb-16">
        {/* ========================================================================= */}
        {/* 1. PATIENT PORTAL (Exclusively Patient-Centric: Upload, Meds, Timeline, QR Share) */}
        {/* ========================================================================= */}
        {portal === 'patient' && (
          <>
            {patientTab === 'home' && (
              <DashboardPage
                onNavigate={(tab) => {
                  if (tab === 'timeline') setPatientTab('timeline');
                  else if (tab === 'share') setPatientTab('share');
                  else if (tab === 'documents') setPatientTab('documents');
                }}
                onOpenUploadModal={() => {
                  setPatientTab('documents');
                  setOpenUploadDirectly(true);
                }}
              />
            )}

            {patientTab === 'documents' && (
              <DocumentsPage initialOpenUpload={openUploadDirectly} />
            )}

            {patientTab === 'timeline' && <TimelinePage />}

            {patientTab === 'share' && (
              <SharingPage
                onOpenDoctorPortal={(token) => {
                  // In demo / test mode, opens doctor token view
                  setDoctorToken(token);
                  window.history.pushState({}, '', `/doctor-portal/${token}`);
                }}
              />
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. DOCTOR & CLINICIAN PORTAL (2-Min Brief, Evidence, Contradictions, Audit) */}
        {/* ========================================================================= */}
        {portal === 'doctor' && (
          <>
            {doctorTab === 'brief' && <DoctorBriefPage />}
            {doctorTab === 'records' && <DocumentsPage initialOpenUpload={false} />}
            {doctorTab === 'timeline' && <TimelinePage />}
            {doctorTab === 'audit' && <VerificationPage />}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sehat Sathi AI — {portal === 'patient' ? 'Patient Health Portal' : 'Clinician Decision Station'}</span>
          <span>🔒 All clinical data encrypted and isolated • Role-secured access</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
