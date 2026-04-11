import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const UIContext = createContext()

const translations = {
  en: {
    appName: 'ExamGuard',
    dashboard: 'Dashboard',
    exams: 'Exams',
    results: 'Results',
    grievances: 'Grievances',
    createExam: 'Create Exam',
    evaluateExam: 'Evaluate Exam',
    users: 'Users',
    settings: 'Settings',
    logout: 'Logout',
    student: 'Student',
    faculty: 'Faculty',
    admin: 'Admin',
    welcomeBack: 'Welcome Back',
    examSystem: 'ExamGuard',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    noAccount: "Don't have an account?",
    registerHere: 'Register here',
    demoCredentials: 'Demo Credentials:',
    createAccount: 'Create Account',
    joinSystem: 'Join ExamGuard',
    fullName: 'Full Name',
    confirmPassword: 'Confirm Password',
    role: 'Role',
    studentId: 'Student ID',
    department: 'Department',
    semester: 'Semester',
    selectSemester: 'Select Semester',
    phone: 'Phone',
    creatingAccount: 'Creating Account...',
    register: 'Register',
    haveAccount: 'Already have an account?',
    loginHere: 'Login here',
    lightMode: 'Light',
    darkMode: 'Dark',
    language: 'Language',
    passwordMismatch: 'Passwords do not match!',
    passwordMinLength: 'Password must be at least 6 characters!',
  },
  mr: {
    appName: 'एक्झामगार्ड',
    dashboard: 'डॅशबोर्ड',
    exams: 'परीक्षा',
    results: 'निकाल',
    grievances: 'तक्रारी',
    createExam: 'परीक्षा तयार करा',
    evaluateExam: 'परीक्षेचे मूल्यमापन',
    users: 'वापरकर्ते',
    settings: 'सेटिंग्ज',
    logout: 'लॉगआउट',
    student: 'विद्यार्थी',
    faculty: 'प्राध्यापक',
    admin: 'प्रशासक',
    welcomeBack: 'पुन्हा स्वागत आहे',
    examSystem: 'एक्झामगार्ड',
    email: 'ईमेल',
    password: 'पासवर्ड',
    login: 'लॉगिन',
    loggingIn: 'लॉगिन होत आहे...',
    noAccount: 'खाते नाही?',
    registerHere: 'येथे नोंदणी करा',
    demoCredentials: 'डेमो क्रेडेन्शियल्स:',
    createAccount: 'खाते तयार करा',
    joinSystem: 'एक्झामगार्डमध्ये सामील व्हा',
    fullName: 'पूर्ण नाव',
    confirmPassword: 'पासवर्डची पुष्टी करा',
    role: 'भूमिका',
    studentId: 'विद्यार्थी आयडी',
    department: 'विभाग',
    semester: 'सत्र',
    selectSemester: 'सत्र निवडा',
    phone: 'फोन',
    creatingAccount: 'खाते तयार होत आहे...',
    register: 'नोंदणी',
    haveAccount: 'आधीच खाते आहे?',
    loginHere: 'येथे लॉगिन करा',
    lightMode: 'लाईट',
    darkMode: 'डार्क',
    language: 'भाषा',
    passwordMismatch: 'पासवर्ड जुळत नाहीत!',
    passwordMinLength: 'पासवर्ड किमान 6 अक्षरांचा असावा!',
  },
  hi: {
    appName: 'एग्जामगार्ड',
    dashboard: 'डैशबोर्ड',
    exams: 'परीक्षाएं',
    results: 'परिणाम',
    grievances: 'शिकायतें',
    createExam: 'परीक्षा बनाएं',
    evaluateExam: 'परीक्षा मूल्यांकन',
    users: 'उपयोगकर्ता',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',
    student: 'छात्र',
    faculty: 'संकाय',
    admin: 'एडमिन',
    welcomeBack: 'वापसी पर स्वागत है',
    examSystem: 'एग्जामगार्ड',
    email: 'ईमेल',
    password: 'पासवर्ड',
    login: 'लॉगिन',
    loggingIn: 'लॉगिन हो रहा है...',
    noAccount: 'खाता नहीं है?',
    registerHere: 'यहाँ रजिस्टर करें',
    demoCredentials: 'डेमो क्रेडेंशियल्स:',
    createAccount: 'खाता बनाएं',
    joinSystem: 'एग्जामगार्ड से जुड़ें',
    fullName: 'पूरा नाम',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    role: 'भूमिका',
    studentId: 'छात्र आईडी',
    department: 'विभाग',
    semester: 'सेमेस्टर',
    selectSemester: 'सेमेस्टर चुनें',
    phone: 'फ़ोन',
    creatingAccount: 'खाता बन रहा है...',
    register: 'रजिस्टर',
    haveAccount: 'पहले से खाता है?',
    loginHere: 'यहाँ लॉगिन करें',
    lightMode: 'लाइट',
    darkMode: 'डार्क',
    language: 'भाषा',
    passwordMismatch: 'पासवर्ड मेल नहीं खाते!',
    passwordMinLength: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए!',
  },
  te: {
    appName: 'ఎగ్జామ్‌గార్డ్',
    dashboard: 'డ్యాష్‌బోర్డ్',
    exams: 'పరీక్షలు',
    results: 'ఫలితాలు',
    grievances: 'ఫిర్యాదులు',
    createExam: 'పరీక్ష సృష్టించండి',
    evaluateExam: 'పరీక్ష మూల్యాంకనం',
    users: 'వినియోగదారులు',
    settings: 'సెట్టింగ్స్',
    logout: 'లాగౌట్',
    student: 'విద్యార్థి',
    faculty: 'ఫ్యాకల్టీ',
    admin: 'అడ్మిన్',
    welcomeBack: 'మళ్లీ స్వాగతం',
    examSystem: 'ఎగ్జామ్‌గార్డ్',
    email: 'ఈమెయిల్',
    password: 'పాస్వర్డ్',
    login: 'లాగిన్',
    loggingIn: 'లాగిన్ అవుతోంది...',
    noAccount: 'ఖాతా లేదా?',
    registerHere: 'ఇక్కడ నమోదు చేయండి',
    demoCredentials: 'డెమో క్రెడెన్షియల్స్:',
    createAccount: 'ఖాతా సృష్టించండి',
    joinSystem: 'ఎగ్జామ్‌గార్డ్‌లో చేరండి',
    fullName: 'పూర్తి పేరు',
    confirmPassword: 'పాస్వర్డ్ నిర్ధారించండి',
    role: 'పాత్ర',
    studentId: 'విద్యార్థి ఐడి',
    department: 'విభాగం',
    semester: 'సెమిస్టర్',
    selectSemester: 'సెమిస్టర్ ఎంచుకోండి',
    phone: 'ఫోన్',
    creatingAccount: 'ఖాతా సృష్టిస్తోంది...',
    register: 'నమోదు',
    haveAccount: 'ఇప్పటికే ఖాతా ఉందా?',
    loginHere: 'ఇక్కడ లాగిన్ చేయండి',
    lightMode: 'లైట్',
    darkMode: 'డార్క్',
    language: 'భాష',
    passwordMismatch: 'పాస్‌వర్డులు సరిపోలడం లేదు!',
    passwordMinLength: 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి!',
  },
}

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'Marathi' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
]

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}

export const UIProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme) return storedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')

  useEffect(() => {
    localStorage.setItem('theme', theme)
    const isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.body.classList.toggle('dark', isDark)
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('language', language)
    document.documentElement.lang = language
  }, [language])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const t = (key, fallback = '') => {
    return translations[language]?.[key] || translations.en[key] || fallback || key
  }

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      language,
      setLanguage,
      languageOptions,
      t,
    }),
    [theme, language],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}
