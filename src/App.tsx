import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AmelBookPrivacy from "./pages/AmelBookPrivacy";
import AmbientBackdrop from "./components/system/AmbientBackdrop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={200}>
      <div className="dark">
        <AmbientBackdrop />
        <Toaster />
        <Sonner />
        {/* Page content sits above the fixed ambient layer. */}
        <div className="relative z-[1]">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/privacy/amelbook" element={<AmelBookPrivacy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
