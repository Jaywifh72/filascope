import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AmazonSyncDashboard } from '@/components/admin/amazon-sync/AmazonSyncDashboard';
import { AmazonDiscoveryPanel } from '@/components/admin/amazon-sync/AmazonDiscoveryPanel';
import { AmazonMappingManager } from '@/components/admin/amazon-sync/AmazonMappingManager';
import { AmazonSyncAuditLog } from '@/components/admin/amazon-sync/AmazonSyncAuditLog';

type Tab = 'dashboard' | 'discovery' | 'mappings' | 'audit';

export default function AmazonSync() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <ShoppingCart className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Amazon Filament Sync</h1>
            <p className="text-sm text-muted-foreground">
              Discover, map, and sync Amazon filament prices across all marketplaces
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={(v) => v && setActiveTab(v as Tab)}
        className="justify-start"
      >
        <ToggleGroupItem value="dashboard" className="gap-1.5 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
          Dashboard
        </ToggleGroupItem>
        <ToggleGroupItem value="discovery" className="gap-1.5 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
          Discovery
        </ToggleGroupItem>
        <ToggleGroupItem value="mappings" className="gap-1.5 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
          ASIN Manager
        </ToggleGroupItem>
        <ToggleGroupItem value="audit" className="gap-1.5 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
          Audit Log
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <AmazonSyncDashboard />}
      {activeTab === 'discovery' && <AmazonDiscoveryPanel />}
      {activeTab === 'mappings' && <AmazonMappingManager />}
      {activeTab === 'audit' && <AmazonSyncAuditLog />}
    </div>
  );
}
