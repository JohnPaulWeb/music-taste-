"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Disc3,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  Mail,
  Music2,
  Sparkles,
  UserRound,
} from "lucide-react";
import MusicPlayer from "@/components/music-player";
import { getSupabase } from "@/lib/supabase";

type Mode = "login" | "signup";
type FormField = "name" | "email" | "password" | "confirmPassword";
type ValidationErrors = Partial<Record<FormField, string>>;

interface Account {
  name: string;
  email: string;
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isStrongPassword = (value: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
const getAuthRedirectUrl = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
};
const getEmailRedirectTo = () => `${getAuthRedirectUrl()}/auth/callback`;

export default function Home() {
  const [account, setAccount] = useState<Account | null>(null);
  const [mode, setMode] = useState<Mode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    const supabase = getSupabase();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email)
        setAccount({
          name: String(user.user_metadata.name ?? user.email.split("@")[0]),
          email: user.email,
        });
    });
  }, []);

  const validateForm = (name: string, email: string, password: string, confirmPassword: string) => {
    const nextErrors: ValidationErrors = {};

    if (mode === "signup") {
      if (name.length < 2) {
        nextErrors.name = "Please enter a name with at least 2 characters.";
      }
      if (!isValidEmail(email)) {
        nextErrors.email = "Enter a valid email address.";
      }
      if (!isStrongPassword(password)) {
        nextErrors.password =
          "Use at least 8 characters, including uppercase, lowercase, and a number.";
      }
      if (password !== confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    } else {
      if (!isValidEmail(email)) {
        nextErrors.email = "Enter a valid email address.";
      }
      if (password.length < 6) {
        nextErrors.password = "Your password must be at least 6 characters.";
      }
    }

    return nextErrors;
  };

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as FormField;
    if (validationErrors[field]) {
      setValidationErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    const nextErrors = validateForm(name, email, password, confirmPassword);
    setValidationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: getEmailRedirectTo(),
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          setAccount({ name, email });
        } else {
          setPendingConfirmationEmail(email);
          setMessage(
            "Check your inbox to confirm your email address, then log in.",
          );
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setAccount({
          name: String(data.user.user_metadata.name ?? email.split("@")[0]),
          email,
        });
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to complete your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendConfirmation = async () => {
    if (!pendingConfirmationEmail) return;

    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const { error: resendError } = await getSupabase().auth.resend({
        type: "signup",
        email: pendingConfirmationEmail,
        options: { emailRedirectTo: getEmailRedirectTo() },
      });
      if (resendError) throw resendError;
      setMessage(
        "A new confirmation email has been sent. Check spam or junk mail too.",
      );
    } catch (resendFailure) {
      setError(
        resendFailure instanceof Error
          ? resendFailure.message
          : "Unable to resend the confirmation email.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (account)
    return (
      <MusicPlayer
        user={account}
        onLogout={async () => {
          await getSupabase().auth.signOut();
          setAccount(null);
        }}
      />
    );

  return (
    <main className="relative flex min-h-screen overflow-x-hidden bg-[#07080a] text-white lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(29,185,84,0.15),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.12),transparent_40%)]" />

      {/* Left Branding Showcase */}
      <section className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-[#1db954]/20 via-[#0e2417] to-[#07080a] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#1db954]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-black/50 blur-3xl" />
        
        {/* Animated Vinyl Disc Art Graphic */}
        <div className="absolute right-12 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full border-[24px] border-black/40 shadow-[0_0_80px_rgba(29,185,84,0.2)] animate-spin-slow">
          <div className="absolute inset-4 rounded-full border border-white/10" />
          <div className="absolute inset-12 rounded-full border border-white/10" />
          <div className="absolute inset-20 rounded-full bg-gradient-to-tr from-[#1db954] to-[#10b981] shadow-lg" />
        </div>

        <div className="relative flex items-center gap-3 text-3xl font-black tracking-tight">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#1db954] to-[#10b981] text-black shadow-lg shadow-[#1db954]/30">
            <Disc3 className="h-7 w-7 animate-spin-slow" />
          </span>{" "}
          echora
        </div>

        <div className="relative max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#75e8a0]">
            <Sparkles className="h-4 w-4" /> Next-Gen Audio Experience
          </div>
          <h1 className="text-6xl font-black leading-tight tracking-tight">
            Feel every
            <br />
            rhythm & beat.
          </h1>
          <p className="text-lg leading-relaxed text-zinc-300">
            Discover curated playlists, explore music worldwide, and experience high-fidelity vinyl visualization.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-4 text-sm font-semibold text-zinc-300">
          <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md">
            <Music2 className="h-4 w-4 text-[#1db954]" /> Hi-Res Previews
          </span>
          <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md">
            <Headphones className="h-4 w-4 text-[#1db954]" /> Custom Turntable
          </span>
        </div>
      </section>

      {/* Right Form Card */}
      <section className="relative flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0e12]/90 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl font-black">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1db954] text-black">
                <Disc3 className="h-6 w-6" />
              </span>{" "}
              echora
            </div>
            <span className="rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-3 py-1 text-xs font-bold text-[#75e8a0]">
              Free Access
            </span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white">
            {mode === "signup" ? "Get started today." : "Welcome back."}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === "signup"
              ? "Create your account or join instantly as guest listener."
              : "Log in to access your queue and playlists."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Name</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Your display name"
                    onChange={handleFieldChange}
                    aria-invalid={Boolean(validationErrors.name)}
                    className={`h-12 w-full rounded-xl border pl-12 pr-4 text-sm outline-none transition placeholder:text-zinc-600 ${
                      validationErrors.name
                        ? "border-red-500/70 bg-red-500/10 focus:ring-4 focus:ring-red-500/20"
                        : "border-white/10 bg-white/[0.04] focus:border-[#1db954] focus:ring-4 focus:ring-[#1db954]/15"
                    }`}
                  />
                </div>
                {validationErrors.name && (
                  <p className="text-xs text-red-400">{validationErrors.name}</p>
                )}
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Email Address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(validationErrors.email)}
                  className={`h-12 w-full rounded-xl border pl-12 pr-4 text-sm outline-none transition placeholder:text-zinc-600 ${
                    validationErrors.email
                      ? "border-red-500/70 bg-red-500/10 focus:ring-4 focus:ring-red-500/20"
                      : "border-white/10 bg-white/[0.04] focus:border-[#1db954] focus:ring-4 focus:ring-[#1db954]/15"
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-xs text-red-400">{validationErrors.email}</p>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(validationErrors.password)}
                  className={`h-12 w-full rounded-xl border pl-12 pr-12 text-sm outline-none transition placeholder:text-zinc-600 ${
                    validationErrors.password
                      ? "border-red-500/70 bg-red-500/10 focus:ring-4 focus:ring-red-500/20"
                      : "border-white/10 bg-white/[0.04] focus:border-[#1db954] focus:ring-4 focus:ring-[#1db954]/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-red-400">{validationErrors.password}</p>
              )}
            </label>

            {mode === "signup" && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Confirm Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    onChange={handleFieldChange}
                    aria-invalid={Boolean(validationErrors.confirmPassword)}
                    className={`h-12 w-full rounded-xl border pl-12 pr-4 text-sm outline-none transition placeholder:text-zinc-600 ${
                      validationErrors.confirmPassword
                        ? "border-red-500/70 bg-red-500/10 focus:ring-4 focus:ring-red-500/20"
                        : "border-white/10 bg-white/[0.04] focus:border-[#1db954] focus:ring-4 focus:ring-[#1db954]/15"
                    }`}
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-400">{validationErrors.confirmPassword}</p>
                )}
              </label>
            )}

            {error && <p role="alert" className="text-xs font-medium text-red-400">{error}</p>}
            {message && <p role="status" className="text-xs font-medium text-[#1db954]">{message}</p>}

            {pendingConfirmationEmail && (
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={isSubmitting}
                className="text-xs font-semibold text-[#1db954] hover:underline"
              >
                Resend confirmation email to {pendingConfirmationEmail}
              </button>
            )}

            <button
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1db954] font-bold text-black shadow-lg shadow-[#1db954]/20 transition hover:scale-[1.02] hover:bg-[#58d979] disabled:opacity-60"
            >
              {isSubmitting ? (
                "Processing..."
              ) : mode === "signup" ? (
                <>
                  Create Account <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Log In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            Or
          </div>

          <button
            type="button"
            onClick={() =>
              setAccount({
                name: "Guest Listener",
                email: "guest@echora.local",
              })
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] text-sm font-bold text-white hover:border-[#1db954]/50 hover:bg-[#1db954]/10 transition"
          >
            <Headphones className="h-4 w-4 text-[#1db954]" /> Continue as Guest
          </button>

          <p className="mt-5 text-center text-xs text-zinc-400">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError("");
                setMessage("");
                setValidationErrors({});
              }}
              className="font-bold text-[#75e8a0] hover:underline"
            >
              {mode === "signup" ? "Log in" : "Sign up free"}
            </button>
          </p>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
            <Check className="h-3.5 w-3.5 text-[#1db954]" /> Instant listening access. No setup required.
          </p>
        </div>
      </section>
    </main>
  );
}
