import React from 'react';
import { Building2, MapPin } from 'lucide-react';

const CompanyInfo = ({ isDark, compact = false }) => {
  if (compact) {
    return (
      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
        <p className="font-semibold">BLUEHAVEN MANAGEMENT LTD.</p>
        <p>60 Tottenham Court Road, Office 469, London, England</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
      <div className="flex items-start gap-2">
        <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
          BLUEHAVEN MANAGEMENT LTD.
        </span>
      </div>
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className="text-sm">
          60 Tottenham Court Road, Office 469<br />
          London, England
        </span>
      </div>
    </div>
  );
};

export default CompanyInfo;
