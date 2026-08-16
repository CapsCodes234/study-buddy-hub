import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  FileSearch,
  Target,
} from "lucide-react";

export function ProductSpotlight() {
  return (
    <section
      aria-labelledby="spotlight-heading"
      className="landing-section border-y border-border/60 bg-muted/25 py-20 md:py-28"
    >
      <div className="container mx-auto grid min-w-0 gap-12 px-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Progress with context
          </p>
          <h2
            id="spotlight-heading"
            className="mt-4 text-balance text-3xl font-bold tracking-[-0.035em] md:text-5xl"
          >
            Weak spots should be easier to notice.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Your study dashboard brings syllabus status and practice history
            together, so the signal behind your next decision is easier to see.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold leading-6">
              See the topic, the context, and a useful next action in the same
              place.
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          data-testid="spotlight-product-preview"
          className="landing-spotlight-visual relative min-w-0 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-2xl sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Subject health
              </p>
              <p className="mt-1 text-lg font-bold">Read the signal</p>
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              Illustrative view
            </span>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-status-red/20 bg-[hsl(var(--status-red-bg))] p-4">
              <AlertTriangle className="h-5 w-5 text-status-red" />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-status-red">
                Needs attention
              </p>
              <p className="mt-1 text-sm font-semibold">Forces and motion</p>
            </div>
            <div className="rounded-2xl border border-status-amber/20 bg-[hsl(var(--status-amber-bg))] p-4">
              <CircleDot className="h-5 w-5 text-status-amber" />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-status-amber">
                Developing
              </p>
              <p className="mt-1 text-sm font-semibold">Data structures</p>
            </div>
            <div className="rounded-2xl border border-status-green/20 bg-[hsl(var(--status-green-bg))] p-4">
              <CheckCircle2 className="h-5 w-5 text-status-green" />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-status-green">
                Confident
              </p>
              <p className="mt-1 text-sm font-semibold">Pure algebra</p>
            </div>
          </div>

          <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <FileSearch className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Practice context
                  </p>
                  <p className="text-sm font-bold">Review what changed</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-5 items-end gap-2">
                <span className="landing-trend-bar h-5" />
                <span className="landing-trend-bar h-8" />
                <span className="landing-trend-bar h-7" />
                <span className="landing-trend-bar h-11" />
                <span className="landing-trend-bar h-10" />
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary p-5 text-primary-foreground">
              <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">
                Signal to action
              </p>
              <p className="mt-3 text-sm font-semibold leading-6">
                Revisit one weak concept before the next practice attempt.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold">
                Next step
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
