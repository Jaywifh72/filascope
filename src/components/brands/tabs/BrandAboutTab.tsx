import { Card, CardContent } from "@/components/ui/card";
import { Globe, MapPin, Calendar, Building2, ExternalLink, Mail, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandInfo {
  summary?: string;
  location?: string;
  headquarters?: string;
  founded?: string;
  employees?: string;
  website?: string;
  companyType?: string;
  founder?: string;
  ceo?: string;
  president?: string;
  parentCompany?: string;
  subsidiaries?: string[];
  supportEmail?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
}

interface BrandAboutTabProps {
  brandName: string;
  brandInfo: BrandInfo | null;
  productCount: number;
  materialsCount: number;
}

// Helper to format website URL for display
const formatWebsiteDisplay = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
};

// Helper to split summary into paragraphs
const formatDescription = (summary: string): string[] => {
  // Split on double newlines or period followed by space and capital letter for natural breaks
  const paragraphs = summary
    .split(/\n\n+/)
    .flatMap((p) => {
      // If paragraph is very long, try to split on sentence boundaries
      if (p.length > 400) {
        const sentences = p.match(/[^.!?]+[.!?]+\s*/g) || [p];
        const chunks: string[] = [];
        let current = "";
        sentences.forEach((s) => {
          if (current.length + s.length > 350 && current.length > 0) {
            chunks.push(current.trim());
            current = s;
          } else {
            current += s;
          }
        });
        if (current.trim()) chunks.push(current.trim());
        return chunks;
      }
      return [p];
    })
    .filter((p) => p.trim().length > 0);

  return paragraphs;
};

export function BrandAboutTab({
  brandName,
  brandInfo,
  productCount,
  materialsCount,
}: BrandAboutTabProps) {
  if (!brandInfo) {
    return (
      <Card className="bg-gray-800/30 border-gray-700">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">About {brandName}</h3>
          <p className="text-gray-400">
            Detailed information about {brandName} is coming soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  const paragraphs = brandInfo.summary ? formatDescription(brandInfo.summary) : [];
  const hasCompanyInfo =
    brandInfo.headquarters ||
    brandInfo.location ||
    brandInfo.founded ||
    brandInfo.companyType ||
    brandInfo.website;

  return (
    <div className="space-y-8">
      {/* Description Section */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">About {brandName}</h2>
        {paragraphs.length > 0 ? (
          <div className="max-w-3xl">
            {paragraphs.map((paragraph, idx) => (
              <p
                key={idx}
                className={`text-gray-300 leading-relaxed mb-4 last:mb-0 ${
                  idx === 0 ? "text-lg font-medium text-gray-200" : ""
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 max-w-3xl">
            {brandName} is a manufacturer of 3D printing filaments, offering a range of materials
            for desktop FDM printers. Visit their official website to learn more about their
            products and company history.
          </p>
        )}
      </section>

      {/* Company Information Card */}
      {hasCompanyInfo && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Company Information</h2>
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {brandInfo.founded && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Founded</span>
                    </div>
                    <div className="text-base text-white font-medium">
                      {brandInfo.founded}
                    </div>
                  </div>
                )}

                {(brandInfo.headquarters || brandInfo.location) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>Headquarters</span>
                    </div>
                    <div className="text-base text-white font-medium">
                      {brandInfo.headquarters || brandInfo.location}
                    </div>
                  </div>
                )}

                {brandInfo.companyType && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 className="w-4 h-4" />
                      <span>Company Type</span>
                    </div>
                    <div className="text-base text-white font-medium capitalize">
                      {brandInfo.companyType.replace(/-/g, " ")}
                    </div>
                  </div>
                )}

                {brandInfo.website && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </div>
                    <a
                      href={brandInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      {formatWebsiteDisplay(brandInfo.website)}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {(brandInfo.ceo || brandInfo.president || brandInfo.founder) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 className="w-4 h-4" />
                      <span>{brandInfo.ceo ? "CEO" : brandInfo.president ? "President" : "Founder"}</span>
                    </div>
                    <div className="text-base text-white font-medium">
                      {brandInfo.ceo || brandInfo.president || brandInfo.founder}
                    </div>
                  </div>
                )}

                {brandInfo.parentCompany && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 className="w-4 h-4" />
                      <span>Parent Company</span>
                    </div>
                    <div className="text-base text-white font-medium">
                      {brandInfo.parentCompany}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Catalog Stats */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Product Catalog</h2>
        <div className="grid grid-cols-2 gap-4 w-full">
          <Card className="bg-card/50 border border-border/30 border-t-2 border-t-primary/40">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{productCount}</div>
              <div className="text-sm text-gray-400">Products</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border border-border/30 border-t-2 border-t-primary/40">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{materialsCount}</div>
              <div className="text-sm text-gray-400">Materials</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact & Support */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Contact & Support</h2>
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-6">
            {brandInfo.supportEmail ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Support Email</div>
                    <a
                      href={`mailto:${brandInfo.supportEmail}`}
                      className="text-primary hover:underline"
                    >
                      {brandInfo.supportEmail}
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-700/50">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-400 mb-4">
                    Visit the official website for support, contact information, and the latest updates from {brandName}.
                  </p>
                  {brandInfo.website && (
                    <Button asChild>
                      <a href={brandInfo.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                        <ExternalLink className="w-3.5 h-3.5 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Social Links */}
            {brandInfo.socialLinks && Object.keys(brandInfo.socialLinks).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-500 mb-3">Follow {brandName}</div>
                <div className="flex gap-3">
                  {brandInfo.socialLinks.twitter && (
                    <a
                      href={brandInfo.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {brandInfo.socialLinks.facebook && (
                    <a
                      href={brandInfo.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {brandInfo.socialLinks.instagram && (
                    <a
                      href={brandInfo.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                      </svg>
                    </a>
                  )}
                  {brandInfo.socialLinks.youtube && (
                    <a
                      href={brandInfo.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
