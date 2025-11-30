import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, Image, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface CleanupResult {
  total_checked: number;
  invalid_found: number;
  fixed: number;
  errors: string[];
  invalid_records: Array<{
    id: string;
    product_title: string;
    vendor: string;
    featured_image: string;
  }>;
}

const AdminMaintenance = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const { toast } = useToast();

  const runImageCleanup = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-images', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      if (data.result) {
        setResult(data.result);
        toast({
          title: "Cleanup Complete",
          description: data.message,
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run cleanup",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Database Maintenance</h1>
        <p className="text-muted-foreground">
          Tools for maintaining and cleaning up database records
        </p>
      </div>

      {/* Image Cleanup Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            <CardTitle>Featured Image Cleanup</CardTitle>
          </div>
          <CardDescription>
            Identifies and fixes filament records with invalid featured_image URLs (timestamps, broken links, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runImageCleanup} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Cleanup...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Run Image Cleanup
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-2xl font-bold">{result.total_checked}</div>
                  <div className="text-sm text-muted-foreground">Records Checked</div>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <div className="text-2xl font-bold">{result.invalid_found}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Invalid Found</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="text-2xl font-bold">{result.fixed}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Fixed</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div className="text-2xl font-bold">{result.errors.length}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-2">Errors encountered:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-sm">... and {result.errors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {result.invalid_records.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Invalid Records Fixed:</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {result.invalid_records.map((record) => (
                      <div key={record.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{record.product_title}</div>
                            <div className="text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{record.vendor}</Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono max-w-xs truncate">
                            {record.featured_image}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMaintenance;