import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ProductPreview } from "./ProductPreview";

const focusSignals = ["Subject clarity", "Practice context", "Next-step focus"];

export function HeroSection() {
  return (
    <section
      aria-labelledby="landing-hero-heading"
      className="landing-hero relative overflow-hidden"
    >
      <div className="landing-orb landing-orb-one" aria-hidden="true" />
      <div className="landing-orb landing-orb-two" aria-hidden="true" />
      <div className="container relative z-10 mx-auto grid min-w-0 items-center gap-12 px-4 pb-20 pt-16 md:pb-28 md:pt-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:pb-32 lg:pt-28">
        <div className="landing-hero-copy min-w-0">
          <p className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary">
            Built for focused AS &amp; A Level study
          </p>
          <h1
            id="landing-hero-heading"
            className="max-w-3xl text-balance text-4xl font-bold leading-[1.06] tracking-[-0.045em] sm:text-5xl md:text-6xl lg:text-[4rem]"
          >
            Know where you stand.{" "}
            <span className="landing-accent-text block">
              Focus on what moves you forward.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl">
            Bring your subjects, syllabus confidence, and past-paper practice
            into one clear view—so the next study decision is easier.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/signup">
                Create your account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-border/80 bg-background/70 px-6 text-base backdrop-blur"
            >
              <Link to="/login">Log in</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {focusSignals.map((signal) => (
              <li key={signal} className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
                {signal}
              </li>
            ))}
          </ul>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
