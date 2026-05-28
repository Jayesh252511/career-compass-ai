import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { type ResumeContent } from "@/lib/constants";
import { Loader2, Target, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type Props = {
  resumeContent: ResumeContent;
  isPremium?: boolean;
};

type AtsResult = {
  score: number;
  missingKeywords: string[];
  feedback: string;
};

export function AtsMatcher({ resumeContent, isPremium }: Props) {
  const [open, setOpen] = useState(false);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);

  const handleMatch = async () => {
    if (!jobDesc.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }
    
    if (!isPremium) {
      toast.error("ATS Matching is a Premium feature. Upgrade to unlock!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ats-matcher", {
        body: { currentResume: resumeContent, jobDescription: jobDesc }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as AtsResult);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to analyze resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors">
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">ATS Match</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="w-5 h-5 text-primary" />
            Targeted ATS Job Matcher
          </DialogTitle>
          <DialogDescription>
            Paste the job description below. Our AI will analyze your generated resume against the requirements and give you a match score.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-2">
            <Textarea
              placeholder="Paste the full job description here..."
              className="min-h-[250px] resize-none font-sans text-sm"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
            <Button 
              className="w-full h-12 text-base font-semibold" 
              onClick={handleMatch}
              disabled={loading || !jobDesc.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Match...
                </>
              ) : (
                "Scan Resume against Job Description"
              )}
            </Button>
            {!isPremium && (
              <p className="text-xs text-amber-600 dark:text-amber-500 text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Premium Feature. You will be prompted to upgrade if you are on a free plan.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Score Ring / Bar */}
            <div className="flex flex-col items-center justify-center space-y-3 bg-secondary/20 p-6 rounded-2xl border border-border">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Match Score</span>
              <div className={`text-6xl font-display font-bold ${getScoreColor(result.score)}`}>
                {result.score}%
              </div>
              <Progress 
                value={result.score} 
                className="w-full max-w-xs h-3 mt-4 bg-muted overflow-hidden" 
                indicatorClassName={getScoreProgressColor(result.score)}
              />
            </div>

            {/* Missing Keywords */}
            {result.missingKeywords && result.missingKeywords.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-full text-xs font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Feedback */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                AI Recommendation
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed bg-primary/5 p-4 rounded-xl border border-primary/10">
                {result.feedback}
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setResult(null)}>
              Check Another Job Description
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
