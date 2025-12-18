import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { calculateRepoQuizScores, PlatformScore, QuizAnswer } from '@/lib/repoQuizScoring';

interface TestScenario {
  name: string;
  description: string;
  answers: QuizAnswer[];
  expectedTopPlatform: string;
  expectedTop3: string[];
}

const testScenarios: TestScenario[] = [
  {
    name: 'Bambu Newbie',
    description: 'New Bambu Lab owner wanting easy one-click printing',
    answers: [
      { questionId: 'printer-brand', selectedOptions: ['bambu'] },
      { questionId: 'primary-goal', selectedOptions: ['one-click-print'] },
      { questionId: 'budget', selectedOptions: ['free-only'] },
      { questionId: 'experience', selectedOptions: ['beginner'] },
      { questionId: 'features', selectedOptions: ['mobile-app', 'print-profiles'] }
    ],
    expectedTopPlatform: 'makerworld',
    expectedTop3: ['makerworld', 'printables', 'thingiverse']
  },
  {
    name: 'Budget Hobbyist',
    description: 'Generic printer owner wanting free models only',
    answers: [
      { questionId: 'printer-brand', selectedOptions: ['other'] },
      { questionId: 'primary-goal', selectedOptions: ['free-personal'] },
      { questionId: 'budget', selectedOptions: ['free-only'] },
      { questionId: 'experience', selectedOptions: ['intermediate'] },
      { questionId: 'features', selectedOptions: ['large-library'] }
    ],
    expectedTopPlatform: 'thingiverse',
    expectedTop3: ['thingiverse', 'printables', 'makerworld']
  },
  {
    name: 'Prusa Quality Seeker',
    description: 'Prusa owner who wants curated, high-quality models',
    answers: [
      { questionId: 'printer-brand', selectedOptions: ['prusa'] },
      { questionId: 'primary-goal', selectedOptions: ['quality-curated'] },
      { questionId: 'budget', selectedOptions: ['pay-for-quality'] },
      { questionId: 'experience', selectedOptions: ['advanced'] },
      { questionId: 'features', selectedOptions: ['quality-curation', 'community'] }
    ],
    expectedTopPlatform: 'printables',
    expectedTop3: ['printables', 'myminifactory', 'makerworld']
  },
  {
    name: 'Designer/Seller',
    description: 'Designer wanting to sell models with best commission',
    answers: [
      { questionId: 'printer-brand', selectedOptions: ['multiple'] },
      { questionId: 'primary-goal', selectedOptions: ['sell-models'] },
      { questionId: 'budget', selectedOptions: ['pay-for-quality'] },
      { questionId: 'experience', selectedOptions: ['professional'] },
      { questionId: 'features', selectedOptions: ['seller-rates', 'community'] }
    ],
    expectedTopPlatform: 'cults3d',
    expectedTop3: ['cults3d', 'myminifactory', 'printables']
  },
  {
    name: 'Engineer',
    description: 'Engineer needing CAD files (STEP, IGES)',
    answers: [
      { questionId: 'printer-brand', selectedOptions: ['other'] },
      { questionId: 'primary-goal', selectedOptions: ['cad-engineering'] },
      { questionId: 'budget', selectedOptions: ['free-only'] },
      { questionId: 'experience', selectedOptions: ['professional'] },
      { questionId: 'features', selectedOptions: ['cad-formats', 'large-library'] }
    ],
    expectedTopPlatform: 'grabcad',
    expectedTop3: ['grabcad', 'thangs', 'thingiverse']
  },
  {
    name: 'Advanced Searcher',
    description: 'User needing AI-powered geometric search',
    answers: [
      { questionId: 'printer-brand', selectedOptions: ['multiple'] },
      { questionId: 'primary-goal', selectedOptions: ['specific-search'] },
      { questionId: 'budget', selectedOptions: ['mostly-free'] },
      { questionId: 'experience', selectedOptions: ['advanced'] },
      { questionId: 'features', selectedOptions: ['ai-search', 'large-library'] }
    ],
    expectedTopPlatform: 'thangs',
    expectedTop3: ['thangs', 'thingiverse', 'printables']
  },
  {
    name: 'Creality Mobile User',
    description: 'Creality owner wanting mobile-first experience',
    answers: [
      { questionId: 'printer-brand', selectedOptions: ['creality'] },
      { questionId: 'primary-goal', selectedOptions: ['one-click-print'] },
      { questionId: 'budget', selectedOptions: ['free-only'] },
      { questionId: 'experience', selectedOptions: ['beginner'] },
      { questionId: 'features', selectedOptions: ['mobile-app', 'print-profiles'] }
    ],
    expectedTopPlatform: 'creality-cloud',
    expectedTop3: ['creality-cloud', 'makerworld', 'thingiverse']
  }
];

