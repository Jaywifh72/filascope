import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2, Hash, AtSign, Globe, Link2, Image } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─── Platform icons (inline SVGs from Simple Icons) ─── */

const iconClass = 'w-5 h-5 shrink-0';

function TikTokIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function InstagramIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
    </svg>
  );
}

function XTwitterIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function BlueskyIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.158 3.13-4.38.63-7.22 2.16-3.14 7.547C7.044 24.674 9.71 20.303 12 16.704c2.29 3.6 4.463 7.452 8.358 4.22 4.08-5.387 1.24-6.917-3.14-7.547 2.558.346 5.373-.503 6.158-3.13C23.622 9.418 24 4.458 24 3.768c0-.69-.139-1.861-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  );
}

function FacebookIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.044 1.613.115l.436.063-.082 3.332c-.229-.024-.629-.044-.961-.044-1.36 0-1.886.516-1.886 1.855v2.237h3.645l-.639 3.667h-3.006v8.127C19.395 23.15 24 18.1 24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.628 3.874 10.35 9.101 11.691Z" />
    </svg>
  );
}

function YouTubeIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedInIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PinterestIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
    </svg>
  );
}

function RedditIcon({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.05 0-.1-.002-.149-.006a8.344 8.344 0 011.744 2.983c.566.229.97.78.97 1.42 0 .855-.693 1.548-1.548 1.548a1.545 1.545 0 01-.924-.305A8.443 8.443 0 0112 14.862a8.443 8.443 0 01-4.481-2.024 1.545 1.545 0 01-.924.305c-.855 0-1.548-.693-1.548-1.548 0-.64.388-1.191.97-1.42a8.344 8.344 0 011.744-2.983 2.014 2.014 0 01-.149.006c-1.104 0-1.999-.895-1.999-2 0-1.104.895-1.999 1.999-1.999.627 0 1.186.289 1.551.74a8.636 8.636 0 012.837-.5c.98 0 1.937.168 2.838.5.364-.451.923-.74 1.55-.74ZM9.5 15.5c0 .829.672 1.5 1.5 1.5h2c.828 0 1.5-.671 1.5-1.5 0-.828-.672-1.5-1.5-1.5h-2c-.828 0-1.5.672-1.5 1.5Zm-1-4a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0Zm5 0a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0Z" />
    </svg>
  );
}

/** Map platform name → brand color + icon component */
const PLATFORM_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'TikTok':                  { icon: TikTokIcon,    color: '#000000' },
  'Instagram / Threads':     { icon: InstagramIcon,  color: '#E4405F' },
  'X / Twitter':             { icon: XTwitterIcon,   color: '#000000' },
  'Bluesky':                 { icon: BlueskyIcon,    color: '#0085FF' },
  'Facebook (Short)':        { icon: FacebookIcon,   color: '#0866FF' },
  'Facebook (Long / About)': { icon: FacebookIcon,   color: '#0866FF' },
  'YouTube':                 { icon: YouTubeIcon,    color: '#FF0000' },
  'LinkedIn':                { icon: LinkedInIcon,   color: '#0A66C2' },
  'Pinterest':               { icon: PinterestIcon,  color: '#BD081C' },
  'Reddit':                  { icon: RedditIcon,     color: '#FF4500' },
};

/* ─── Social Media Bio Kit data (from FilaScope Social Media Bio Kit PDF) ─── */

interface PlatformBio {
  platform: string;
  charLimit: number;
  bio: string;
}

const CORE_TAGLINE =
  'Compare 21,000+ 3D printing filaments & 90+ printers. Real prices. Real data.';

