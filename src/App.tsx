import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import Navbar from "./components/Navbar";
import { SiteFooter } from "./components/SiteFooter";
import { RegionProvider } from "./contexts/RegionContext";
import { CurrencyProvider } from "./hooks/useCurrency";
import { CompareProvider } from "./hooks/useCompare";
import { CompareTray } from "./components/CompareTray";
import { PrinterCompareProvider } from "./hooks/usePrinterCompare";
import { PrinterCompareBar } from "./components/PrinterCompareBar";
import { BrandCompareProvider } from "./hooks/useBrandCompare";
import { BrandCompareBar } from "./components/brands/BrandCompare";
import { CompatibleCountProvider, useCompatibleCount } from "./hooks/useCompatibleCount";
import { MaintenanceModeWrapper } from "./components/MaintenanceModeWrapper";
import { SkipLink } from "./components/accessibility/SkipLink";
import { ScreenReaderAnnouncerProvider } from "./components/accessibility/ScreenReaderAnnouncer";
import { GlobalKeyboardHandler } from "./components/accessibility/GlobalKeyboardHandler";
import { ErrorBoundary, initializeGlobalErrorHandler } from "./components/analytics/ErrorBoundary";
import { PWAInstallBanner, OfflineBanner } from "./components/pwa";
import { PageLoadingSkeleton } from "./components/skeletons/PageLoadingSkeleton";
import { RegionWelcomeBanner } from "./components/RegionWelcomeBanner";

