import React from 'react';

export default function BrandLogo({ size = 'md', dark = false, black = false }) {
  const sizes = {
    sm: { img: 'w-7 h-7', text: 'text-sm' },
    md: { img: 'w-9 h-9', text: 'text-base' },
    lg: { img: 'w-20 h-20', text: 'text-2xl' },
    sidebar: { img: 'w-8 h-8', text: 'text-sm' },
  };
  const s = sizes[size] || sizes.md;

  const textColor = size === 'lg' ? 'text-white' : black ? 'text-black' : dark ? 'text-gray-900' : 'text-white';

  return (
    <div className={`flex items-center gap-2.5 ${size === 'lg' ? 'flex-col' : ''}`}>
      <img
        src="/logo.png"
        alt="Brandfletch"
        className={`${s.img} rounded-xl object-contain flex-shrink-0`}
      />
      <div className={size === 'lg' ? 'text-center' : ''}>
        <span className={`font-display font-bold ${s.text} ${textColor} leading-none`}>Brandfletch</span>
      </div>
    </div>
  );
}