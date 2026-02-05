import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  metaDescription: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ 
  title, 
  lastUpdated, 
  metaDescription, 
  children 
}: LegalPageLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{title} | FilaScope</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Hero gradient area */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl opacity-15" />
          
          <div className="relative max-w-3xl mx-auto px-4 pt-12 md:pt-16 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 pb-12 md:pb-16">
          <div className="space-y-8">
            {children}
          </div>
          
          {/* Back to home link */}
          <div className="mt-12 pt-8 border-t border-border">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to FilaScope
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

interface LegalListProps {
  items: string[];
}

export function LegalList({ items }: LegalListProps) {
  return (
    <ul className="space-y-2 ml-4">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