const PLATFORM_BIOS: PlatformBio[] = [
  {
    platform: 'TikTok',
    charLimit: 80,
    bio: 'Compare 21,000+ 3D printing filaments & 90+ printers \uD83C\uDFAF\nfilascope.com',
  },
  {
    platform: 'Instagram / Threads',
    charLimit: 150,
    bio: 'Compare 21,000+ filaments from 50+ brands \uD83D\uDCE2\nHueForge TD values \u00B7 Real-time pricing \u00B7 90+ printers\nBuilt for makers \uD83D\uDD27\n\uD83D\uDD17 filascope.com',
  },
  {
    platform: 'X / Twitter',
    charLimit: 160,
    bio: 'Compare 21,000+ 3D printing filaments from 50+ brands. HueForge TD values, real-time pricing & 90+ printer specs. The data platform built for makers.\nfilascope.com',
  },
  {
    platform: 'Bluesky',
    charLimit: 256,
    bio: 'The 3D printing filament & printer comparison platform. Compare 21,000+ filaments from 50+ brands with HueForge Transmission Distance values, real-time multi-region pricing, and a database of 90+ printers. Built for makers who want real data.\nfilascope.com',
  },
  {
    platform: 'Facebook (Short)',
    charLimit: 155,
    bio: 'Compare 21,000+ 3D printing filaments & 90+ printers. HueForge TD values, real-time pricing, and specs from 50+ brands. The data platform for makers.',
  },
  {
    platform: 'Facebook (Long / About)',
    charLimit: 2000,
    bio: `FilaScope is the 3D printing filament and printer comparison platform built for makers who want real data, not guesswork.

\uD83D\uDCE2 21,000+ filaments from 50+ brands
\uD83D\uDDA8\uFE0F 90+ printers across 22+ brands
\uD83C\uDFAF HueForge Transmission Distance (TD) values
\uD83D\uDCB0 Real-time pricing across multiple regions
\uD83D\uDCCA Side-by-side specs, filters, and comparisons

Whether you\u2019re dialing in a HueForge project, choosing your next spool, or comparing printers before you buy \u2014 FilaScope gives you the data to make the right call.

\uD83D\uDD17 filascope.com`,
  },
  {
    platform: 'YouTube',
    charLimit: 1000,
    bio: `FilaScope is the 3D printing filament and printer comparison platform \u2014 built for makers who want real data, not guesswork.

We track 21,000+ filaments from 50+ brands with specs you won\u2019t find anywhere else, including HueForge Transmission Distance (TD) values, real-time multi-region pricing, and detailed material properties.

Our printer database covers 90+ models across 22+ brands with full spec comparisons so you can find the right machine for your workflow.

Whether you\u2019re picking the perfect filament for a HueForge project, hunting for the best price on your favorite spool, or comparing printers before your next upgrade \u2014 FilaScope has the data.

\uD83D\uDD17 filascope.com`,
  },
  {
    platform: 'LinkedIn',
    charLimit: 2000,
    bio: `FilaScope is the data-driven comparison platform for the 3D printing community.

We aggregate and organize the specs, pricing, and performance data that makers need to make informed decisions \u2014 covering 21,000+ filaments from 50+ brands and 90+ printers across 22+ manufacturers.

What sets FilaScope apart:
- HueForge Transmission Distance (TD) values \u2014 a critical spec for lithophane and HueForge projects that\u2019s difficult to find elsewhere
- Real-time, multi-region pricing \u2014 so you see what a spool actually costs where you are
- A comprehensive printer database \u2014 with detailed specifications for side-by-side comparison
- Filters and tools built for real maker workflows

FilaScope was built by a maker, for makers. We believe the 3D printing community deserves better tools to navigate an increasingly crowded market of filaments and machines.

\uD83D\uDD17 filascope.com`,
  },
  {
    platform: 'Pinterest',
    charLimit: 500,
    bio: 'FilaScope is the 3D printing filament and printer comparison platform. Compare 21,000+ filaments from 50+ brands with HueForge TD values, real-time pricing, and detailed material specs. Our printer database covers 90+ models across 22+ brands. Built for makers who want real data. filascope.com',
  },
  {
    platform: 'Reddit',
    charLimit: 200,
    bio: 'Builder of FilaScope \u2014 the filament & printer comparison platform. 21,000+ filaments, 90+ printers, HueForge TD values, real-time pricing. filascope.com',
  },
];

