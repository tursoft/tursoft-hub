import { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BackgroundAnimation from "./components/BackgroundAnimation";
import { HelmetProvider } from "react-helmet-async";

// Pages other than the homepage load on demand, so the homepage bundle stays small.
const AmelBookPrivacy = lazy(() => import("./pages/AmelBookPrivacy"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const CaseStudy = lazy(() => import("./pages/CaseStudy"));

const queryClient = new QueryClient();

/**
 * Suspense boundary for a lazily loaded page. The wrapper class lets the prerender step
 * add React's server-rendering markers around it, so the prerendered page hydrates.
 */
const RouteBoundary = ({ children }: { children: ReactNode }) => (
  <div className="route-boundary">
    <Suspense fallback={<div className="min-h-screen bg-background" aria-hidden="true" />}>{children}</Suspense>
  </div>
);

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark">
        <BackgroundAnimation />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/case-studies" element={<RouteBoundary><CaseStudies /></RouteBoundary>} />
            <Route path="/case-studies/:slug" element={<RouteBoundary><CaseStudy /></RouteBoundary>} />
            <Route path="/privacy/amelbook" element={<RouteBoundary><AmelBookPrivacy /></RouteBoundary>} />
            <Route path="/privacy/amelbook/:lang" element={<RouteBoundary><AmelBookPrivacy /></RouteBoundary>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
