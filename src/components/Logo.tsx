import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        viewBox="0 0 400 80" 
        className={`${sizeClasses[size]} w-auto`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left black bars */}
        <g>
          <rect x="0" y="15" width="8" height="35" fill="#000000"/>
          <rect x="12" y="15" width="8" height="35" fill="#000000"/>
          <rect x="24" y="15" width="8" height="35" fill="#000000"/>
          <rect x="36" y="10" width="12" height="45" fill="#000000"/>
        </g>
        
        {/* IMX Letters */}
        <g>
          {/* I */}
          <rect x="60" y="10" width="12" height="45" fill="#000000"/>
          
          {/* M */}
          <path d="M85 10 L85 55 L97 55 L97 25 L110 55 L122 55 L135 25 L135 55 L147 55 L147 10 L125 10 L116 35 L107 10 Z" fill="#FF0000"/>
          
          {/* X */}
          <path d="M165 10 L185 35 L205 10 L220 10 L195 40 L220 55 L205 55 L185 40 L165 55 L150 55 L175 40 L150 10 Z" fill="#FF0000"/>
        </g>
        
        {/* Right black bars */}
        <g>
          <rect x="240" y="10" width="12" height="45" fill="#000000"/>
          <rect x="256" y="15" width="8" height="35" fill="#000000"/>
          <rect x="268" y="15" width="8" height="35" fill="#000000"/>
          <rect x="280" y="15" width="8" height="35" fill="#000000"/>
        </g>
        
        {/* Tagline */}
        <text x="50" y="72" fontSize="8" fill="#000000" fontWeight="bold" fontFamily="Arial, sans-serif">
          AUTO BUYING CENTER AND LEASING
        </text>
      </svg>
    </div>
  );
}