import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Mic, Keyboard, Eye, Palette, Download, Plus, Briefcase, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_KEY = "resumezen_onboarding_step";
const ACTIVE_KEY = "resumezen_onboarding_active";

type Step = {
  path: string;            // The page path this step belongs to
  target: string;          // data-tour selector value
  title: string;
  body: string;
  icon: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
};

const STEPS: Step[] = [
  {
    path: "/dashboard",
    target: "tour-create-new",
    title: "🚀 Create Your Resume",
    body: "Welcome to Career Compass AI! Click the 'New Resume' button here to select your template and start your journey.",
    icon: <Plus className="h-4.5 w-4.5 text-primary" />,
    position: "bottom",
  },
  {
    path: "/templates",
    target: "tour-select-template",
    title: "🎨 Select a Template",
    body: "Select one of our 10 beautiful, ATS-optimized templates. Don't worry, you can switch this at any time later with zero data loss!",
    icon: <Palette className="h-4.5 w-4.5 text-primary" />,
    position: "bottom",
  },
  {
    path: "/templates",
    target: "tour-template-continue",
    title: "➡️ Next Step",
    body: "Ready to proceed? Click the 'Continue' button to choose your target industry.",
    icon: <ChevronRight className="h-4.5 w-4.5 text-primary" />,
    position: "top",
  },
  {
    path: "/industry",
    target: "tour-select-industry",
    title: "💼 Target Industry",
    body: "Select your professional career field. This helps Linnea customize her interview questions to fit your specific role.",
    icon: <Briefcase className="h-4.5 w-4.5 text-primary" />,
    position: "bottom",
  },
  {
    path: "/industry",
    target: "tour-industry-other",
    title: "✳️ Custom Industry?",
    body: "Can't find your target field? Click 'Other' to input your own custom industry or job title.",
    icon: <Sparkles className="h-4.5 w-4.5 text-primary" />,
    position: "top",
  },
  {
    path: "/industry",
    target: "tour-industry-start",
    title: "🎙️ Meet Your AI interviewer",
    body: "Click 'Start Writing' to open your builder workspace and meet Linnea, your interactive AI interviewer!",
    icon: <Mic className="h-4.5 w-4.5 text-primary" />,
    position: "top",
  },
  {
    path: "/builder",
    target: "tour-voice",
    title: "🎙️ Interactive Voice Mode",
    body: "Click the mic and speak naturally! Linnea will listen, ask clarification questions, and fill in your details automatically.",
    icon: <Mic className="h-4.5 w-4.5 text-primary" />,
    position: "bottom",
  },
  {
    path: "/builder",
    target: "tour-text",
    title: "⌨️ Chat Text Mode",
    body: "Prefer typing? Switch to text mode to review suggestions and type out your resume details directly.",
    icon: <Keyboard className="h-4.5 w-4.5 text-primary" />,
    position: "bottom",
  },
  {
    path: "/builder",
    target: "tour-preview",
    title: "👁️ Live PDF Preview",
    body: "Your professional resume builds in real-time as you chat! On mobile devices, tap 'Preview' to view your document.",
    icon: <Eye className="h-4.5 w-4.5 text-primary" />,
    position: "bottom",
  },
  {
    path: "/builder",
    target: "tour-template",
    title: "✨ Change Design",
    body: "Swap templates dynamically anytime inside the builder to instantly preview alternative visual layouts.",
    icon: <Palette className="h-4.5 w-4.5 text-primary" />,
    position: "bottom",
  },
  {
    path: "/builder",
    target: "tour-download",
    title: "📥 Export ATS PDF",
    body: "When you are happy with the content, export your resume as a clean, highly polished ATS-friendly PDF!",
    icon: <Download className="h-4.5 w-4.5 text-primary" />,
    position: "bottom",
  },
];

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPath, setCurrentPath] = useState(typeof window !== "undefined" ? window.location.pathname : "");

  // Initialize Tour State
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check pathname transitions
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    
    // Polyfill location listening for Single Page App transitions
    const interval = setInterval(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    }, 250);

    const isTourActive = localStorage.getItem(ACTIVE_KEY);
    const savedStep = localStorage.getItem(STEP_KEY);

    if (isTourActive === null) {
      // First-time visitor: start the tour on the dashboard
      if (window.location.pathname === "/dashboard") {
        localStorage.setItem(ACTIVE_KEY, "true");
        localStorage.setItem(STEP_KEY, "0");
        setActive(true);
        setStep(0);
      }
    } else if (isTourActive === "true") {
      setActive(true);
      if (savedStep !== null) {
        setStep(Number(savedStep));
      }
    }

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(interval);
    };
  }, [currentPath]);

  // Synchronize tour step index to the current page route
  useEffect(() => {
    if (!active) return;

    const currentStepDef = STEPS[step];
    if (!currentStepDef) return;

    const pathMatches = currentStepDef.path === "/builder"
      ? currentPath.startsWith("/builder")
      : currentPath === currentStepDef.path;

    if (!pathMatches) {
      // Find the first step corresponding to this new path
      const newStepIdx = STEPS.findIndex((s) =>
        s.path === "/builder" ? currentPath.startsWith("/builder") : currentPath === s.path
      );
      if (newStepIdx !== -1) {
        setStep(newStepIdx);
        localStorage.setItem(STEP_KEY, String(newStepIdx));
      } else {
        // Current route has no matching onboarding steps: pause visually
        setRect(null);
      }
    }
  }, [currentPath, active, step]);

  // Check for the presence of modal dialogs (e.g. language select) to auto-pause the tour
  useEffect(() => {
    const checkModals = () => {
      const languageModal = document.getElementById("language-picker-modal");
      if (languageModal) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    // Run check periodically
    const timer = setInterval(checkModals, 200);
    return () => clearInterval(timer);
  }, []);

  // Update bounding rectangle of active target
  const updateRect = useCallback(() => {
    if (!active || isPaused) {
      setRect(null);
      return;
    }
    const currentStepDef = STEPS[step];
    if (!currentStepDef) return;

    const el = document.querySelector(`[data-tour="${currentStepDef.target}"]`);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [active, isPaused, step]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  const dismiss = useCallback(() => {
    setActive(false);
    localStorage.setItem(ACTIVE_KEY, "false");
  }, []);

  const handleNext = useCallback(() => {
    const nextStepIdx = step + 1;
    if (nextStepIdx >= STEPS.length) {
      dismiss();
      return;
    }

    const currentTarget = STEPS[step].target;
    const el = document.querySelector(`[data-tour="${currentTarget}"]`) as HTMLElement;

    // Smart Navigation transitions on click
    if (step === 0 && el) {
      el.click(); // Click "Create New Resume"
    } else if (step === 2 && el) {
      el.click(); // Click "Continue" to fields
    } else if (step === 5 && el) {
      el.click(); // Click "Start Writing"
    } else {
      // Normal sequential step
      setStep(nextStepIdx);
      localStorage.setItem(STEP_KEY, String(nextStepIdx));
    }
  }, [step, dismiss]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      const prevStepIdx = step - 1;
      setStep(prevStepIdx);
      localStorage.setItem(STEP_KEY, String(prevStepIdx));
    }
  }, [step]);

  // Restart / Trigger onboarding manually (e.g. from support or dashboard help buttons)
  useEffect(() => {
    const handleTriggerTour = () => {
      localStorage.setItem(ACTIVE_KEY, "true");
      localStorage.setItem(STEP_KEY, "0");
      setStep(0);
      setActive(true);
      if (window.location.pathname !== "/dashboard") {
        window.location.href = "/dashboard";
      }
    };
    window.addEventListener("trigger-resume-tour", handleTriggerTour);
    return () => window.removeEventListener("trigger-resume-tour", handleTriggerTour);
  }, []);

  if (!active || isPaused) return null;

  const current = STEPS[step];
  if (!current) return null;

  // Render check: If target is not on current page, return null
  const currentStepDef = STEPS[step];
  const pathMatches = currentStepDef.path === "/builder"
    ? currentPath.startsWith("/builder")
    : currentPath === currentStepDef.path;
  if (!pathMatches) return null;

  // Smart Tooltip style with screen clipping protection
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) {
      // Center position if element is missing or not rendered yet
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed",
        width: "320px",
      };
    }

    const pad = 16;
    const tooltipW = Math.min(330, window.innerWidth - 32);
    const isMobile = window.innerWidth < 640;

    // Mobile: Always align centered bottom or centered top depending on target height
    if (isMobile) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const leftX = Math.max(16, Math.min(window.innerWidth - tooltipW - 16, rect.left + rect.width / 2 - tooltipW / 2));
      if (spaceBelow > 220) {
        return { top: rect.bottom + pad, left: leftX, width: tooltipW, position: "fixed" };
      }
      return { bottom: window.innerHeight - rect.top + pad, left: leftX, width: tooltipW, position: "fixed" };
    }

    // Desktop: Follow position hints but protect against edge clipping
    const leftX = Math.max(16, Math.min(window.innerWidth - tooltipW - 16, rect.left + rect.width / 2 - tooltipW / 2));
    let finalPos = current.position;

    // Auto-flip tooltip if target is close to screen bounds
    if (rect.top < 220 && finalPos === "top") {
      finalPos = "bottom";
    } else if (window.innerHeight - rect.bottom < 220 && finalPos === "bottom") {
      finalPos = "top";
    }

    switch (finalPos) {
      case "top":
        return { bottom: window.innerHeight - rect.top + pad, left: leftX, width: tooltipW, position: "fixed" };
      case "bottom":
        return { top: rect.bottom + pad, left: leftX, width: tooltipW, position: "fixed" };
      case "left":
        return { top: rect.top, right: window.innerWidth - rect.left + pad, width: tooltipW, position: "fixed" };
      case "right":
        return { top: rect.top, left: rect.right + pad, width: tooltipW, position: "fixed" };
      default:
        return { top: rect.bottom + pad, left: leftX, width: tooltipW, position: "fixed" };
    }
  };

  return (
    <>
      {/* Backdrop with a smooth, focused spotlight hole utilizing huge shadow */}
      <AnimatePresence>
        {rect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9990] rounded-2xl ring-4 ring-primary/80 ring-offset-4 ring-offset-transparent pointer-events-none transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
            }}
          />
        )}
      </AnimatePresence>

      {/* Global overlay fallback click listener */}
      <div className="fixed inset-0 z-[9980] pointer-events-none" />

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed z-[9995] rounded-3xl backdrop-blur-md bg-card/95 dark:bg-card/90 border border-border/80 shadow-2xl p-6 flex flex-col gap-3.5 select-none"
          style={getTooltipStyle()}
        >
          {/* Close Header */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const matchesStepPath = s.path === "/builder"
                ? currentPath.startsWith("/builder")
                : currentPath === s.path;
              return (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === step
                      ? "w-6 bg-primary"
                      : matchesStepPath
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20"
                  )}
                />
              );
            })}
            <span className="ml-auto text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Icon & Title */}
          <div className="flex items-center gap-2.5 mt-1">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              {current.icon}
            </div>
            <h4 className="font-display text-base font-bold tracking-tight text-foreground">{current.title}</h4>
          </div>

          {/* Body Description */}
          <p className="text-[13px] text-muted-foreground leading-relaxed font-normal">{current.body}</p>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-3 pt-3.5 border-t border-border/60 gap-3">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className={cn(
                "flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                step === 0
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/85"
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={dismiss}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-accent/80 transition-colors cursor-pointer uppercase tracking-wide"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-primary/20"
              >
                {step === STEPS.length - 1 ? "Finish" : "Next"}
                {step < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
