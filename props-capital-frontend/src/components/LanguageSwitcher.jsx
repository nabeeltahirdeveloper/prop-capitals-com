import React from 'react';
import { useTranslation, supportedLanguages } from '../contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Globe className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger
          className={`w-[130px] rounded-full h-10 ${
            isDark
              ? 'bg-white/10 border-white/10 text-gray-200'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
          aria-label="Language"
        >
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
