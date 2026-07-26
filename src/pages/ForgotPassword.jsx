/**
 * ForgotPassword.jsx
 *
 * Sends a Supabase password-reset email with the correct redirectTo URL
 * pointing to /reset-password so the user lands on the right page.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
    } catch (err) {
      // Supabase best practice: don't reveal if email exists or not.
      // Only show an error for actual network/server failures (not "not found").
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("network")) {
        setError(msg);
        setLoading(false);
        return;
      }
      // Otherwise fall through and show success anyway (anti-enumeration)
    } finally {
      setLoading(false);
    }
    setSent(true);
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries — enter your email and we'll send you a reset link"
      footer={
        <Link
          to="/login"
          className="text-gray-400 hover:text-white font-medium hover:underline flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="text-center py-4 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <div>
            <p className="font-semibold text-foreground mb-1">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, you'll receive a
              password reset link shortly. Check your spam folder too.
            </p>
          </div>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-sm text-muted-foreground hover:underline"
          >
            Try a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
