import { Helmet } from "react-helmet-async";
import { Download, Smartphone, Zap, WifiOff, Bell, Shield, Share, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { cn } from "@/lib/utils";

const InstallPage = () => {
  const { canInstall, isInstalled, isStandalone, isIOS, isAndroid, promptInstall } = usePWAInstall();

  const handleInstall = async () => {
    await promptInstall();
  };

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Loads instantly, even on slow connections",
    },
    {
      icon: WifiOff,
      title: "Works Offline",
      description: "Access your viewed filaments without internet",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Get alerts for price drops and deals (coming soon)",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "No tracking, no ads, just filament data",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Install FilaScope App | Offline Filament Database</title>
        <meta
          name="description"
          content="Install the FilaScope app on your device for instant access to 3D printer filament data, even offline. Works on iPhone, Android, and desktop."
        />
      </Helmet>

      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Smartphone className="w-4 h-4" />
              Progressive Web App
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Install FilaScope
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Get the full app experience with offline access, faster loading, and home screen shortcuts.
            </p>
          </div>

          {/* Status Card */}
          <div className={cn(
            "p-6 rounded-xl border mb-8",
            isInstalled || isStandalone
              ? "bg-success/10 border-success/30"
              : "bg-card border-border"
          )}>
            {isInstalled || isStandalone ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Already Installed!</h2>
                <p className="text-muted-foreground">
                  You're running FilaScope as an installed app. Enjoy the full experience!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Android/Desktop Install Button */}
                {canInstall && (
                  <div className="text-center">
                    <Button onClick={handleInstall} size="lg" className="w-full md:w-auto">
                      <Download className="w-5 h-5 mr-2" />
                      Install FilaScope
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      No app store required — installs directly from your browser
                    </p>
                  </div>
                )}

                {/* iOS Instructions */}
                {isIOS && (
                  <div>
                    <h2 className="font-semibold text-lg mb-4 text-center">
                      Install on iPhone/iPad
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Tap the Share button</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Look for <Share className="w-4 h-4" /> in Safari's toolbar
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Tap "Add to Home Screen"</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Scroll down in the share menu to find <Plus className="w-4 h-4" />
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Tap "Add"</p>
                          <p className="text-sm text-muted-foreground">
                            FilaScope will appear on your home screen
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generic instructions if no install prompt */}
                {!canInstall && !isIOS && (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      {isAndroid 
                        ? "Open this page in Chrome to install"
                        : "Use Chrome, Edge, or Safari to install FilaScope as an app"
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Not ready to install? No problem — FilaScope works great in your browser too.
            </p>
            <Button variant="outline" asChild>
              <a href="/">
                Continue to FilaScope
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallPage;
