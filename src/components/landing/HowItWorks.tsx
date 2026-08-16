import { ArrowDown, BookPlus, Crosshair, ListChecks } from "lucide-react";

const steps = [
  {
    title: "Add your subjects",
    description: "Choose from the available catalogue or create a custom subject.",
    icon: BookPlus,
  },
  {
    title: "Track what you know and practise",
    description:
      "Update syllabus status, keep notes, and log past-paper attempts.",
    icon: ListChecks,
  },
  {
    title: "Focus where it matters",
    description:
      "Use progress, subject-health, and next-action views to decide what deserves attention.",
    icon: Crosshair,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="landing-section py-20 md:py-28"
    >
      <div className="container mx-auto px-4">
        <div className="landing-how-panel relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl sm:p-10 lg:p-14">
          <div className="landing-how-grid" aria-hidden="true" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">
                How it works
              </p>
              <h2
                id="how-it-works-heading"
                className="mt-4 max-w-xl text-balance text-3xl font-bold tracking-[-0.035em] text-white md:text-5xl"
              >
                From setup to a clearer next step.
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-slate-300">
                Build context as you study, then use that context to make the
                next session more deliberate.
              </p>
            </div>

            <ol className="grid gap-3">
              {steps.map(({ title, description, icon: Icon }, index) => (
                <li
                  key={title}
                  className="landing-step relative grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-300 text-slate-950">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-white sm:text-lg">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {description}
                    </p>
                  </div>
                  {index < steps.length - 1 ? (
                    <ArrowDown className="landing-step-arrow absolute -bottom-3 left-8 z-10 h-4 w-4 text-teal-300" />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
