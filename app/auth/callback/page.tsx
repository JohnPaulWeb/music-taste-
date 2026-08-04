"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const supabase = getSupabase();

    const exchange = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (!code && !tokenHash) {
        const errorDescription = params.get("error_description");
        setMessage(errorDescription || "No verification code was found. Please try again.");
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setMessage(error.message || "We could not verify your email. Please try again.");
            return;
          }
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "signup" | "email_change" | "recovery" | "magiclink" | "invite" | "email",
          });

          if (error) {
            setMessage(error.message || "We could not verify your email. Please try again.");
            return;
          }
        } else {
          setMessage("The confirmation link is incomplete. Please request a new one.");
          return;
        }

        router.replace("/");
      } catch (verificationError) {
        setMessage(
          verificationError instanceof Error
            ? verificationError.message
            : "We could not verify your email. Please try again.",
        );
      }
    };

    void exchange();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090a0b] px-6 text-center text-white">
      <div className="max-w-md rounded-3xl border border-white/10 bg-[#151617]/85 p-8 shadow-2xl shadow-black/40">
        <p className="text-lg font-semibold">{message}</p>
      </div>
    </main>
  );
}
