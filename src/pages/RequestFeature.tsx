import { DocumentHead } from "@/components/seo/DocumentHead";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Lightbulb } from "lucide-react";

export default function RequestFeature() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !useCase.trim()) {
      toast({ title: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Store in error_logs as a lightweight approach (no new table needed)
      await supabase.from("error_logs").insert({
        error_id: `feature-request-${Date.now()}`,
        error_type: "feature_request",
        error_message: title.trim().slice(0, 500),
        metadata: {
          description: description.trim().slice(0, 2000),
          use_case: useCase.trim().slice(0, 1000),
          category: category || "other",
          contact_email: email.trim().slice(0, 255) || null,
        },
        route: "/request-feature",
      });
      setSubmitted(true);
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <DocumentHead title="Feature Requested | FilaScope" />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Thanks for your suggestion!</h1>
            <p className="text-muted-foreground mb-6">We'll review your feature request and consider it for our roadmap.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild><a href="/roadmap">View Roadmap</a></Button>
              <Button asChild><a href="/">Back to FilaScope</a></Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DocumentHead
        title="Request a Feature | FilaScope"
        description="Have an idea to improve FilaScope? Submit a feature request and help shape the future of the platform."
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Request a Feature</h1>
            <p className="text-muted-foreground">Help shape FilaScope by telling us what you need.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="feat-title" className="block text-sm font-medium text-foreground mb-1.5">Feature Title *</label>
              <Input id="feat-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dark mode for comparison tables" maxLength={200} required />
            </div>
            <div>
              <label htmlFor="feat-desc" className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
              <Textarea id="feat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the feature in detail..." rows={4} maxLength={2000} required />
            </div>
            <div>
              <label htmlFor="feat-usecase" className="block text-sm font-medium text-foreground mb-1.5">What problem does this solve? *</label>
              <Textarea id="feat-usecase" value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="Explain the use case..." rows={3} maxLength={1000} required />
            </div>
            <div>
              <label htmlFor="feat-category" className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="feat-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="feat-email" className="block text-sm font-medium text-foreground mb-1.5">Contact Email <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input id="feat-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" maxLength={255} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Feature Request"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