const CONSISTENT_ELEMENTS = [
  { label: 'Display Name', value: 'FilaScope' },
  { label: 'Handle', value: '@filascope' },
  { label: 'Website Link', value: 'https://filascope.com' },
  { label: 'Profile Image', value: 'FilaScope logo (use same everywhere)' },
  { label: 'Banner / Cover', value: 'Consistent branded banner' },
];

const PRIMARY_HASHTAGS = ['#FilaScope', '#3DPrinting', '#Filament'];
const SECONDARY_HASHTAGS = [
  '#HueForge',
  '#3DPrinter',
  '#FDM',
  '#PLA',
  '#PETG',
  '#ABS',
  '#3DPrintingCommunity',
  '#MakerLife',
  '#AdditiveManufacturing',
  '#FilamentReview',
  '#3DPrintingFilament',
  '#PrinterComparison',
];

/* ─── Component ─── */

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label ? `Copied ${label}` : 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy} title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

export default function AdminSocialMedia() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Share2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Media</h1>
          <p className="text-sm text-muted-foreground">Bio kit, hashtags, and brand consistency reference</p>
        </div>
      </div>

      {/* Core Tagline */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Core Tagline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 p-3 bg-card rounded-lg border border-border/50">
            <p className="text-sm font-medium text-foreground">{CORE_TAGLINE}</p>
            <CopyButton text={CORE_TAGLINE} label="tagline" />
          </div>
        </CardContent>
      </Card>

      {/* Platform Bios */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AtSign className="w-5 h-5 text-primary" />
          Platform Bios
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {PLATFORM_BIOS.map((p) => {
            const meta = PLATFORM_META[p.platform];
            const PlatformIcon = meta?.icon;
            return (
            <Card key={p.platform} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2.5">
                    {PlatformIcon && (
                      <span className="flex items-center justify-center w-7 h-7 rounded-md" style={{ backgroundColor: meta.color + '18' }}>
                        <PlatformIcon className="w-4 h-4" style={{ color: meta.color }} />
                      </span>
                    )}
                    {p.platform}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {p.bio.length} / {p.charLimit}
                    </Badge>
                    <CopyButton text={p.bio} label={p.platform} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/30 rounded-lg p-3 border border-border/30">
                  {p.bio}
                </pre>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </div>

      {/* Consistent Elements */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            Consistent Elements Across All Platforms
          </CardTitle>
          <CardDescription>Use these exact values on every social media profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/50">
            {CONSISTENT_ELEMENTS.map((el) => (
              <div key={el.label} className="flex items-center justify-between py-3 gap-4">
                <span className="text-sm font-medium text-muted-foreground w-36 shrink-0">{el.label}</span>
                <span className="text-sm text-foreground flex-1">{el.value}</span>
                <CopyButton text={el.value} label={el.label} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hashtags */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            Hashtags
          </CardTitle>
          <CardDescription>Click any tag to copy it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Primary (use on most posts)</p>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_HASHTAGS.map((tag) => (
                <HashtagChip key={tag} tag={tag} primary />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Secondary (rotate as relevant)</p>
            <div className="flex flex-wrap gap-2">
              {SECONDARY_HASHTAGS.map((tag) => (
                <HashtagChip key={tag} tag={tag} />
              ))}
            </div>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const all = [...PRIMARY_HASHTAGS, ...SECONDARY_HASHTAGS].join(' ');
                navigator.clipboard.writeText(all);
                toast.success('All hashtags copied');
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy All Hashtags
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Source reference */}
      <p className="text-xs text-muted-foreground text-center">
        Source: FilaScope Social Media Bio Kit (PDF) &middot; Last updated March 2026
      </p>
    </div>
  );
}

/* ─── Sub-component ─── */

function HashtagChip({ tag, primary }: { tag: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tag);
    setCopied(true);
    toast.success(`Copied ${tag}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
        primary
          ? 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25'
          : 'bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted hover:text-foreground',
        copied && 'bg-green-500/15 text-green-400 border-green-500/30'
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : null}
      {tag}
    </button>
  );
}
