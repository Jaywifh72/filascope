import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

// Sitemap redirect — sends browsers and crawlers to the edge function that generates dynamic XML
const SITEMAP_EDGE_BASE = "https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=";
function SitemapRedirect({ path }: { path: string }) {
  useEffect(() => {
    window.location.replace(SITEMAP_EDGE_BASE + encodeURIComponent(path));
  }, [path]);
  return null;
}

// Redirect /admin/* to /old-admin/*
function AdminRedirect() {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/admin/, '/old-admin');
  return <Navigate to={newPath + location.search + location.hash} replace />;
}
import { HelmetProvider } from "react-helmet-async";
import Navbar from "./components/Navbar";
import { MobileBottomTabBar } from "./components/navigation/MobileBottomTabBar";
import { ScrollProgressBar } from "./components/ScrollProgressBar";
import { useCelebrationMilestones } from "./hooks/useCelebrationMilestones";

/** Mounts celebration milestone tracking inside BrowserRouter */
function CelebrationMilestoneTracker() {
  useCelebrationMilestones();
  return null;
}
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
// GA4 loaded via index.html <script> tag — no dynamic injection needed
import { GA4RouteTracker } from "./components/analytics/GA4RouteTracker";
import { AIReferralTracker } from "./components/analytics/AIReferralTracker";
import { usePageTracking } from "./hooks/usePageTracking";
import { PageLoadingSkeleton } from "./components/skeletons/PageLoadingSkeleton";
import { RegionWelcomeBanner } from "./components/RegionWelcomeBanner";
import { CanonicalLink } from "./components/seo/CanonicalLink";
import { HreflangTags } from "./components/seo/HreflangTags";
import { useSchemaValidator } from "./hooks/useSchemaValidator";

// Dev-only schema validation runner (tree-shaken in production)
function SchemaValidatorRunner() {
  useSchemaValidator();
  return null;
}

// Lazy-load heavy global overlays that aren't needed at initial render
const CompareTray = lazy(() => import("./components/CompareTray").then(m => ({ default: m.CompareTray })));
const UnifiedCompareTray = lazy(() => import("./components/compare/UnifiedCompareTray").then(m => ({ default: m.UnifiedCompareTray })));
const UnifiedMobileCompareTray = lazy(() => import("./components/compare/UnifiedMobileCompareTray").then(m => ({ default: m.UnifiedMobileCompareTray })));
const BrandCompareBar = lazy(() => import("./components/brands/BrandCompare").then(m => ({ default: m.BrandCompareBar })));
const PWAInstallBanner = lazy(() => import("./components/pwa").then(m => ({ default: m.PWAInstallBanner })));

