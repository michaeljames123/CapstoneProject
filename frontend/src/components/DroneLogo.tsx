import React from 'react';

const DroneLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="4" className="fill-emerald-500" />
      <circle cx="8" cy="8" r="3.5" className="stroke-emerald-500" strokeWidth="1.5" />
      <circle cx="24" cy="8" r="3.5" className="stroke-emerald-500" strokeWidth="1.5" />
      <circle cx="8" cy="24" r="3.5" className="stroke-emerald-500" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="3.5" className="stroke-emerald-500" strokeWidth="1.5" />
      <path
        d="M11 16h10M16 11v10M10 8h-2.5M24 8h2.5M8 22v2.5M24 22v2.5"
        className="stroke-emerald-600"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default DroneLogo;
