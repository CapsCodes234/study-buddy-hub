import type { LucideIcon } from "lucide-react";
import { Compass, FileCheck2, Layers3, ScanSearch } from "lucide-react";

const features: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    title: "Keep subjects organised",
    description:
      "Bring official catalogue subjects and your own custom subjects into one study space.",
    icon: Layers3,
    accent: "landing-feature-navy",
  },
  {
    title: "See syllabus confidence clearly",
    description:
      "Track topics by status, add notes, and spot the areas that need attention.",
    icon: ScanSearch,
    accent: "landing-feature-teal",
  },
  {
    title: "Learn from past-paper practice",
    description:
      "Record attempts and use the dashboard’s progress views to notice patterns over time.",
    icon: FileCheck2,
    accent: "landing-feature-sky",
  },
  {
    title: "Choose the next useful action",
    description:
      "Turn subject status, deadlines, and practice history into a more focused next step.",
    icon: Compass,
    accent: "landing-feature-amber",
  },
];

export function FeatureShowcase() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="landing-section border-y border-border/60 bg-card/35 py-20 md:py-28"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            A clearer study picture
          </p>
          <h2
            id="features-heading"
            className="mt-4 text-balance text-3xl font-bold tracking-[-0.035em] md:text-5xl"
          >
            More than a list of tasks.{" "}
            <span className="text-muted-foreground">
              A clearer picture of your study.
            </span>
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map(({ title, description, icon: Icon, accent }, index) => (
            <article
              key={title}
              className="landing-feature-card group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-card"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div
                className={`mb-8 flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
              <span className="landing-card-rule mt-7 block h-1 w-12 rounded-full" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
