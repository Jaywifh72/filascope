import { Helmet } from "react-helmet-async";
import { Rocket, ClipboardList, Lightbulb, CheckCircle2 } from "lucide-react";

const categories = [
  {
    title: "In Progress",
    emoji: "🚀",
    icon: Rocket,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    items: [
      { title: "Advanced printer compatibility filters", desc: "Filter filaments by your exact printer model for guaranteed compatibility." },
      { title: "Regional price accuracy improvements", desc: "Better currency conversion and local retailer coverage." },
    ],
  },
  {
    title: "Planned",
    emoji: "📋",
    icon: ClipboardList,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    items: [
      { title: "Bulk price comparison export", desc: "Export comparison tables as CSV or PDF for offline reference." },
      { title: "Filament usage calculator", desc: "Estimate how much filament you need based on model weight and infill." },
    ],
  },
  {
    title: "Under Consideration",
    emoji: "💡",
    icon: Lightbulb,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    items: [
      { title: "Custom filament collections", desc: "Create and share curated lists of filaments for specific projects." },
      { title: "Mobile app", desc: "Native mobile experience for on-the-go filament shopping." },
      { title: "Print profile sharing", desc: "Share and discover slicer profiles tuned for specific filaments." },
    ],
  },
  {
    title: "Recently Shipped",
    emoji: "✅",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    items: [
      { title: "Recently Viewed quick access", desc: "Quickly jump back to products you've browsed recently." },
      { title: "Regional pricing with currency conversion", desc: "See prices in your local currency from regional retailers." },
      { title: "Community photo gallery", desc: "Share and browse prints from the community." },
    ],
  },
];

export default function Roadmap() {
  return (
    <>
      <Helmet>
        <title>Feature Roadmap | FilaScope</title>
        <meta name="description" content="See what's coming next on FilaScope. Our public roadmap shows features in progress, planned, and under consideration." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Feature Roadmap</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Here's what we're working on and what's coming next. Have an idea?{" "}
              <a href="/request-feature" className="text-primary hover:underline">Request a feature</a>.
            </p>
          </div>

          <div className="space-y-10">
            {categories.map((cat) => (
              <section key={cat.title}>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                  <span>{cat.emoji}</span> {cat.title}
                </h2>
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <div
                      key={item.title}
                      className={`border rounded-lg px-4 py-3 ${cat.bg}`}
                    >
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
