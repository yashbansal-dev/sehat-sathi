import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_documents: 'Documents',
    nav_timeline: 'Timeline',
    nav_brief: 'Doctor Brief',
    nav_review: 'Review',
    nav_share: 'Share',
    nav_guide: 'How It Works',
    portal_patient: 'Patient Portal',
    portal_doctor: 'Doctor Portal',
    switch_to_doctor: 'Switch to Doctor Portal',
    switch_to_patient: 'Switch to Patient Portal',
    sign_in: 'Sign In',
    logout: 'Log Out',

    // Dashboard
    greeting_prefix: 'Namaste',
    patient_vault_active: 'Patient Health Vault Active',
    simple_view: 'Simple Patient View',
    clinical_view: 'Detailed Clinical View',
    quick_actions: 'Quick Actions',
    action_upload: 'Upload Prescription / Report',
    action_upload_sub: 'Take a photo or choose a PDF',
    action_medicines: 'My Medicines',
    action_medicines_sub: 'See what pills to take today',
    action_brief: 'Show 2-Min Doctor Brief',
    action_brief_sub: 'Give to doctor in consultation',
    action_share: 'Share Records with Doctor',
    action_share_sub: 'Create secure link or QR code',

    // Medicine Schedule
    today_medicines: "Today's Medicine Schedule",
    today_medicines_sub: 'Always take prescribed medicines on time with water',
    morning: 'Morning (After Breakfast)',
    afternoon: 'Afternoon (After Lunch)',
    night: 'Night (After Dinner)',
    take_with_food: 'Take after meals',

    // Health Vitals
    health_vitals_title: 'My Health at a Glance',
    blood_sugar: 'Blood Sugar (HbA1c & Fasting)',
    blood_sugar_status: '142 mg/dL • Slightly high (Take Metformin)',
    blood_pressure: 'Blood Pressure',
    blood_pressure_status: '134/84 mmHg • Well controlled',
    cholesterol: 'Cholesterol',
    cholesterol_status: '218 mg/dL • Borderline (Take Atorvastatin)',
    allergy_warning: 'Drug Allergy Alert',
    allergy_warning_text: 'Allergic to Penicillin! Inform every doctor before any injection or antibiotics.',

    // Doctor Visit
    visiting_doctor_title: 'Visiting a doctor today?',
    visiting_doctor_desc: 'Save time in the clinic. Doctors can read your complete medical history, medicines, and allergies in under 2 minutes.',
    show_brief_btn: 'Open Doctor Summary',
    print_brief_btn: 'Print 1-Page Summary'
  },
  hi: {
    // Navigation
    nav_home: 'होम',
    nav_documents: 'पर्चियां व रिपोर्ट',
    nav_timeline: 'इतिहास',
    nav_brief: 'डॉक्टर सारांश',
    nav_review: 'समीक्षा',
    nav_share: 'शेयर',
    nav_guide: 'यह क्या है?',
    portal_patient: 'मरीज़ पोर्टल',
    portal_doctor: 'डॉक्टर पोर्टल',
    switch_to_doctor: 'डॉक्टर पोर्टल पर जाएं',
    switch_to_patient: 'मरीज़ पोर्टल पर जाएं',
    sign_in: 'लॉग इन',
    logout: 'लॉग आउट',

    // Dashboard
    greeting_prefix: 'नमस्ते',
    patient_vault_active: 'आपकी स्वास्थ्य तिजोरी सक्रिय है',
    simple_view: 'सरल मरीज़ दृश्य (आसान)',
    clinical_view: 'विस्तृत मेडिकल दृश्य',
    quick_actions: 'मुख्य कार्य',
    action_upload: 'पर्ची या रिपोर्ट अपलोड करें',
    action_upload_sub: 'फोटो खींचे या PDF चुनें',
    action_medicines: 'मेरी रोज़ की दवाइयां',
    action_medicines_sub: 'आज कौन सी दवा कब लेनी है',
    action_brief: '2-मिनट डॉक्टर सारांश दिखाएं',
    action_brief_sub: 'क्लीनिक में डॉक्टर को दिखाने हेतु',
    action_share: 'डॉक्टर को शेयर करें',
    action_share_sub: 'सुरक्षित लिंक या QR कोड बनाएं',

    // Medicine Schedule
    today_medicines: 'आज की दवाइयां और समय सारणी',
    today_medicines_sub: 'अपनी दवाइयां समय पर पानी के साथ अवश्य लें',
    morning: 'सुबह (नाश्ते के बाद)',
    afternoon: 'दोपहर (भोजन के बाद)',
    night: 'रात (रात के खाने के बाद)',
    take_with_food: 'भोजन के बाद लें',

    // Health Vitals
    health_vitals_title: 'मेरी सेहत की वर्तमान स्थिति',
    blood_sugar: 'ब्लड शुगर (मधुमेह)',
    blood_sugar_status: '142 mg/dL • थोड़ा अधिक (मेटफॉर्मिन जारी रखें)',
    blood_pressure: 'रक्तचाप (Blood Pressure)',
    blood_pressure_status: '134/84 mmHg • सामान्य और नियंत्रित',
    cholesterol: 'कोलेस्ट्रॉल (वसा)',
    cholesterol_status: '218 mg/dL • थोड़ा बढ़ा हुआ (एटोरवास्टेटिन लें)',
    allergy_warning: 'दवा एलर्जी चेतावनी',
    allergy_warning_text: 'पेनिसिलिन (Penicillin) से एलर्जी है! डॉक्टर को किसी भी इंजेक्शन या एंटीबायोटिक से पहले बताएं।',

    // Doctor Visit
    visiting_doctor_title: 'क्या आज डॉक्टर के पास जा रहे हैं?',
    visiting_doctor_desc: 'क्लीनिक में समय बचाएं। डॉक्टर 2 मिनट में आपकी पूरी बीमारी, दवाइयां और टेस्ट रिपोर्ट समझ सकते हैं।',
    show_brief_btn: 'डॉक्टर सारांश खोलें',
    print_brief_btn: '1-पेज पर्ची प्रिंट करें'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('sehat_language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sehat_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
