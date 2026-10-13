import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    app_name: 'Sehat Sathi AI',
    tagline: 'The Two-Minute Doctor',
    subtext: 'Every medical record. One clear story.',

    // Navigation
    tab_home: 'Home',
    tab_history: 'History',
    tab_documents: 'Documents',
    tab_trends: 'Trends',
    tab_profile: 'Profile',

    // Auth Screen
    sign_in: 'Sign In',
    register: 'Register',
    continue_with_google: 'Continue with Google',
    demo_patient_login: '1-Click Demo Patient Login',
    full_name: 'Full Name',
    email_address: 'Email Address',
    password: 'Password',
    sign_in_button: 'Sign In to Health Vault',
    create_account: 'Create Patient Account',
    backend_online: 'Backend Online',
    server_unreachable: 'Server Unreachable',
    instant_signin_title: 'Instant Health Vault Sign-In',
    instant_signin_sub: 'Sign in with Google or 1-click synthetic patient profile (Rajesh Sharma).',

    // Home Screen
    welcome_prefix: 'Namaste',
    vault_active: 'Patient Health Vault Active',
    briefing_title: '2-Minute Clinical Briefing',
    briefing_desc: 'AI-distilled summary ready for clinical consultations',
    high_risk: 'High Clinical Attention',
    moderate_risk: 'Moderate Risk',
    stable_risk: 'Stable Patient',
    red_flags: 'Clinical Red Flags',
    active_conditions: 'Active Health Conditions',
    recent_events: 'Recent Medical Events',
    quick_stats: 'Health Metrics',
    stat_documents: 'Documents',
    stat_events: 'Timeline Events',
    stat_clarifications: 'Resolved Qs',
    stat_risk: 'Risk Level',

    // Pill Tracking & Reminders
    pill_tracker_title: "Today's Medicine Schedule",
    pill_tracker_sub: 'Take prescribed medicines on time with water',
    mark_taken: 'Mark Taken',
    taken: 'Taken',
    send_reminder: 'Test Reminder Alert',
    morning: 'Morning (After Breakfast)',
    night: 'Night (After Dinner)',
    afternoon: 'Afternoon (After Lunch)',

    // History Screen
    history_title: 'Unified Health Timeline',
    filter_all: 'All',
    filter_lab: 'Lab Reports',
    filter_prescription: 'Prescriptions',
    filter_diagnosis: 'Diagnoses',
    filter_note: 'Clinical Notes',

    // Documents Screen
    docs_title: 'Medical Records Vault',
    upload_doc: 'Upload Document',
    scan_doc: 'Scan Prescription',
    sample_docs: 'Load Sample Records',
    category_all: 'All',
    category_prescription: 'Prescription',
    category_lab: 'Lab Report',
    category_discharge: 'Discharge Summary',

    // Trends Screen
    trends_title: 'Biomarker Trends',
    trends_sub: 'Longitudinal laboratory trajectory & stability',
    hba1c: 'HbA1c (Glycated Hemoglobin)',
    fasting_glucose: 'Fasting Blood Sugar',
    postprandial: 'Post Prandial Sugar',
    creatinine: 'Serum Creatinine',
    blood_pressure: 'Blood Pressure',
    abnormal: 'Attention Needed',
    normal: 'Within Target',

    // Profile & Sharing Screen
    profile_title: 'Patient Profile & Sharing',
    demographics: 'Demographics',
    age_gender: '54 Yrs • Male • Blood Group B+ve',
    chronic_conditions: 'Chronic Conditions',
    doctor_sharing_title: 'Secure Doctor Access Portal',
    doctor_sharing_sub: 'Generate a secure, time-limited QR access link for your doctor',
    create_token_btn: 'Generate New Doctor Link',
    active_tokens: 'Active Doctor Access Links',
    revoke_access: 'Revoke Access',
    doctor_access_revoked: 'Doctor access revoked immediately (HTTP 410)',
    logout: 'Log Out of Health Vault',
    action_share_sub: 'Doctor Access',

    // 1-Click Send to Doctor
    send_to_doctor_1click: '⚡ 1-Click Send to Doctor',
    upload_and_send_1click: '⚡ 1-Click Upload & Send to Doctor',
    prescription_sent_title: 'Prescription Sent to Doctor!',
    prescription_sent_subtitle: 'Secure 48-hour clinical access granted with patient control',
    whatsapp_share: 'Send to Doctor via WhatsApp',
    share_via_apps: 'Share Link (SMS / Other Apps)',
    copy_link: 'Copy Prescription Link',
    link_copied: 'Prescription Link Copied!',
    doctor_only_notice: 'Doctor Portal Link (For Clinician Use Only)',
    doctor_only_desc: 'This link is generated exclusively for your doctor to view your prescription. Patient access to the doctor workstation is restricted.'
  },
  hi: {
    // Brand & Header
    app_name: 'सेहत साथी AI',
    tagline: 'दो-मिनट डॉक्टर सारांश',
    subtext: 'हर मेडिकल पर्ची। एक स्पष्ट स्वास्थ्य कहानी।',

    // Navigation
    tab_home: 'होम',
    tab_history: 'इतिहास',
    tab_documents: 'पर्चियां',
    tab_trends: 'ट्रेंड्स',
    tab_profile: 'प्रोफ़ाइल',

    // Auth Screen
    sign_in: 'लॉग इन',
    register: 'रजिस्टर करें',
    continue_with_google: 'Google के साथ आगे बढ़ें',
    demo_patient_login: '1-क्लिक डेमो मरीज़ लॉग इन',
    full_name: 'पूरा नाम',
    email_address: 'ईमेल पता',
    password: 'पासवर्ड',
    sign_in_button: 'स्वास्थ्य तिजोरी में प्रवेश करें',
    create_account: 'नया मरीज़ खाता बनाएं',
    backend_online: 'सर्वर कनेक्टेड (ऑनलाइन)',
    server_unreachable: 'सर्वर से संपर्क नहीं हुआ',
    instant_signin_title: 'त्वरित स्वास्थ्य तिजोरी लॉग इन',
    instant_signin_sub: 'Google खाते से या 1-क्लिक डेमो मरीज़ (राजेश शर्मा) से प्रवेश करें।',

    // Home Screen
    welcome_prefix: 'नमस्ते',
    vault_active: 'आपकी स्वास्थ्य तिजोरी सक्रिय है',
    briefing_title: '2-मिनट डॉक्टर क्लिनिकल सारांश',
    briefing_desc: 'डॉक्टर को परामर्श के समय दिखाने हेतु AI द्वारा तैयार संक्षिप्त विवरण',
    high_risk: 'उच्च चिकित्सकीय ध्यान आवश्यक',
    moderate_risk: 'मध्यम जोखिम',
    stable_risk: 'संतुलित स्वास्थ्य',
    red_flags: 'ज़रूरी चेतावनियां (Red Flags)',
    active_conditions: 'वर्तमान बीमारियां',
    recent_events: 'हालिया मेडिकल घटनाएं',
    quick_stats: 'स्वास्थ्य मेट्रिक्स',
    stat_documents: 'दस्तावेज़',
    stat_events: 'इतिहास घटनाएं',
    stat_clarifications: 'सुलझाए सवाल',
    stat_risk: 'जोखिम स्तर',

    // Pill Tracking & Reminders
    pill_tracker_title: 'आज की दवाइयां व समय सारणी',
    pill_tracker_sub: 'दवाइयां हमेशा सही समय पर पानी के साथ लें',
    mark_taken: 'दवा ले ली',
    taken: 'ले ली गई ✓',
    send_reminder: 'अलर्ट सूचना जांचें',
    morning: 'सुबह (नाश्ते के बाद)',
    night: 'रात (रात के खाने के बाद)',
    afternoon: 'दोपहर (दोपहर के खाने के बाद)',

    // History Screen
    history_title: 'संपूर्ण स्वास्थ्य इतिहास',
    filter_all: 'सभी',
    filter_lab: 'लैब रिपोर्ट्स',
    filter_prescription: 'दवा पर्चियां',
    filter_diagnosis: 'निदान (डायग्नोसिस)',
    filter_note: 'डॉक्टर नोट्स',

    // Documents Screen
    docs_title: 'मेडिकल दस्तावेज़ तिजोरी',
    upload_doc: 'दस्तावेज़ अपलोड करें',
    scan_doc: 'पर्ची स्कैन करें',
    sample_docs: 'नमूना पर्चियां लोड करें',
    category_all: 'सभी',
    category_prescription: 'दवा पर्ची',
    category_lab: 'लैब रिपोर्ट',
    category_discharge: 'डिस्चार्ज सारांश',

    // Trends Screen
    trends_title: 'बायोमार्कर्स ट्रेंड ग्राफ',
    trends_sub: 'समय के साथ ब्लड टेस्ट परिणामों का बदलाव',
    hba1c: 'HbA1c (ग्लाइकेटेड हीमोग्लोबिन)',
    fasting_glucose: 'फास्टिंग ब्लड शुगर (खाली पेट)',
    postprandial: 'खाने के बाद की शुगर',
    creatinine: 'सीरम क्रिएटिनिन',
    blood_pressure: 'रक्तचाप (ब्लड प्रेशर)',
    abnormal: 'सावधानी ज़रूरी',
    normal: 'लक्ष्य सीमा में',

    // Profile & Sharing Screen
    profile_title: 'मरीज़ प्रोफ़ाइल व शेयरिंग',
    demographics: 'मरीज़ विवरण',
    age_gender: '54 वर्ष • पुरुष • ब्लड ग्रुप B+ve',
    chronic_conditions: 'दीर्घकालिक बीमारियां',
    doctor_sharing_title: 'सुरक्षित डॉक्टर एक्सेस पोर्टल',
    doctor_sharing_sub: 'अपने डॉक्टर के लिए सीमित समय का सुरक्षित QR लिंक बनाएं',
    create_token_btn: 'नया डॉक्टर लिंक बनाएं',
    active_tokens: 'सक्रिय डॉक्टर एक्सेस लिंक्स',
    revoke_access: 'पहुंच तुरंत रद्द करें',
    doctor_access_revoked: 'डॉक्टर की पहुंच तुरंत समाप्त कर दी गई (HTTP 410)',
    logout: 'स्वास्थ्य तिजोरी से लॉग आउट करें',
    action_share_sub: 'डॉक्टर एक्सेस',

    // 1-Click Send to Doctor
    send_to_doctor_1click: '⚡ 1-क्लिक में डॉक्टर को भेजें',
    upload_and_send_1click: '⚡ 1-क्लिक में अपलोड करें और डॉक्टर को भेजें',
    prescription_sent_title: 'पर्ची डॉक्टर को भेज दी गई!',
    prescription_sent_subtitle: 'मरीज़ के नियंत्रण में 48 घंटे का सुरक्षित क्लिनिकल लिंक तैयार',
    whatsapp_share: 'व्हाट्सएप पर डॉक्टर को लिंक भेजें',
    share_via_apps: 'अन्य ऐप्स / SMS से लिंक शेयर करें',
    copy_link: 'पर्ची का लिंक कॉपी करें',
    link_copied: 'पर्ची का लिंक कॉपी हो गया!',
    doctor_only_notice: 'डॉक्टर पोर्टल लिंक (केवल डॉक्टर के लिए)',
    doctor_only_desc: 'यह लिंक केवल आपके डॉक्टर के परामर्श के लिए है। मरीज़ सीधे डॉक्टर पोर्टल नहीं खोल सकते।'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('sehat_language');
      if (saved === 'hi' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch (e) {
      console.warn('Error reading language from storage:', e);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('sehat_language', lang);
    } catch (e) {
      console.warn('Error saving language:', e);
    }
  };

  const toggleLanguage = async () => {
    const nextLang: Language = language === 'en' ? 'hi' : 'en';
    await setLanguage(nextLang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
