import React from "react";
import BrandLogo from "@/components/BrandLogo";

export default function AuthLayout({ title, subtitle, footer, children, hideBrand, ...rest }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#13131d] px-4 py-12">
      {/* Brand Growth System Header (Always outside and white) */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-white">Brandfletch Growth System</h1>
        <p className="text-sm text-gray-400 mt-1">Shooting your brand to success</p>
      </div>

      {/* Centered White Form Card */}
      <div className="w-full max-w-[440px] bg-white rounded-xl p-6 sm:p-8 shadow-lg">
        {!hideBrand && (
          <div className="flex justify-center mb-6">
            <BrandLogo size="md" dark />
          </div>
        )}

        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title && <h2 className="text-2xl font-bold text-gray-900 font-heading">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
        )}

        {children}
      </div>

      {/* Footer Text (Below Card, gray-500) */}
      {footer && (
        <div className="mt-6 text-center text-sm text-gray-500">
          {footer}
        </div>
      )}
    </div>
  );
}
