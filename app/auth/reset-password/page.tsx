"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Disc3, Eye, EyeOff, Lock } from "lucide-react";
import { formatAuthError } from "@/lib/auth-errors";
import { getSupabase } from "@/lib/supabase";

const isStrongPassword = (value: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (!session) setError("This reset link is invalid or has expired. Please request a new one.");
    });
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isStrongPassword(password)) {
      setError("Use at least 8 characters, including uppercase, lowercase, and a number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) {
        setError(formatAuthError(updateError, "updatePassword"));
        return;
      }
      setMessage("Your password has been updated. Redirecting to your account...");
      setTimeout(() => router.replace("/"), 1000);
    } catch (updateFailure) {
      setError(formatAuthError(updateFailure, "updatePassword"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07080a] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0e12]/90 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-2 text-2xl font-black">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1db954] text-black"><Disc3 className="h-6 w-6" /></span>
          echora
        </div>
        <h1 className="text-3xl font-black">Choose a new password</h1>
        <p className="mt-2 text-sm text-zinc-400">Use a new, secure password for your account.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {[["New password", password, setPassword], ["Confirm new password", confirmPassword, setConfirmPassword]].map(([label, value, setValue]) => (
            <label key={label as string} className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{label as string}</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
                <input type={showPassword ? "text" : "password"} required minLength={8} value={value as string} onChange={(event) => (setValue as (value: string) => void)(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-12 text-sm outline-none transition focus:border-[#1db954] focus:ring-4 focus:ring-[#1db954]/15" />
              </div>
            </label>
          ))}
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {showPassword ? "Hide passwords" : "Show passwords"}
          </button>
          {error && <p role="alert" className="text-xs font-medium text-red-400">{error}</p>}
          {message && <p role="status" className="text-xs font-medium text-[#75e8a0]">{message}</p>}
          <button disabled={isSubmitting} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1db954] font-bold text-black transition hover:bg-[#58d979] disabled:opacity-60">
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
