/**
 * App routing with authenticated and guest-only route boundaries.
 */

import { useEffect } from "react";
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
import { SubjectThemeProvider } from "@/components/providers/SubjectThemeProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/AuthProvider";
import AuthPage from "@/pages/Auth";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import ThemeDemo from "@/pages/ThemeDemo";

const queryClient = new QueryClient();

function ProtectedSubjectRoutes() {
  return (
    <SubjectThemeProvider>
      <Outlet />
    </SubjectThemeProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedSubjectRoutes />}>
          <Route path="/" element={<Index />} />
          <Route path="/settings" element={<Index />} />
          <Route path="/exams" element={<Index />} />

          <Route path="/:subjectId" element={<Index />} />
          <Route path="/:subjectId/syllabus" element={<Index />} />
          <Route path="/:subjectId/papers" element={<Index />} />

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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
