import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Youtube, Twitter, Globe, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { influencerData, InfluencerData } from "@/lib/influencerData";
import { useAuth } from "@/hooks/useAuth";

type SortField = "name" | "subscribers" | "reach" | "technical" | "entertainment" | "influence" | "monetization";
type SortDirection = "asc" | "desc";

// Helper to parse subscriber counts for sorting
const parseSubscribers = (subs: string): number => {
  const match = subs.match(/~?([\d.]+)\s*(Million|K)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === "million") return num * 1000000;
  if (unit === "k") return num * 1000;
  return num;
};

const ReferenceInfluencers = () => {
  const { isAdmin } = useAuth();
  const [sortField, setSortField] = useState<SortField>("subscribers");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Extract unique niches and locations for filters
  const niches = useMemo(() => {
    const nicheSet = new Set<string>();
    influencerData.forEach(i => {
      // Extract primary niche (first item before comma)
      const primaryNiche = i.niche.split(",")[0].trim();
      nicheSet.add(primaryNiche);
    });
    return Array.from(nicheSet).sort();
  }, []);

  const locations = useMemo(() => {
    const locationSet = new Set<string>();
    influencerData.forEach(i => {
      // Extract country from location
      const country = i.location.includes("(") 
        ? i.location.split("(")[0].trim() 
        : i.location;
      locationSet.add(country);
    });
    return Array.from(locationSet).sort();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...influencerData];

    // Apply niche filter
    if (nicheFilter !== "all") {
      filtered = filtered.filter(i => i.niche.toLowerCase().includes(nicheFilter.toLowerCase()));
    }

    // Apply location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(i => i.location.includes(locationFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "subscribers":
          aVal = parseSubscribers(a.subscribers);
          bVal = parseSubscribers(b.subscribers);
          break;
        case "reach":
          aVal = a.ratings.reach;
          bVal = b.ratings.reach;
          break;
        case "technical":
          aVal = a.ratings.technical;
          bVal = b.ratings.technical;
          break;
        case "entertainment":
          aVal = a.ratings.entertainment;
          bVal = b.ratings.entertainment;
          break;
        case "influence":
          aVal = a.ratings.influence;
          bVal = b.ratings.influence;
          break;
        case "monetization":
          aVal = a.ratings.monetization;
          bVal = b.ratings.monetization;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === "asc" 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [sortField, sortDirection, nicheFilter, locationFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 font-medium hover:text-primary transition-colors"
    >
      {label}
      {sortField === field && (
        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  const RatingDot = ({ rating }: { rating: number }) => {
    const colorClass = rating >= 4 ? "bg-green-500" : rating >= 3 ? "bg-amber-500" : "bg-red-500";
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i <= rating ? colorClass : "bg-muted"}`}
          />
        ))}
      </div>
    );
  };

  const clearFilters = () => {
    setNicheFilter("all");
    setLocationFilter("all");
  };

  const hasFilters = nicheFilter !== "all" || locationFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Finder
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Creator Spotlights</h1>
          <p className="text-muted-foreground">
            Comprehensive guide to 3D printing content creators, their influence, and specializations.
          </p>
        </div>

        {/* Comparative Features Matrix */}
        <div className="mb-12 bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Comparative Influencer Matrix</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Niche:</span>
              <Select value={nicheFilter} onValueChange={setNicheFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Niches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Niches</SelectItem>
                  {niches.map(niche => (
                    <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Location:</span>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
            <span className="text-sm text-muted-foreground ml-auto">
              Showing {filteredAndSortedData.length} of {influencerData.length} influencers
            </span>
          </div>

          {/* Rating Legend - Admin only */}
          {isAdmin && (
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Excellent (4-5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Average (3)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Limited (1-2)</span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">
                    <SortHeader field="name" label="Creator" />
                  </th>
                  <th className="text-left py-3 px-2">Channel</th>
                  <th className="text-left py-3 px-2">
                    <SortHeader field="subscribers" label="Subscribers" />
                  </th>
                  <th className="text-left py-3 px-2">Location</th>
                  {isAdmin && (
                    <>
                      <th className="text-center py-3 px-2">
                        <SortHeader field="reach" label="Reach" />
                      </th>
                      <th className="text-center py-3 px-2">
                        <SortHeader field="technical" label="Technical" />
                      </th>
                      <th className="text-center py-3 px-2">
                        <SortHeader field="entertainment" label="Entertainment" />
                      </th>
                      <th className="text-center py-3 px-2">
                        <SortHeader field="influence" label="Influence" />
                      </th>
                      <th className="text-center py-3 px-2">
                        <SortHeader field="monetization" label="Monetization" />
                      </th>
                    </>
                  )}
                  <th className="text-left py-3 px-2">Niche</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((influencer) => (
                  <tr key={influencer.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{influencer.name}</td>
                    <td className="py-3 px-2">
                      {influencer.links.youtube ? (
                        <a 
                          href={influencer.links.youtube} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {influencer.channelName}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        influencer.channelName
                      )}
                    </td>
                    <td className="py-3 px-2">{influencer.subscribers}</td>
                    <td className="py-3 px-2 text-muted-foreground">{influencer.location}</td>
                    {isAdmin && (
                      <>
                        <td className="py-3 px-2">
                          <div className="flex justify-center">
                            <RatingDot rating={influencer.ratings.reach} />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center">
                            <RatingDot rating={influencer.ratings.technical} />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center">
                            <RatingDot rating={influencer.ratings.entertainment} />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center">
                            <RatingDot rating={influencer.ratings.influence} />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center">
                            <RatingDot rating={influencer.ratings.monetization} />
                          </div>
                        </td>
                      </>
                    )}
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {influencer.niche.split(",")[0].trim()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Profiles */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Detailed Creator Profiles</h2>
          <Accordion type="single" collapsible className="space-y-4">
            {influencerData.map((influencer) => (
              <AccordionItem 
                key={influencer.id} 
                value={influencer.id}
                className="bg-card rounded-lg border px-6"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                      <Youtube className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{influencer.channelName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {influencer.name} • {influencer.subscribers} subscribers • {influencer.location}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="space-y-6">
                    {/* Bio */}
                    <p className="text-muted-foreground italic text-lg">{influencer.bio}</p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">Total Views</div>
                        <div className="font-semibold">{influencer.totalViews}</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">Joined</div>
                        <div className="font-semibold">{influencer.joinDate}</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">Key Asset</div>
                        <div className="font-semibold text-sm">{influencer.keyAsset}</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">Business Model</div>
                        <div className="font-semibold text-sm">{influencer.businessModel}</div>
                      </div>
                    </div>

                    {/* Top 2025 Video Thumbnail */}
                    {influencer.topVideo2025 && (
                      <a 
                        href={influencer.topVideo2025} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block relative group w-fit"
                      >
                        <img 
                          src={`https://img.youtube.com/vi/${influencer.topVideo2025.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`}
                          alt="Top 2025 Video"
                          className="rounded-lg w-64 h-auto transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-red-600 rounded-full p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Youtube className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </a>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-2">
                      {influencer.links.youtube && (
                        <a href={influencer.links.youtube} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Youtube className="h-4 w-4 mr-2 text-red-600" />
                            YouTube
                          </Button>
                        </a>
                      )}
                      {influencer.links.twitter && (
                        <a href={influencer.links.twitter} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Twitter className="h-4 w-4 mr-2 text-sky-500" />
                            Twitter
                          </Button>
                        </a>
                      )}
                      {influencer.links.patreon && (
                        <a href={influencer.links.patreon} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Heart className="h-4 w-4 mr-2 text-orange-500" />
                            Patreon
                          </Button>
                        </a>
                      )}
                      {influencer.links.website && (
                        <a href={influencer.links.website} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </Button>
                        </a>
                      )}
                    </div>

                    {/* Sections */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Brand Identity</h4>
                        <p className="text-sm text-muted-foreground">{influencer.brandIdentity}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Content Strategy</h4>
                        <p className="text-sm text-muted-foreground">{influencer.contentStrategy}</p>
                      </div>
                      {isAdmin && (
                        <div>
                          <h4 className="font-semibold mb-2">Economic Impact</h4>
                          <p className="text-sm text-muted-foreground">{influencer.economicImpact}</p>
                        </div>
                      )}
                      {isAdmin && (
                        <div>
                          <h4 className="font-semibold mb-2">Future Outlook</h4>
                          <p className="text-sm text-muted-foreground">{influencer.futureOutlook}</p>
                        </div>
                      )}
                    </div>

                    {/* Strengths */}
                    <div>
                      <h4 className="font-semibold mb-3 text-green-600">Strengths</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {influencer.strengths.map((strength, idx) => (
                          <div key={idx} className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                            <div className="font-medium text-sm">{strength.title}</div>
                            <div className="text-xs text-muted-foreground">{strength.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default ReferenceInfluencers;
