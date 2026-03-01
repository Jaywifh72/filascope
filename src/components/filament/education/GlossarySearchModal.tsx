import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRINTING_GLOSSARY, GLOSSARY_CATEGORIES, searchGlossary, getTermsByCategory } from '@/lib/printingGlossary';
import { BookOpen, Search, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { SKILL_LEVELS } from '@/lib/skillLevels';

interface GlossarySearchModalProps {
  trigger?: React.ReactNode;
}

export function GlossarySearchModal({ trigger }: GlossarySearchModalProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTerms = useMemo(() => {
    let terms = Object.values(PRINTING_GLOSSARY);

    if (searchQuery) {
      terms = searchGlossary(searchQuery);
    }

    if (selectedCategory !== 'all') {
      terms = terms.filter(t => t.category === selectedCategory);
    }

    return terms.sort((a, b) => a.title.localeCompare(b.title));
  }, [searchQuery, selectedCategory]);

  const categories = Object.entries(GLOSSARY_CATEGORIES);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Glossary
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            3D Printing Glossary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All ({Object.keys(PRINTING_GLOSSARY).length})
              </TabsTrigger>
              {categories.map(([key, config]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {config.icon} {config.label} ({getTermsByCategory(key as any).length})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Terms list */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredTerms.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title={`No terms found for "${searchQuery}"`}
                  message="Try a different spelling or browse the full glossary."
                  compact
                />
              ) : (
                filteredTerms.map((term) => {
                  const category = GLOSSARY_CATEGORIES[term.category];
                  const skillConfig = SKILL_LEVELS[term.skillLevel];
                  
                  return (
                    <div
                      key={term.id}
                      className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm">{term.title}</h4>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {category.icon} {category.label}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0 ${skillConfig.color}`}
                          >
                            {skillConfig.icon}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {term.description}
                      </p>
                      {term.relatedTerms && term.relatedTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {term.relatedTerms.slice(0, 3).map(relatedId => {
                            const relatedTerm = PRINTING_GLOSSARY[relatedId];
                            return relatedTerm ? (
                              <span
                                key={relatedId}
                                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                              >
                                {relatedTerm.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <p className="text-xs text-center text-muted-foreground">
            {filteredTerms.length} of {Object.keys(PRINTING_GLOSSARY).length} terms shown
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
