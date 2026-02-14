import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";

// Redirect /admin/* to /old-admin/*
function AdminRedirect() {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/admin/, '/old-admin');
  return <Navigate to={newPath + location.search + location.hash} replace />;
}
import { HelmetProvider } from "react-helmet-async";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeProvider";
import { SiteFooter } from "./components/SiteFooter";
import { RegionProvider } from "./contexts/RegionContext";
import { CurrencyProvider } from "./hooks/useCurrency";
import { CompareProvider } from "./hooks/useCompare";
import { PrinterCompareProvider } from "./hooks/usePrinterCompare";
import { BrandCompareProvider } from "./hooks/useBrandCompare";
import { CompatibleCountProvider, useCompatibleCount } from "./hooks/useCompatibleCount";
import { MaintenanceModeWrapper } from "./components/MaintenanceModeWrapper";
import { SkipLink } from "./components/accessibility/SkipLink";
import { ScreenReaderAnnouncerProvider } from "./components/accessibility/ScreenReaderAnnouncer";
import { GlobalKeyboardHandler } from "./components/accessibility/GlobalKeyboardHandler";
import { ErrorBoundary, initializeGlobalErrorHandler } from "./components/analytics/ErrorBoundary";
import { OfflineBanner, SWUpdateNotifier } from "./components/pwa";
import { PageLoadingSkeleton } from "./components/skeletons/PageLoadingSkeleton";
import { RegionWelcomeBanner } from "./components/RegionWelcomeBanner";
import { CanonicalLink } from "./components/seo/CanonicalLink";

