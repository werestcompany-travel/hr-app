import { createContext, useContext, useState } from 'react';
import translations from '../i18n/index';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('hr-liff-lang') || 'th'
  );

  const toggle = () => {
    setLang(prev => {
      const next = prev === 'th' ? 'en' : 'th';
      localStorage.setItem('hr-liff-lang', next);
      return next;
    });
  };

  const t = translations[lang] || translations.th;

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
