import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Finder from "./pages/Finder";
import Brands from "./pages/Brands";
import Compare from "./pages/Compare";
import Matrix from "./pages/Matrix";
import Deals from "./pages/Deals";
import Wizard from "./pages/Wizard";
import Diagnose from "./pages/Diagnose";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Finder />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/matrix" element={<Matrix />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/diagnose" element={<Diagnose />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
