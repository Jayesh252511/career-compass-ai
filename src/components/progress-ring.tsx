import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ProgressRingProps = {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
};

function getColor(pct: number): string {
  if (pct >= 100) return "hsl(142, 71%, 45%)";   // green
  if (pct >= 70) return "hsl(142, 60%, 50%)";     // light green
  if (pct >= 40) return "hsl(45, 93%, 47%)";      // amber/yellow
  return "hsl(0, 84%, 60%)";                       // red
}

export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 4,
  className,
  showLabel = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (pct / 100) * circumference;
  const color = getColor(pct);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-border/40"
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute text-[11px] font-bold leading-none"
          style={{ color }}
        >
          {Math.round(pct)}
        </span>
      )}
    </div>
  );
}
