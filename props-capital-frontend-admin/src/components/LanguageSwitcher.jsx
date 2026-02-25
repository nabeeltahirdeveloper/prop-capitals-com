import React from 'react';
import { useTranslation, supportedLanguages } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
      <Globe className="w-5 h-5 text-[#d97706]" />

      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-[112px] sm:w-[140px] bg-transparent border-border text-foreground">
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

