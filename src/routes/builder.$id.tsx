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
import { Send, Loader2, Download, ArrowLeft, Sparkles, Keyboard, Mic, Square, ChevronDown, Copy, Globe, Eye, RefreshCcw, Volume2 } from "lucide-react";
import { computeProgress, INDUSTRIES, LANGUAGES, TEMPLATES, type ResumeContent, type TemplateType } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { playStreamingMp3 } from "@/lib/voice/streaming-audio";
import { getElevenLabsVoiceId } from "@/lib/voice/voices";
import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getSectionLabels } from "@/lib/resume/section-labels";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Msg = { id?: string; role: "user" | "assistant"; content: string };
type Mode = "voice" | "text";

export const Route = createFileRoute("/builder/$id")({
  component: Builder,
});

const getLangToast = (code: string, native: string) => {
  const map: Record<string, string> = {
    en: `Language updated! The AI will now speak ${native}.`,
    hi: `भाषा अपडेट की गई! AI अब ${native} में बात करेगा।`,
    mr: `भाषा अपडेट केली! AI आता ${native} मध्ये बोलेल.`,
    ta: `மொழி புதுப்பிக்கப்பட்டது! AI இப்போது ${native} மொழியில் பேசும்.`,
    te: `భాష నవీకరించబడింది! AI ఇప్పుడు ${native} లో మాట్లాడుతుంది.`,
    bn: `ভাষা আপডেট করা হয়েছে! এআই এখন ${native} ভাষায় কথা বলবে।`,
    gu: `ભાષા અપડેટ થઈ ગઈ! AI હવે ${native} માં વાત કરશે.`,
    pa: `ਭਾਸ਼ਾ ਅੱਪਡੇਟ ਕੀਤੀ ਗਈ! AI ਹੁਣ ${native} ਵਿੱਚ ਗੱਲ ਕਰੇਗਾ।`,
    ml: `ഭാഷ അപ്ഡേറ്റ് ചെയ്തു! AI ഇനി ${native} സംസാരിക്കും.`,
    kn: `ಭಾಷೆ ನವೀಕರಿಸಲಾಗಿದೆ! AI ಈಗ ${native} ನಲ್ಲಿ ಮಾತನಾಡುತ್ತದೆ.`,
    ur: `زبان اپ ڈیٹ ہو گئی! اب AI ${native} میں بات کرے گا۔`,
    es: `¡Idioma actualizado! La IA ahora hablará en ${native}.`,
    fr: `Langue mise à jour ! L'IA parlera désormais en ${native}.`,
    de: `Sprache aktualisiert! Die KI wird nun auf ${native} sprechen.`,
    ar: `تم تحديث اللغة! سيتحدث الذكاء الاصطناعي الآن بـ ${native}.`,
    ja: `言語が更新されました！AIは${native}で話します。`,
    ko: `언어가 업데이트되었습니다! 이제 AI가 ${native}로 말합니다.`
  };
  return map[code] || map.en;
};

function getResumeSignature(content: any, template: string, language: string): string {
  const cleanContent = { ...content };
  delete cleanContent.premium_unlocked;
  delete cleanContent.premium_signature;
  
  const expCount = Array.isArray(cleanContent.experience) ? cleanContent.experience.length : 0;
  const eduCount = Array.isArray(cleanContent.education) ? cleanContent.education.length : 0;
  const projCount = Array.isArray(cleanContent.projects) ? cleanContent.projects.length : 0;
  const skillsCount = Array.isArray(cleanContent.skills) ? cleanContent.skills.length : 0;
  
  let totalCharCount = 0;
  if (cleanContent.fullName) totalCharCount += cleanContent.fullName.length;
  if (cleanContent.headline) totalCharCount += cleanContent.headline.length;
  if (cleanContent.summary) totalCharCount += cleanContent.summary.length;
  if (Array.isArray(cleanContent.experience)) {
    cleanContent.experience.forEach((e: any) => {
      totalCharCount += (e.title?.length ?? 0) + (e.company?.length ?? 0);
      if (Array.isArray(e.bullets)) {
        e.bullets.forEach((b: string) => totalCharCount += b.length);
      }
    });
  }
  if (Array.isArray(cleanContent.education)) {
    cleanContent.education.forEach((ed: any) => {
      totalCharCount += (ed.degree?.length ?? 0) + (ed.school?.length ?? 0);
    });
  }
  if (Array.isArray(cleanContent.projects)) {
    cleanContent.projects.forEach((p: any) => {
      totalCharCount += (p.name?.length ?? 0) + (p.description?.length ?? 0);
    });
  }
  
  const roundedCharCount = Math.round(totalCharCount / 50) * 50;
  return `${template}_${language}_ex${expCount}_ed${eduCount}_pj${projCount}_sk${skillsCount}_len${roundedCharCount}`;
}

