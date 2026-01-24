import { useState } from "react";
import { Camera, Heart, Settings, Printer, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface PrintResult {
  id: string;
  imageUrl: string;
  caption: string;
  authorName: string;
  printerUsed?: string;
  settings?: {
    nozzleTemp?: number;
    bedTemp?: number;
    speed?: number;
  };
  likesCount: number;
  featured?: boolean;
}

interface PrintResultsShowcaseProps {
  filamentId: string;
}

// Placeholder images using generic placeholders
const MOCK_PRINTS: PrintResult[] = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1611117775350-ac3950990985?w=400&h=400&fit=crop",
    caption: "Low-poly planter - turned out amazing with this filament!",
    authorName: "PrinterPro",
    printerUsed: "Bambu Lab X1C",
    settings: { nozzleTemp: 210, bedTemp: 60, speed: 150 },
    likesCount: 42,
    featured: true,
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=400&fit=crop",
    caption: "Articulated dragon - smooth layers, no stringing",
    authorName: "MakerMike",
    printerUsed: "Prusa MK4",
    settings: { nozzleTemp: 215, bedTemp: 55, speed: 100 },
    likesCount: 38,
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400&h=400&fit=crop",
    caption: "Functional mechanical parts - great layer adhesion",
    authorName: "Engineer3D",
    printerUsed: "Voron 2.4",
    settings: { nozzleTemp: 220, bedTemp: 65, speed: 200 },
    likesCount: 29,
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1563520239648-a24e51d4b570?w=400&h=400&fit=crop",
    caption: "Desktop organizer with perfect matte finish",
    authorName: "HomeDesigner",
    printerUsed: "Ender 3 V3",
    likesCount: 24,
  },
];

export function PrintResultsShowcase({ filamentId }: PrintResultsShowcaseProps) {
  const { user } = useAuth();
  const [selectedPrint, setSelectedPrint] = useState<PrintResult | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleNext = () => {
    if (!selectedPrint) return;
    const currentIndex = MOCK_PRINTS.findIndex((p) => p.id === selectedPrint.id);
    const nextIndex = (currentIndex + 1) % MOCK_PRINTS.length;
    setSelectedPrint(MOCK_PRINTS[nextIndex]);
  };

  const handlePrev = () => {
    if (!selectedPrint) return;
    const currentIndex = MOCK_PRINTS.findIndex((p) => p.id === selectedPrint.id);
    const prevIndex = (currentIndex - 1 + MOCK_PRINTS.length) % MOCK_PRINTS.length;
    setSelectedPrint(MOCK_PRINTS[prevIndex]);
  };

  return (
    <>
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Prints Made With This Filament
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Share Your Print
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOCK_PRINTS.map((print) => (
              <button
                key={print.id}
                onClick={() => setSelectedPrint(print)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden",
                  "group hover:ring-2 hover:ring-primary transition-all"
                )}
              >
                <img
                  src={print.imageUrl}
                  alt={print.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {print.featured && (
                  <Badge className="absolute top-2 left-2 bg-primary text-xs">
                    Featured
                  </Badge>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs line-clamp-2">{print.caption}</p>
                    <div className="flex items-center gap-1 mt-1 text-white/80 text-[10px]">
                      <Heart className="w-3 h-3" />
                      {print.likesCount}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* View All Link */}
          <div className="text-center mt-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View all {MOCK_PRINTS.length + 12} prints →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedPrint} onOpenChange={() => setSelectedPrint(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedPrint && (
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="relative flex-1 bg-black">
                <img
                  src={selectedPrint.imageUrl}
                  alt={selectedPrint.caption}
                  className="w-full h-64 md:h-[400px] object-contain"
                />
                {/* Navigation */}
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Details */}
              <div className="w-full md:w-72 p-4 space-y-4">
                <div>
                  <p className="font-medium">{selectedPrint.authorName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPrint.caption}</p>
                </div>

                {selectedPrint.printerUsed && (
                  <div className="flex items-center gap-2 text-sm">
                    <Printer className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedPrint.printerUsed}</span>
                  </div>
                )}

                {selectedPrint.settings && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Settings className="w-4 h-4 text-primary" />
                      Print Settings
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedPrint.settings.nozzleTemp && (
                        <div className="bg-muted/30 p-2 rounded">
                          <span className="text-muted-foreground text-xs">Nozzle</span>
                          <p className="font-medium">{selectedPrint.settings.nozzleTemp}°C</p>
                        </div>
                      )}
                      {selectedPrint.settings.bedTemp && (
                        <div className="bg-muted/30 p-2 rounded">
                          <span className="text-muted-foreground text-xs">Bed</span>
                          <p className="font-medium">{selectedPrint.settings.bedTemp}°C</p>
                        </div>
                      )}
                      {selectedPrint.settings.speed && (
                        <div className="bg-muted/30 p-2 rounded col-span-2">
                          <span className="text-muted-foreground text-xs">Speed</span>
                          <p className="font-medium">{selectedPrint.settings.speed} mm/s</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 gap-1">
                    <Heart className="w-4 h-4" />
                    {selectedPrint.likesCount}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Print</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!user ? (
              <div className="text-center py-6">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  Sign in to share your prints with the community
                </p>
                <Button asChild>
                  <a href="/auth">Sign In</a>
                </Button>
              </div>
            ) : (
              <>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Camera className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your photo here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB. Please share your own prints only.
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
