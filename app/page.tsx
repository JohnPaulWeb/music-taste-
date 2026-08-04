"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Disc3,
  Eye,
  EyeOff,
  Headphones,
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
    <main className="relative min-h-screen overflow-x-hidden bg-[#090a0b] text-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(29,185,84,0.12),transparent_26%),radial-gradient(circle_at_20%_90%,rgba(43,78,255,0.10),transparent_30%)]" />


      <section className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-[#1db954] via-[#12813b] to-[#062814] p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#d6ff6e]/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-black/30 blur-3xl" />
        <div className="absolute right-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border-[18px] border-black/20 shadow-[0_0_0_20px_rgba(255,255,255,0.06),0_40px_100px_rgba(0,0,0,0.35)]" />
        <div className="absolute right-[9.5rem] top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#d6ff6e] shadow-[0_0_0_8px_rgba(0,0,0,0.2)]" />
        <div className="relative flex items-center gap-2 text-2xl font-black tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-black/15">
            <Disc3 className="h-6 w-6" />
          </span>{" "}
          echora
        </div>
        <div className="relative max-w-lg">
          <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-white/75">
            <Sparkles className="h-4 w-4" /> Your sound, your space
          </p>
          <h1 className="text-6xl font-black leading-[0.92] tracking-tight">
            Feel every
            <br />
            moment.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-7 text-white/80">
            Discover your next favorite track, build playlists, and keep the
            music moving.
          </p>
        </div>
        <div className="relative flex gap-3 text-sm font-semibold text-white/90">
          <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2">
            <Music2 className="h-4 w-4" /> Curated picks
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2">
            <Headphones className="h-4 w-4" /> Listen anywhere
          </span>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-3">
        <div className="w-full max-w-[29rem] rounded-3xl border border-white/10 bg-[#151617]/85 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:max-w-[31rem] sm:p-8 lg:max-w-[27rem] lg:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6 lg:mb-4">
            <div className="flex items-center gap-2 text-xl font-black sm:text-2xl">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1db954] text-black">
                <Disc3 className="h-6 w-6" />
              </span>{" "}
              echora
            </div>
            <span className="rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-3 py-1 text-xs font-bold text-[#75e8a0]">
              Free to explore
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[1.9rem]">
            {mode === "signup" ? "Your next song is waiting." : "Welcome back."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-[15px]">
            {mode === "signup"
              ? "Create your space, discover new sounds, and start listening."
              : "Log in to pick up right where you left off."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3 sm:mt-6 sm:space-y-4 lg:mt-4 lg:space-y-2.5">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Name</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="What should we call you?"
                    onChange={handleFieldChange}
                    aria-invalid={Boolean(validationErrors.name)}
                    className={`h-12 w-full rounded-xl border pl-12 pr-4 outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:ring-4 ${
                      validationErrors.name
                        ? "border-red-500/70 bg-red-500/10 focus:border-red-500 focus:ring-red-500/20"
                        : "border-white/10 bg-white/[0.04] focus:border-[#1db954] focus:ring-[#1db954]/10"
                    }`}
                  />
                </div>
                {validationErrors.name && (
                  <p className="mt-2 text-sm text-red-400">{validationErrors.name}</p>
                )}
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Email address
              </span>
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
                  className={`h-12 w-full rounded-xl border pl-12 pr-4 outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:ring-4 ${
                    validationErrors.email
                      ? "border-red-500/70 bg-red-500/10 focus:border-red-500 focus:ring-red-500/20"
                      : "border-white/10 bg-white/[0.04] focus:border-[#1db954] focus:ring-[#1db954]/10"
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-2 text-sm text-red-400">{validationErrors.email}</p>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Password</span>
              <div className="relative">
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
                  className={`h-12 w-full rounded-xl border px-4 pr-12 outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:ring-4 ${
                    validationErrors.password
                      ? "border-red-500/70 bg-red-500/10 focus:border-red-500 focus:ring-red-500/20"
                      : "border-white/10 bg-white/[0.04] focus:border-[#1db954] focus:ring-[#1db954]/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-3 text-zinc-400 transition hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-400">{validationErrors.password}</p>
              )}
            </label>
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Confirm password</span>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    onChange={handleFieldChange}
                    aria-invalid={Boolean(validationErrors.confirmPassword)}
                    className={`h-12 w-full rounded-xl border px-4 pr-12 outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:ring-4 ${
                      validationErrors.confirmPassword
                        ? "border-red-500/70 bg-red-500/10 focus:border-red-500 focus:ring-red-500/20"
                        : "border-white/10 bg-white/[0.04] focus:border-[#1db954] focus:ring-[#1db954]/10"
                    }`}
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-400">{validationErrors.confirmPassword}</p>
                )}
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-sm text-[#1db954]">
                {message}
              </p>
            )}
            {pendingConfirmationEmail && (
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={isSubmitting}
                className="text-sm font-semibold text-[#1db954] hover:text-[#1ed760] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Resend confirmation email to {pendingConfirmationEmail}
              </button>
            )}
            <button
              disabled={isSubmitting}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1db954] px-4 py-3 font-bold text-black shadow-lg shadow-[#1db954]/20 transition hover:-translate-y-0.5 hover:bg-[#58d979] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                "Please wait..."
              ) : mode === "signup" ? (
                <>
                  Create free account <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Log in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          <div className="my-5 flex items-center gap-3 text-[11px] font-bold tracking-[0.16em] text-zinc-600 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10 lg:my-4">
            OR
          </div>
          <button
            type="button"
            onClick={() =>
              setAccount({
                name: "Guest listener",
                email: "guest@echora.local",
              })
            }
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-bold text-white transition hover:border-[#1db954]/70 hover:bg-[#1db954]/10"
          >
            <Headphones className="h-4 w-4 text-[#1db954]" /> Continue as guest
          </button>
          <p className="mt-4 text-center text-sm text-zinc-400 lg:mt-3">
            {mode === "signup" ? "Already have an account?" : "New to Echora?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError("");
                setMessage("");
                setValidationErrors({});
              }}
              className="font-bold text-[#58d979] transition hover:text-white"
            >
              {mode === "signup" ? "Log in" : "Sign up free"}
            </button>
          </p>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-zinc-600 lg:mt-4">
            <Check className="h-3.5 w-3.5 text-[#1db954]" /> Secure accounts.
            Confirm email to get started.
          </p>
        </div>
      </section>
    </main>
  );
}
