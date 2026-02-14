import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Database, 
  Users, 
  FlaskConical, 
  CheckCircle2, 
  RefreshCw,
  BookOpen,
  Shield,
  ArrowRight,
  ExternalLink,
  Lightbulb,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FAQSchema } from '@/components/seo';

const methodologyFaqs = [
  {
    question: 'What is Transmission Distance (TD) for HueForge?',
    answer: 'Transmission Distance (TD) is a measurement of how much light passes through a filament at a specific thickness. It\'s critical for HueForge lithophane and multicolor printing because it determines layer counts and color blending. Higher TD values mean more light transmission. FilaScope provides TD values sourced from manufacturer Technical Data Sheets (TDS) and verified community measurements.',
  },
  {
    question: 'How does FilaScope gather filament data?',
    answer: 'FilaScope uses a multi-source data pipeline: 1) Official Technical Data Sheets (TDS) from manufacturers for specifications like temperature ranges and mechanical properties, 2) Automated web scraping via Firecrawl for real-time pricing and availability, 3) Community contributions for TD measurements and print quality feedback, 4) Direct brand partnerships for verified product information.',
  },
  {
    question: 'How accurate are the TD values on FilaScope?',
    answer: 'TD values on FilaScope come from two primary sources: manufacturer-provided data from official Technical Data Sheets (highest accuracy) and community-measured values using standardized testing methodology. We label each TD value with its source and confidence level. Manufacturer-verified TD values are marked with a checkmark badge.',
  },
  {
    question: 'Can I contribute my own TD measurements to FilaScope?',
    answer: 'Yes! FilaScope welcomes community TD contributions. You can submit your measurements through the product detail page. We use a standardized testing methodology: print a test swatch at specific layer heights and measure light transmission. Your contributions help the 3D printing community find the best filaments for HueForge projects.',
  },
  {
    question: 'How often is FilaScope data updated?',
    answer: 'FilaScope updates data continuously. Prices and availability are refreshed every 4-24 hours depending on the brand. Technical specifications are updated when manufacturers release new TDS documents. Community contributions are reviewed within 48 hours. Major brands are monitored in real-time for price drops and stock changes.',
  },
  {
    question: 'What makes FilaScope different from other filament databases?',
    answer: 'FilaScope is the only database that combines comprehensive HueForge TD values with real-time pricing from 60+ brands. We specialize in the data that matters for multicolor and lithophane printing: Transmission Distance, color accuracy, and layer adhesion. Our normalized schema ensures consistent data across all vendors.',
  },
];

export default function ReferenceMethodology() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Helmet>
        <title>Data Methodology & Sources | FilaScope - How We Gather Filament TD Values</title>
        <meta 
          name="description" 
          content="Learn how FilaScope gathers, verifies, and maintains the world's most comprehensive 3D printing filament database. Trusted sources for TD values, prices, and technical specifications." 
        />
        <meta name="keywords" content="filament database methodology, TD value testing, HueForge data source, 3D printing specifications, filament data verification" />
        
      </Helmet>
      
      <FAQSchema faqs={methodologyFaqs} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm">
            <Shield className="w-3 h-3 mr-1" />
            Transparency & Trust
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Our Data Methodology
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            How FilaScope builds and maintains the most trusted filament database for HueForge and 3D printing
          </p>
        </div>

        {/* Data Sources Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Data Sources
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Technical Data Sheets (TDS)
                </CardTitle>
                <CardDescription>Primary source for specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  We extract data directly from manufacturer Technical Data Sheets, including:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Transmission Distance (TD) for HueForge compatibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Nozzle and bed temperature ranges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Mechanical properties (tensile strength, elongation)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Material composition and additives</span>
                  </li>
                </ul>
                <Badge variant="secondary" className="mt-2">Highest Accuracy</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-green-500" />
                  Automated Scraping
                </CardTitle>
                <CardDescription>Real-time pricing & availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Our automated pipeline using Firecrawl monitors 60+ brands for:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Current prices in multiple currencies (USD, EUR, GBP, CAD)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Stock availability and regional shipping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>New product launches and color variants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Price history for deal detection</span>
                  </li>
                </ul>
                <Badge variant="secondary" className="mt-2">Updated Every 4-24 Hours</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Community Contributions
                </CardTitle>
                <CardDescription>User-submitted measurements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The 3D printing community contributes valuable data:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>TD measurements for filaments without manufacturer data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Print quality ratings and reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Optimal print settings per printer model</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Safety reports and batch quality issues</span>
                  </li>
                </ul>
                <Badge variant="secondary" className="mt-2">Reviewed Within 48 Hours</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-orange-500" />
                  Standardized Testing
                </CardTitle>
                <CardDescription>Consistent methodology</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  When measuring TD values, we follow HueForge's recommended methodology:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Test swatch printed at specific layer heights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Consistent lighting conditions for measurement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Multiple sample averaging for accuracy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Cross-validation with existing measurements</span>
                  </li>
                </ul>
                <Badge variant="secondary" className="mt-2">Reproducible Results</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Verification Process */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Data Verification Process
          </h2>
          
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-blue-500">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Collection</h3>
                  <p className="text-sm text-muted-foreground">
                    Data gathered from TDS, scraping, or community
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-green-500">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    Cross-reference with multiple sources
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-orange-500">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Manual review for discrepancies
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-500">4</span>
                  </div>
                  <h3 className="font-semibold mb-2">Publication</h3>
                  <p className="text-sm text-muted-foreground">
                    Data added with source & timestamp
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* TD Value Explanation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-primary" />
            Understanding TD Values for HueForge
          </h2>
          
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Transmission Distance (TD)</strong> is the key metric for HueForge lithophane and multicolor printing. 
                It measures how far light travels through a filament before being absorbed.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-background/80 rounded-lg p-4 border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    Low TD (1-3)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Opaque filaments. Good for vibrant colors, requires fewer layers for color blocking.
                  </p>
                </div>
                <div className="bg-background/80 rounded-lg p-4 border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-yellow-500" />
                    Medium TD (3-5)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Balanced translucency. Ideal for most HueForge projects with good color blending.
                  </p>
                </div>
                <div className="bg-background/80 rounded-lg p-4 border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    High TD (5+)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Translucent filaments. Best for lithophanes and light-diffusing applications.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button asChild>
                  <Link to="/hueforge-filaments">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Browse TD Database
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://www.hueforge.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Learn About HueForge
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {methodologyFaqs.map((faq, index) => (
              <Card key={index} className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold mb-2">Ready to Find Your Perfect Filament?</h3>
            <p className="text-muted-foreground mb-4">
              Use our comprehensive database to compare TD values, prices, and specifications.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Start Searching
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/td-database">
                  <Database className="w-4 h-4 mr-2" />
                  TD Value Database
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
