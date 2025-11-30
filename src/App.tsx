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
import AdminDashboard from "./pages/AdminDashboard";
import AdminImport from "./pages/AdminImport";
import AdminUsers from "./pages/AdminUsers";
import AdminEnrichment from "./pages/AdminEnrichment";
import AdminAffiliates from "./pages/AdminAffiliates";
import FilamentDetail from "./pages/FilamentDetail";
import BrandDetail from "./pages/BrandDetail";
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
          <Route path="/brands/:brand" element={<BrandDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/matrix" element={<Matrix />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/diagnose" element={<Diagnose />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/import" element={<AdminImport />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/enrichment" element={<AdminEnrichment />} />
          <Route path="/admin/affiliates" element={<AdminAffiliates />} />
          <Route path="/filament/:id" element={<FilamentDetail />} />
          <Route path="/admin/filaments" element={<AdminDashboard />} />
          <Route path="/admin/deals" element={<AdminDashboard />} />
          <Route path="/admin/printers" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
