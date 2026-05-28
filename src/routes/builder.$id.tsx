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
import { Send, Loader2, Download, ArrowLeft, Sparkles, Keyboard, Mic, Square, ChevronDown } from "lucide-react";
import { computeProgress, INDUSTRIES, LANGUAGES, TEMPLATES, type ResumeContent } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { playStreamingMp3 } from "@/lib/voice/streaming-audio";
import { getElevenLabsVoiceId } from "@/lib/voice/voices";
import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getSectionLabels } from "@/lib/resume/section-labels";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const modeRef = useRef<Mode>("voice");
  const [partial, setPartial] = useState("");
  const [fakeLevel, setFakeLevel] = useState(0);
  const [ttsFailed, setTtsFailed] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"assistant" | "preview">("assistant");

  // Track what was last attempted for retry
  const lastSpeakRef = useRef<{ text: string; lang: string }>({ text: "", lang: "en" });

  // Keep modeRef in sync so async callbacks always read current mode
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // Single persistent audio element — never replaced, just reused — prevents orphaned audio
  const audioElRef = useRef<HTMLAudioElement>(typeof window !== "undefined" ? new Audio() : null as unknown as HTMLAudioElement);
  // AbortController for the in-flight TTS fetch
  const ttsAbortRef = useRef<AbortController | null>(null);
  // Monotonically-increasing counter so stale speak() calls know they've been superseded
  const speakCounterRef = useRef(0);
  // Mirror of messages state — readable synchronously inside callbacks without stale closure
  const messagesRef = useRef<Msg[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  // Export state - declared here (before any conditional returns) to satisfy Rules of Hooks
  const [exportMode, setExportMode] = useState<"ui" | "en" | "native" | "bilingual">("ui");
  const [exportContent, setExportContent] = useState<ResumeContent | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`resumezen_premium_unlocked_${id}`) === "true";
    }
    return false;
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Keep messagesRef in sync — lets handleUserUtterance read latest messages synchronously
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const stopSpeaking = useCallback(() => {
    // Bump counter so any in-flight speak() call knows it's been superseded
    speakCounterRef.current += 1;
    // Abort the in-flight fetch
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    // Stop and reset the single audio element
    const el = audioElRef.current;
    if (el) {
      try { el.pause(); } catch { /* ignore */ }
      try { el.currentTime = 0; } catch { /* ignore */ }
      el.removeAttribute("src");
      el.load();
    }
    setSpeaking(false);
  }, []);

  // -------- ElevenLabs realtime STT --------
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      const t = data.text ?? "";
      if (t.trim()) stopSpeaking();
      setPartial(t);
    },
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
      if (error || !r) { toast.error(t("builder.resumeNotFound")); navigate({ to: "/dashboard" }); return; }
      setResume({ ...r, content: (r.content ?? {}) as ResumeContent });
      const { data: m } = await supabase
        .from("ai_conversations").select("id, role, content").eq("resume_id", id).order("created_at");
      const list = (m ?? []).map((x) => ({ id: x.id, role: x.role as "user" | "assistant", content: x.content }));
      messagesRef.current = list;
      setMessages(list);
      if (list.length === 0 && !initRef.current) {
        initRef.current = true;
        // Delay slightly so React has committed the resume state before we call AI.
        // shouldSpeak=true: if user is in voice mode, speak the greeting automatically.
        setTimeout(() => sendToAI([], r.language, r.industry ?? undefined, (r.content ?? {}) as ResumeContent, r.id, true), 400);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // -------- Scroll & faux level animation --------
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, partial]);

  useEffect(() => {
    if (speaking) {
      const audioEl = audioElRef.current;
      if (!audioEl) return;

      let audioCtx: AudioContext | undefined;
      let analyser: AnalyserNode | undefined;
      let sourceNode: MediaElementAudioSourceNode | undefined;
      let animationFrameId: number;
      let active = true;

      try {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        
        audioEl.crossOrigin = "anonymous";
        sourceNode = audioCtx.createMediaElementSource(audioEl);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
          if (!active) return;
          if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
          }
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const level = Math.min(1, average / 120);
            setFakeLevel(level);
          }
          animationFrameId = requestAnimationFrame(update);
        };
        animationFrameId = requestAnimationFrame(update);
      } catch (e) {
        let time = 0;
        const update = () => {
          if (!active) return;
          time += 0.12;
          const syllable = Math.sin(time * 6.5) * 0.45 + 0.45;
          const word = Math.sin(time * 1.8) * 0.5 + 0.5;
          const level = syllable * word * 0.95;
          setFakeLevel(level > 0.08 ? level : 0);
          animationFrameId = requestAnimationFrame(update);
        };
        animationFrameId = requestAnimationFrame(update);
      }

      return () => {
        active = false;
        cancelAnimationFrame(animationFrameId);
      };
    } else if (scribe.isConnected) {
      const i = setInterval(() => setFakeLevel(0.25 + Math.random() * 0.55), 110);
      return () => {
        clearInterval(i);
        setFakeLevel(0);
      };
    } else {
      setFakeLevel(0);
    }
  }, [speaking, scribe.isConnected]);

  // -------- TTS playback --------
  const speak = useCallback(async (text: string, languageCode?: string) => {
    if (!text.trim()) return;

    // Track for retry
    lastSpeakRef.current = { text, lang: languageCode ?? "en" };

    // Claim this speak slot — stopSpeaking bumps the counter so stale calls bail.
    stopSpeaking();
    setTtsFailed(false);
    const myId = ++speakCounterRef.current;

    const controller = new AbortController();
    ttsAbortRef.current = controller;

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase env missing");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      // ---- Guard: bail if superseded while awaiting session ----
      if (myId !== speakCounterRef.current || controller.signal.aborted) return;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/eleven-tts`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voiceId: getElevenLabsVoiceId(languageCode) }),
        signal: controller.signal,
      });

      // ---- Guard: bail if superseded while fetching ----
      if (myId !== speakCounterRef.current || controller.signal.aborted) return;

      // Reuse the single persistent audio element — prevents concurrent Audio() objects
      const audioEl = audioElRef.current;

      await playStreamingMp3(audioEl, resp, {
        signal: controller.signal,
        onStart: () => {
          // Final guard before we declare we're speaking
          if (myId === speakCounterRef.current) {
            setSpeaking(true);
            setTtsFailed(false);
          }
        },
        onEnd: () => setSpeaking(false),
        onError: () => { setSpeaking(false); setTtsFailed(true); },
      });
    } catch (e) {
      // AbortError is expected when user speaks mid-sentence — silent exit.
      if (e instanceof DOMException && e.name === "AbortError") { setSpeaking(false); return; }
      // Autoplay blocked by browser (requires user gesture) — show retry button.
      if (e instanceof DOMException && e.name === "NotAllowedError") { setSpeaking(false); setTtsFailed(true); return; }
      // Network / TTS errors — log and show retry button.
      console.warn("[TTS] speak() failed:", e);
      setSpeaking(false);
      setTtsFailed(true);
    }
  }, [stopSpeaking]);

  // -------- Persist & call AI --------
  async function persistMessage(role: "user" | "assistant", content: string) {
    if (!user) return;
    await supabase.from("ai_conversations").insert({ resume_id: id, user_id: user.id, role, content });
  }

  async function sendToAI(history: Msg[], language: string, industry: string | undefined, currentResume: ResumeContent, resumeId: string, shouldSpeak = false) {
    setThinking(true);
    try {
      const industryName =
        (industry && INDUSTRIES.find((i) => i.id === industry)?.name) ||
        industry ||
        undefined;
      const { data, error } = await supabase.functions.invoke("resume-chat", {
        body: {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          language,
          industry: industryName,
          currentResume,
        },
      });
      if (error) throw error;
      const payload = data as { message: string; resume_patch: Partial<ResumeContent>; error?: string };
      if (payload.error) throw new Error(payload.error);

      const aiMsg: Msg = { role: "assistant", content: payload.message || "..." };
      // Update messagesRef synchronously so handleUserUtterance always has latest history
      const nextMessages = [...messagesRef.current, aiMsg];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
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

      // Only speak if this call is explicitly authorized (shouldSpeak=true)
      // OR the user is actively in voice mode. modeRef.current is always current.
      if ((shouldSpeak || modeRef.current === "voice") && aiMsg.content.trim()) {
        speak(aiMsg.content, language);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Linnea couldn't respond. Try again.");
    } finally {
      setThinking(false);
    }
  }

  const handleUserUtterance = useCallback((text: string) => {
    if (!resume || thinking) return; // Debounce: ignore while AI is already responding
    // Interrupt any AI speech the moment user starts speaking
    stopSpeaking();
    const userMsg: Msg = { role: "user", content: text };
    // Build the updated list synchronously using messagesRef — avoids the
    // setMessages(prev => { sideEffect(); return prev }) anti-pattern that
    // React StrictMode double-invokes, which was the root cause of double TTS.
    const nextMessages = [...messagesRef.current, userMsg];
    messagesRef.current = nextMessages; // Keep ref up-to-date immediately
    setMessages(nextMessages);
    persistMessage("user", userMsg.content);
    // Call AI with the already-updated history
    sendToAI(nextMessages, resume.language, resume.industry ?? undefined, resume.content, resume.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, thinking, stopSpeaking]);

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
      toast.error(e instanceof Error ? e.message : t("builder.voiceErrMic"));
    }
  };

  const stopVoice = async () => {
    setPartial("");
    await scribe.disconnect();
  };

  const toggleVoice = () => {
    // ChatGPT Voice-like: tapping while speaking interrupts immediately.
    if (speaking) {
      stopSpeaking();
      if (!scribe.isConnected) void startVoice();
      return;
    }
    return scribe.isConnected ? stopVoice() : startVoice();
  };

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
  const runExportPrint = (printMode: "en" | "native" | "bilingual") => {
    setExportMode(printMode);
    // Let React commit the DOM update, then print.
    setTimeout(() => window.print(), 50);
    // Reset back to UI mode after print dialog opens.
    setTimeout(() => setExportMode("ui"), 500);
  };

  // -------- Cleanup --------
  useEffect(() => () => {
    stopSpeaking();
    if (scribe.isConnected) scribe.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Export translation effect — must be ABOVE the conditional return to satisfy Rules of Hooks
  useEffect(() => {
    if (!resume) return;
    if (exportMode === "native" || exportMode === "bilingual") {
      setExportLoading(true);
      supabase.functions
        .invoke("resume-export", {
          body: { content: resume.content, targetLanguage: resume.language },
        })
        .then(({ data, error }) => {
          if (error) throw error;
          const payload = data as { content: ResumeContent };
          setExportContent((payload?.content ?? null) as ResumeContent | null);
        })
        .catch(() => setExportContent(null))
        .finally(() => setExportLoading(false));
    } else {
      setExportContent(null);
      setExportLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportMode, resume?.id]);

  if (!resume) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const lang = LANGUAGES.find((l) => l.code === resume.language);
  const orbState: OrbState = speaking ? "speaking" : thinking ? "thinking" : scribe.isConnected ? "listening" : "idle";
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const labelsEn = getSectionLabels("en");
  const labelsNative = getSectionLabels(resume.language);

  return (
      <div
        className="h-screen flex flex-col bg-background print:bg-white"
        lang={exportMode === "native" ? (resume.language || "en") : "en"}
      >
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
            {savedTick && <span className="text-primary">{t("common.saved")}</span>}
          </div>
          <Select value={resume.template} onValueChange={changeTemplate}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {t(`templatesList.${tpl.id}.name`, { defaultValue: tpl.name })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPremium ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 select-none">
              Premium ✦
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpgradeModal(true)}
              className="h-9 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-500/30 hover:border-amber-500/50 text-amber-700 dark:text-amber-400 font-semibold"
            >
              Upgrade ✦
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9 rounded-full">
                <Download className="mr-1.5 h-4 w-4" /> {t("common.pdf")} <ChevronDown className="ml-1.5 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => runExportPrint("en")}>
                {t("builder.exportEnglish")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => runExportPrint("native")}>
                {t("builder.exportNative", { language: lang?.native ?? "your language" })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => runExportPrint("bilingual")}>
                {t("builder.exportBilingual", { language: lang?.native ?? "your language" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile-First Segmented Tab Switcher */}
      {isMobile && (
        <div className="print:hidden flex border-b border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setMobileTab("assistant")}
            className={cn(
              "flex-1 py-2 text-center text-xs font-medium rounded-xl transition-all cursor-pointer",
              mobileTab === "assistant" ? "bg-accent text-accent-foreground shadow-sm font-semibold" : "text-muted-foreground"
            )}
          >
            {t("builder.tabAssistant")}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={cn(
              "flex-1 py-2 text-center text-xs font-medium rounded-xl transition-all cursor-pointer",
              mobileTab === "preview" ? "bg-accent text-accent-foreground shadow-sm font-semibold" : "text-muted-foreground"
            )}
          >
            {t("builder.tabPreview")}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[480px_1fr] print:block">
        {/* ============ Conversation panel ============ */}
        {(!isMobile || mobileTab === "assistant") && (
          <div className="print:hidden flex flex-col border-r border-border bg-gradient-to-b from-secondary/40 via-background to-secondary/30 relative h-full">
            {/* Header with mode toggle */}
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{t("builder.assistantName")}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {orbState === "speaking"
                      ? t("builder.speaking")
                      : orbState === "thinking"
                        ? t("builder.thinking")
                        : orbState === "listening"
                          ? t("builder.listening")
                          : t("builder.tapOrbToTalk")}
                  </p>
                </div>
              </div>
              <div className="flex items-center rounded-full bg-card border border-border p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("voice")}
                  className={cn("px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer",
                    mode === "voice" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                ><Mic className="h-3 w-3" /> {t("builder.voice")}</button>
                <button
                  type="button"
                  onClick={() => { setMode("text"); stopVoice(); stopSpeaking(); }}
                  className={cn("px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer",
                    mode === "text" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                ><Keyboard className="h-3 w-3" /> {t("builder.text")}</button>
              </div>
            </div>

            {/* Body */}
            {mode === "voice" ? (
              <div className="flex-1 flex flex-col items-center justify-between px-6 py-6 sm:py-8 overflow-hidden gap-6 sm:gap-8">
                {/* Last AI line — large, centered */}
                <div className="w-full max-w-md text-center min-h-[5rem] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={lastAssistant?.content ?? "intro"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35 }}
                      className="text-[17px] sm:text-[18px] leading-relaxed text-foreground/90 font-medium tracking-tight"
                    >
                      {lastAssistant?.content ?? t("builder.intro", { language: lang?.native ?? "your language" })}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Orb */}
                <div className="flex flex-col items-center gap-4 sm:gap-5 flex-1 justify-center">
                  <VoiceOrb state={orbState} level={fakeLevel} onClick={toggleVoice} disabled={thinking} />
                  <Waveform active={scribe.isConnected} level={fakeLevel} />
                  <p className="text-xs text-muted-foreground">
                    {scribe.isConnected
                      ? t("builder.tapToStop")
                      : thinking
                        ? t("builder.aiThinking")
                        : speaking
                          ? t("builder.tapToInterrupt")
                          : t("builder.tapToSpeak")}
                  </p>
                  {/* TTS failure retry button — shown in selected language when sound doesn't come */}
                  {ttsFailed && !speaking && !thinking && (
                    <button
                      type="button"
                      onClick={() => speak(lastSpeakRef.current.text, lastSpeakRef.current.lang)}
                      className="mt-1 flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs text-foreground/80 hover:bg-accent hover:text-foreground transition-all animate-pulse cursor-pointer"
                    >
                      <span>🔊</span>
                      <span>{t("builder.tapToListen")}</span>
                    </button>
                  )}
                </div>

                {/* Live partial transcript */}
                <div className="w-full max-w-md min-h-[3rem] pb-2">
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
                    <Square className="h-3 w-3" /> {t("builder.stop")}
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
                      placeholder={t("builder.replyPlaceholder", { language: lang?.native ?? "your language" })}
                      rows={1}
                      className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground min-h-[28px] max-h-32"
                    />
                    <Button type="submit" size="icon" disabled={!textInput.trim() || thinking} className="h-8 w-8 rounded-full">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-2 text-[10.5px] text-muted-foreground text-center">
                    {t("builder.shortRepliesHint")}
                  </p>
                </form>
              </>
            )}
          </div>
        )}

        {/* ============ Preview ============ */}
        {(!isMobile || mobileTab === "preview") && (
          <div className="overflow-y-auto bg-muted/40 print:bg-white print:overflow-visible">
            <div className="mx-auto my-6 print:my-0 w-full max-w-[820px] print:max-w-none">
              <div className="bg-white shadow-[0_2px_24px_-8px_rgba(0,0,0,0.12)] rounded-xl print:rounded-none print:shadow-none overflow-hidden border border-border print:border-0">
                <div className="min-h-[1100px]">
                  {exportMode === "ui" && (
                    <ResumePreview
                      content={resume.content}
                      template={resume.template as "ats" | "modern" | "fresher"}
                      labels={labelsEn}
                      isPremium={isPremium}
                      userEmail={user?.email}
                    />
                  )}
                  {exportMode === "en" && (
                    <ResumePreview
                      content={resume.content}
                      template={resume.template as "ats" | "modern" | "fresher"}
                      labels={labelsEn}
                      isPremium={isPremium}
                      userEmail={user?.email}
                    />
                  )}
                  {exportMode === "native" && (
                    <ResumePreview
                      content={(exportContent ?? resume.content) as ResumeContent}
                      template={resume.template as "ats" | "modern" | "fresher"}
                      labels={labelsNative}
                      isPremium={isPremium}
                      userEmail={user?.email}
                    />
                  )}
                  {exportMode === "bilingual" && (
                    <div className="print:block">
                      <ResumePreview
                        content={resume.content}
                        template={resume.template as "ats" | "modern" | "fresher"}
                        labels={labelsEn}
                        isPremium={isPremium}
                        userEmail={user?.email}
                      />
                      <div className="print:break-before-page" />
                      <ResumePreview
                        content={(exportContent ?? resume.content) as ResumeContent}
                        template={resume.template as "ats" | "modern" | "fresher"}
                        labels={labelsNative}
                        isPremium={isPremium}
                        userEmail={user?.email}
                      />
                    </div>
                  )}
                  {exportLoading && exportMode !== "ui" && (
                    <div className="print:hidden mt-3 text-xs text-muted-foreground p-5 text-center">
                      {t("builder.preparingTranslation")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative bg-card text-card-foreground border border-border max-w-md w-full rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-2xl font-bold tracking-tight text-center">Unlock Premium ✦</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Remove all watermarks and download unlimited professional resumes instantly.
            </p>
            
            <div className="my-6 p-4 rounded-2xl bg-secondary/50 border border-border/80 flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">UPI Payment Details</span>
              <span className="font-mono text-lg font-bold text-primary mt-2 select-all">jayeshneo07@oksbi</span>
              <span className="text-xl font-extrabold text-foreground mt-3">₹99 <span className="text-xs font-normal text-muted-foreground">one-time payment</span></span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Watermark-free high-definition PDF downloads.</span>
              </div>
              <div className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Full access to ATS-compliant bilingual exports.</span>
              </div>
            </div>

            {/* Manual test bypass control */}
            <div className="mt-6 border-t border-border/80 pt-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-100">
                <div className="text-xs font-medium">
                  <p className="font-bold">Manual Test Unlock</p>
                  <p className="opacity-80">Tap to bypass payment instantly for testing.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-background text-foreground hover:bg-accent border-amber-500/30 text-xs h-8"
                  onClick={() => {
                    localStorage.setItem(`resumezen_premium_unlocked_${id}`, "true");
                    setIsPremium(true);
                    setShowUpgradeModal(false);
                    toast.success("Premium successfully unlocked for this resume!");
                  }}
                >
                  Bypass
                </Button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1 rounded-full h-11" onClick={() => setShowUpgradeModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
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
