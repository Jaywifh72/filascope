import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3x3 } from "lucide-react";

const Matrix = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Compatibility Matrix</h1>
          <p className="text-muted-foreground">Check printer-filament compatibility at a glance</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Grid3x3 className="w-6 h-6 text-primary" />
              Printer Compatibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Compatibility matrix coming soon...</p>
              <p className="text-sm mt-2">View which filaments work best with your 3D printer</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Matrix;
