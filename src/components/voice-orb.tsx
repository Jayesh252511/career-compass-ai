import { motion } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Floating voice orb — the centerpiece of the voice-first builder.
 * Soft gradient sphere with state-aware halo, pulse, and waveform.
 */
export function VoiceOrb({
  state,
  level = 0,
  onClick,
  disabled,
}: {
  state: OrbState;
  level?: number; // 0-1, current input volume
  onClick?: () => void;
  disabled?: boolean;
}) {
  const ringScale = state === "listening" ? 1 + level * 0.35 : 1;

  return (
    <div className="relative grid place-items-center select-none">
      {/* Ambient halos */}
      <motion.div
        aria-hidden
        className={cn(
          "absolute h-56 w-56 rounded-full blur-3xl opacity-60 transition-colors",
          state === "listening" && "bg-primary/40",
          state === "thinking" && "bg-amber-400/30",
          state === "speaking" && "bg-emerald-400/40",
          state === "idle" && "bg-foreground/10",
        )}
        animate={{ scale: state === "idle" ? 1 : [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute h-44 w-44 rounded-full border border-foreground/10"
        animate={{ scale: ringScale, opacity: state === "listening" ? 0.9 : 0.4 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      />
      <motion.div
        aria-hidden
        className="absolute h-36 w-36 rounded-full border border-foreground/10"
        animate={{ scale: ringScale * 0.95, opacity: state === "listening" ? 0.7 : 0.3 }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
      />

      {/* Core orb */}
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative h-28 w-28 rounded-full grid place-items-center cursor-pointer",
          "bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-[0_18px_60px_-12px_rgba(0,0,0,0.4)]",
          "transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        )}
        animate={
          state === "speaking"
            ? { scale: [1, 1.04, 1] }
            : state === "thinking"
              ? { rotate: 360 }
              : { scale: 1, rotate: 0 }
        }
        transition={
          state === "speaking"
            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            : state === "thinking"
              ? { duration: 2.4, repeat: Infinity, ease: "linear" }
              : { duration: 0.3 }
        }
      >
        {state === "thinking" ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : state === "speaking" ? (
          <Volume2 className="h-7 w-7" />
        ) : state === "listening" ? (
          <Mic className="h-7 w-7" />
        ) : (
          <MicOff className="h-7 w-7 opacity-80" />
        )}
      </motion.button>
    </div>
  );
}

/** Slim animated waveform under the orb to show live input energy. */
export function Waveform({ active, level = 0 }: { active: boolean; level?: number }) {
  const bars = 24;
  return (
    <div className="flex items-end gap-[3px] h-8" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const seed = Math.sin((i + 1) * 1.7) * 0.5 + 0.5;
        const h = active ? 6 + (level * 22 + seed * 14) : 4;
        return (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-foreground/70"
            animate={{ height: active ? [h * 0.6, h, h * 0.7] : 4 }}
            transition={{ duration: 0.7 + seed * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.03 }}
          />
        );
      })}
    </div>
  );
}
