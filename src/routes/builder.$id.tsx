import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/topbar";
import { ResumePreview } from "@/components/resume-preview";
import { VoiceOrb, Waveform, type OrbState } from "@/components/voice-orb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Download, ArrowLeft, Sparkles, Keyboard, Mic, Square } from "lucide-react";
import { computeProgress, LANGUAGES, TEMPLATES, type ResumeContent } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { id?: string; role: "user" | "assistant"; content: string };
type Mode = "voice" | "text";

export const Route = createFileRoute("/builder/$id")({
  component: Builder,
});

function Builder() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState<{
    id: string; title: string; template: string; industry: string | null;
    language: string; content: ResumeContent; progress: number;
  } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [textInput, setTextInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [mode, setMode] = useState<Mode>("voice");
  const [partial, setPartial] = useState("");
  const [fakeLevel, setFakeLevel] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  // -------- ElevenLabs realtime STT --------
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => setPartial(data.text ?? ""),
    onCommittedTranscript: (data) => {
      const text = (data.text ?? "").trim();
      setPartial("");
      if (text) handleUserUtterance(text);
    },
  });

  // -------- Auth & load --------
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: `/builder/${id}` } });
  }, [user, loading, id, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: r, error } = await supabase.from("resumes").select("*").eq("id", id).single();
      if (error || !r) { toast.error("Resume not found"); navigate({ to: "/dashboard" }); return; }
      setResume({ ...r, content: (r.content ?? {}) as ResumeContent });
      const { data: m } = await supabase
        .from("ai_conversations").select("id, role, content").eq("resume_id", id).order("created_at");
      const list = (m ?? []).map((x) => ({ id: x.id, role: x.role as "user" | "assistant", content: x.content }));
      setMessages(list);
      if (list.length === 0 && !initRef.current) {
        initRef.current = true;
        setTimeout(() => sendToAI([], r.language, r.industry ?? undefined, (r.content ?? {}) as ResumeContent, r.id), 250);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // -------- Scroll & faux level animation --------
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, partial]);

  useEffect(() => {
    if (!scribe.isConnected) { setFakeLevel(0); return; }
    const i = setInterval(() => setFakeLevel(0.2 + Math.random() * 0.6), 120);
    return () => clearInterval(i);
  }, [scribe.isConnected]);

  // -------- TTS playback --------
  const speak = useCallback(async (text: string) => {
    try {
      // Stop any currently playing audio first
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      const { data, error } = await supabase.functions.invoke("eleven-tts", { body: { text } });
      if (error) throw error;
      // invoke returns a Blob for binary; coerce
      const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setSpeaking(true);
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play().catch(() => setSpeaking(false));
    } catch (e) {
      console.warn("TTS failed", e);
      setSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
  }, []);

  // -------- Persist & call AI --------
  async function persistMessage(role: "user" | "assistant", content: string) {
    if (!user) return;
    await supabase.from("ai_conversations").insert({ resume_id: id, user_id: user.id, role, content });
  }

  async function sendToAI(history: Msg[], language: string, industry: string | undefined, currentResume: ResumeContent, resumeId: string) {
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("resume-chat", {
        body: { messages: history.map((m) => ({ role: m.role, content: m.content })), language, industry, currentResume },
      });
      if (error) throw error;
      const payload = data as { message: string; resume_patch: Partial<ResumeContent>; error?: string };
      if (payload.error) throw new Error(payload.error);

      const aiMsg: Msg = { role: "assistant", content: payload.message || "..." };
      setMessages((prev) => [...prev, aiMsg]);
      persistMessage("assistant", aiMsg.content);

      const patch = payload.resume_patch ?? {};
      if (patch && Object.keys(patch).length > 0) {
        const merged: ResumeContent = { ...currentResume, ...patch };
        const progress = computeProgress(merged);
        setResume((prev) => (prev ? { ...prev, content: merged, progress } : prev));
        await supabase.from("resumes").update({ content: merged, progress }).eq("id", resumeId);
        setSavedTick(true);
        setTimeout(() => setSavedTick(false), 1200);
      }

      // Speak the reply if in voice mode
      if (mode === "voice" && aiMsg.content) {
        speak(aiMsg.content);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Linnea couldn't respond. Try again.");
    } finally {
      setThinking(false);
    }
  }

  const handleUserUtterance = useCallback((text: string) => {
    if (!resume) return;
    // Interrupt any AI speech the moment user speaks
    stopSpeaking();
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    persistMessage("user", userMsg.content);
    setMessages((prev) => {
      sendToAI(prev, resume.language, resume.industry ?? undefined, resume.content, resume.id);
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, mode]);

  const onSendText = async () => {
    if (!textInput.trim() || !resume || thinking) return;
    const text = textInput.trim();
    setTextInput("");
    handleUserUtterance(text);
  };

  // -------- Voice toggle --------
  const startVoice = async () => {
    try {
      stopSpeaking();
      const { data, error } = await supabase.functions.invoke("eleven-stt-token");
      if (error || !data?.token) throw new Error(data?.error ?? "Couldn't get voice token");
      await scribe.connect({
        token: data.token,
        microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start voice. Check microphone permission.");
    }
  };

  const stopVoice = async () => {
    setPartial("");
    await scribe.disconnect();
  };

  const toggleVoice = () => (scribe.isConnected ? stopVoice() : startVoice());

  // -------- Misc actions --------
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

  // -------- Cleanup --------
  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause();
    if (scribe.isConnected) scribe.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!resume) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const lang = LANGUAGES.find((l) => l.code === resume.language);
  const orbState: OrbState = speaking ? "speaking" : thinking ? "thinking" : scribe.isConnected ? "listening" : "idle";
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="h-screen flex flex-col bg-background print:bg-white">
      <div className="print:hidden">
        <TopBar />
      </div>

      {/* Sub-header */}
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
              {TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={downloadPdf} size="sm" className="h-9 rounded-full">
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[480px_1fr] print:block">
        {/* ============ Conversation panel ============ */}
        <div className="print:hidden flex flex-col border-r border-border bg-gradient-to-b from-secondary/40 via-background to-secondary/30 relative">
          {/* Header with mode toggle */}
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">Linnea</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {orbState === "speaking" ? "Speaking…" : orbState === "thinking" ? "Thinking…" : orbState === "listening" ? "Listening…" : "Tap the orb to talk"}
                </p>
              </div>
            </div>
            <div className="flex items-center rounded-full bg-card border border-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("voice")}
                className={cn("px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer",
                  mode === "voice" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              ><Mic className="h-3 w-3" /> Voice</button>
              <button
                type="button"
                onClick={() => { setMode("text"); stopVoice(); stopSpeaking(); }}
                className={cn("px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer",
                  mode === "text" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              ><Keyboard className="h-3 w-3" /> Text</button>
            </div>
          </div>

          {/* Body */}
          {mode === "voice" ? (
            <div className="flex-1 flex flex-col items-center justify-between px-6 py-8 overflow-hidden">
              {/* Last AI line — large, centered */}
              <div className="w-full max-w-md text-center min-h-[5rem]">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={lastAssistant?.content ?? "intro"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="text-[17px] leading-relaxed text-foreground/90 font-medium tracking-tight"
                  >
                    {lastAssistant?.content ?? `Hi. Let's build your resume. Tap the orb and answer in ${lang?.native ?? "your language"}.`}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Orb */}
              <div className="flex flex-col items-center gap-5">
                <VoiceOrb state={orbState} level={fakeLevel} onClick={toggleVoice} disabled={thinking} />
                <Waveform active={scribe.isConnected} level={fakeLevel} />
                <p className="text-xs text-muted-foreground">
                  {scribe.isConnected ? "Tap to stop · Speak naturally" : thinking ? "Linnea is thinking" : speaking ? "Tap orb to interrupt" : "Tap to speak"}
                </p>
              </div>

              {/* Live partial transcript */}
              <div className="w-full max-w-md min-h-[3rem]">
                <AnimatePresence>
                  {partial && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-2xl bg-card/70 backdrop-blur border border-border px-4 py-2.5 text-sm text-foreground/80 text-center"
                    >
                      {partial}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {speaking && (
                <button
                  onClick={stopSpeaking}
                  className="absolute top-20 right-5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <Square className="h-3 w-3" /> Stop
                </button>
              )}
            </div>
          ) : (
            // -------- Text mode --------
            <>
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
              <form onSubmit={(e) => { e.preventDefault(); onSendText(); }} className="p-4 border-t border-border bg-background">
                <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 focus-within:border-foreground/30 transition">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendText(); } }}
                    placeholder={`Reply in ${lang?.native ?? "your language"}…`}
                    rows={1}
                    className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground min-h-[28px] max-h-32"
                  />
                  <Button type="submit" size="icon" disabled={!textInput.trim() || thinking} className="h-8 w-8 rounded-full">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="mt-2 text-[10.5px] text-muted-foreground text-center">
                  Linnea writes everything in polished English, no matter the language you reply in.
                </p>
              </form>
            </>
          )}
        </div>

        {/* ============ Preview ============ */}
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
        role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md",
      )}>
        {children}
      </div>
    </div>
  );
}
