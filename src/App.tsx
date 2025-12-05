import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";

// Lazy load route components for better performance
const Finder = lazy(() => import("./pages/Finder"));
const Brands = lazy(() => import("./pages/Brands"));
const Compare = lazy(() => import("./pages/Compare"));
const Matrix = lazy(() => import("./pages/Matrix"));
const Deals = lazy(() => import("./pages/Deals"));
const Wizard = lazy(() => import("./pages/Wizard"));
const Diagnose = lazy(() => import("./pages/Diagnose"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminImport = lazy(() => import("./pages/AdminImport"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminEnrichment = lazy(() => import("./pages/AdminEnrichment"));
const AdminAffiliates = lazy(() => import("./pages/AdminAffiliates"));
const AdminMaintenance = lazy(() => import("./pages/AdminMaintenance"));
const AdminPrinters = lazy(() => import("./pages/AdminPrinters"));
const FilamentDetail = lazy(() => import("./pages/FilamentDetail"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const Vault = lazy(() => import("./pages/Vault"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Printers = lazy(() => import("./pages/Printers"));
const PrinterCompare = lazy(() => import("./pages/PrinterCompare"));
const PrinterDetail = lazy(() => import("./pages/PrinterDetail"));
const Accessories = lazy(() => import("./pages/Accessories"));
const HotendDetail = lazy(() => import("./pages/HotendDetail"));
const BuildPlateDetail = lazy(() => import("./pages/BuildPlateDetail"));
const AMSDetail = lazy(() => import("./pages/AMSDetail"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-muted-foreground">Loading...</div></div>}>
          <Routes>
            <Route path="/" element={<Finder />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/brands/:brand" element={<BrandDetail />} />
            <Route path="/compare" element={<Compare />} />
          <Route path="/printers" element={<Printers />} />
          <Route path="/printers/:id" element={<PrinterDetail />} />
          <Route path="/printers/compare" element={<PrinterCompare />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/hotends/:id" element={<HotendDetail />} />
          <Route path="/build-plates/:id" element={<BuildPlateDetail />} />
          <Route path="/ams/:id" element={<AMSDetail />} />
            <Route path="/matrix" element={<Matrix />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/wizard" element={<Wizard />} />
            <Route path="/diagnose" element={<Diagnose />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/import" element={<AdminImport />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/enrichment" element={<AdminEnrichment />} />
            <Route path="/admin/affiliates" element={<AdminAffiliates />} />
            <Route path="/admin/maintenance" element={<AdminMaintenance />} />
            <Route path="/admin/printers" element={<AdminPrinters />} />
            <Route path="/filament/:id" element={<FilamentDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
