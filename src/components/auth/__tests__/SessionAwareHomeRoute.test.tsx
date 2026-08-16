import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/features/auth/useAuth";
import { SessionAwareHomeRoute } from "../SessionAwareHomeRoute";

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function setAuthState({
  loading,
  authenticated,
}: {
  loading: boolean;
  authenticated: boolean;
}) {
  mockUseAuth.mockReturnValue({
    loading,
    user: authenticated ? ({ id: "student-1" } as never) : null,
  } as ReturnType<typeof useAuth>);
}

describe("SessionAwareHomeRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the existing auth loading screen while session state is loading", () => {
    setAuthState({ loading: true, authenticated: false });

    render(
      <SessionAwareHomeRoute
        guest={<div>Public landing</div>}
        authenticated={<div>Authenticated application</div>}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Restoring your study session",
    );
    expect(screen.queryByText("Public landing")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Authenticated application"),
    ).not.toBeInTheDocument();
  });

  it("renders the guest experience after an unauthenticated decision", () => {
    setAuthState({ loading: false, authenticated: false });

    render(
      <SessionAwareHomeRoute
        guest={<div>Public landing</div>}
        authenticated={<div>Authenticated application</div>}
      />,
    );

    expect(screen.getByText("Public landing")).toBeInTheDocument();
    expect(
      screen.queryByText("Authenticated application"),
    ).not.toBeInTheDocument();
  });

  it("renders the authenticated experience without exposing the landing page", () => {
    setAuthState({ loading: false, authenticated: true });

    render(
      <SessionAwareHomeRoute
        guest={<div>Public landing</div>}
        authenticated={<div>Authenticated application</div>}
      />,
    );

    expect(screen.getByText("Authenticated application")).toBeInTheDocument();
    expect(screen.queryByText("Public landing")).not.toBeInTheDocument();
  });
});
