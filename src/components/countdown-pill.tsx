import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { sfx } from "@/lib/sounds";

interface CountdownPillProps {
  /** Stable id for the round being timed -- resets the timer when this changes. */
  roundKey: string;
  /** Seconds the player has to lock a pick before tipping into "go go go". */
  seconds?: number;
  /** Called once when the timer hits zero. */
  onExpire?: () => void;
}

export function CountdownPill({
  roundKey,
  seconds = 25,
  onExpire,
}: CountdownPillProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [roundKey, seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    if (remaining <= 5) sfx.countdown();
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [remaining, onExpire]);

  const pct = Math.max(0, Math.min(1, remaining / seconds));
  const urgent = remaining <= 5;
  const label = remaining > 0 ? `${remaining}s` : "Time!";

  return (
    <div className="relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full overflow-hidden bg-muted text-foreground border border-border">
      <div
        className={`absolute inset-y-0 left-0 transition-[width] duration-1000 ease-linear ${
          urgent ? "bg-destructive/20" : "bg-primary/20"
        }`}
        style={{ width: `${pct * 100}%` }}
      />
      <Timer
        className={`relative h-3 w-3 ${urgent ? "text-destructive" : "text-primary"}`}
      />
      <span
        className={`relative text-[11px] font-extrabold tabular-nums tracking-wider ${
          urgent ? "text-destructive" : "text-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
