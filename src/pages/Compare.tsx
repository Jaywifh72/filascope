import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare } from "lucide-react";

const Compare = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Compare Filaments</h1>
          <p className="text-muted-foreground">Side-by-side comparison of filament properties</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <GitCompare className="w-6 h-6 text-primary" />
              Select Filaments to Compare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Compare feature coming soon...</p>
              <p className="text-sm mt-2">Select filaments from the Finder page to compare their properties</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Compare;
