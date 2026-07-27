import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

/**
 * AuthCallback — handles Supabase email verification links.
 * Supports both PKCE (token_hash) and implicit (hash fragment) flows.
 * After verifying, signs the user in and redirects — no second login needed.
 *
 * For recovery (password reset) links that land here, we redirect to /reset-password
 * after establishing the session.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // --- Flow 1: PKCE — token_hash in query string ---
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type") || "signup";

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (error) throw error;
        await ensureSession();
        setStatus("success");
        redirectAfterVerify(type);
        return;
      }

      // --- Flow 2: Implicit — access_token in URL hash ---
      if (window.location.hash?.includes("access_token")) {
        // For implicit flow, the SDK may need detectSessionInUrl to be true.
        // Since we disabled it, we manually extract and set the session.
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          if (sessionError) throw sessionError;
          setStatus("success");
          redirectAfterVerify(hashType || "signup");
          return;
        }
      }

      // --- Flow 3: Already authenticated (e.g. user clicked link twice) ---
      const ok = await ensureSession();
      if (ok) {
        setStatus("success");
        const _r = sessionStorage.getItem("bf_post_login_redirect");
        sessionStorage.removeItem("bf_post_login_redirect");
        navigate(_r || "/dashboard", { replace: true });
        return;
      }

      throw new Error("Verification link is invalid or has expired. Please sign up again.");
    } catch (err) {
      console.error("Auth callback error:", err);
      setStatus("error");
      setErrorMsg(err.message || "Verification failed. Please try again.");
    }
  };

  const ensureSession = async () => {
    for (let i = 0; i < 4; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return true;
      await new Promise(res => setTimeout(res, 1000));
    }
    return false;
  };

  const redirectAfterVerify = (type) => {
    if (type === "recovery") {
      navigate("/reset-password", { replace: true });
    } else {
      const _r = sessionStorage.getItem("bf_post_login_redirect");
      sessionStorage.removeItem("bf_post_login_redirect");
      navigate(_r || "/dashboard", { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4">
      {status === "verifying" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Verifying your email…</p>
          <p className="text-xs text-muted-foreground">Just a second, signing you in automatically.</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="font-medium">Email verified!</p>
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="w-10 h-10 text-destructive" />
          <p className="font-semibold text-foreground">Verification failed</p>
          <p className="text-sm text-muted-foreground text-center max-w-xs px-4">{errorMsg}</p>
          <div className="flex gap-3 mt-2">
            <a href="/register" className="text-sm text-primary underline">Sign up again</a>
            <span className="text-muted-foreground">·</span>
            <a href="/login" className="text-sm text-primary underline">Log in</a>
          </div>
        </>
      )}
    </div>
  );
}
