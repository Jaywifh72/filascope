import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Database, 
  Palette, 
  Wrench, 
  Thermometer, 
  Tag,
  RefreshCw 
} from "lucide-react";
import { useFieldFillRates } from "@/hooks/useFieldFillRates";
import { FieldCategorySection } from "@/components/admin/FieldFillRateCard";
import { BrandFieldMatrix } from "@/components/admin/BrandFieldMatrix";
import { FieldCoverageChart } from "@/components/admin/FieldCoverageChart";

export default function AdminFieldCoverage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { data, isLoading, refetch, isFetching } = useFieldFillRates();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        navigate('/');
        return;
      }
      setIsAdmin(true);
    };

    checkAdmin();
  }, [navigate]);

  if (isAdmin === null || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const categoryIcons: Record<string, React.ReactNode> = {
    hueforge: <Palette className="h-4 w-4" />,
    mechanical: <Wrench className="h-4 w-4" />,
    print_settings: <Thermometer className="h-4 w-4" />,
    identifiers: <Tag className="h-4 w-4" />,
  };

  const categoryLabels: Record<string, string> = {
    hueforge: 'HueForge / Visual',
    mechanical: 'Mechanical Properties',
    print_settings: 'Print Settings',
    identifiers: 'Identifiers & Codes',
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Field Coverage Dashboard</h1>
            <p className="text-muted-foreground">
              Track fill rates for key filament data fields
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{data.totalFilaments.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Filaments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Palette className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{data.hueforgeReady.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">HueForge Ready (TD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{data.tdsCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">With TDS URL</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{data.averageCoverage}%</p>
                <Badge variant={data.averageCoverage >= 50 ? "default" : "destructive"}>
                  {data.averageCoverage >= 50 ? 'Fair' : 'Low'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Average Coverage</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
          <TabsTrigger value="by-brand">By Brand</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FieldCoverageChart fields={data.overall} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.byCategory).map(([category, fields]) => (
              <FieldCategorySection
                key={category}
                title={categoryLabels[category] || category}
                fields={fields}
                icon={categoryIcons[category]}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-category" className="space-y-6">
          {Object.entries(data.byCategory).map(([category, fields]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {categoryIcons[category]}
                {categoryLabels[category] || category}
              </h3>
              <FieldCoverageChart 
                fields={fields} 
                title={`${categoryLabels[category]} Coverage`} 
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="by-brand">
          <BrandFieldMatrix brands={data.byBrand} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
