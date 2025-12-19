import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBambuDataQuality, useDeleteBambuFilaments, type IssueType } from "@/hooks/useBambuDataQuality";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ChevronDown, 
  ChevronRight, 
  ShieldAlert,
  Trash2,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Link,
  Clock,
  FileWarning,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ISSUE_CONFIG: Record<IssueType, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  garbage_name: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10' },
  no_url: { icon: Link, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
  no_price: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
  suspicious_title: { icon: FileWarning, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  stale_data: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
};

function DataQualityScoreCard({ 
  qualityScore, 
  totalProducts, 
  validProducts, 
  issues 
}: { 
  qualityScore: number; 
  totalProducts: number; 
  validProducts: number;
  issues: { noUrl: number; noPrice: number; garbageName: number; staleData: number; suspiciousTitle: number };
}) {
  const scoreColor = qualityScore >= 80 ? 'text-green-600' : qualityScore >= 50 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = qualityScore >= 80 ? 'bg-green-500/10' : qualityScore >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10';
  
  return (
    <div className={`rounded-lg p-4 ${scoreBg} border`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Data Quality Score
        </h4>
        <span className={`text-3xl font-bold ${scoreColor}`}>{qualityScore}%</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Valid Products
          </span>
          <span className="font-medium">{validProducts}/{totalProducts}</span>
        </div>
        
        {issues.garbageName > 0 && (
          <div className="flex items-center justify-between text-red-600">
            <span className="flex items-center gap-2">
              <XCircle className="w-3 h-3" />
              Garbage Entries
            </span>
            <span className="font-medium">{issues.garbageName}</span>
          </div>
        )}
        
        {issues.noUrl > 0 && (
          <div className="flex items-center justify-between text-orange-600">
            <span className="flex items-center gap-2">
              <Link className="w-3 h-3" />
              Missing URLs
            </span>
            <span className="font-medium">{issues.noUrl}</span>
          </div>
        )}
        
        {issues.noPrice > 0 && (
          <div className="flex items-center justify-between text-yellow-600">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Missing Prices
            </span>
            <span className="font-medium">{issues.noPrice}</span>
          </div>
        )}
        
        {issues.suspiciousTitle > 0 && (
          <div className="flex items-center justify-between text-amber-600">
            <span className="flex items-center gap-2">
              <FileWarning className="w-3 h-3" />
              Suspicious Titles
            </span>
            <span className="font-medium">{issues.suspiciousTitle}</span>
          </div>
        )}
        
        {issues.staleData > 0 && (
          <div className="flex items-center justify-between text-blue-600">
            <span className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Stale Data
            </span>
            <span className="font-medium">{issues.staleData}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BambuDataQualitySection() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: quality, isLoading, refetch } = useBambuDataQuality();
  const deleteFilaments = useDeleteBambuFilaments();
  const queryClient = useQueryClient();

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAllDeletable = () => {
    const deletableIds = quality?.issuesList
      .filter(i => i.canDelete)
      .map(i => i.id) || [];
    setSelectedIds(new Set(deletableIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteFilaments(Array.from(selectedIds));
      toast.success(`Deleted ${selectedIds.size} garbage entries`);
      setSelectedIds(new Set());
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['bambu-data-quality'] });
      queryClient.invalidateQueries({ queryKey: ['bambu-regional-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bambu-material-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['bambu-missing-data'] });
    } catch (error) {
      toast.error('Failed to delete entries');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return null;
  if (!quality || quality.issuesList.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div>
          <div className="font-medium text-green-700">Data Quality: Excellent</div>
          <div className="text-sm text-green-600">All {quality?.totalProducts || 0} products pass quality checks</div>
        </div>
      </div>
    );
  }

  const deletableCount = quality.issuesList.filter(i => i.canDelete).length;
  const rescrapableCount = quality.issuesList.filter(i => i.canRescrape && i.issueType !== 'garbage_name').length;

  return (
    <div className="space-y-4">
      <DataQualityScoreCard 
        qualityScore={quality.qualityScore}
        totalProducts={quality.totalProducts}
        validProducts={quality.validProducts}
        issues={quality.issues}
      />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Data Quality Issues</span>
              <Badge variant="destructive">{quality.issuesList.length} issues</Badge>
            </div>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg">
            {/* Bulk Actions */}
            <div className="p-3 bg-muted/20 border-b flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllDeletable}
                  disabled={deletableCount === 0}
                >
                  Select All Deletable ({deletableCount})
                </Button>
                {selectedIds.size > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0 || isDeleting}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Selected ({selectedIds.size})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Issues Table */}
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Issue Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Possible Cause</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-10">URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quality.issuesList.slice(0, 100).map(issue => {
                    const config = ISSUE_CONFIG[issue.issueType];
                    const IconComponent = config.icon;
                    
                    return (
                      <TableRow key={issue.id} className={selectedIds.has(issue.id) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          {issue.canDelete && (
                            <Checkbox
                              checked={selectedIds.has(issue.id)}
                              onCheckedChange={() => toggleSelection(issue.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.bgColor} ${config.color} border-0`}>
                            <IconComponent className="w-3 h-3 mr-1" />
                            {issue.issueLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="block truncate text-sm" title={issue.productTitle}>
                            {issue.productTitle}
                          </span>
                        </TableCell>
                        <TableCell>
                          {issue.material ? (
                            <Badge variant="outline" className="text-xs">{issue.material}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <span className="text-xs text-muted-foreground" title={issue.possibleCause}>
                            {issue.possibleCause}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {issue.lastUpdated 
                            ? formatDistanceToNow(new Date(issue.lastUpdated), { addSuffix: true })
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          {issue.productUrl ? (
                            <a 
                              href={issue.productUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {quality.issuesList.length > 100 && (
                <div className="text-center py-2 text-xs text-muted-foreground border-t">
                  Showing 100 of {quality.issuesList.length} issues
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
