import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Landing from "../Landing";

vi.mock("@/components/ui/ThemeToggle", () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme</button>,
}));

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

describe("Landing", () => {
  it("uses semantic landmarks, a skip link, and exactly one H1", () => {
    renderLanding();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Public navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders the approved section headings", () => {
    renderLanding();

    expect(
      screen.getByRole("heading", {
        name: /more than a list of tasks.*clearer picture of your study/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "From setup to a clearer next step." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Weak spots should be easier to notice." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Make your next study session more deliberate.",
      }),
    ).toBeInTheDocument();
  });

  it("links every primary landing CTA to the existing auth routes", () => {
    renderLanding();

    const hero = screen.getByRole("region", {
      name: /know where you stand/i,
    });
    expect(
      within(hero).getByRole("link", { name: "Create your account" }),
    ).toHaveAttribute("href", "/signup");
    expect(within(hero).getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );

    const finalCta = screen.getByRole("region", {
      name: "Make your next study session more deliberate.",
    });
    expect(
      within(finalCta).getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/signup");
    expect(
      within(finalCta).getByRole("link", { name: "Log in" }),
    ).toHaveAttribute("href", "/login");
  });

  it("keeps illustrative product compositions out of the accessibility tree", () => {
    renderLanding();

    expect(screen.getByTestId("hero-product-preview")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByTestId("spotlight-product-preview")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("defines reduced-motion handling for system and manual preferences", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/landing.css"),
      "utf8",
    );

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".reduce-motion .landing-page");
    expect(css).toContain("animation: none !important");
  });
});
