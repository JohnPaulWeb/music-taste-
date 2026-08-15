type AuthAction = "signup" | "signin" | "resend";

type AuthLikeError = {
  message?: unknown;
  msg?: unknown;
  name?: unknown;
  status?: unknown;
  code?: unknown;
};

const isUselessMessage = (message: string) => {
  const trimmed = message.trim();
  return !trimmed || trimmed === "{}" || trimmed === "[]";
};

const readMessage = (error: AuthLikeError): string => {
  if (typeof error.message === "string" && !isUselessMessage(error.message)) {
    return error.message;
  }
  if (typeof error.msg === "string" && !isUselessMessage(error.msg)) {
    return error.msg;
  }
  return "";
};

const fallbackForAction = (action: AuthAction): string => {
  switch (action) {
    case "signup":
      return "Unable to create your account. Please try again.";
    case "signin":
      return "Invalid email or password. Please try again.";
    case "resend":
      return "Unable to resend the confirmation email.";
  }
};

export function formatAuthError(error: unknown, action: AuthAction): string {
  if (typeof error === "string" && !isUselessMessage(error)) {
    return error;
  }

  if (error instanceof Error && !isUselessMessage(error.message)) {
    return error.message;
  }

  const authError =
    typeof error === "object" && error !== null ? (error as AuthLikeError) : null;

  if (authError) {
    const directMessage = readMessage(authError);
    if (directMessage) {
      return directMessage;
    }

    if (authError.name === "AuthRetryableFetchError") {
      if (action === "signup") {
        return (
          "Could not reach Supabase to create your account. Check your internet connection, " +
          "confirm your Supabase project is active, and verify Authentication → URL Configuration " +
          "includes http://localhost:3000/auth/callback. If email confirmation is enabled, also check " +
          "Authentication → Email in the Supabase dashboard."
        );
      }

      return "Unable to reach the authentication server. Check your connection and try again.";
    }
  }

  return fallbackForAction(action);
}
