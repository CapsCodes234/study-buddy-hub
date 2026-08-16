import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const bootstrapSource = indexHtml.match(
  /<script id="theme-bootstrap">([\s\S]*?)<\/script>/,
)?.[1];

function setSystemDark(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function runBootstrap() {
  if (!bootstrapSource) {
    throw new Error("Theme bootstrap script was not found in index.html");
  }

  Function(bootstrapSource)();
}

describe("pre-hydration theme bootstrap", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    document.head.innerHTML = '<meta name="theme-color" content="#f6f7f9">';
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies stored dark before React mounts", () => {
    localStorage.setItem("study-tracker:theme", "dark");
    setSystemDark(false);

    runBootstrap();

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("light");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#090e1a",
    );
  });

  it("applies stored light even when the system is dark", () => {
    localStorage.setItem("study-tracker:theme", "light");
    setSystemDark(true);

    runBootstrap();

    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("resolves system and invalid values through prefers-color-scheme", () => {
    localStorage.setItem("study-tracker:theme", "invalid");
    setSystemDark(true);

    runBootstrap();

    expect(document.documentElement).toHaveClass("dark");
  });

  it("falls back to the system when storage is inaccessible", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    setSystemDark(true);

    runBootstrap();

    expect(document.documentElement).toHaveClass("dark");
  });

  it("ships matching critical backgrounds and color-scheme metadata", () => {
    expect(indexHtml).toContain('<meta name="color-scheme" content="light dark"');
    expect(indexHtml).toContain("html.dark body");
    expect(indexHtml).toContain("#090e1a");
    expect(indexHtml).toContain("#f6f7f9");
  });
});
