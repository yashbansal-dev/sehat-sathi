import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  Send, 
  AlertTriangle, 
  RotateCcw, 
  FileText,
  HeartPulse,
  Pill,
  TrendingUp,
  UserCheck,
  Stethoscope,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

interface QAPair {
  question: string;
  questionLang: 'hi' | 'en';
  answer: string;
  audioText: string;
  sourceDoc: string;
  category: 'medication' | 'lab' | 'allergy' | 'doctor' | 'general';
}

const SAMPLE_QUERIES = [
  {
    queryHi: 'मेरी डायबिटीज की दवाई कब लेनी है?',
    queryEn: 'When should I take my diabetes medicine?',
    category: 'medication' as const,
    icon: '💊'
  },
  {
    queryHi: 'क्या मेरा कोलेस्ट्रॉल सुधरा है?',
    queryEn: 'Did my cholesterol improve?',
    category: 'lab' as const,
    icon: '🧪'
  },
  {
    queryHi: 'मुझे कौन सी दवाइयों से एलर्जी है?',
    queryEn: 'What medicines am I allergic to?',
    category: 'allergy' as const,
    icon: '⚠️'
  },
  {
    queryHi: 'बीपी की दवाई का समय क्या है?',
    queryEn: 'When should I take my BP medicine?',
    category: 'medication' as const,
    icon: '🩺'
  },
  {
    queryHi: 'मेरा पिछला HbA1c टेस्ट क्या था?',
    queryEn: 'What was my latest HbA1c test result?',
    category: 'lab' as const,
    icon: '📈'
  },
  {
    queryHi: 'मेरे डॉक्टर कौन हैं और अगला चेकअप कब है?',
    queryEn: 'Who is my doctor and when was my last visit?',
    category: 'doctor' as const,
    icon: '👨‍⚕️'
  }
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ 
  isOpen, 
  onClose,
  initialQuestion 
}) => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState<'hi' | 'en'>(language === 'hi' ? 'hi' : 'en');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<QAPair[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptRef = useRef<string>('');
  const lastProcessedRef = useRef<string>('');

  // Keep transcriptRef synchronized
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Pre-load and cache SpeechSynthesis voices (fixes Chromium async voices issue)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      handleVoices();
      window.speechSynthesis.onvoiceschanged = handleVoices;
    }
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      stopSpeaking();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setRecognitionError(
        'Speech-to-text recognition is supported best in Chrome & Edge browsers. You can type any question below or click any suggested prompt to hear the voice response.'
      );
      return;
    }

    setSpeechSupported(true);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript;
          } else {
            interimText += res[0].transcript;
          }
        }

        const combined = (finalText || interimText).trim();
        if (combined) {
          setTranscript(combined);
          transcriptRef.current = combined;
        }

        if (finalText.trim()) {
          lastProcessedRef.current = finalText.trim();
          handleProcessQuery(finalText.trim(), selectedLang);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const err = event.error || '';
        if (err === 'not-allowed' || err === 'permission-denied') {
          setRecognitionError('Microphone access was denied. Please allow microphone permissions in your browser or type your query below.');
        } else if (err === 'no-speech') {
          setRecognitionError('No speech was detected. Please click the mic and speak clearly.');
        } else if (err === 'network') {
          setRecognitionError('Speech service network error. You can type your question in the text box below or tap any suggested question.');
        } else if (err === 'audio-capture') {
          setRecognitionError('No microphone was detected on this device. You can type your question or use the sample buttons.');
        } else if (err !== 'aborted') {
          setRecognitionError(`Speech recognition notice: ${err}. You can type your question below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Process speech if finalized text was not captured in onresult
        const pending = transcriptRef.current.trim();
        if (pending && pending !== lastProcessedRef.current) {
          lastProcessedRef.current = pending;
          handleProcessQuery(pending, selectedLang);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition initialization notice:', e);
      setSpeechSupported(false);
    }

    if (initialQuestion && chatHistory.length === 0) {
      handleProcessQuery(initialQuestion, selectedLang);
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [isOpen, selectedLang]);

  const startListening = () => {
    stopSpeaking();
    setRecognitionError(null);
    setTranscript('');
    transcriptRef.current = '';

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError('Web Speech recognition is not supported in this browser. You can type your question below or click any prompt.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLang === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        // If already active or restarting
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch {}
          }, 250);
        } catch {
          setIsListening(false);
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
  };

  const speakText = (text: string, lang: 'hi' | 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    stopSpeaking();

    // Clear queue & resume in case synthesis was paused
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = lang === 'hi' ? 0.95 : 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      // Prioritize matching language voice
      const targetLang = lang === 'hi' ? 'hi' : 'en';
      const match = voices.find(v => v.lang.toLowerCase().startsWith(targetLang)) ||
                    voices.find(v => v.lang.toLowerCase().includes('in')) ||
                    voices[0];
      if (match) {
        utterance.voice = match;
      }
    }

    // Keep reference in ref to prevent Chrome garbage-collection speech cutoff bug
    activeUtteranceRef.current = utterance;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    };
    utterance.onerror = (e) => {
      console.warn('Speech synthesis playback notice:', e);
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  // Comprehensive Clinical Q&A Engine for patient health history
  const handleProcessQuery = (queryText: string, lang: 'hi' | 'en') => {
    const q = queryText.trim();
    if (!q) return;

    setIsThinking(true);
    stopListening();

    const lower = q.toLowerCase();

    let answer = '';
    let audioText = '';
    let sourceDoc = 'Verified Medical Records (Rajesh Sharma, 54M)';
    let category: QAPair['category'] = 'general';

    // 1. Diabetes / Sugar / Metformin / Glimepiride
    if (
      lower.includes('diabetes') || 
      lower.includes('sugar') || 
      lower.includes('शुगर') || 
      lower.includes('डायबिटीज') || 
      lower.includes('metformin') || 
      lower.includes('glimepiride') || 
      lower.includes('इंसुलिन') || 
      lower.includes('insulin')
    ) {
      category = 'medication';
      sourceDoc = 'Prescription: Dr. Arvind Mehta (Cardiology & Internal Medicine, Max Healthcare)';
      if (lang === 'hi' || lower.includes('kab') || lower.includes('leni') || lower.includes('kaise')) {
        answer = `आपकी डायबिटीज की दवाई का सटीक शेड्यूल:\n• मेटफ़ॉर्मिन 500mg: दिन में 2 बार (सुबह नाश्ते के बाद और रात को खाने के बाद)।\n• ग्लिमेपिराइड 1mg: सुबह 1 बार नाश्ते से 15 मिनट पहले।\n\nसमीक्षा: आपका HbA1c 8.2% से घटकर 7.4% हो गया है। दवाइयों का समय नियमित रखें।`;
        audioText = `आपकी डायबिटीज की मुख्य दवाई मेटफ़ॉर्मिन 500 मिलीग्राम सुबह और रात को खाने के बाद लेनी है, और ग्लिमेपिराइड 1 मिलीग्राम सुबह नाश्ते से 15 मिनट पहले। आपका शुगर लेवल पहले से बेहतर हुआ है।`;
      } else {
        answer = `Diabetes Management Regimen:\n• Metformin 500mg: Twice daily with/after meals (Morning & Night).\n• Glimepiride 1mg: Once daily 15 minutes before breakfast.\n\nClinical Trend: Your HbA1c has improved from 8.2% down to 7.4%. Continue this schedule.`;
        audioText = `You should take Metformin 500 milligrams twice daily with meals in the morning and evening, and Glimepiride 1 milligram before breakfast. Your HbA1c has improved to 7.4%.`;
      }
    }
    // 2. Cholesterol / Atorvastatin / Lipids / Triglycerides
    else if (
      lower.includes('cholesterol') || 
      lower.includes('कोलेस्ट्रॉल') || 
      lower.includes('atorvastatin') || 
      lower.includes('lipid') || 
      lower.includes('लिपिड') || 
      lower.includes('triglyceride')
    ) {
      category = 'lab';
      sourceDoc = 'Thyrocare Blood Lipid Profile & Statin Therapy Record (Oct 2026)';
      if (lang === 'hi' || lower.includes('sudhra') || lower.includes('kaisa')) {
        answer = `हाँ, आपका कोलेस्ट्रॉल काफी सुधरा है! 🎉\n• टोटल कोलेस्ट्रॉल: 210 mg/dL से घटकर 175 mg/dL हो गया है (सामान्य सीमा < 200)।\n• ट्राइग्लिसराइड्स: 160 mg/dL (नियंत्रित)।\n• दवाई: एटोरवास्टेटिन 20mg रोज़ाना रात को सोते समय 1 गोली लें।`;
        audioText = `हाँ, आपका कोलेस्ट्रॉल काफी सुधरा है। आपका कोलेस्ट्रॉल 210 से घटकर 175 हो गया है, जो सामान्य सीमा में है। अपनी एटोरवास्टेटिन 20 मिलीग्राम की गोली रात को लेते रहें।`;
      } else {
        answer = `Yes, your cholesterol has noticeably improved! 🎉\n• Total Cholesterol dropped from 210 mg/dL down to 175 mg/dL (Normal reference range < 200).\n• Triglycerides: 160 mg/dL (Controlled).\n• Regimen: Atorvastatin 20mg once daily at bedtime.`;
        audioText = `Yes, your cholesterol improved noticeably. It dropped from 210 down to 175 milligrams per decilitre, which is normal. Continue taking Atorvastatin 20 milligrams at bedtime.`;
      }
    }
    // 3. Allergies / Penicillin / Ampicillin / Red Flags
    else if (
      lower.includes('allergy') || 
      lower.includes('एलर्जी') || 
      lower.includes('penicillin') || 
      lower.includes('पेनिसिलिन') || 
      lower.includes('ampicillin') || 
      lower.includes('reaction')
    ) {
      category = 'allergy';
      sourceDoc = 'Hospital Discharge Summary — Critical Alerts Section';
      if (lang === 'hi') {
        answer = `⚠️ अति महत्वपूर्ण चेतावनी:\n• पेनिसिलिन (Penicillin) और एम्पीसिलीन (Ampicillin) से आपको गंभीर एनाफिलेक्सिस एलर्जी है!\n• किसी भी डॉक्टर या अस्पताल में जाने पर तुरंत बताएं कि आपको पेनिसिलिन या बीटा-लैक्टम एंटीबायोटिक बिल्कुल न दें।\n• सल्फा (Sulfa) दवाइयों से हल्की त्वचा की खुजली/चकत्ते होते हैं।`;
        audioText = `सावधान! आपको पेनिसिलिन और एम्पीसिलीन से गंभीर एलर्जी है। किसी भी डॉक्टर को यह ज़रूर बताएं ताकि वे आपको बीटा-लैक्टम एंटीबायोटिक्स न दें।`;
      } else {
        answer = `⚠️ CRITICAL ALLERGY ALERT:\n• Severe Anaphylactic Allergy to Penicillin and Ampicillin recorded in EHR.\n• Strict Contraindication: Do NOT receive beta-lactam antibiotics.\n• Note: Mild sensitivity to Sulfa medications (rashes). Always display your Red Flag card to clinicians.`;
        audioText = `Critical Alert! You have a documented severe allergy to Penicillin and Ampicillin. Never take penicillin class antibiotics and always notify your treating doctor.`;
      }
    }
    // 4. Blood Pressure / Telmisartan / BP / Hypertension
    else if (
      lower.includes('bp') || 
      lower.includes('blood pressure') || 
      lower.includes('बीपी') || 
      lower.includes('telmisartan') || 
      lower.includes('hypertension') || 
      lower.includes('दबाव')
    ) {
      category = 'medication';
      sourceDoc = 'Hypertension Clinic Evaluation — Dr. Arvind Mehta';
      if (lang === 'hi') {
        answer = `ब्लड प्रेशर की दवाई और स्थिति:\n• टेल्मिसार्टन 40mg: रोज़ाना सुबह नाश्ते के बाद 1 गोली पानी के साथ लें।\n• हालिया बीपी रीडिंग: 128/82 mmHg (नियंत्रित और सुरक्षित सीमा में है)।\n• नमक का सेवन सीमित रखें।`;
        audioText = `आपकी बीपी की दवाई टेल्मिसार्टन 40 मिलीग्राम है। इसे रोज़ाना सुबह नाश्ते के बाद लें। आपका ब्लड प्रेशर 128 बटा 82 है, जो नियंत्रित है।`;
      } else {
        answer = `Blood Pressure Regimen & Vitals:\n• Telmisartan 40mg: Take 1 tablet every morning with water after breakfast.\n• Recent BP Reading: 128/82 mmHg (Well controlled within target range).\n• Maintain low-sodium dietary precautions.`;
        audioText = `Take your Telmisartan 40 milligrams once daily every morning with water. Your latest blood pressure is 128 over 82, which is well controlled.`;
      }
    }
    // 5. HbA1c / Tests / Reports / Creatinine / Lab Results
    else if (
      lower.includes('hba1c') || 
      lower.includes('test') || 
      lower.includes('रिपोर्ट') || 
      lower.includes('report') || 
      lower.includes('creatinine') || 
      lower.includes('kidney') || 
      lower.includes('लैब')
    ) {
      category = 'lab';
      sourceDoc = 'Thyrocare & Max Lab Diagnostics Panel (Oct 2026)';
      if (lang === 'hi') {
        answer = `हालिया लैब टेस्ट परिणाम:\n• HbA1c: 7.4% (पहले 8.2% था, अच्छा सुधार हुआ है)\n• फास्टिंग ग्लूकोज: 124 mg/dL\n• सीरम क्रिएटिनिन: 0.9 mg/dL (किडनी कार्यप्रणाली पूरी तरह सामान्य)\n• हीमोग्लोबिन: 13.8 g/dL\n• लिपिड प्रोफाइल: सामान्य सीमा में।`;
        audioText = `आपका हालिया एचबीए वन सी टेस्ट 7.4 प्रतिशत है, जो पिछले 8.2 प्रतिशत से सुधरा है। आपकी किडनी रिपोर्ट और क्रिएटिनिन 0.9 बिल्कुल सामान्य है।`;
      } else {
        answer = `Latest Comprehensive Lab Results:\n• HbA1c: 7.4% (Significant improvement from baseline 8.2%)\n• Fasting Glucose: 124 mg/dL\n• Serum Creatinine: 0.9 mg/dL (Completely normal renal function)\n• Hemoglobin: 13.8 g/dL (Normal)\n• Lipid Profile: Total cholesterol is 175 mg/dL.`;
        audioText = `Your latest HbA1c is 7.4 percent, down from 8.2 percent. Your fasting sugar is 124, and your kidney markers are completely normal.`;
      }
    }
    // 6. Doctor / Hospital / Clinic / Appointment / Max Healthcare
    else if (
      lower.includes('doctor') || 
      lower.includes('डॉक्टर') || 
      lower.includes('hospital') || 
      lower.includes('mehta') || 
      lower.includes('clinic') || 
      lower.includes('अस्पताल') || 
      lower.includes('checkup')
    ) {
      category = 'doctor';
      sourceDoc = 'Apex Clinic & Max Super Speciality Hospital Outpatient Record';
      if (lang === 'hi') {
        answer = `आपके डॉक्टरों और क्लीनिक का विवरण:\n• मुख्य कार्डियोलॉजिस्ट: डॉ. अरविंद मेहता (Max Healthcare Saket)\n• हालिया विज़िट: 12 अक्टूबर 2026 (नियमित कार्डियोलॉजी व शुगर समीक्षा)\n• आपातकालीन अस्पताल: Max Super Speciality Hospital, New Delhi\n• आपातकालीन संपर्क: पूजा शर्मा (पत्नी) - +91 98765 43210`;
        audioText = `आपके मुख्य डॉक्टर डॉ. अरविंद मेहता हैं, जो मैक्स हेल्थकेयर में कार्डियोलॉजिस्ट हैं। आपकी पिछली विज़िट 12 अक्टूबर को हुई थी।`;
      } else {
        answer = `Treating Clinician & Hospital Details:\n• Primary Cardiologist: Dr. Arvind Mehta (Max Healthcare Saket)\n• Most Recent Consultation: October 12, 2026 (Cardiology OPD review)\n• Primary Facility: Max Super Speciality Hospital, New Delhi\n• Emergency Contact: Pooja Sharma (Spouse) — +91 98765 43210`;
        audioText = `Your primary doctor is Dr. Arvind Mehta at Max Healthcare Saket. Your last consultation was on October 12th for diabetes and heart health review.`;
      }
    }
    // 7. Diet / Food / Sweets / Lifestyle / Restrictions
    else if (
      lower.includes('diet') || 
      lower.includes('खाना') || 
      lower.includes('sweet') || 
      lower.includes('मीठा') || 
      lower.includes('namak') || 
      lower.includes('salt') || 
      lower.includes('परहेज')
    ) {
      category = 'general';
      sourceDoc = 'Clinical Dietary Guidelines for Diabetic & Hypertensive Care';
      if (lang === 'hi') {
        answer = `आपके लिए खान-पान के मुख्य निर्देश:\n• चीनी व मीठी चीज़ों से परहेज़ रखें ताकि HbA1c 7% के नीचे आ सके।\n• नमक का सेवन सीमित (दिन में 5 ग्राम से कम) रखें जिससे बीपी नियंत्रित रहे।\n• भोजन में हरी सब्जियां, सलाद और फाइबर युक्त दालें शामिल करें।\n• रोज़ाना 30 मिनट हल्की वॉक करें।`;
        audioText = `डायबिटीज और बीपी के लिए चीनी और तली हुई चीज़ों से परहेज़ रखें। नमक कम खाएं और हरी सब्जियां व फाइबर ज्यादा लें। रोज़ाना 30 मिनट की वॉक बहुत फायदेमंद है।`;
      } else {
        answer = `Dietary & Lifestyle Recommendations:\n• Avoid refined sugars and sweets to maintain your HbA1c trajectory towards < 7.0%.\n• Restrict dietary sodium (< 5g salt/day) for optimal hypertension management.\n• Increase dietary soluble fiber, vegetables, and whole grains.\n• Maintain 30 minutes of daily moderate walking.`;
        audioText = `Avoid refined sweets and excess salt to keep your blood sugar and BP well controlled. Include plenty of green vegetables, fiber, and walk 30 minutes daily.`;
      }
    }
    // 8. General Health Summary & All Medications
    else {
      category = 'general';
      sourceDoc = 'Unified Electronic Health Record (Rajesh Sharma, 54M — ABHA: 91-8472-1049-3820)';
      if (lang === 'hi') {
        answer = `आपके स्वास्थ्य रिकॉर्ड का संपूर्ण सारांश:\n• सक्रिय दवाइयां (4):\n  1. मेटफ़ॉर्मिन 500mg (नाश्ते व रात के खाने के बाद)\n  2. ग्लिमेपिराइड 1mg (सुबह नाश्ते से पहले)\n  3. टेल्मिसार्टन 40mg (सुबह नाश्ते के बाद)\n  4. एटोरवास्टेटिन 20mg (रात को सोते समय)\n• गंभीर एलर्जी: पेनिसिलिन और एम्पीसिलीन (कड़ा परहेज़ रखें)\n• हालिया ट्रेंड: डायबिटीज और कोलेस्ट्रॉल दोनों में सकारात्मक सुधार है।`;
        audioText = `आपके रिकॉर्ड के अनुसार आपकी मुख्य दवाइयां मेटफ़ॉर्मिन, ग्लिमेपिराइड, टेल्मिसार्टन और एटोरवास्टेटिन हैं। ध्यान रखें कि आपको पेनिसिलिन से गंभीर एलर्जी है। आपका कोलेस्ट्रॉल और शुगर पहले से सुधरे हैं।`;
      } else {
        answer = `Unified Clinical Record Summary:\n• Active Daily Regimen (4 Medications):\n  1. Metformin 500mg (Twice daily with meals)\n  2. Glimepiride 1mg (Morning before breakfast)\n  3. Telmisartan 40mg (Morning with water)\n  4. Atorvastatin 20mg (Bedtime daily)\n• Critical Safety Alert: Severe Penicillin anaphylaxis.\n• Clinical Trajectory: Both HbA1c (7.4%) and Total Cholesterol (175 mg/dL) show sustained improvement.`;
        audioText = `Based on your unified health record, your daily medicines are Metformin, Glimepiride, Telmisartan, and Atorvastatin. Remember that you have a severe Penicillin allergy. Your sugar and cholesterol both show good progress.`;
      }
    }

    setTimeout(() => {
      const newQA: QAPair = {
        question: q,
        questionLang: lang,
        answer,
        audioText,
        sourceDoc,
        category
      };

      setChatHistory(prev => [...prev, newQA]);
      setIsThinking(false);
      setTranscript('');
      transcriptRef.current = '';

      speakText(audioText, lang);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base tracking-tight text-slate-900">
                  {selectedLang === 'hi' ? 'सेहत साथी बोलिए (Voice Assistant)' : 'Bilingual Voice Health Assistant'}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {selectedLang === 'hi' 
                  ? 'अपनी भाषा में बोलें और अपनी दवाइयों व रिपोर्ट्स की जानकारी पाएं' 
                  : 'Speak or type in Hindi/English to query your verified clinical records'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setSelectedLang('hi');
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  selectedLang === 'hi'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setSelectedLang('en');
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  selectedLang === 'en'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          
          {/* Welcome Card if no queries yet */}
          {chatHistory.length === 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-teal-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>{selectedLang === 'hi' ? 'आप क्या पूछना चाहते हैं?' : 'What would you like to know?'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedLang === 'hi'
                  ? 'नीचे दिए गए माइक्रोफ़ोन बटन पर टैप करके बोलें, टाइप करें, या इन आम सवालों में से किसी एक पर क्लिक करें:'
                  : 'Tap the microphone button below to speak, type your question, or tap any of these suggested clinical questions:'}
              </p>

              {/* Sample Question Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {SAMPLE_QUERIES.map((sample, idx) => {
                  const queryText = selectedLang === 'hi' ? sample.queryHi : sample.queryEn;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleProcessQuery(queryText, selectedLang)}
                      className="text-left text-xs bg-slate-50 hover:bg-teal-50 hover:text-teal-950 hover:border-teal-300 text-slate-800 font-medium px-3 py-2 rounded-xl border border-slate-200 transition cursor-pointer flex items-center space-x-2 shadow-2xs"
                    >
                      <span className="shrink-0">{sample.icon}</span>
                      <span className="truncate">{queryText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {chatHistory.map((qa, index) => (
            <div key={index} className="space-y-3">
              
              {/* User Question */}
              <div className="flex justify-end">
                <div className="bg-teal-800 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[85%] text-xs font-semibold shadow-xs flex items-center space-x-2">
                  <Mic className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span>{qa.question}</span>
                </div>
              </div>

              {/* Assistant Answer Card */}
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-xs p-4 max-w-[95%] border border-slate-200/90 shadow-sm space-y-2.5 text-xs text-slate-800">
                  
                  {/* Category Badge & Audio Replay */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-1.5">
                      {qa.category === 'medication' && <Pill className="w-3.5 h-3.5 text-teal-600" />}
                      {qa.category === 'lab' && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                      {qa.category === 'allergy' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                      {qa.category === 'doctor' && <Stethoscope className="w-3.5 h-3.5 text-blue-600" />}
                      {qa.category === 'general' && <HeartPulse className="w-3.5 h-3.5 text-sky-600" />}
                      <span className="font-bold text-slate-900 capitalize">
                        {qa.category === 'medication' ? 'दवाई निर्देश (Medication Schedule)' : 
                         qa.category === 'lab' ? 'लैब टेस्ट परिणाम (Lab Trends)' : 
                         qa.category === 'allergy' ? 'महत्वपूर्ण एलर्जी अलर्ट (Critical Allergy)' : 
                         qa.category === 'doctor' ? 'डॉक्टर व अस्पताल विवरण (Care Team)' : 'स्वास्थ्य सारांश'}
                      </span>
                    </div>

                    {/* Audio Replay Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else {
                          speakText(qa.audioText, qa.questionLang);
                        }
                      }}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200 transition cursor-pointer"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3 h-3 text-rose-600 animate-pulse" />
                          <span>रोकें / Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-teal-700" />
                          <span>फिर से सुनें / Replay</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Body Text */}
                  <div className="whitespace-pre-line leading-relaxed font-medium text-slate-700 text-xs">
                    {qa.answer}
                  </div>

                  {/* Clinical Provenance */}
                  <div className="pt-1 flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium">
                    <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">स्रोत: {qa.sourceDoc}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-xs flex items-center space-x-2 text-xs text-slate-500 font-semibold">
                <div className="animate-spin w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full"></div>
                <span>{selectedLang === 'hi' ? 'स्वास्थ्य रिकॉर्ड्स की जांच कर रहे हैं...' : 'Checking verified medical records...'}</span>
              </div>
            </div>
          )}

          {/* Recognition Error Alert */}
          {recognitionError && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{recognitionError}</p>
                <p className="text-[11px] text-amber-700 mt-1">
                  💡 Tip: You can type your question in the text box below and hit Enter, or click any sample question to test full audio playback.
                </p>
              </div>
            </div>
          )}

          <div ref={bottomRef}></div>
        </div>

        {/* Interactive Speech Input Dock */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-3">
          
          {/* Active Listening Banner */}
          {isListening && (
            <div className="flex items-center justify-between p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-bold animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span>
                  {selectedLang === 'hi' ? 'सुन रहे हैं... बोलिए (उदा. "मेरी दवाई कब लेनी है?")' : 'Listening... Speak now (e.g. "Did my cholesterol improve?")'}
                </span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="text-[11px] underline text-rose-800 hover:text-rose-950 cursor-pointer"
              >
                बंद करें / Done
              </button>
            </div>
          )}

          {/* Active Speaking Banner */}
          {isSpeaking && (
            <div className="flex items-center justify-between p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>{selectedLang === 'hi' ? 'उत्तर बोलकर सुनाया जा रहा है...' : 'Speaking answer aloud...'}</span>
              </div>
              <button
                type="button"
                onClick={stopSpeaking}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                रोकें / Mute
              </button>
            </div>
          )}

          {/* Controls: Microphone + Text Query */}
          <div className="flex items-center space-x-2">
            
            {/* Main Microphone Button */}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-3.5 rounded-2xl flex items-center justify-center transition shadow-md cursor-pointer ${
                isListening 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white scale-105 shadow-rose-200 animate-pulse'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice recognition'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Live Text Field / Manual Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && transcript.trim()) {
                    handleProcessQuery(transcript, selectedLang);
                  }
                }}
                placeholder={
                  selectedLang === 'hi'
                    ? 'माइक दबाकर बोलें या यहाँ टाइप करें...'
                    : 'Speak with microphone or type here...'
                }
                className="w-full pl-3.5 pr-10 py-3 rounded-2xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs font-medium text-slate-800 outline-none"
              />
              {transcript.trim() && (
                <button
                  type="button"
                  onClick={() => handleProcessQuery(transcript, selectedLang)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-teal-600 hover:text-teal-800 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Clear History */}
            {chatHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setChatHistory([]);
                  setTranscript('');
                }}
                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition cursor-pointer"
                title="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

          </div>

          {/* Quick Guidance Subtitle */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
            <span>
              {selectedLang === 'hi' 
                ? '💡 आप हिंदी, अंग्रेजी या हिंग्लिश में भी पूछ सकते हैं' 
                : '💡 You can speak or type in English, Hindi, or Hinglish'}
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Info className="w-3 h-3" />
              <span>SpeechRecognition + TTS Audio</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
