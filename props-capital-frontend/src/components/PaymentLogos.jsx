import React from 'react';

export const VisaLogo = ({ className = "w-12 h-8" }) => (
  <svg className={className} viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg">
    <rect width="780" height="500" rx="40" fill="#1A1F71" />
    <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4zm224.5-191c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.3 64.7-.3 28.2 26.5 43.9 46.8 53.3 20.8 9.6 27.8 15.8 27.7 24.4-.1 13.2-16.6 19.2-31.9 19.2-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.3 93-66.8.2-22.3-14-39.2-44.8-53.2-18.6-9.1-30-15.1-29.9-24.3 0-8.1 9.7-16.8 30.5-16.8 17.4-.3 30 3.5 39.8 7.5l4.8 2.3 7.2-42zm138.7-4.8h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.5h56.2s9.2-24.2 11.3-29.5h68.6c1.6 6.9 6.5 29.5 6.5 29.5h49.7l-43.6-195.8zm-65.8 126.5c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.6h-44.6zM247.8 152.9L195.6 290l-5.6-27c-9.7-31.2-39.9-65.1-73.7-82l47.9 167.7h56.6l84.2-195.8h-57.2z" fill="#fff"/>
    <path d="M146.9 152.9H60.8l-.7 4.1c67.2 16.2 111.7 55.5 130.1 102.7l-18.8-90.3c-3.2-12.4-12.8-16.1-24.5-16.5z" fill="#F9A533"/>
  </svg>
);

export const MastercardLogo = ({ className = "w-12 h-8" }) => (
  <svg className={className} viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg">
    <rect width="780" height="500" rx="40" fill="#16366F" />
    <circle cx="310" cy="250" r="150" fill="#EB001B" />
    <circle cx="470" cy="250" r="150" fill="#F79E1B" />
    <path d="M390 130.7c-38.8 31-63.7 78.6-63.7 131.8s24.9 100.8 63.7 131.8c38.8-31 63.7-78.6 63.7-131.8s-24.9-100.8-63.7-131.8z" fill="#FF5F00" />
  </svg>
);

export const PaymentLogos = ({ className = "" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <VisaLogo className="w-12 h-8" />
    <MastercardLogo className="w-12 h-8" />
  </div>
);

export default PaymentLogos;
