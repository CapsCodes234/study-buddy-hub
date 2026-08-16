import { render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  useLocation,
  type InitialEntry,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/App";
import { useAuth } from "@/features/auth/useAuth";

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/Index", () => ({
  default: () => <main>Authenticated application</main>,
}));

vi.mock("@/pages/Landing", () => ({
  default: () => <main>Public landing</main>,
}));

vi.mock("@/pages/NotFound", () => ({
  default: () => <main>Not found</main>,
}));

vi.mock("@/pages/ThemeDemo", () => ({
  default: () => <main>Theme demo</main>,
}));

vi.mock("@/components/providers/SubjectThemeProvider", () => ({
  SubjectThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="subject-theme-provider">{children}</div>
  ),
}));

const mockUseAuth = vi.mocked(useAuth);

function setAuthState({
  loading = false,
  authenticated = false,
}: {
  loading?: boolean;
  authenticated?: boolean;
}) {
  mockUseAuth.mockReturnValue({
    loading,
    user: authenticated
      ? ({ id: "student-1", email: "student@example.com" } as never)
      : null,
    signIn: vi.fn(),
    signUp: vi.fn(),
  } as ReturnType<typeof useAuth>);
}

function LocationProbe() {
  const location = useLocation();
  const state = location.state as { from?: string } | null;

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}|{state?.from ?? ""}
    </div>
  );
}

function renderRoute(entry: InitialEntry) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("application routing contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows auth loading at the root before choosing an experience", () => {
    setAuthState({ loading: true });
    renderRoute("/");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Restoring your study session",
    );
  });

  it("renders the public landing at the root for a guest", async () => {
    setAuthState({ authenticated: false });
    renderRoute("/");

    expect(await screen.findByText("Public landing")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/|");
  });

  it("renders Index inside the subject theme provider for an authenticated root", async () => {
    setAuthState({ authenticated: true });
    renderRoute("/");

    expect(
      await screen.findByText("Authenticated application"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("subject-theme-provider")).toBeInTheDocument();
    expect(screen.queryByText("Public landing")).not.toBeInTheDocument();
  });

  it.each([
    ["/login", "Welcome back"],
    ["/signup", "Create your account"],
  ])("renders the existing guest auth mode at %s", (path, heading) => {
    setAuthState({ authenticated: false });
    renderRoute(path);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it.each(["/login", "/signup"])(
    "redirects an authenticated %s visit through the existing guest-only behavior",
    async (path) => {
      setAuthState({ authenticated: true });
      renderRoute(path);

      expect(
        await screen.findByText("Authenticated application"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent("/|");
    },
  );

  it("preserves a guest private destination including query and hash", () => {
    setAuthState({ authenticated: false });
    renderRoute("/physics/syllabus?chapter=forces#topic");

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/login|/physics/syllabus?chapter=forces#topic",
    );
  });

  it("preserves an authenticated remembered destination on a guest-only route", async () => {
    setAuthState({ authenticated: true });
    renderRoute({ pathname: "/login", state: { from: "/settings" } });

    expect(
      await screen.findByText("Authenticated application"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/settings|");
  });
});
