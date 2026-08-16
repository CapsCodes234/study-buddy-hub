/**
 * App routing with authenticated and guest-only route boundaries.
 */

import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { GuestOnlyRoute } from "@/components/auth/GuestOnlyRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { SessionAwareHomeRoute } from "@/components/auth/SessionAwareHomeRoute";
import { SubjectThemeProvider } from "@/components/providers/SubjectThemeProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/AuthProvider";
import AuthPage from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import ThemeDemo from "@/pages/ThemeDemo";

const queryClient = new QueryClient();
const Index = lazy(() => import("@/pages/Index"));
const Landing = lazy(() => import("@/pages/Landing"));

function DeferredPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AuthLoadingScreen />}>{children}</Suspense>;
}

function AuthenticatedIndex() {
  return (
    <DeferredPage>
      <Index />
    </DeferredPage>
  );
}

function ProtectedSubjectRoutes() {
  return (
    <SubjectThemeProvider>
      <Outlet />
    </SubjectThemeProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <SessionAwareHomeRoute
            guest={
              <DeferredPage>
                <Landing />
              </DeferredPage>
            }
            authenticated={
              <SubjectThemeProvider>
                <AuthenticatedIndex />
              </SubjectThemeProvider>
            }
          />
        }
      />

      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedSubjectRoutes />}>
          <Route path="/settings" element={<AuthenticatedIndex />} />
          <Route path="/exams" element={<AuthenticatedIndex />} />

          <Route path="/:subjectId" element={<AuthenticatedIndex />} />
          <Route path="/:subjectId/syllabus" element={<AuthenticatedIndex />} />
          <Route path="/:subjectId/papers" element={<AuthenticatedIndex />} />

          <Route path="/theme-demo" element={<ThemeDemo />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="/auth" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
