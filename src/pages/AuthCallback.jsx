import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

/**
 * AuthCallback — handles Supabase email verification links.
 *
 * Supabase sends an email with a link like:
 *   https://yourapp.vercel.app/auth/callback#access_token=...&type=signup
 * or (PKCE flow):
 *   https://yourapp.vercel.app/auth/callback?token_hash=...&type=signup
 *
 * This page detects both flows and signs the user in.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // --- Flow 1: PKCE (token_hash in query params) ---
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type"); // signup | recovery | email_change

      if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (error) throw error;
        setStatus("success");
        redirectAfterVerify(data?.session, type);
        return;
      }

      // --- Flow 2: Implicit (access_token in hash fragment) ---
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Supabase's onAuthStateChange picks this up automatically
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) {
          setStatus("success");
          redirectAfterVerify(session, "signup");
          return;
        }
        // Wait briefly for the session to settle
        await new Promise(res => setTimeout(res, 1500));
        const { data: { session: session2 } } = await supabase.auth.getSession();
        if (session2) {
          setStatus("success");
          redirectAfterVerify(session2, "signup");
          return;
        }
      }

      // --- No recognised params ---
      // Maybe user is already logged in
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (existing) {
        setStatus("success");
        navigate("/dashboard", { replace: true });
        return;
      }

      throw new Error("No verification token found. The link may have expired.");
    } catch (err) {
      console.error("Auth callback error:", err);
      setStatus("error");
      setErrorMsg(err.message || "Verification failed. Please try again.");
    }
  };

  const redirectAfterVerify = (session, type) => {
    if (type === "recovery") {
      navigate("/reset-password", { replace: true });
    } else {
      // New signup → onboarding; existing login → dashboard
      const isNewUser = session?.user?.created_at === session?.user?.last_sign_in_at;
      navigate(isNewUser ? "/onboarding" : "/dashboard", { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4">
      {status === "verifying" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Verifying your email…</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="text-sm text-muted-foreground">Verified! Redirecting…</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="w-10 h-10 text-destructive" />
          <p className="font-medium">Verification failed</p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">{errorMsg}</p>
          <a href="/register" className="text-sm text-primary underline mt-2">
            Back to sign up
          </a>
        </>
      )}
    </div>
  );
}
