/**
 * Updated App with Subject Routing and Per-Subject Theming
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { SubjectThemeProvider } from "@/components/providers/SubjectThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ThemeDemo from "./pages/ThemeDemo";

const queryClient = new QueryClient();

// Wrapper component to provide subject theming within router context
function SubjectThemedRoutes() {
  return (
    <SubjectThemeProvider>
      <Routes>
        {/* Main Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/settings" element={<Index />} />
        <Route path="/exams" element={<Index />} />
        
        {/* Subject Routes - SubjectThemeProvider reads :subjectId */}
        <Route path="/:subjectId" element={<Index />} />
        <Route path="/:subjectId/syllabus" element={<Index />} />
        <Route path="/:subjectId/papers" element={<Index />} />
        
        {/* Utility Routes */}
        <Route path="/theme-demo" element={<ThemeDemo />} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SubjectThemeProvider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <SubjectThemedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
