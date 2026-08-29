'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type Lang = 'en' | 'zh';

const LocaleContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: 'en', setLang: () => undefined });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  const applyLanguage = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem('kestrel.language', next);
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.dataset.language = next;
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('kestrel.language');
    applyLanguage(
      saved === 'zh' ||
        (!saved && navigator.language.toLowerCase().startsWith('zh'))
        ? 'zh'
        : 'en',
    );
  }, [applyLanguage]);

  return (
    <LocaleContext.Provider value={{ lang, setLang: applyLanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function L(lang: Lang, english: string, chinese: string) {
  return lang === 'zh' ? chinese : english;
}

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLocale();
  return (
    <button
      className={`language-switch ${className}`}
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      aria-label={lang === 'en' ? '切换到简体中文' : 'Switch to English'}
    >
      {lang === 'en' ? '简体中文' : 'EN'}
    </button>
  );
}
