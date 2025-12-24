/**
 * Updated App with Subject Routing
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ThemeDemo from "./pages/ThemeDemo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Index />} />
            
            {/* Subject Routes */}
            <Route path="/:subjectId" element={<Index />} />
            <Route path="/:subjectId/syllabus" element={<Index />} />
            <Route path="/:subjectId/papers" element={<Index />} />
            
            {/* Utility Routes */}
            <Route path="/theme-demo" element={<ThemeDemo />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