// Initialize global error handlers for uncaught errors
initializeGlobalErrorHandler();
// GA4 initialized via index.html <script> tag — initGA() removed to prevent double-loading
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
const DataQualityDashboard = lazy(() => import("./pages/admin/DataQualityDashboard"));
const SyncMonitor = lazy(() => import("./pages/admin/SyncMonitor"));
const AdminPriceImport = lazy(() => import("./pages/AdminPriceImport"));
const AdminStores = lazy(() => import("./pages/AdminStores"));
const AdminAffiliateHub = lazy(() => import("./pages/AdminAffiliateHub"));
const AdminPricingData = lazy(() => import("./pages/admin/PricingData"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminSearchAnalytics = lazy(() => import("./pages/admin/SearchAnalytics"));
const AdminLinkHealth = lazy(() => import("./pages/AdminLinkHealth"));
const AdminNewLayoutModule = lazy(() => import("./components/admin/AdminNewLayout").then(m => ({ default: m.AdminNewLayout })));
const PrinterUrlHealth = lazy(() => import("./pages/admin/PrinterUrlHealth"));
const PriceSync = lazy(() => import("./pages/admin/PriceSync"));
const PrinterPriceAudit = lazy(() => import("./pages/admin/PrinterPriceAudit"));
const AdminTdManagement = lazy(() => import("./pages/admin/TdManagement"));
const AdminFilamentOnboarding = lazy(() => import("./pages/admin/BrandCatalogSync"));
const AdminAffiliatesNew = lazy(() => import("./pages/admin/Affiliates"));
const FilamentDetail = lazy(() => import("./pages/FilamentDetail"));
const FilamentCategoryPage = lazy(() => import("./pages/FilamentCategoryPage"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const Vault = lazy(() => import("./pages/Vault"));
const SharedWishlist = lazy(() => import("./pages/SharedWishlist"));
const PublicCollection = lazy(() => import("./pages/PublicCollection"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Printers = lazy(() => import("./pages/Printers"));
const PrinterCategoryPage = lazy(() => import("./pages/PrinterCategoryPage"));
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
const HueForgeTDDatabase = lazy(() => import("./pages/HueForgeTDDatabase"));
const HueForgeSubstituteFinder = lazy(() => import("./pages/HueForgeSubstituteFinder"));
const HueForgeLayerPreview = lazy(() => import("./pages/HueForgeLayerPreview"));
const HueForgeColorMatcher = lazy(() => import("./pages/HueForgeColorMatcher"));
const HueForgeProjectPlanner = lazy(() => import("./pages/HueForgeProjectPlanner"));
const HueForgeTools = lazy(() => import("./pages/HueForgeTools"));
const HueForgePaletteBuilder = lazy(() => import("./pages/HueForgePaletteBuilder"));
const QuizScoringTest = lazy(() => import("./components/reference/repos/quiz/QuizScoringTest"));
const LearningCenter = lazy(() => import("./pages/LearningCenter"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
const BrandComparePage = lazy(() => import("./pages/BrandComparePage"));
const GuidePrintSettings = lazy(() => import("./pages/GuidePrintSettings"));
const GuideTroubleshooting = lazy(() => import("./pages/GuideTroubleshooting"));
const BuyingGuide = lazy(() => import("./pages/BuyingGuide"));
const HueForgeWhatIsTD = lazy(() => import("./pages/guides/HueForgeWhatIsTD"));
const BestWhiteFilamentsForHueForge = lazy(() => import("./pages/guides/BestWhiteFilamentsForHueForge"));
const HowToMeasureFilamentTD = lazy(() => import("./pages/guides/HowToMeasureFilamentTD"));
const EmbedProduct = lazy(() => import("./pages/EmbedProduct"));
const ResourcesProfiles = lazy(() => import("./pages/ResourcesProfiles"));
const Install = lazy(() => import("./pages/Install"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AffiliateDisclosure = lazy(() => import("./pages/AffiliateDisclosure"));
const About = lazy(() => import("./pages/About"));
const Methodology = lazy(() => import("./pages/Methodology"));
const MaterialKnowledgeBase = lazy(() => import("./pages/MaterialKnowledgeBase"));
const CompatibilityMatrix = lazy(() => import("./pages/CompatibilityMatrix"));
const SlicerDirectory = lazy(() => import("./pages/SlicerDirectory"));
const ModelRepositories = lazy(() => import("./pages/ModelRepositories"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const RequestFeature = lazy(() => import("./pages/RequestFeature"));
const BestFilamentsForHueForge = lazy(() => import("./pages/BestFilamentsForHueForge"));
const HueForgeHub = lazy(() => import("./pages/learn/HueForgeHub"));
const PLAVsPETG = lazy(() => import("./pages/PLAVsPETG"));
const PLAvsABS = lazy(() => import("./pages/PLAvsABS"));
const PETGvsABS = lazy(() => import("./pages/PETGvsABS"));
const TPUvsPETG = lazy(() => import("./pages/TPUvsPETG"));
const NylonvsPETG = lazy(() => import("./pages/NylonvsPETG"));
const HowToChooseFilament = lazy(() => import("./pages/HowToChooseFilament"));
const FilamentTypesExplained = lazy(() => import("./pages/FilamentTypesExplained"));
const BestWhiteFilaments = lazy(() => import("./pages/BestWhiteFilaments"));
const FilamentDatabase = lazy(() => import("./pages/FilamentDatabase"));
const MaterialHub = lazy(() => import("./pages/MaterialHub"));
const BrandMaterialPage = lazy(() => import("./pages/BrandMaterialPage"));
const ColorFamilyPage = lazy(() => import("./pages/ColorFamilyPage"));
const BestFilamentsForBeginners = lazy(() => import("./pages/BestFilamentsForBeginners"));
const FilamentTemperatureGuide = lazy(() => import("./pages/FilamentTemperatureGuide"));
const FilamentStorageGuide = lazy(() => import("./pages/FilamentStorageGuide"));
const BestFilament = lazy(() => import("./pages/BestFilament"));
const CheapestFilament = lazy(() => import("./pages/CheapestFilament"));
const FilamentTypes = lazy(() => import("./pages/FilamentTypes"));
const FilamentPrinterCompatibility = lazy(() => import("./pages/FilamentPrinterCompatibility"));

import { DEFAULT_QUERY_OPTIONS } from "@/lib/queryConfig";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: DEFAULT_QUERY_OPTIONS,
  },
});

// Navbar no longer needs compatible count - printer selector moved to hero section

// eslint-disable-next-line react-refresh/only-export-components
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
                {/* SEO: Static defaults live in index.html; page-specific overrides use useDocumentHead hook */}
                {/* SEO: Canonical link for all pages */}
                <CanonicalLink />
                {/* SEO: hreflang for multi-region international SEO */}
                <HreflangTags />
                <GA4RouteTracker />
                <AIReferralTracker />
                <SchemaValidatorRunner />
                <CelebrationMilestoneTracker />
                <GlobalKeyboardHandler>
                {/* WCAG 2.1 AA: Skip to main content link */}
                <SkipLink />
                {/* PWA: Offline indicator + update notifier */}
                <OfflineBanner />
                <SWUpdateNotifier />
                <MaintenanceModeWrapper>
                <RegionWelcomeBanner />
                <ScrollProgressBar />
                <Navbar />
                <Suspense fallback={<PageLoadingSkeleton />}>
                  {/* Main content landmark for accessibility */}
                  <main id="main-content" tabIndex={-1} className="outline-none pb-20 md:pb-0">
                  <Routes>
                  <Route path="/" element={<Finder />} />
                  <Route path="/finder" element={<Finder />} />
                  <Route path="/filaments" element={<FilamentCategoryPage />} />
                  <Route path="/filaments/:slug" element={<FilamentCategoryPage />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/brands/compare" element={<BrandComparePage />} />
                  <Route path="/brands/:brand/:material" element={<BrandMaterialPage />} />
                  <Route path="/brands/:brand" element={<BrandDetail />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/materials/compare" element={<MaterialCompare />} />
                  <Route path="/materials/:slug" element={<MaterialHub />} />
                  <Route path="/printers" element={<Printers />} />
                  {/* Category routes MUST come before :id wildcard */}
                  <Route path="/printers/compare" element={<PrinterCompare />} />
                  <Route path="/printers/brand/:brand" element={<PrinterCategoryPage />} />
                  <Route path="/printers/enclosed" element={<PrinterCategoryPage />} />
                  <Route path="/printers/multi-color" element={<PrinterCategoryPage />} />
                  <Route path="/printers/high-speed" element={<PrinterCategoryPage />} />
                  <Route path="/printers/large-format" element={<PrinterCategoryPage />} />
                  <Route path="/printers/corexy" element={<PrinterCategoryPage />} />
                  <Route path="/printers/bed-slinger" element={<PrinterCategoryPage />} />
                  <Route path="/printers/direct-drive" element={<PrinterCategoryPage />} />
                  <Route path="/printers/under-300" element={<PrinterCategoryPage />} />
                  <Route path="/printers/under-500" element={<PrinterCategoryPage />} />
                  <Route path="/printers/under-1000" element={<PrinterCategoryPage />} />
                  <Route path="/printers/:id" element={<PrinterDetail />} />
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
                  <Route path="/admin" element={<AdminNewLayoutModule><NewAdminPanel /></AdminNewLayoutModule>} />
                  <Route path="/admin/affiliate-hub" element={<AdminNewLayoutModule><AdminAffiliateHub /></AdminNewLayoutModule>} />
                  <Route path="/admin/pricing-data" element={<AdminNewLayoutModule><AdminPricingData /></AdminNewLayoutModule>} />
                  <Route path="/admin/analytics" element={<AdminNewLayoutModule><AdminAnalytics /></AdminNewLayoutModule>} />
                  <Route path="/admin/search-analytics" element={<AdminNewLayoutModule><AdminSearchAnalytics /></AdminNewLayoutModule>} />
                  <Route path="/admin/link-health" element={<AdminNewLayoutModule><AdminLinkHealth /></AdminNewLayoutModule>} />
                  <Route path="/admin/printer-url-health" element={<AdminNewLayoutModule><PrinterUrlHealth /></AdminNewLayoutModule>} />
                  <Route path="/admin/price-sync" element={<AdminNewLayoutModule><PriceSync /></AdminNewLayoutModule>} />
                  <Route path="/admin/price-audit" element={<AdminNewLayoutModule><PrinterPriceAudit /></AdminNewLayoutModule>} />
                  <Route path="/admin/td-management" element={<AdminNewLayoutModule><AdminTdManagement /></AdminNewLayoutModule>} />
                  <Route path="/admin/filament-onboarding" element={<AdminNewLayoutModule><AdminFilamentOnboarding /></AdminNewLayoutModule>} />
                  <Route path="/admin/affiliates" element={<AdminNewLayoutModule><AdminAffiliatesNew /></AdminNewLayoutModule>} />
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
                  <Route path="/old-admin/data-quality-dashboard" element={<DataQualityDashboard />} />
                  <Route path="/old-admin/sync-monitor" element={<SyncMonitor />} />
                  <Route path="/old-admin/affiliate-hub" element={<Navigate to="/admin/affiliate-hub" replace />} />
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
                  <Route path="/colors/:family" element={<ColorFamilyPage />} />
                  <Route path="/td-database" element={<TDDatabase />} />
                  <Route path="/hueforge-td-database" element={<HueForgeTDDatabase />} />
                  <Route path="/hueforge-filament-substitute-finder" element={<HueForgeSubstituteFinder />} />
                  <Route path="/hueforge-layer-preview" element={<HueForgeLayerPreview />} />
                  <Route path="/hueforge-color-matcher" element={<HueForgeColorMatcher />} />
                  <Route path="/hueforge-project-planner" element={<HueForgeProjectPlanner />} />
                  <Route path="/hueforge-tools" element={<HueForgeTools />} />
                  <Route path="/hueforge-palette-builder" element={<HueForgePaletteBuilder />} />
                  <Route path="/learn" element={<LearningCenter />} />
                  <Route path="/learn/hueforge" element={<Navigate to="/guides/what-is-hueforge-td" replace />} />
                  <Route path="/learn/:slug" element={<GuideDetail />} />
                  <Route path="/guides/print-settings" element={<GuidePrintSettings />} />
                  <Route path="/guides/troubleshooting" element={<GuideTroubleshooting />} />
                  <Route path="/guides/what-is-hueforge-td" element={<HueForgeWhatIsTD />} />
                  <Route path="/guides/best-white-filaments-for-hueforge" element={<BestWhiteFilamentsForHueForge />} />
                  <Route path="/guides/how-to-measure-filament-td" element={<HowToMeasureFilamentTD />} />
                  <Route path="/guides/pla-vs-petg" element={<PLAVsPETG />} />
                  <Route path="/guides/pla-vs-abs" element={<PLAvsABS />} />
                  <Route path="/guides/petg-vs-abs" element={<PETGvsABS />} />
                  <Route path="/guides/tpu-vs-petg" element={<TPUvsPETG />} />
                  <Route path="/guides/nylon-vs-petg" element={<NylonvsPETG />} />
                  <Route path="/guides/how-to-choose-3d-printer-filament" element={<HowToChooseFilament />} />
                  <Route path="/guides/3d-printer-filament-types-explained" element={<FilamentTypesExplained />} />
                  <Route path="/guides/best-filaments-for-beginners" element={<BestFilamentsForBeginners />} />
                  <Route path="/guides/best-filaments-for-hueforge" element={<BestFilamentsForHueForge />} />
                  <Route path="/guides/:slug" element={<BuyingGuide />} />
                  <Route path="/resources/profiles" element={<ResourcesProfiles />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/affiliate-disclosure" element={<AffiliateDisclosure />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/methodology" element={<Methodology />} />
                  <Route path="/reference/materials" element={<MaterialKnowledgeBase />} />
                  <Route path="/material-encyclopedia" element={<Navigate to="/reference/materials" replace />} />
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
                  <Route path="/knowledge-base" element={<Navigate to="/reference/materials" replace />} />
                  <Route path="/best-filaments-for-hueforge" element={<Navigate to="/guides/best-filaments-for-hueforge" replace />} />
                  <Route path="/pla-vs-petg" element={<Navigate to="/guides/pla-vs-petg" replace />} />
                  <Route path="/best-white-filaments" element={<BestWhiteFilaments />} />
                  <Route path="/filament-database" element={<FilamentDatabase />} />
                  <Route path="/best-filaments-for-beginners" element={<Navigate to="/guides/best-filaments-for-beginners" replace />} />
                  <Route path="/guides/filament-temperature-guide" element={<FilamentTemperatureGuide />} />
                  <Route path="/filament-temperature-guide" element={<Navigate to="/guides/filament-temperature-guide" replace />} />
                  <Route path="/filament-storage-guide" element={<FilamentStorageGuide />} />
                  <Route path="/best-filament-for-ender-3" element={<Navigate to="/guides/best-filament-for-ender-3" replace />} />
                  <Route path="/best-filament-for-bambu-lab-a1" element={<Navigate to="/guides/best-filament-for-bambu-lab-a1" replace />} />
                  {/* Redirects: old guide slugs → canonical /guides/ pages */}
                  <Route path="/guides/best-filament-for-beginners-2025" element={<Navigate to="/guides/best-filaments-for-beginners" replace />} />
                  <Route path="/guides/beginners-guide" element={<Navigate to="/guides/best-filaments-for-beginners" replace />} />
                  <Route path="/guides/hueforge-filaments" element={<Navigate to="/guides/best-filaments-for-hueforge" replace />} />
                  {/* Clean comparison URL redirects */}
                  <Route path="/petg-vs-abs" element={<Navigate to="/materials/compare?a=petg&b=abs" replace />} />
                  <Route path="/pla-vs-abs" element={<Navigate to="/materials/compare?a=pla&b=abs" replace />} />
                  <Route path="/asa-vs-abs" element={<Navigate to="/materials/compare?a=asa&b=abs" replace />} />
                  <Route path="/tpu-vs-pla" element={<Navigate to="/materials/compare?a=tpu&b=pla" replace />} />
                  <Route path="/nylon-vs-petg" element={<Navigate to="/materials/compare?a=nylon&b=petg" replace />} />
                  {/* Sitemap routes — _redirects 302s aren't honoured on Lovable hosting, so redirect here */}
                  <Route path="/sitemap.xml"           element={<SitemapRedirect path="/sitemap.xml" />} />
                  <Route path="/sitemap-pages.xml"     element={<SitemapRedirect path="/sitemap-pages.xml" />} />
                  <Route path="/sitemap-filaments.xml" element={<SitemapRedirect path="/sitemap-filaments.xml" />} />
                  <Route path="/sitemap-brands.xml"    element={<SitemapRedirect path="/sitemap-brands.xml" />} />
                  <Route path="/sitemap-printers.xml"  element={<SitemapRedirect path="/sitemap-printers.xml" />} />
                  <Route path="/sitemap-guides.xml"    element={<SitemapRedirect path="/sitemap-guides.xml" />} />
                  <Route path="/sitemap-colors.xml"    element={<SitemapRedirect path="/sitemap-colors.xml" />} />
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
              <MobileBottomTabBar />
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
