import React from 'react';
import { useTranslation, supportedLanguages } from '../contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { urlForLocale } from '@/lib/localeUrl';

// Only expose English and Turkish in the navbar dropdown for now.
const ENABLED_LANGUAGE_CODES = ['en', 'tr', 'kk'];

export default function LanguageSwitcher() {
  const { language } = useTranslation();
  const { isDark } = useTheme();

  const languages = supportedLanguages.filter((lang) =>
    ENABLED_LANGUAGE_CODES.includes(lang.code)
  );

  const switchLanguage = (code) => {
    if (typeof window === 'undefined') return;
    // Persist the explicit choice so the server root-redirect honors it.
    document.cookie = `locale=${code}; Path=/; Max-Age=2592000; SameSite=Lax`;
    try { localStorage.setItem('language', code); } catch { /* ignore */ }
    const { pathname, search, hash } = window.location;
    // Full reload to the /tr-prefixed (or root) URL so the Router basename updates.
    window.location.assign(urlForLocale(code, { pathname, search, hash }));
  };

  return (
    <Select value={language} onValueChange={switchLanguage}>
      <SelectTrigger
        className={`w-[124px] rounded-full h-10 gap-1.5 ${
          isDark
            ? 'bg-white/10 border-white/10 text-gray-200'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
        aria-label="Language"
      >
        <Globe className={`w-4 h-4 shrink-0 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
