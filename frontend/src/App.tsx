import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { TimelinePage } from './pages/TimelinePage';
import { TrendsPage } from './pages/TrendsPage';
import { SummaryPage } from './pages/SummaryPage';
import { VerificationPage } from './pages/VerificationPage';
import { SharingPage } from './pages/SharingPage';
import { SettingsPage } from './pages/SettingsPage';
import { DoctorBriefPage } from './pages/DoctorBriefPage';
import { DoctorPortalPage } from './pages/DoctorPortalPage';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { user, loading, demoLogin, demoDoctorLogin } = useAuth();
  const { language } = useLanguage();

  // Role isolation:
  // Patient uses patient modules. Doctor uses clinician modules.
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

  // Poll for pending review count if logged in
  useEffect(() => {
    if (user) {
      api.getUncertainties()
        .then(data => setPendingReviewsCount(data.length))
        .catch(() => { });
    }
  }, [user, doctorTab, patientTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
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

  // Authenticated Application
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

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
        {/* 1. PATIENT PORTAL (PHR: Upload, Timeline, Trends, Summary, Verify, Share) */}
        {/* ========================================================================= */}
        {portal === 'patient' && (
          <>
            {patientTab === 'home' && (
              <DashboardPage
                onNavigate={(tab) => setPatientTab(tab)}
                onOpenUploadModal={() => {
                  setPatientTab('documents');
                  setOpenUploadDirectly(true);
                }}
              />
            )}

            {patientTab === 'documents' && (
              <DocumentsPage
                initialOpenUpload={openUploadDirectly}
                onOpenDoctorPortal={(token) => {
                  setDoctorToken(token);
                  window.history.pushState({}, '', `/doctor-portal/${token}`);
                }}
              />
            )}

            {patientTab === 'timeline' && <TimelinePage />}

            {patientTab === 'trends' && <TrendsPage />}

            {patientTab === 'summary' && <SummaryPage />}

            {patientTab === 'verify' && <VerificationPage />}

            {patientTab === 'share' && (
              <SharingPage
                onOpenDoctorPortal={(token) => {
                  setDoctorToken(token);
                  window.history.pushState({}, '', `/doctor-portal/${token}`);
                }}
              />
            )}

            {patientTab === 'settings' && <SettingsPage />}
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. DOCTOR & CLINICIAN WORKSTATION (The Two-Minute Doctor Brief)          */}
        {/* ========================================================================= */}
        {portal === 'doctor' && (
          <DoctorBriefPage />
        )}
      </main>

      {/* Patient Mobile Bottom Navigation (Shown on smartphone viewports) */}
      {portal === 'patient' && (
        <MobileBottomNav
          currentTab={patientTab}
          onSelectTab={setPatientTab}
          pendingReviewsCount={pendingReviewsCount}
        />
      )}

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sehat Sathi AI — {portal === 'patient' ? 'Personal Health Record & Living History' : 'Clinician Decision Station'}</span>
          <span>🔒 All clinical data encrypted and isolated • Patient-authorized access</span>
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
