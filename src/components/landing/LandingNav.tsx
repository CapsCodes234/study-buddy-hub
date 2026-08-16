import { BookOpenCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function LandingNav() {
  return (
    <header className="landing-nav sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <nav
        aria-label="Public navigation"
        className="container mx-auto flex h-16 min-w-0 items-center justify-between gap-2 px-3 sm:px-4"
      >
        <Link
          to="/"
          aria-label="Study Buddy Hub home"
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden min-[520px]:inline">Study Buddy Hub</span>
          <span className="sr-only min-[520px]:hidden">Study Buddy Hub</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <a
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            href="#features"
          >
            What it helps with
          </a>
          <a
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            href="#how-it-works"
          >
            How it works
          </a>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <ThemeToggle className="h-11 w-11 shrink-0" />
          <Button asChild variant="ghost" className="h-11 px-2.5 sm:px-4">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="h-11 px-3 sm:px-5">
            <Link to="/signup">
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Get started</span>
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
