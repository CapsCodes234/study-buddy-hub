import type { ReactNode } from "react";

import { useAuth } from "@/features/auth/useAuth";

import { AuthLoadingScreen } from "./AuthLoadingScreen";

type SessionAwareHomeRouteProps = {
  guest: ReactNode;
  authenticated: ReactNode;
};

/**
 * Chooses the root-route experience after the existing AuthProvider has made
 * its session decision. It deliberately owns no authentication or data logic.
 */
export function SessionAwareHomeRoute({
  guest,
  authenticated,
}: SessionAwareHomeRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return user ? authenticated : guest;
}
