import { useParams, Navigate } from 'react-router-dom';
import { getBuyingGuideConfig } from '@/components/guides/guideConfigs';
import { BuyingGuideTemplate } from '@/components/guides/BuyingGuideTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BuyingGuide() {
  const { slug } = useParams<{ slug: string }>();
  
  if (!slug) {
    return <Navigate to="/guides" replace />;
  }

  const config = getBuyingGuideConfig(slug);

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Guide Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The buying guide you're looking for doesn't exist or has been moved.
            </p>
            <Button asChild>
              <Link to="/guides">Browse All Guides</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <BuyingGuideTemplate config={config} />;
}
