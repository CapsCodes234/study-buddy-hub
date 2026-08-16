import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Target,
} from "lucide-react";

const subjectSignals = [
  { name: "Mathematics", className: "landing-subject-math" },
  { name: "Physics", className: "landing-subject-physics" },
  { name: "Information Technology", className: "landing-subject-it" },
];

export function ProductPreview() {
  return (
    <div
      aria-hidden="true"
      data-testid="hero-product-preview"
      className="landing-preview-wrap relative mx-auto w-full max-w-[680px] min-w-0"
    >
      <div className="landing-preview-frame relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-status-red" />
            <span className="h-2.5 w-2.5 rounded-full bg-status-amber" />
            <span className="h-2.5 w-2.5 rounded-full bg-status-green" />
          </div>
          <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
            Illustrative dashboard preview
          </p>
        </div>

        <div className="mb-4 flex gap-2 overflow-hidden">
          {subjectSignals.map((subject) => (
            <div
              key={subject.name}
              className="landing-preview-card flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/60 bg-background/65 px-2.5 py-2.5 sm:px-3"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${subject.className}`}
              />
              <span className="truncate text-[0.7rem] font-semibold sm:text-xs">
                {subject.name}
              </span>
            </div>
          ))}
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-[1.12fr_0.88fr]">
          <div className="landing-preview-card min-w-0 rounded-2xl border border-border/70 bg-background/75 p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Syllabus focus
                  </p>
                  <p className="text-sm font-semibold">Mechanics</p>
                </div>
              </div>
              <span className="rounded-full border border-status-amber/20 bg-[hsl(var(--status-amber-bg))] px-2.5 py-1 text-[0.68rem] font-semibold text-status-amber">
                In progress
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-status-red/15 bg-[hsl(var(--status-red-bg))] p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-status-red">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Needs attention
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/80">
                  <div className="landing-progress-line landing-line-short h-full rounded-full bg-status-red" />
                </div>
              </div>
              <div className="rounded-xl border border-status-amber/15 bg-[hsl(var(--status-amber-bg))] p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-status-amber">
                  <Clock3 className="h-3.5 w-3.5" />
                  Developing confidence
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/80">
                  <div className="landing-progress-line landing-line-medium h-full rounded-full bg-status-amber" />
                </div>
              </div>
              <div className="rounded-xl border border-status-green/15 bg-[hsl(var(--status-green-bg))] p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-status-green">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confident
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/80">
                  <div className="landing-progress-line landing-line-long h-full rounded-full bg-status-green" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2 md:grid-cols-1">
            <div className="landing-preview-card rounded-2xl border border-primary/20 bg-primary p-4 text-primary-foreground shadow-medium">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-75">
                <Target className="h-4 w-4" />
                Next useful action
              </div>
              <p className="mt-3 text-sm font-semibold leading-6">
                Revisit forces, then apply the idea to one practice question.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs opacity-80">
                <span className="h-px flex-1 bg-current opacity-30" />
                Focus with context
              </div>
            </div>

            <div className="landing-preview-card rounded-2xl border border-border/70 bg-background/75 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-accent/10 p-2 text-accent">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Paper practice
                  </p>
                  <p className="text-sm font-semibold">Notice the pattern</p>
                </div>
              </div>
              <div className="mt-5 flex h-12 items-end gap-2">
                <span className="landing-mini-bar h-5" />
                <span className="landing-mini-bar h-8" />
                <span className="landing-mini-bar h-6" />
                <span className="landing-mini-bar h-10" />
                <span className="landing-mini-bar h-9" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
