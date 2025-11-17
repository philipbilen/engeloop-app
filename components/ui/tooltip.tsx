"use client"

import { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip = ({ text, children }: TooltipProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div 
          className="absolute left-full ml-2 w-64 p-2 text-sm rounded shadow-lg z-10"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)', 
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)'
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};
