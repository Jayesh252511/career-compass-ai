import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/topbar";
import { ResumePreview } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Download, ArrowLeft, Sparkles } from "lucide-react";
import { computeProgress, LANGUAGES, TEMPLATES, type ResumeContent } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { id?: string; role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/builder/$id")({
  component: Builder,
});

function Builder() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState<{ id: string; title: string; template: string; industry: string | null; language: string; content: ResumeContent; progress: number } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: `/builder/${id}` } });
  }, [user, loading, id, navigate]);

  // Load resume + messages
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: r, error } = await supabase.from("resumes").select("*").eq("id", id).single();
      if (error || !r) { toast.error("Resume not found"); navigate({ to: "/dashboard" }); return; }
      setResume({ ...r, content: (r.content ?? {}) as ResumeContent });
      const { data: m } = await supabase.from("ai_conversations").select("id, role, content").eq("resume_id", id).order("created_at");
      const list = (m ?? []).map(x => ({ id: x.id, role: x.role as "user" | "assistant", content: x.content }));
      setMessages(list);
      if (list.length === 0) {
        // Kick off opening question
        setTimeout(() => sendToAI([], r.language, r.industry ?? undefined, (r.content ?? {}) as ResumeContent, r.id), 200);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function persistMessage(role: "user" | "assistant", content: string) {
    if (!user) return;
    await supabase.from("ai_conversations").insert({ resume_id: id, user_id: user.id, role, content });
  }

  async function sendToAI(history: Msg[], language: string, industry: string | undefined, currentResume: ResumeContent, resumeId: string) {
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("resume-chat", {
        body: {
          messages: history.map(m => ({ role: m.role, content: m.content })),
          language, industry, currentResume,
        },
      });
      if (error) throw error;
      const payload = data as { message: string; resume_patch: Partial<ResumeContent>; error?: string };
      if (payload.error) throw new Error(payload.error);

      const aiMsg: Msg = { role: "assistant", content: payload.message || "..." };
      setMessages(prev => [...prev, aiMsg]);
      persistMessage("assistant", aiMsg.content);

      const patch = payload.resume_patch ?? {};
      if (patch && Object.keys(patch).length > 0) {
        const merged: ResumeContent = { ...currentResume, ...patch };
        const progress = computeProgress(merged);
        setResume(prev => prev ? { ...prev, content: merged, progress } : prev);
        await supabase.from("resumes").update({ content: merged, progress }).eq("id", resumeId);
        setSavedTick(true);
        setTimeout(() => setSavedTick(false), 1200);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Linnea couldn't respond. Try again.");
    } finally {
      setThinking(false);
    }
  }

  const onSend = async () => {
    if (!input.trim() || !resume || thinking) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setInput("");
    setMessages(prev => [...prev, userMsg]);
    persistMessage("user", userMsg.content);
    await sendToAI([...messages, userMsg], resume.language, resume.industry ?? undefined, resume.content, resume.id);
  };

  const changeTemplate = async (template: string) => {
    if (!resume) return;
    setResume({ ...resume, template });
    await supabase.from("resumes").update({ template }).eq("id", resume.id);
  };

  const renameTitle = async (title: string) => {
    if (!resume) return;
    setResume({ ...resume, title });
    await supabase.from("resumes").update({ title }).eq("id", resume.id);
  };

  const downloadPdf = () => window.print();

  if (!resume) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const lang = LANGUAGES.find(l => l.code === resume.language);

  return (
    <div className="h-screen flex flex-col bg-background print:bg-white">
      <div className="print:hidden">
        <TopBar />
      </div>
      <div className="print:hidden mx-auto w-full max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <Input
            value={resume.title}
            onChange={(e) => renameTitle(e.target.value)}
            className="h-9 max-w-[260px] border-transparent bg-transparent focus-visible:border-input font-medium"
          />
          <span className="text-xs text-muted-foreground hidden sm:inline">{lang?.flag} {lang?.native}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{resume.progress}%</span>
            <Progress value={resume.progress} className="h-1 w-28" />
            {savedTick && <span className="text-primary">Saved</span>}
          </div>
          <Select value={resume.template} onValueChange={changeTemplate}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={downloadPdf} size="sm" className="h-9 rounded-full">
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[420px_1fr] print:block">
        {/* Chat */}
        <div className="print:hidden flex flex-col border-r border-border bg-secondary/30">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Sparkles className="h-3.5 w-3.5" /></div>
            <div>
              <p className="text-sm font-medium leading-tight">Linnea</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Your career coach</p>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((m, i) => (
              <Bubble key={m.id ?? i} role={m.role}>{m.content}</Bubble>
            ))}
            {thinking && (
              <Bubble role="assistant">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </Bubble>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="p-4 border-t border-border bg-background">
            <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 focus-within:border-foreground/30 transition">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder={`Reply in ${lang?.native ?? "your language"}…`}
                rows={1}
                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground min-h-[28px] max-h-32"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || thinking} className="h-8 w-8 rounded-full">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-2 text-[10.5px] text-muted-foreground text-center">Linnea writes everything in polished English, no matter what language you reply in.</p>
          </form>
        </div>

        {/* Preview */}
        <div className="overflow-y-auto bg-muted/40 print:bg-white print:overflow-visible">
          <div className="mx-auto my-6 print:my-0 w-full max-w-[820px] print:max-w-none">
            <div className="bg-white shadow-[0_2px_24px_-8px_rgba(0,0,0,0.12)] rounded-xl print:rounded-none print:shadow-none overflow-hidden border border-border print:border-0">
              <div className="min-h-[1100px]">
                <ResumePreview content={resume.content} template={resume.template as "ats" | "modern" | "fresher"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
        role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"
      )}>
        {children}
      </div>
    </div>
  );
}
