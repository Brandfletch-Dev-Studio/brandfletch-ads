/**
 * ForgotPassword.jsx — Redesigned
 *
 * Sends a Supabase password-reset email with the correct redirectTo URL.
 * Handles rate limits gracefully and guides the user clearly.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        const msg = resetError.message || "";

        // Rate limit — Supabase free tier limits to ~3-4 emails/hour
        if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many")) {
          setError("Too many reset attempts. Please wait a few minutes before trying again.");
          setLoading(false);
          return;
        }

        // Network errors
        if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
          setError("Network error. Check your connection and try again.");
          setLoading(false);
          return;
        }

        // For any other error, don't reveal if the email exists (anti-enumeration)
        // Fall through to success state
      }
    } catch (err) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("network")) {
        setError(msg);
        setLoading(false);
        return;
      }
      // Anti-enumeration: show success regardless
    } finally {
      setLoading(false);
    }

    setSent(true);
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a secure reset link"
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
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-lg">Check your inbox</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
              The link expires in 1 hour.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Didn't get it?</strong> Check your spam/junk folder. If you still don't see it after a few minutes,
              make sure you entered the correct email address and try again.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-sm text-[#4f46e5] hover:text-[#4338ca] font-medium hover:underline"
            >
              Try a different email
            </button>
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
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
            className="w-full h-11 font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending reset link…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            You'll receive an email with a link to reset your password.
            The link will expire in 1 hour for security.
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
