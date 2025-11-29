import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

const Diagnose = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-orange-400" />
            Print Diagnostics
          </h1>
          <p className="text-muted-foreground">Troubleshoot common 3D printing issues</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Troubleshooting Tool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Diagnostic tool coming soon...</p>
              <p className="text-sm mt-2">Get help identifying and fixing print quality issues</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Diagnose;