// Initialize global error handlers for uncaught errors
initializeGlobalErrorHandler();
// Lazy load route components for better performance
const Finder = lazy(() => import("./pages/Finder"));
const Brands = lazy(() => import("./pages/Brands"));
const Compare = lazy(() => import("./pages/Compare"));
const MaterialCompare = lazy(() => import("./pages/MaterialCompare"));
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
const AdminMaintenanceArchive = lazy(() => import("./pages/AdminMaintenanceArchive"));
const AdminPrinters = lazy(() => import("./pages/AdminPrinters"));
const AdminDataQuality = lazy(() => import("./pages/AdminDataQuality"));
const AdminFilaments = lazy(() => import("./pages/AdminFilaments"));
const AdminAmazonLinks = lazy(() => import("./pages/AdminAmazonLinks"));
const AdminFilamentAudit = lazy(() => import("./pages/AdminFilamentAudit"));
const AdminBrands = lazy(() => import("./pages/AdminBrands"));
const AdminBrandPipeline = lazy(() => import("./pages/AdminBrandPipeline"));
const AdminDataHealth = lazy(() => import("./pages/AdminDataHealth"));
const AdminBrokenLinks = lazy(() => import("./pages/AdminBrokenLinks"));
const AdminDuplicates = lazy(() => import("./pages/AdminDuplicates"));
const AdminScheduler = lazy(() => import("./pages/AdminScheduler"));
const AdminPriceAnomalies = lazy(() => import("./pages/AdminPriceAnomalies"));
const AdminModuleAnalytics = lazy(() => import("./pages/AdminModuleAnalytics"));
const AdminFeaturedContent = lazy(() => import("./pages/AdminFeaturedContent"));
const AdminABTests = lazy(() => import("./pages/AdminABTests"));
const AdminDocs = lazy(() => import("./pages/AdminDocs"));
const AdminFieldCoverage = lazy(() => import("./pages/AdminFieldCoverage"));
const AdminFilamentScraper = lazy(() => import("./pages/AdminFilamentScraper"));
const AdminSiteSettings = lazy(() => import("./pages/AdminSiteSettings"));
const AdminRegionalStores = lazy(() => import("./pages/AdminRegionalStores"));
const AdminExchangeRates = lazy(() => import("./pages/AdminExchangeRates"));
const FilamentDetail = lazy(() => import("./pages/FilamentDetail"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const Vault = lazy(() => import("./pages/Vault"));
const SharedWishlist = lazy(() => import("./pages/SharedWishlist"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Printers = lazy(() => import("./pages/Printers"));
const PrinterCompare = lazy(() => import("./pages/PrinterCompare"));
const PrinterDetail = lazy(() => import("./pages/PrinterDetail"));
const Accessories = lazy(() => import("./pages/Accessories"));
const HotendDetail = lazy(() => import("./pages/HotendDetail"));
const BuildPlateDetail = lazy(() => import("./pages/BuildPlateDetail"));
const AMSDetail = lazy(() => import("./pages/AMSDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const ReferenceSlicers = lazy(() => import("./pages/ReferenceSlicers"));
const ReferenceCAD = lazy(() => import("./pages/ReferenceCAD"));
const ReferenceRepos = lazy(() => import("./pages/ReferenceRepos"));
const ReferenceInfluencers = lazy(() => import("./pages/ReferenceInfluencers"));
const ReferenceSpecialty = lazy(() => import("./pages/ReferenceSpecialty"));
const ReferenceMethodology = lazy(() => import("./pages/ReferenceMethodology"));
const HueForgeFinder = lazy(() => import("./pages/HueForgeFinder"));
const TDDatabase = lazy(() => import("./pages/TDDatabase"));
const QuizScoringTest = lazy(() => import("./components/reference/repos/quiz/QuizScoringTest"));
const LearningCenter = lazy(() => import("./pages/LearningCenter"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
const BrandComparePage = lazy(() => import("./pages/BrandComparePage"));
const GuidePrintSettings = lazy(() => import("./pages/GuidePrintSettings"));
const GuideTroubleshooting = lazy(() => import("./pages/GuideTroubleshooting"));
const ResourcesProfiles = lazy(() => import("./pages/ResourcesProfiles"));
const Install = lazy(() => import("./pages/Install"));

import { DEFAULT_QUERY_OPTIONS } from "@/lib/queryConfig";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: DEFAULT_QUERY_OPTIONS,
  },
});

// Navbar no longer needs compatible count - printer selector moved to hero section

const App = () => (
  <ErrorBoundary>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <RegionProvider>
        <CurrencyProvider>
          <CompatibleCountProvider>
          <CompareProvider>
            <PrinterCompareProvider>
              <BrandCompareProvider>
              <TooltipProvider>
                <ScreenReaderAnnouncerProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <GlobalKeyboardHandler>
                {/* WCAG 2.1 AA: Skip to main content link */}
                <SkipLink />
                {/* PWA: Offline indicator */}
                <OfflineBanner />
                <MaintenanceModeWrapper>
                <RegionWelcomeBanner />
                <Navbar />
                <Suspense fallback={<PageLoadingSkeleton />}>
                  {/* Main content landmark for accessibility */}
                  <main id="main-content" tabIndex={-1} className="outline-none">
                  <Routes>
                  <Route path="/" element={<Finder />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/brands/compare" element={<BrandComparePage />} />
                  <Route path="/brands/:brand" element={<BrandDetail />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/materials/compare" element={<MaterialCompare />} />
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
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/vault" element={<Vault />} />
                  <Route path="/wishlist/:shareCode" element={<SharedWishlist />} />
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/import" element={<AdminImport />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/enrichment" element={<AdminEnrichment />} />
                  <Route path="/admin/affiliates" element={<AdminAffiliates />} />
                  <Route path="/admin/maintenance" element={<AdminMaintenance />} />
                  <Route path="/admin/maintenance/archive" element={<AdminMaintenanceArchive />} />
                  <Route path="/admin/printers" element={<AdminPrinters />} />
                  <Route path="/admin/data-quality" element={<AdminDataQuality />} />
                  <Route path="/admin/filaments" element={<AdminFilaments />} />
                  <Route path="/admin/amazon-links" element={<AdminAmazonLinks />} />
                  <Route path="/admin/filament-audit" element={<AdminFilamentAudit />} />
                  <Route path="/admin/brands" element={<AdminBrands />} />
                  <Route path="/admin/brand-pipeline" element={<AdminBrandPipeline />} />
                  <Route path="/admin/data-health" element={<AdminDataHealth />} />
                  <Route path="/admin/broken-links" element={<AdminBrokenLinks />} />
                  <Route path="/admin/duplicates" element={<AdminDuplicates />} />
                  <Route path="/admin/scheduler" element={<AdminScheduler />} />
                  <Route path="/admin/price-anomalies" element={<AdminPriceAnomalies />} />
                  <Route path="/admin/module-analytics" element={<AdminModuleAnalytics />} />
                  <Route path="/admin/featured-content" element={<AdminFeaturedContent />} />
                  <Route path="/admin/ab-tests" element={<AdminABTests />} />
                  <Route path="/admin/docs" element={<AdminDocs />} />
                  <Route path="/admin/field-coverage" element={<AdminFieldCoverage />} />
                  <Route path="/admin/filament-scraper" element={<AdminFilamentScraper />} />
                  <Route path="/admin/site-settings" element={<AdminSiteSettings />} />
                  <Route path="/admin/regional-stores" element={<AdminRegionalStores />} />
                  <Route path="/admin/exchange-rates" element={<AdminExchangeRates />} />
                  <Route path="/filament/:id" element={<FilamentDetail />} />
                  <Route path="/reference/slicers" element={<ReferenceSlicers />} />
                  <Route path="/reference/cad" element={<ReferenceCAD />} />
                  <Route path="/reference/repos" element={<ReferenceRepos />} />
                  <Route path="/reference/influencers" element={<ReferenceInfluencers />} />
                  <Route path="/reference/specialty" element={<ReferenceSpecialty />} />
                  <Route path="/reference/methodology" element={<ReferenceMethodology />} />
                  <Route path="/reference/repos/quiz-test" element={<QuizScoringTest />} />
                  <Route path="/hueforge-filaments" element={<HueForgeFinder />} />
                  <Route path="/td-database" element={<TDDatabase />} />
                  <Route path="/learn" element={<LearningCenter />} />
                  <Route path="/learn/:slug" element={<GuideDetail />} />
                  <Route path="/guides/print-settings" element={<GuidePrintSettings />} />
                  <Route path="/guides/troubleshooting" element={<GuideTroubleshooting />} />
                  <Route path="/resources/profiles" element={<ResourcesProfiles />} />
                  <Route path="/install" element={<Install />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                  </main>
              </Suspense>
              <CompareTray />
                <PrinterCompareBar />
                <BrandCompareBar />
                {/* PWA: Install prompt banner */}
                <PWAInstallBanner />
                <SiteFooter />
                </MaintenanceModeWrapper>
                </GlobalKeyboardHandler>
              </BrowserRouter>
                </ScreenReaderAnnouncerProvider>
            </TooltipProvider>
              </BrandCompareProvider>
          </PrinterCompareProvider>
        </CompareProvider>
          </CompatibleCountProvider>
        </CurrencyProvider>
      </RegionProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;
