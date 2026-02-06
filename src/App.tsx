import { Toaster } from "./components/ui/toaster"; // Changed from @components
import { Toaster as Sonner } from "./components/ui/sonner"; // Changed from @components
import { TooltipProvider } from "./components/ui/tooltip"; // Changed from @components
import { QueryClient, QueryClientProvider } from "tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* ADD YOUR NEW ROUTES HERE */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/academics" element={<AcademicsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/staff" element={<StaffPage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
