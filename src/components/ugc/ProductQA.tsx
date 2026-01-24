import { useState } from "react";
import { HelpCircle, ThumbsUp, MessageSquare, ChevronDown, Check, Shield, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Answer {
  id: string;
  text: string;
  authorName: string;
  isBrandVerified: boolean;
  isAccepted: boolean;
  helpfulCount: number;
  createdAt: string;
}

interface Question {
  id: string;
  text: string;
  authorName: string;
  answers: Answer[];
  answerCount: number;
  helpfulCount: number;
  createdAt: string;
}

interface ProductQAProps {
  filamentId: string;
  brandName?: string;
}

// Placeholder data
const MOCK_QUESTIONS: Question[] = [
  {
    id: "1",
    text: "Is this filament compatible with the Bambu Lab AMS? I've heard some matte filaments cause issues.",
    authorName: "CuriousPrinter",
    answerCount: 3,
    helpfulCount: 15,
    createdAt: "1 week ago",
    answers: [
      {
        id: "a1",
        text: "Yes! I've been using this exact filament with my AMS for months without any issues. The matte texture doesn't cause feeding problems. Just make sure to calibrate the AMS properly for the filament diameter.",
        authorName: "Polymaker Support",
        isBrandVerified: true,
        isAccepted: true,
        helpfulCount: 28,
        createdAt: "6 days ago",
      },
      {
        id: "a2",
        text: "Can confirm it works great with AMS. No tangling or feeding issues. I've gone through 5+ rolls.",
        authorName: "ExperiencedUser",
        isBrandVerified: false,
        isAccepted: false,
        helpfulCount: 12,
        createdAt: "5 days ago",
      },
    ],
  },
  {
    id: "2",
    text: "What nozzle temperature do you recommend for best layer adhesion? The range on the spool is quite wide.",
    authorName: "NewToMatte",
    answerCount: 2,
    helpfulCount: 8,
    createdAt: "2 weeks ago",
    answers: [
      {
        id: "a3",
        text: "For most printers, 215°C gives the best results. Start there and adjust ±5°C based on your specific machine. Higher temps = better adhesion but potentially more stringing.",
        authorName: "PrintEnthusiast",
        isBrandVerified: false,
        isAccepted: false,
        helpfulCount: 9,
        createdAt: "2 weeks ago",
      },
    ],
  },
  {
    id: "3",
    text: "How does this compare to the non-matte version in terms of strength?",
    authorName: "StrengthTester",
    answerCount: 0,
    helpfulCount: 5,
    createdAt: "3 days ago",
    answers: [],
  },
];

export function ProductQA({ filamentId, brandName }: ProductQAProps) {
  const { user } = useAuth();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set(["1"]));
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState("");

  const toggleQuestion = (id: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQuestions(newExpanded);
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Questions & Answers
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAskQuestion(true)}
            className="gap-1"
          >
            <MessageSquare className="w-4 h-4" />
            Ask a Question
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ask Question Form */}
        {showAskQuestion && (
          <div className="p-4 bg-muted/20 rounded-lg border border-border space-y-3">
            <h4 className="font-medium">Ask the community</h4>
            {!user ? (
              <div className="text-sm text-muted-foreground">
                <a href="/auth" className="text-primary hover:underline">Sign in</a> to ask a question
              </div>
            ) : (
              <>
                <Textarea
                  placeholder="What would you like to know about this filament?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button disabled={!newQuestion.trim()} className="gap-1">
                    <Send className="w-4 h-4" />
                    Submit Question
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAskQuestion(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-3">
          {MOCK_QUESTIONS.map((question) => (
            <div
              key={question.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Question */}
              <button
                onClick={() => toggleQuestion(question.id)}
                className="w-full p-4 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="font-medium text-primary mt-0.5">Q:</div>
                  <div className="flex-1">
                    <p className="font-medium">{question.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{question.authorName}</span>
                      <span>•</span>
                      <span>{question.createdAt}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {question.answerCount} answers
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform",
                      expandedQuestions.has(question.id) && "rotate-180"
                    )}
                  />
                </div>
              </button>

              {/* Answers */}
              {expandedQuestions.has(question.id) && (
                <div className="border-t border-border bg-muted/10">
                  {question.answers.length > 0 ? (
                    <div className="divide-y divide-border">
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="font-medium text-green-400 mt-0.5">A:</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">{answer.authorName}</span>
                                {answer.isBrandVerified && (
                                  <Badge className="gap-1 bg-primary/20 text-primary border-primary/30 text-[10px]">
                                    <Shield className="w-3 h-3" />
                                    Brand Verified
                                  </Badge>
                                )}
                                {answer.isAccepted && (
                                  <Badge className="gap-1 bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                                    <Check className="w-3 h-3" />
                                    Best Answer
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{answer.text}</p>
                              <div className="flex items-center gap-4 mt-3">
                                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                                  <ThumbsUp className="w-3 h-3" />
                                  Helpful ({answer.helpfulCount})
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {answer.createdAt}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No answers yet. Be the first to help!
                    </div>
                  )}

                  {/* Answer Input */}
                  {replyingTo === question.id ? (
                    <div className="p-4 border-t border-border">
                      {!user ? (
                        <div className="text-sm text-muted-foreground">
                          <a href="/auth" className="text-primary hover:underline">Sign in</a> to answer
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Share your knowledge..."
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button disabled={!newAnswer.trim()} size="sm" className="gap-1">
                              <Send className="w-4 h-4" />
                              Post Answer
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setNewAnswer("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyingTo(question.id)}
                        className="gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Answer this question
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More */}
        <Button variant="outline" className="w-full gap-2">
          <ChevronDown className="w-4 h-4" />
          Load More Questions
        </Button>
      </CardContent>
    </Card>
  );
}
