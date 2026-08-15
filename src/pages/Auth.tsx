import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/useAuth";

type AuthMode = "login" | "signup";

type AuthPageProps = {
  mode: AuthMode;
};

type LocationState = {
  from?: string;
};

export default function AuthPage({ mode }: AuthPageProps) {
  const isSignUp = mode === "signup";
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const destination = state?.from ?? "/";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const result = await signUp(email, password, displayName);

        if (result.requiresEmailConfirmation) {
          setSuccessMessage(
            "Account created. Check your email to confirm the account before signing in.",
          );
          return;
        }
      } else {
        await signIn(email, password);
      }

      navigate(destination, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <header className="mb-7 space-y-2">
            <p className="text-sm font-medium text-primary">Study Buddy Hub</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? "Start syncing your subjects, progress and paper attempts."
                : "Sign in to continue to your study dashboard."}
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignUp ? (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="display-name"
                >
                  Display name
                </label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Your name"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="At least 8 characters"
              />
            </div>

            {errorMessage ? (
              <p
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? isSignUp
                  ? "Creating account…"
                  : "Signing in…"
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "New to Study Buddy Hub?"}{" "}
            <Link
              className="font-medium text-primary underline-offset-4 hover:underline"
              to={isSignUp ? "/login" : "/signup"}
              state={state}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
