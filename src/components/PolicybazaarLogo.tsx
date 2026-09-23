import React from 'react';

interface PolicybazaarLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const PolicybazaarLogo: React.FC<PolicybazaarLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true
}) => {
  // Height configurations
  const heightStyles = {
    sm: 'h-8',
    md: 'h-11 sm:h-12',
    lg: 'h-14 sm:h-16'
  };

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      {/* Policybazaar text mark with .com circle */}
      <div className="flex items-center leading-none">
        <span className="font-extrabold text-[#0065ff] tracking-tight text-xl sm:text-2xl md:text-3xl font-sans">
          policy
        </span>
        <span className="font-extrabold text-[#0a2540] tracking-tight text-xl sm:text-2xl md:text-3xl font-sans ml-[1px]">
          bazaar
        </span>
        {/* .com pill circle */}
        <div className="ml-1 sm:ml-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0065ff] flex items-center justify-center shadow-xs">
          <span className="text-white text-[9px] sm:text-[10px] font-bold tracking-tighter">
            .com
          </span>
        </div>
        {/* Registered symbol */}
        <span className="text-[9px] text-[#0a2540] font-semibold ml-0.5 -mt-3 sm:-mt-4">
          ®
        </span>
      </div>

      {/* Official Tagline Banner: "HAR FAMILY HOGI INSURED" */}
      {showTagline && (
        <div className="mt-1 sm:mt-1.5 overflow-hidden">
          <div 
            className="bg-[#172c44] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-[2px] shadow-xs flex items-center justify-center"
            style={{
              clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
              transform: 'skewX(-4deg)'
            }}
          >
            <span className="text-white font-black italic tracking-wider text-[8px] sm:text-[9.5px] uppercase font-sans whitespace-nowrap px-1">
              HAR FAMILY HOGI INSURED
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
