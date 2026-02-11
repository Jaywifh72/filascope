import { useState } from "react";
import { Bell, Mail, Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DealNotificationSignupProps {
  availableMaterials: string[];
  availableBrands: string[];
}

export function DealNotificationSignup({
  availableMaterials,
  availableBrands,
}: DealNotificationSignupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setIsSubmitted(true);
    
    toast({
      title: "✓ You're subscribed!",
      description: "We'll notify you when matching deals appear.",
    });
    
    setTimeout(() => {
      setIsOpen(false);
      setIsSubmitted(false);
      setEmail("");
      setSelectedMaterials([]);
      setSelectedBrands([]);
    }, 2000);
  };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(material) ? prev.filter((m) => m !== material) : [...prev, material]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const filterCount = selectedMaterials.length + selectedBrands.length;

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2 px-4 py-2 bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 hover:border-primary"
      >
        <Bell className="h-4 w-4 animate-pulse" />
        Get Deal Alerts
      </Button>

      {/* Signup Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Deal Notifications
            </DialogTitle>
            <DialogDescription>
              Get notified when deals match your preferences. No spam, just savings.
            </DialogDescription>
          </DialogHeader>

          {isSubmitted ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">You're all set!</h3>
              <p className="text-muted-foreground text-sm">
                We'll email you when matching deals appear.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Optional Filters */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Filter preferences <span className="text-muted-foreground">(optional)</span>
                </label>
                
                <div className="flex flex-wrap gap-2">
                  {/* Materials Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "gap-1.5",
                          selectedMaterials.length > 0 && "border-primary bg-primary/10"
                        )}
                      >
                        Materials
                        {selectedMaterials.length > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {selectedMaterials.length}
                          </Badge>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
                      <DropdownMenuLabel>Notify for materials</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {availableMaterials.slice(0, 15).map((material) => (
                        <DropdownMenuCheckboxItem
                          key={material}
                          checked={selectedMaterials.includes(material)}
                          onCheckedChange={() => toggleMaterial(material)}
                        >
                          {material}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Brands Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "gap-1.5",
                          selectedBrands.length > 0 && "border-primary bg-primary/10"
                        )}
                      >
                        Brands
                        {selectedBrands.length > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {selectedBrands.length}
                          </Badge>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
                      <DropdownMenuLabel>Notify for brands</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {availableBrands.slice(0, 15).map((brand) => (
                        <DropdownMenuCheckboxItem
                          key={brand}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => toggleBrand(brand)}
                        >
                          {brand}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Selected Tags Display */}
                {filterCount > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMaterials.map((material) => (
                      <Badge
                        key={material}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {material}
                        <button
                          type="button"
                          onClick={() => toggleMaterial(material)}
                          className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedBrands.map((brand) => (
                      <Badge
                        key={brand}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {brand}
                        <button
                          type="button"
                          onClick={() => toggleBrand(brand)}
                          className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Card */}
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-3 text-xs text-muted-foreground">
                  <p>
                    {filterCount > 0
                      ? `We'll email you when deals appear for your selected ${selectedMaterials.length > 0 ? "materials" : ""}${selectedMaterials.length > 0 && selectedBrands.length > 0 ? " and " : ""}${selectedBrands.length > 0 ? "brands" : ""}.`
                      : "We'll email you when any new deals appear. You can unsubscribe anytime."}
                  </p>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Subscribe to Deal Alerts
                  </>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