interface TestResult {
  scenario: TestScenario;
  results: PlatformScore[];
  primaryPass: boolean;
  top3Pass: boolean;
}

const QuizScoringTest = () => {
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());

  const toggleScenario = (name: string) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const testResults: TestResult[] = testScenarios.map(scenario => {
    const results = calculateRepoQuizScores(scenario.answers);
    const primaryPass = results[0]?.platformId === scenario.expectedTopPlatform;
    const actualTop3 = results.slice(0, 3).map(r => r.platformId);
    const top3Pass = scenario.expectedTop3.every((id, i) => actualTop3[i] === id);
    
    return { scenario, results, primaryPass, top3Pass };
  });

  const passingCount = testResults.filter(r => r.primaryPass).length;
  const top3PassingCount = testResults.filter(r => r.top3Pass).length;

  const formatAnswers = (answers: QuizAnswer[]) => {
    return answers.map(a => `${a.questionId}: ${a.selectedOptions.join(', ')}`).join(' | ');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quiz Scoring Algorithm Test</h1>
        <p className="text-muted-foreground">
          Validates that the scoring algorithm produces sensible recommendations for different user personas.
        </p>
      </div>

      {/* Summary Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${passingCount === testScenarios.length ? 'text-green-500' : 'text-amber-500'}`}>
                {passingCount}/{testScenarios.length}
              </div>
              <div>
                <div className="font-medium">Primary Tests Passing</div>
                <div className="text-sm text-muted-foreground">Top platform matches expected</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${top3PassingCount === testScenarios.length ? 'text-green-500' : 'text-amber-500'}`}>
                {top3PassingCount}/{testScenarios.length}
              </div>
              <div>
                <div className="font-medium">Top 3 Tests Passing</div>
                <div className="text-sm text-muted-foreground">All top 3 match expected order</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map(({ scenario, results, primaryPass, top3Pass }) => (
          <Card key={scenario.name} className={!primaryPass ? 'border-destructive' : ''}>
            <Collapsible
              open={expandedScenarios.has(scenario.name)}
              onOpenChange={() => toggleScenario(scenario.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {primaryPass ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={primaryPass ? 'default' : 'destructive'}>
                      #{1}: {results[0]?.platformId}
                    </Badge>
                    {!primaryPass && (
                      <Badge variant="outline">Expected: {scenario.expectedTopPlatform}</Badge>
                    )}
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedScenarios.has(scenario.name) ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  {/* Answers Given */}
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground mb-1">ANSWERS GIVEN</div>
                    <div className="text-sm font-mono">{formatAnswers(scenario.answers)}</div>
                  </div>

                  {/* Expected vs Actual */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground mb-2">EXPECTED TOP 3</div>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        {scenario.expectedTop3.map((id, i) => (
                          <li key={id} className="font-medium">{id}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground mb-2">ACTUAL TOP 3</div>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        {results.slice(0, 3).map((r, i) => (
                          <li 
                            key={r.platformId} 
                            className={`font-medium ${r.platformId === scenario.expectedTop3[i] ? 'text-green-500' : 'text-destructive'}`}
                          >
                            {r.platformId} ({r.matchPercentage}%)
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Full Results Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Rank</th>
                          <th className="text-left py-2 px-2">Platform</th>
                          <th className="text-right py-2 px-2">Base</th>
                          <th className="text-right py-2 px-2">Bonus</th>
                          <th className="text-right py-2 px-2">Total</th>
                          <th className="text-right py-2 px-2">Match %</th>
                          <th className="text-left py-2 px-2">Reasons</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={r.platformId} className={`border-b ${i < 3 ? 'bg-muted/20' : ''}`}>
                            <td className="py-2 px-2 font-medium">#{i + 1}</td>
                            <td className="py-2 px-2 font-medium">{r.platformId}</td>
                            <td className="py-2 px-2 text-right text-muted-foreground">{r.baseScore}</td>
                            <td className="py-2 px-2 text-right text-green-500">+{r.bonusPoints}</td>
                            <td className="py-2 px-2 text-right font-bold">{r.totalScore}</td>
                            <td className="py-2 px-2 text-right">{r.matchPercentage}%</td>
                            <td className="py-2 px-2 text-xs text-muted-foreground max-w-xs truncate">
                              {r.matchReasons.slice(0, 3).join(', ')}
                              {r.matchReasons.length > 3 && ` +${r.matchReasons.length - 3} more`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuizScoringTest;
