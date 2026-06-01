import React from 'react';

export default function BrandLogo({ size = 'md', dark = false }) {
  const sizes = {
    sm: { img: 'w-7 h-7', text: 'text-sm' },
    md: { img: 'w-9 h-9', text: 'text-base' },
    lg: { img: 'w-20 h-20', text: 'text-2xl' },
    sidebar: { img: 'w-8 h-8', text: 'text-sm' },
  };
  const s = sizes[size] || sizes.md;

  const textColor = size === 'lg' ? 'text-white' : dark ? 'text-foreground' : 'text-white';
  const accentColor = size === 'lg' ? 'text-white/70' : dark ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--accent))]';

  return (
    <div className={`flex items-center gap-2.5 ${size === 'lg' ? 'flex-col' : ''}`}>
      <img
        src="https://media.base44.com/images/public/6a1df082a0de66cf554f8fdd/eeb543716_file_0000000024d0722fa20034e2dedcbc9e.png"
        alt="Brandfletch Ads"
        className={`${s.img} rounded-xl object-contain flex-shrink-0`}
      />
      <div className={size === 'lg' ? 'text-center' : ''}>
        <span className={`font-display font-bold ${s.text} ${textColor} leading-none`}>Brandfletch</span>
        <span className={`font-display font-bold ${s.text} ${accentColor} leading-none`}> Ads</span>
      </div>
    </div>
  );
}