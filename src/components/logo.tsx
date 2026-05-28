import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <span className="grid place-items-center h-7 w-7 rounded-md bg-primary text-primary-foreground font-display font-bold text-sm">
        Z
      </span>
      <span className="font-display text-base font-semibold tracking-tight">resume-zen Ai</span>
    </div>
  );
}
