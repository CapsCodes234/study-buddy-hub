import { BookOpenCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/35">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold">Study Buddy Hub</p>
            <p className="text-sm text-muted-foreground">
              Focused study tracking for AS &amp; A Level students.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <Link
            className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
            to="/login"
          >
            Log in
          </Link>
          <Link
            className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
            to="/signup"
          >
            Create account
          </Link>
          <span className="text-muted-foreground">
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