// Lazy-load heavy global overlays that aren't needed at initial render
const CompareTray = lazy(() => import("./components/CompareTray").then(m => ({ default: m.CompareTray })));
const UnifiedCompareTray = lazy(() => import("./components/compare/UnifiedCompareTray").then(m => ({ default: m.UnifiedCompareTray })));
const UnifiedMobileCompareTray = lazy(() => import("./components/compare/UnifiedMobileCompareTray").then(m => ({ default: m.UnifiedMobileCompareTray })));
const BrandCompareBar = lazy(() => import("./components/brands/BrandCompare").then(m => ({ default: m.BrandCompareBar })));
const PWAInstallBanner = lazy(() => import("./components/pwa").then(m => ({ default: m.PWAInstallBanner })));

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
const NewAdminPanel = lazy(() => import("./pages/NewAdminPanel"));
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
const AdminStoreUrls = lazy(() => import("./pages/AdminStoreUrls"));
const AdminPriceVerification = lazy(() => import("./pages/AdminPriceVerification"));
const AdminBrandExtraction = lazy(() => import("./pages/AdminBrandExtraction"));
const AdminBrokenUrls = lazy(() => import("./pages/AdminBrokenUrls"));
const AdminInventory = lazy(() => import("./pages/admin/InventoryManagement"));
const AdminExportData = lazy(() => import("./pages/admin/ExportData"));
const AdminRegionTest = lazy(() => import("./pages/AdminRegionTest"));
const AdminRegionalExpansion = lazy(() => import("./pages/AdminRegionalExpansion"));
const AdminPriceFreshness = lazy(() => import("./pages/AdminPriceFreshness"));
const AdminPriceImport = lazy(() => import("./pages/AdminPriceImport"));
const AdminStores = lazy(() => import("./pages/AdminStores"));
const AdminAffiliateHub = lazy(() => import("./pages/AdminAffiliateHub"));
const FilamentDetail = lazy(() => import("./pages/FilamentDetail"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const Vault = lazy(() => import("./pages/Vault"));
const SharedWishlist = lazy(() => import("./pages/SharedWishlist"));
const PublicCollection = lazy(() => import("./pages/PublicCollection"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Printers = lazy(() => import("./pages/Printers"));
const PrinterCompare = lazy(() => import("./pages/PrinterCompare"));
const PrinterDetail = lazy(() => import("./pages/PrinterDetail"));
const Accessories = lazy(() => import("./pages/Accessories"));
const HotendDetail = lazy(() => import("./pages/HotendDetail"));
const BuildPlateDetail = lazy(() => import("./pages/BuildPlateDetail"));
const AMSDetail = lazy(() => import("./pages/AMSDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const ReferenceSlicers = lazy(() => import("./pages/ReferenceSlicers"));
const ReferenceCAD = lazy(() => import("./pages/ReferenceCAD"));
const ReferenceRepos = lazy(() => import("./pages/ReferenceRepos"));
const ReferenceInfluencers = lazy(() => import("./pages/ReferenceInfluencers"));
const ReferenceSpecialty = lazy(() => import("./pages/ReferenceSpecialty"));
const ReferenceMethodology = lazy(() => import("./pages/ReferenceMethodology"));
const HueForgeFinder = lazy(() => import("./pages/HueForgeFinder"));
const ColorFinder = lazy(() => import("./pages/ColorFinder"));
const TDDatabase = lazy(() => import("./pages/TDDatabase"));
const QuizScoringTest = lazy(() => import("./components/reference/repos/quiz/QuizScoringTest"));
const LearningCenter = lazy(() => import("./pages/LearningCenter"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
const BrandComparePage = lazy(() => import("./pages/BrandComparePage"));
const GuidePrintSettings = lazy(() => import("./pages/GuidePrintSettings"));
const GuideTroubleshooting = lazy(() => import("./pages/GuideTroubleshooting"));
const BuyingGuide = lazy(() => import("./pages/BuyingGuide"));
const EmbedProduct = lazy(() => import("./pages/EmbedProduct"));
const ResourcesProfiles = lazy(() => import("./pages/ResourcesProfiles"));
const Install = lazy(() => import("./pages/Install"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AffiliateDisclosure = lazy(() => import("./pages/AffiliateDisclosure"));
const About = lazy(() => import("./pages/About"));
const Methodology = lazy(() => import("./pages/Methodology"));
// MaterialEncyclopedia route redirects to /compare
const CompatibilityMatrix = lazy(() => import("./pages/CompatibilityMatrix"));
const SlicerDirectory = lazy(() => import("./pages/SlicerDirectory"));
const ModelRepositories = lazy(() => import("./pages/ModelRepositories"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const RequestFeature = lazy(() => import("./pages/RequestFeature"));

import { DEFAULT_QUERY_OPTIONS } from "@/lib/queryConfig";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: DEFAULT_QUERY_OPTIONS,
  },
});

// Navbar no longer needs compatible count - printer selector moved to hero section

const App = () => (
  <ErrorBoundary>
  <ThemeProvider>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
                {/* SEO: Canonical link for all pages */}
                <CanonicalLink />
                <GlobalKeyboardHandler>
                {/* WCAG 2.1 AA: Skip to main content link */}
                <SkipLink />
                {/* PWA: Offline indicator + update notifier */}
                <OfflineBanner />
                <SWUpdateNotifier />
                <MaintenanceModeWrapper>
                <RegionWelcomeBanner />
                <Navbar />
                <Suspense fallback={<PageLoadingSkeleton />}>
                  {/* Main content landmark for accessibility */}
                  <main id="main-content" tabIndex={-1} className="outline-none">
                  <Routes>
                  <Route path="/" element={<Finder />} />
                  <Route path="/finder" element={<Finder />} />
                  <Route path="/filaments" element={<Navigate to="/" replace />} />
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
                  <Route path="/collections/:username/:slug" element={<PublicCollection />} />
                  <Route path="/admin" element={<NewAdminPanel />} />
                  <Route path="/admin/*" element={<AdminRedirect />} />
                  <Route path="/old-admin" element={<Navigate to="/old-admin/dashboard" replace />} />
                  <Route path="/old-admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/old-admin/import" element={<AdminImport />} />
                  <Route path="/old-admin/users" element={<AdminUsers />} />
                  <Route path="/old-admin/enrichment" element={<AdminEnrichment />} />
                  <Route path="/old-admin/affiliates" element={<AdminAffiliates />} />
                  <Route path="/old-admin/maintenance" element={<AdminMaintenance />} />
                  <Route path="/old-admin/maintenance/archive" element={<AdminMaintenanceArchive />} />
                  <Route path="/old-admin/printers" element={<AdminPrinters />} />
                  <Route path="/old-admin/data-quality" element={<AdminDataQuality />} />
                  <Route path="/old-admin/filaments" element={<AdminFilaments />} />
                  <Route path="/old-admin/amazon-links" element={<AdminAmazonLinks />} />
                  <Route path="/old-admin/filament-audit" element={<AdminFilamentAudit />} />
                  <Route path="/old-admin/brands" element={<AdminBrands />} />
                  <Route path="/old-admin/brand-pipeline" element={<AdminBrandPipeline />} />
                  <Route path="/old-admin/data-health" element={<AdminDataHealth />} />
                  <Route path="/old-admin/broken-links" element={<AdminBrokenLinks />} />
                  <Route path="/old-admin/duplicates" element={<AdminDuplicates />} />
                  <Route path="/old-admin/scheduler" element={<AdminScheduler />} />
                  <Route path="/old-admin/price-anomalies" element={<AdminPriceAnomalies />} />
                  <Route path="/old-admin/module-analytics" element={<AdminModuleAnalytics />} />
                  <Route path="/old-admin/featured-content" element={<AdminFeaturedContent />} />
                  <Route path="/old-admin/ab-tests" element={<AdminABTests />} />
                  <Route path="/old-admin/docs" element={<AdminDocs />} />
                  <Route path="/old-admin/field-coverage" element={<AdminFieldCoverage />} />
                  <Route path="/old-admin/filament-scraper" element={<AdminFilamentScraper />} />
                  <Route path="/old-admin/site-settings" element={<AdminSiteSettings />} />
                  <Route path="/old-admin/regional-stores" element={<AdminRegionalStores />} />
                  <Route path="/old-admin/exchange-rates" element={<AdminExchangeRates />} />
                  <Route path="/old-admin/store-urls" element={<AdminStoreUrls />} />
                  <Route path="/old-admin/price-verification" element={<AdminPriceVerification />} />
                  <Route path="/old-admin/brand-extraction" element={<AdminBrandExtraction />} />
                  <Route path="/old-admin/broken-urls" element={<AdminBrokenUrls />} />
                  <Route path="/old-admin/inventory" element={<AdminInventory />} />
                  <Route path="/old-admin/export" element={<AdminExportData />} />
                  <Route path="/old-admin/region-test" element={<AdminRegionTest />} />
                  <Route path="/old-admin/regional-expansion" element={<AdminRegionalExpansion />} />
                  <Route path="/old-admin/price-freshness" element={<AdminPriceFreshness />} />
                  <Route path="/old-admin/price-import" element={<AdminPriceImport />} />
                  <Route path="/old-admin/stores" element={<AdminStores />} />
                  <Route path="/old-admin/affiliate-hub" element={<AdminAffiliateHub />} />
                  <Route path="/filament/:id" element={<FilamentDetail />} />
                  <Route path="/reference/slicers" element={<ReferenceSlicers />} />
                  <Route path="/reference/cad" element={<ReferenceCAD />} />
                  <Route path="/reference/repos" element={<ReferenceRepos />} />
                  <Route path="/reference/influencers" element={<ReferenceInfluencers />} />
                  <Route path="/reference/specialty" element={<ReferenceSpecialty />} />
                  <Route path="/reference/methodology" element={<ReferenceMethodology />} />
                  <Route path="/reference/repos/quiz-test" element={<QuizScoringTest />} />
                  <Route path="/hueforge-filaments" element={<HueForgeFinder />} />
                  <Route path="/colors" element={<ColorFinder />} />
                  <Route path="/td-database" element={<TDDatabase />} />
                  <Route path="/learn" element={<LearningCenter />} />
                  <Route path="/learn/:slug" element={<GuideDetail />} />
                  <Route path="/guides/print-settings" element={<GuidePrintSettings />} />
                  <Route path="/guides/troubleshooting" element={<GuideTroubleshooting />} />
                  <Route path="/guides/:slug" element={<BuyingGuide />} />
                  <Route path="/resources/profiles" element={<ResourcesProfiles />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/affiliate-disclosure" element={<AffiliateDisclosure />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/methodology" element={<Methodology />} />
                  <Route path="/material-encyclopedia" element={<Navigate to="/compare" replace />} />
                  <Route path="/compatibility-matrix" element={<CompatibilityMatrix />} />
                  <Route path="/slicer-directory" element={<SlicerDirectory />} />
                  <Route path="/model-repositories" element={<ModelRepositories />} />
                  <Route path="/roadmap" element={<Roadmap />} />
                  <Route path="/request-feature" element={<RequestFeature />} />
                  {/* Embed route — lightweight, no navbar/footer */}
                  <Route path="/embed/:id" element={<EmbedProduct />} />
                  {/* Public user profile */}
                  <Route path="/user/:userId" element={<UserProfile />} />
                  {/* Redirects for legacy/broken links */}
                  <Route path="/knowledge-base" element={<Navigate to="/compare" replace />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                  </main>
              </Suspense>
              <Suspense fallback={null}>
                <CompareTray />
                <UnifiedCompareTray />
                <UnifiedMobileCompareTray />
                <BrandCompareBar />
                {/* PWA: Install prompt banner */}
                <PWAInstallBanner />
              </Suspense>
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
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
