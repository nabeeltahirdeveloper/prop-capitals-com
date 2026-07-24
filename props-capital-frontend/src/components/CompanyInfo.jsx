import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { COMPANY_ADDRESS, COMPANY_ADDRESS_LINES } from '../constants/company';

const CompanyInfo = ({ isDark, compact = false }) => {
  if (compact) {
    return (
      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
        <p className="font-semibold">BLUEHAVEN MANAGEMENT LTD.</p>
        <p>{COMPANY_ADDRESS}</p>
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
          {COMPANY_ADDRESS_LINES.map((line, i) => (
            <React.Fragment key={line}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </span>
      </div>
    </div>
  );
};

export default CompanyInfo;
