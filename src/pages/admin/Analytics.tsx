import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import { AffiliatePanel } from "@/components/admin/analytics/AffiliatePanel";
import { ContentMetricsPanel } from "@/components/admin/analytics/ContentMetricsPanel";
import { SearchPanel } from "@/components/admin/analytics/SearchPanel";
import { TrafficPanel } from "@/components/admin/analytics/TrafficPanel";
import { SeoHealthPanel } from "@/components/admin/analytics/SeoHealthPanel";
import { ContentGapsPanel } from "@/components/admin/analytics/ContentGapsPanel";
import { SearchConsolePanel } from "@/components/admin/analytics/SearchConsolePanel";

export default function Analytics() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <AdminPageHeader
          title="Analytics Dashboard"
          description="Affiliate performance, search insights, SEO health, content gaps, and Search Console data"
          icon={BarChart3}
        />

        <Tabs defaultValue="affiliate" className="space-y-6">
          <TabsList className="h-auto flex-wrap gap-1">
            <TabsTrigger value="affiliate">Affiliate Performance</TabsTrigger>
            <TabsTrigger value="content">Content Metrics</TabsTrigger>
            <TabsTrigger value="search">Search Insights</TabsTrigger>
            <TabsTrigger value="traffic">Traffic (GA4)</TabsTrigger>
            <TabsTrigger value="seo">SEO Health</TabsTrigger>
            <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
            <TabsTrigger value="gsc">Search Console</TabsTrigger>
          </TabsList>

          <TabsContent value="affiliate">
            <AffiliatePanel />
          </TabsContent>

          <TabsContent value="content">
            <ContentMetricsPanel />
          </TabsContent>

          <TabsContent value="search">
            <SearchPanel />
          </TabsContent>

          <TabsContent value="traffic">
            <TrafficPanel />
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
