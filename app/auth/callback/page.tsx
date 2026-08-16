"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Disc3 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your email address...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    let isCancelled = false;
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, "")
    );
    const isRecovery =
      searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery";
    const successMessage = isRecovery
      ? "Reset link verified. Redirecting..."
      : "Email confirmed successfully! Redirecting...";
    const successDestination = isRecovery ? "/auth/reset-password" : "/";

    const finishSuccess = (delay = 1200) => {
      if (isCancelled) return;
      setIsSuccess(true);
      setMessage(successMessage);
      setTimeout(() => router.replace(successDestination), delay);
    };

    const verifyAuth = async () => {
      try {
        // 1. Check if session is already established
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (existingSession && !isCancelled) {
          finishSuccess();
          return;
        }

        // 2. Check for explicit error in search or hash params
        const errorDesc =
          searchParams.get("error_description") ||
          hashParams.get("error_description") ||
          searchParams.get("error") ||
          hashParams.get("error");

        if (errorDesc && !isCancelled) {
          setMessage(decodeURIComponent(errorDesc).replace(/\+/g, " "));
          return;
        }

        // 3. PKCE code exchange flow (?code=...)
        const code = searchParams.get("code") || hashParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error && !isCancelled) {
            setMessage(
              error.message || "We could not verify your email link. Please try again."
            );
            return;
          }
          if (!isCancelled) {
            finishSuccess();
          }
          return;
        }

        // 4. Token hash flow (?token_hash=...&type=signup)
        const tokenHash =
          searchParams.get("token_hash") || hashParams.get("token_hash");
        const type = (searchParams.get("type") || hashParams.get("type")) as
          | "signup"
          | "email_change"
          | "recovery"
          | "magiclink"
          | "invite"
          | "email"
          | null;

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (error && !isCancelled) {
            setMessage(
              error.message || "We could not verify your email link. Please try again."
            );
            return;
          }
          if (!isCancelled) {
            finishSuccess();
          }
          return;
        }

        // 5. Implicit flow access_token in hash fragment (#access_token=...&refresh_token=...)
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error && !isCancelled) {
            setMessage(
              error.message || "We could not verify your email link. Please try again."
            );
            return;
          }
          if (!isCancelled) {
            finishSuccess();
          }
          return;
        }

        // 6. Fallback: Listen to Supabase JS SDK auto-session detection
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (
            session &&
            (event === "SIGNED_IN" ||
              event === "TOKEN_REFRESHED" ||
              event === "INITIAL_SESSION") &&
            !isCancelled
          ) {
            finishSuccess(1000);
          }
        });

        // 2-second grace period for auto-detection
        setTimeout(async () => {
          if (isCancelled) return;
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            finishSuccess(0);
          } else {
            setMessage(
              "No verification code found. If you already verified, try logging in."
            );
          }
          subscription.unsubscribe();
        }, 2200);
      } catch (err) {
        if (!isCancelled) {
          setMessage(
            err instanceof Error
              ? err.message
              : "Unable to verify email link. Please try again."
          );
        }
      }
    };

    void verifyAuth();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07080a] px-6 text-center text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0e12]/90 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1db954] to-[#10b981] text-black shadow-lg shadow-[#1db954]/25">
          <Disc3 className="h-8 w-8 animate-spin-slow" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Echora Auth</h2>
        <p
          className={`mt-3 text-sm font-semibold transition ${
            isSuccess ? "text-[#75e8a0]" : "text-zinc-300"
          }`}
        >
          {message}
        </p>

        {!isSuccess && message.includes("No verification code") && (
          <button
            onClick={() => router.replace("/")}
            className="mt-6 w-full rounded-xl bg-[#1db954] px-4 py-3 text-xs font-extrabold text-black hover:bg-[#58d979] transition shadow-lg shadow-[#1db954]/20"
          >
            Go to Login Page
          </button>
        )}
      </div>
    </main>
  );
}