const formatVipTime = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
};

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
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();

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
  const [vipRemaining, setVipRemaining] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const vipUntilStr = localStorage.getItem("resumezen_global_vip_until");
      if (vipUntilStr) {
        const until = parseInt(vipUntilStr, 10);
        if (until > Date.now()) return true;
      }
      return localStorage.getItem(`resumezen_premium_unlocked_${id}`) === "true";
    }
    return false;
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Keep messagesRef in sync — lets handleUserUtterance read latest messages synchronously
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Global VIP Timer
  useEffect(() => {
    const checkVip = () => {
      const untilStr = localStorage.getItem("resumezen_global_vip_until");
      if (untilStr) {
        const diff = parseInt(untilStr, 10) - Date.now();
        if (diff > 0) {
          setVipRemaining(diff);
          setIsPremium(true);
        } else {
          setVipRemaining(null);
        }
      }
    };
    checkVip();
    const interval = setInterval(checkVip, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // -------- Unlock audio on first user gesture (mobile fix) --------
  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      // Play a tiny silent buffer to permanently unlock audio on this page
      const el = audioElRef.current;
      if (el) {
        el.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwBHAAAAAAD/+1DEAAAGAAGn9AAAIgAANP8AAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxB4AAADSAAAAAAAAANIAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";
        el.volume = 0.01;
        el.play().then(() => { el.pause(); el.volume = 1; el.removeAttribute("src"); }).catch(() => {});
      }
      // Also resume any suspended AudioContext
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (AC) { const ctx = new AC(); ctx.resume().then(() => ctx.close()); }
      } catch {}
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
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
      
      const contentObj = (r.content ?? {}) as any;
      setResume({ ...r, content: contentObj as ResumeContent });
      
      // Calculate signature to verify if premium is valid
      const currentSig = getResumeSignature(contentObj, r.template, r.language);
      
      // Query premium_unlocks to see if this signature was already unlocked
      const { data: unlockData } = await (supabase as any)
        .from("premium_unlocks")
        .select("id, payment_id")
        .eq("resume_id", r.id)
        .eq("version_signature", currentSig)
        .maybeSingle();

      const dbPremium = (contentObj.premium_unlocked === true && contentObj.premium_signature === currentSig) || !!unlockData;
      const localPremium = localStorage.getItem(`resumezen_premium_unlocked_${r.id}`) === "true";
      const vipUntilStr = localStorage.getItem("resumezen_global_vip_until");
      const isVip = vipUntilStr ? parseInt(vipUntilStr, 10) > Date.now() : false;
      
      if (isVip || dbPremium || (localPremium && contentObj.premium_signature === currentSig)) {
        setIsPremium(true);
        const hasSpecificUnlock = dbPremium || (localPremium && contentObj.premium_signature === currentSig);
        if (hasSpecificUnlock && (!contentObj.premium_unlocked || contentObj.premium_signature !== currentSig)) {
          // Sync to db
          const updatedContent = {
            ...contentObj,
            premium_unlocked: true,
            premium_signature: currentSig,
            payment_utr: unlockData?.payment_id || "manual_unlock",
            unlocked_at: new Date().toISOString()
          };
          await supabase.from("resumes").update({ content: updatedContent }).eq("id", r.id);
        }
      } else {
        setIsPremium(false);
      }

      const { data: m } = await supabase
        .from("ai_conversations").select("id, role, content").eq("resume_id", id).order("created_at");
      const list = (m ?? []).map((x) => ({ id: x.id, role: x.role as "user" | "assistant", content: x.content }));
      messagesRef.current = list;
      setMessages(list);
      
      if (list.length === 0 && !initRef.current && !dbPremium && !localPremium) {
        initRef.current = true;
        if (r.language === "unspecified") {
          setShowLanguagePicker(true);
        } else {
          // Delay slightly so React has committed the resume state before we call AI.
          // shouldSpeak=true: if user is in voice mode, speak the greeting automatically.
          setTimeout(() => sendToAI([], r.language, r.industry ?? undefined, contentObj, r.id, true), 400);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // -------- Polling Payment Status for automatic checkout --------
  const checkPaymentStatus = async () => {
    if (!user || !resume || isPremium) return;
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("content, template, language")
        .eq("id", id)
        .single();
        
      if (error || !data) return;
      
      const contentObj = (data.content ?? {}) as any;
      const currentSig = getResumeSignature(contentObj, data.template, data.language);
      
      // Check premium_unlocks table as well for higher reliability
      const { data: unlockData } = await (supabase as any)
        .from("premium_unlocks")
        .select("id, payment_id")
        .eq("resume_id", id)
        .eq("version_signature", currentSig)
        .maybeSingle();
      
      if ((contentObj.premium_unlocked === true && contentObj.premium_signature === currentSig) || unlockData) {
        // Ensure content is synced if it was unlocked via premium_unlocks
        let syncedContent = contentObj;
        if (!contentObj.premium_unlocked || contentObj.premium_signature !== currentSig) {
          syncedContent = {
            ...contentObj,
            premium_unlocked: true,
            premium_signature: currentSig,
            payment_utr: unlockData?.payment_id || "webhook_captured",
            unlocked_at: new Date().toISOString()
          };
          await supabase.from("resumes").update({ content: syncedContent }).eq("id", id);
        }
        
        const vipTime = Date.now() + 2 * 60 * 60 * 1000;
        localStorage.setItem("resumezen_global_vip_until", vipTime.toString());
        setVipRemaining(vipTime - Date.now());
        
        setIsPremium(true);
        setResume(prev => prev ? { ...prev, content: syncedContent } : prev);
        setShowUpgradeModal(false);
        toast.success("Payment detected! 2-Hour VIP unlocked globally.");
      }
    } catch (e) {
      console.warn("Polling payment status failed:", e);
    }
  };

  // -------- Check premium sync --------
  useEffect(() => {
    if (!showUpgradeModal || isPremium || !user || !resume) return;
    void checkPaymentStatus();
  }, [showUpgradeModal, isPremium, user, resume?.id]);

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

  const handleDuplicateAndEdit = async () => {
    if (!user || !resume) return;
    setThinking(true);
    try {
      const cleanContent = { ...resume.content };
      delete (cleanContent as any).premium_unlocked;
      delete (cleanContent as any).premium_signature;
      
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title: `${resume.title} (Copy)`,
          template: resume.template,
          industry: resume.industry,
          language: resume.language,
          content: cleanContent,
          progress: resume.progress,
        })
        .select("id")
        .single();
        
      if (error || !data) throw error || new Error("Failed to create copy");
      
      const { data: convs } = await supabase
        .from("ai_conversations")
        .select("role, content")
        .eq("resume_id", resume.id)
        .order("created_at");
        
      if (convs && convs.length > 0) {
        const insertRows = convs.map(c => ({
          resume_id: data.id,
          user_id: user.id,
          role: c.role,
          content: c.content
        }));
        await supabase.from("ai_conversations").insert(insertRows);
      }
      
      toast.success("Created an editable copy of this resume!");
      navigate({ to: "/builder/$id", params: { id: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to duplicate resume.");
    } finally {
      setThinking(false);
    }
  };

  const confirmUnlock = async (code: string) => {
    if (!resume || !user) return;
    
    const trimmed = code.trim().toLowerCase();
    if (trimmed !== "mumbai") {
      toast.error("Invalid unlock code. Please check the LinkedIn post.");
      return;
    }
    
    setVerifyingCode(true);
    
    try {
      const signature = getResumeSignature(resume.content, resume.template, resume.language);
      const updatedContent = {
        ...resume.content,
        premium_unlocked: true,
        premium_signature: signature,
        payment_utr: "mumbai_code",
        unlocked_at: new Date().toISOString(),
      };
      
      // Lock version inside premium_unlocks table
      const { error: unlockErr } = await (supabase as any)
        .from("premium_unlocks")
        .insert({
          user_id: user.id,
          resume_id: resume.id,
          version_signature: signature,
          payment_id: `code_${trimmed}`,
        });
      if (unlockErr) console.error("Error inserting manual premium unlock:", unlockErr);

      const { error } = await supabase
        .from("resumes")
        .update({ content: updatedContent })
        .eq("id", id);
        
      if (error) throw error;
      
      localStorage.setItem(`resumezen_premium_unlocked_${id}`, "true");
      const vipTime = Date.now() + 2 * 60 * 60 * 1000;
      localStorage.setItem("resumezen_global_vip_until", vipTime.toString());
      setVipRemaining(vipTime - Date.now());
      
      setResume(prev => prev ? { ...prev, content: updatedContent } : prev);
      setIsPremium(true);
      setShowUpgradeModal(false);
      setUnlockCode("");
      
      toast.success("Code verified! Premium unlocked & resume version finalized.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to verify unlock code.");
    } finally {
      setVerifyingCode(false);
    }
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
  const changeConversationLanguage = async (lng: string) => {
    if (!resume || resume.language === lng) return;
    setThinking(true);
    try {
      await supabase.from("resumes").update({ language: lng }).eq("id", resume.id);
      setResume({ ...resume, language: lng });
      const languageName = LANGUAGES.find(l => l.code === lng)?.native || lng;
      toast.success(getLangToast(lng, languageName));
    } catch (e) {
      toast.error("Failed to update conversation language.");
    } finally {
      setThinking(false);
    }
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

  // -------- Cleanup & Global Listeners --------
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (scribe.isConnected) scribe.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.id, resume?.language]);

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
      <div className="print:hidden mx-auto w-full max-w-7xl px-3 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
        {/* Left Side: Back & Lang */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
            
            {/* Lang Dropdown — hidden on mobile (already near mic) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-secondary/80 transition-colors shrink-0">
                   <span className="text-xs text-foreground/90 font-medium">{lang?.flag} {lang?.native}</span>
                   <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 max-h-[300px] overflow-auto">
                {LANGUAGES.map((l) => (
                  <DropdownMenuItem key={l.code} onClick={() => changeConversationLanguage(l.code)} className="cursor-pointer">
                    <span className="mr-2">{l.flag}</span><span className="flex-1">{l.native}</span>
                    {resume.language === l.code && <span className="text-[10px] text-muted-foreground">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tools & Download */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto pb-1 sm:pb-0 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <span>{resume.progress}%</span>
            <Progress value={resume.progress} className="h-1 w-28" />
            {savedTick && <span className="text-primary">{t("common.saved")}</span>}
          </div>
          <Select value={resume.template} onValueChange={changeTemplate}>
            <SelectTrigger className="h-9 w-[150px] shrink-0 border-primary/20 hover:border-primary/50 hover:shadow-[0_0_10px_rgba(var(--color-primary),0.2)] transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {t(`templatesList.${tpl.id}.name`, { defaultValue: tpl.name })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {vipRemaining !== null ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 select-none animate-pulse shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              👑 VIP {formatVipTime(vipRemaining)}
            </span>
          ) : isPremium ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 select-none shrink-0">
              Premium ✦
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpgradeModal(true)}
              className="h-9 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-500/30 hover:border-amber-500/50 text-amber-700 dark:text-amber-400 font-semibold shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] transition-all"
            >
              Upgrade ✦
            </Button>
          )}
          
          <Button size="sm" onClick={() => setShowPreviewModal(true)} variant="outline" className="h-9 rounded-full px-4 shrink-0 shadow-sm border-primary/20 hover:border-primary/50 bg-card sm:hidden flex items-center">
            <Eye className="mr-1.5 h-4 w-4" /> <span>Preview</span>
          </Button>

          <Button size="sm" onClick={() => setShowDownloadModal(true)} className="h-9 rounded-full px-4 shrink-0 shadow-[0_0_10px_rgba(var(--color-primary),0.3)] transition-all flex">
            <Download className="mr-1.5 h-4 w-4" /> <span>{t("common.pdf") || "Download"}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col-reverse md:flex-row print:block pb-0">
        {/* ============ Conversation panel ============ */}
        <div className={cn("print:hidden flex flex-col border-t md:border-t-0 md:border-r border-border bg-gradient-to-b from-secondary/40 via-background to-secondary/30 relative md:h-full md:w-[480px]", mode === "text" ? "h-[45vh] min-h-[300px]" : "h-auto md:h-full")}>
              <>
                {/* Header with mode toggle (Hidden on Mobile) */}
                <div className="hidden md:flex px-5 py-4 border-b border-border/60 items-center justify-between">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 ml-2 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title={t("templates.stepLanguage")}>
                        <Globe className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-auto">
                      {LANGUAGES.map((l) => (
                        <DropdownMenuItem 
                          key={l.code} 
                          onClick={() => changeConversationLanguage(l.code)}
                          className="cursor-pointer"
                        >
                          <span className="mr-2">{l.flag}</span>
                          <span className="flex-1">{l.native}</span>
                          {resume.language === l.code && <span className="text-[10px] text-muted-foreground">✓</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Body */}
                {mode === "voice" ? (
                  <div className="flex flex-col items-center md:flex-1 md:justify-center justify-end w-full px-4 py-2 md:py-8 overflow-hidden gap-3 md:gap-6">
                    {/* Last AI line — large, centered */}
                    <div className="w-full max-w-md text-center min-h-[2.5rem] md:min-h-[5rem] flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={lastAssistant?.content ?? "intro"}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.35 }}
                          className="text-[15px] md:text-[18px] leading-relaxed text-foreground/90 font-medium tracking-tight"
                        >
                          {lastAssistant?.content ?? t("builder.intro", { language: lang?.native ?? "your language" })}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Orb + Controls */}
                    <div className="flex flex-col items-center gap-2 md:gap-4 justify-center w-full relative">
                      {/* Voice Controls Row */}
                      <div className="flex items-center justify-center gap-2 md:gap-5 w-full relative px-1">
                        {/* Mobile: Language */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="md:hidden h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border shadow-sm flex items-center justify-center text-foreground/70 hover:text-foreground transition-all shrink-0 z-10">
                              <Globe className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48 max-h-[300px] overflow-auto">
                            {LANGUAGES.map((l) => (
                              <DropdownMenuItem key={l.code} onClick={() => changeConversationLanguage(l.code)} className="cursor-pointer">
                                <span className="mr-2">{l.flag}</span><span className="flex-1">{l.native}</span>
                                {resume.language === l.code && <span className="text-[10px] text-muted-foreground">✓</span>}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Desktop: Replay */}
                        <button onClick={() => { if(lastSpeakRef.current.text) speak(lastSpeakRef.current.text, lastSpeakRef.current.lang) }} className={cn("hidden md:flex h-12 w-12 rounded-full bg-background/60 backdrop-blur-md border border-border shadow-[0_4px_12px_rgba(0,0,0,0.05)] items-center justify-center text-foreground/70 hover:text-foreground transition-all shrink-0 z-10", ttsFailed && "animate-pulse ring-2 ring-primary text-primary")}>
                          <RefreshCcw className="w-5 h-5"/>
                        </button>

                        {/* Desktop: Stop/Mic */}
                        <button onClick={toggleVoice} className="hidden md:flex h-12 w-12 rounded-full bg-background/60 backdrop-blur-md border border-border shadow-[0_4px_12px_rgba(0,0,0,0.05)] items-center justify-center text-foreground/70 hover:text-foreground transition-all shrink-0 z-10">
                          {(scribe.isConnected || speaking) ? <Square className="w-5 h-5 fill-current"/> : <Mic className="w-5 h-5"/>}
                        </button>

                        {/* Big Mic (VoiceOrb) — centered */}
                        <div className="flex-shrink-0 relative z-0 scale-[0.65] md:scale-100 transform origin-center -mx-3 md:mx-0">
                          <VoiceOrb state={orbState} level={fakeLevel} onClick={toggleVoice} disabled={thinking} />
                        </div>

                        {/* Mobile: Stop */}
                        <button onClick={toggleVoice} className="md:hidden h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border shadow-sm flex items-center justify-center text-foreground/70 hover:text-foreground transition-all shrink-0 z-10">
                          <Square className="w-3.5 h-3.5"/>
                        </button>

                        {/* Mobile: Replay */}
                        <button onClick={() => { if(lastSpeakRef.current.text) speak(lastSpeakRef.current.text, lastSpeakRef.current.lang) }} className={cn("md:hidden h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border shadow-sm flex items-center justify-center text-foreground/70 hover:text-foreground transition-all shrink-0 z-10", ttsFailed && "animate-pulse ring-2 ring-primary text-primary")}>
                          <RefreshCcw className="w-3.5 h-3.5"/>
                        </button>

                        {/* Mobile: Text mode */}
                        <button onClick={() => { setMode("text"); stopVoice(); stopSpeaking(); }} className="md:hidden h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border shadow-sm flex items-center justify-center text-foreground/70 hover:text-foreground transition-all shrink-0 z-10">
                          <Keyboard className="w-3.5 h-3.5"/>
                        </button>

                        {/* Desktop: Keyboard */}
                        <button onClick={() => { setMode("text"); stopVoice(); stopSpeaking(); }} className="hidden md:flex h-12 w-12 rounded-full bg-background/60 backdrop-blur-md border border-border shadow-[0_4px_12px_rgba(0,0,0,0.05)] items-center justify-center text-foreground/70 hover:text-foreground transition-all shrink-0 z-10">
                          <Keyboard className="w-5 h-5"/>
                        </button>
                      </div>

                      <Waveform active={scribe.isConnected} level={fakeLevel} />
                      <p className="text-[11px] md:text-xs text-muted-foreground text-center">
                        {scribe.isConnected
                          ? t("builder.tapToStop")
                          : thinking
                            ? t("builder.aiThinking")
                            : speaking
                              ? t("builder.tapToInterrupt")
                              : t("builder.tapToSpeak")}
                      </p>
                      {/* TTS failure message */}
                      {ttsFailed && !speaking && !thinking && (
                        <p className="text-[10px] text-primary animate-pulse text-center font-medium">
                          {t("builder.tapToListen", "Audio blocked. Tap replay button to listen.")}
                        </p>
                      )}
                    </div>

                    {/* Live partial transcript */}
                    <div className="w-full max-w-md min-h-[2rem] md:min-h-[3rem]">
                      <AnimatePresence>
                        {partial && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="rounded-2xl bg-card/70 backdrop-blur border border-border px-4 py-2 text-sm text-foreground/80 text-center"
                          >
                            {partial}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {speaking && (
                      <button
                        onClick={stopSpeaking}
                        className="hidden md:flex absolute top-20 right-5 text-xs text-muted-foreground hover:text-foreground items-center gap-1 cursor-pointer"
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
                    <form onSubmit={(e) => { e.preventDefault(); onSendText(); }} className="p-3 sm:p-4 border-t border-border bg-background w-full">
                      <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-1.5 focus-within:border-foreground/30 transition shadow-sm">
                        {/* Mobile Text/Voice Toggle in Text Mode */}
                        <div className="md:hidden flex items-center bg-secondary/50 rounded-full p-1 mr-1 mb-0.5">
                          <button type="button" onClick={() => setMode('text')} className="p-1.5 rounded-full bg-foreground text-background shadow-sm transition-all">
                            <Keyboard className="w-4 h-4"/>
                          </button>
                          <button type="button" onClick={() => setMode('voice')} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all">
                            <Mic className="w-4 h-4"/>
                          </button>
                        </div>
                        <textarea
                          value={textInput}
                          onChange={(e) => {
                            setTextInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendText(); e.currentTarget.style.height = 'auto'; } }}
                          placeholder={t("builder.replyPlaceholder", { language: lang?.native ?? "your language" })}
                          rows={1}
                          className="flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-muted-foreground min-h-[40px] max-h-[120px] overflow-y-auto w-full leading-relaxed"
                        />
                        <Button type="submit" size="icon" disabled={!textInput.trim() || thinking} className="h-10 w-10 shrink-0 rounded-full mb-0.5 mr-0.5">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2 text-[10.5px] text-muted-foreground text-center">
                        {t("builder.shortRepliesHint")}
                      </p>
                    </form>
                  </>
                )}
              </>
          </div>

        {/* ============ Preview ============ */}
        <div className="flex-1 overflow-y-auto bg-muted/40 print:bg-white print:overflow-visible relative">
          <div className="mx-auto my-6 print:my-0 w-full max-w-[820px] print:max-w-none px-4 md:px-8">
              <div className="bg-white shadow-[0_2px_24px_-8px_rgba(0,0,0,0.12)] rounded-xl print:rounded-none print:shadow-none overflow-hidden border border-border print:border-0">
                <div className="min-h-[1100px]">
                  {exportMode === "ui" && (
                    <ResumePreview
                      content={resume.content}
                      template={resume.template as TemplateType}
                      labels={labelsEn}
                      isPremium={isPremium}
                      userEmail={user?.email}
                    />
                  )}
                  {exportMode === "en" && (
                    <ResumePreview
                      content={resume.content}
                      template={resume.template as TemplateType}
                      labels={labelsEn}
                      isPremium={isPremium}
                      userEmail={user?.email}
                    />
                  )}
                  {exportMode === "native" && (
                    <ResumePreview
                      content={(exportContent ?? resume.content) as ResumeContent}
                      template={resume.template as TemplateType}
                      labels={labelsNative}
                      isPremium={isPremium}
                      userEmail={user?.email}
                    />
                  )}
                  {exportMode === "bilingual" && (
                    <div className="print:block">
                      <ResumePreview
                        content={resume.content}
                        template={resume.template as TemplateType}
                        labels={labelsEn}
                        isPremium={isPremium}
                        userEmail={user?.email}
                      />
                      <div className="print:break-before-page" />
                      <ResumePreview
                        content={(exportContent ?? resume.content) as ResumeContent}
                        template={resume.template as TemplateType}
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
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative bg-card text-card-foreground border border-border/85 max-w-md w-full rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            <div className="text-center space-y-1.5">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 grid place-items-center text-amber-500">
                <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight">Upgrade to Premium ✦</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Remove all watermarks and download unlimited professional bilingual & multilingual resumes.
              </p>
            </div>
            
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col items-center justify-center text-center">
              <span className="text-[12px] text-muted-foreground font-medium mb-1">Enter code to unlock Premium</span>
              <Input 
                placeholder="Enter unlock code" 
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                className="rounded-xl h-10 tracking-widest text-center text-sm font-mono border-border bg-card max-w-[200px]"
                onKeyDown={(e) => { if (e.key === "Enter") confirmUnlock(unlockCode); }}
              />
              <p className="mt-2 text-[10px] text-muted-foreground max-w-[280px]">
                The code is in the LinkedIn post. Just like the post and get the code which is at the last of the caption.
              </p>
            </div>
            
            <div className="space-y-2.5 bg-card border border-border p-3.5 rounded-2xl">
              <div className="flex items-start gap-2.5 text-xs leading-normal">
                <span className="text-emerald-500 font-semibold">✓</span>
                <span>Watermark-free high-definition PDF downloads.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs leading-normal">
                <span className="text-emerald-500 font-semibold">✓</span>
                <span>Full access to ATS-compliant bilingual layouts.</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button 
                className="w-full rounded-full h-11 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-white font-semibold transition-all cursor-pointer"
                onClick={() => confirmUnlock(unlockCode)}
                disabled={verifyingCode || !unlockCode.trim()}
              >
                {verifyingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Verify & Unlock Resume ✦"
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full rounded-full h-10 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                onClick={() => setShowUpgradeModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLanguagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative bg-card text-card-foreground border border-border/85 max-w-3xl w-full rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="text-center space-y-1.5 mb-6">
              <h3 className="font-display text-2xl font-bold tracking-tight">Select Communication Language</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Which language would you like Linnea to use during the interview?
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={async () => {
                    if (!resume) return;
                    setThinking(true);
                    try {
                      await supabase.from("resumes").update({ language: l.code }).eq("id", id);
                      setResume(prev => prev ? { ...prev, language: l.code } : prev);
                      setShowLanguagePicker(false);
                      setTimeout(() => sendToAI([], l.code, resume.industry ?? undefined, resume.content as any, id, true), 400);
                    } catch(e) { toast.error("Failed to set language"); }
                    finally { setThinking(false); }
                  }}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card px-3 py-4 transition-all border-border hover:border-primary/50 hover:bg-accent/50 hover:-translate-y-1 cursor-pointer"
                >
                  <span className="text-2xl leading-none">{l.flag}</span>
                  <span className="text-[13px] font-medium leading-tight text-center">{l.native}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("builder.nameResume", "Name your Resume")}</DialogTitle>
            <DialogDescription>
              {t("builder.nameResumeDesc", "Give your resume a name before downloading.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={resume.title}
              onChange={(e) => renameTitle(e.target.value)}
              placeholder="e.g. John_Doe_Resume"
              className="w-full"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {!isPremium && (
              <Button 
                variant="outline" 
                className="w-full justify-between font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 border-amber-500/30"
                onClick={() => { setShowDownloadModal(false); setShowUpgradeModal(true); }}
              >
                <span>✦ Download Clean PDF</span>
                <span className="text-xs opacity-70">Upgrade</span>
              </Button>
            )}
            <Button 
              className="w-full justify-between" 
              onClick={() => { setShowDownloadModal(false); runExportPrint("en"); }}
            >
              <span>{t("builder.exportEnglish", "Standard Download (English)")}</span>
              {!isPremium && <span className="text-xs opacity-70">(Watermarked)</span>}
            </Button>
            <Button 
              className="w-full justify-between" 
              variant="outline"
              onClick={() => { 
                setShowDownloadModal(false); 
                if (!isPremium) setShowUpgradeModal(true);
                else runExportPrint("native"); 
              }}
            >
              <span>{t("builder.exportNative", { defaultValue: `Standard Download (${lang?.native ?? "Native"})` })}</span>
              {!isPremium && <span className="text-xs opacity-70">✦</span>}
            </Button>
            <Button 
              variant="secondary"
              className="w-full justify-between" 
              onClick={() => { 
                setShowDownloadModal(false); 
                if (!isPremium) setShowUpgradeModal(true);
                else runExportPrint("bilingual"); 
              }}
            >
              <span>{t("builder.exportBilingual", { defaultValue: `Bilingual (${lang?.native ?? "Native"} + English)` })}</span>
              {!isPremium && <span className="text-xs opacity-70">✦</span>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 sm:max-w-4xl overflow-hidden flex flex-col rounded-2xl bg-card border-none">
          <div className="flex-1 overflow-y-auto bg-neutral-100/50 dark:bg-neutral-900/50 p-2 sm:p-4 rounded-b-2xl hide-scrollbar">
            <ResumePreview content={resume.content} template={resume.template as any} labels={exportMode === "native" ? labelsNative : labelsEn} isPremium={isPremium} userEmail={user?.email} />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
        role === "user" ? "bg-primary text-primary-foreground rounded-br-md shadow-sm" : "bg-transparent px-1 font-medium text-foreground/90",
      )}>
        {children}
      </div>
    </div>
  );
}
