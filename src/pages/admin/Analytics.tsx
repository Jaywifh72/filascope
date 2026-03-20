import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import { AffiliatePanel } from "@/components/admin/analytics/AffiliatePanel";
import { ContentMetricsPanel } from "@/components/admin/analytics/ContentMetricsPanel";
import { SearchPanel } from "@/components/admin/analytics/SearchPanel";
import { TrafficOverviewPanel } from "@/components/admin/analytics/TrafficOverviewPanel";
import { SeoHealthPanel } from "@/components/admin/analytics/SeoHealthPanel";
import { ContentGapsPanel } from "@/components/admin/analytics/ContentGapsPanel";
import { SearchConsolePanel } from "@/components/admin/analytics/SearchConsolePanel";
import SeoCommandCenter from "@/components/admin/analytics/SeoCommandCenter";

export default function Analytics() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <AdminPageHeader
          title="Analytics Dashboard"
          description="Traffic overview, affiliate performance, search insights, SEO health, content gaps, and Search Console data"
          icon={BarChart3}
        />

        <Tabs defaultValue="traffic" className="space-y-6">
          <TabsList className="h-auto flex-wrap gap-1">
            <TabsTrigger value="traffic">Traffic Overview</TabsTrigger>
            <TabsTrigger value="affiliate">Affiliate Performance</TabsTrigger>
            <TabsTrigger value="search">Search Insights</TabsTrigger>
            <TabsTrigger value="content">Content Metrics</TabsTrigger>
            <TabsTrigger value="seo">SEO Health</TabsTrigger>
            <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
            <TabsTrigger value="gsc">Search Console</TabsTrigger>
            <TabsTrigger value="command" className="bg-primary/10 text-primary font-semibold">SEO Command Center</TabsTrigger>
          </TabsList>

          <TabsContent value="traffic">
            <TrafficOverviewPanel />
          </TabsContent>

          <TabsContent value="affiliate">
            <AffiliatePanel />
          </TabsContent>

          <TabsContent value="search">
            <SearchPanel />
          </TabsContent>

          <TabsContent value="content">
            <ContentMetricsPanel />
          </TabsContent>

          <TabsContent value="seo">
            <SeoHealthPanel />
          </TabsContent>

          <TabsContent value="gaps">
            <ContentGapsPanel />
          </TabsContent>

          <TabsContent value="gsc">
            <SearchConsolePanel />
          </TabsContent>

          <TabsContent value="command">
            <SeoCommandCenter />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

