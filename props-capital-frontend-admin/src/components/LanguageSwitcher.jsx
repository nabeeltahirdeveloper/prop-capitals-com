import React from 'react';
import { useTranslation, supportedLanguages } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-400" />

      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-[140px] bg-transparent border-slate-700 text-slate-200">
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

