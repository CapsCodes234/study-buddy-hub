import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/useAuth";

import { AuthLoadingScreen } from "./AuthLoadingScreen";

type LocationState = {
  from?: string;
};

export function GuestOnlyRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const state = location.state as LocationState | null;

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Navigate to={state?.from ?? "/"} replace />;
  }

  return <Outlet />;
}
