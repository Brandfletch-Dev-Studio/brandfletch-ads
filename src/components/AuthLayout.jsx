import React from "react";
import BrandLogo from "@/components/BrandLogo";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel – decorative (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] bg-[hsl(var(--primary))] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03]" />

        <div className="relative z-10 text-center">
          <BrandLogo size="lg" />
          <h2 className="text-white text-3xl font-bold font-heading mt-8 leading-tight">
            Grow your business<br />with smart advertising
          </h2>
          <p className="text-white/60 mt-4 text-base max-w-xs mx-auto">
            Launch professionally managed Facebook & Instagram campaigns — no expertise needed.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Facebook Ads', 'Instagram Ads', 'AI Targeting', 'Real-time Reports', 'Africa-first'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Mobile logo – left aligned, dark text */}
        <div className="lg:hidden mb-8 w-full max-w-md">
          <BrandLogo size="md" dark />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold font-heading text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-7">
            {children}
          </div>

          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-5">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}