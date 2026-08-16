import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="landing-section py-20 md:py-28"
    >
      <div className="container mx-auto px-4">
        <div className="landing-cta-panel relative overflow-hidden rounded-[2rem] border border-primary/20 px-6 py-14 text-center shadow-2xl sm:px-10 md:py-20">
          <div className="landing-cta-orbit" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Your next session
            </p>
            <h2
              id="final-cta-heading"
              className="mt-4 text-balance text-3xl font-bold tracking-[-0.035em] md:text-5xl"
            >
              Make your next study session more deliberate.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Create an account to choose your subjects and start building your
              study dashboard.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/signup">
                  Create account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 bg-background/75 px-6 text-base backdrop-blur"
              >
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
