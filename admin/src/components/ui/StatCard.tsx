import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: number | null;
  accent?: "navy" | "red" | "success" | "warning";
  className?: string;
};

function AnimatedNumber({ value }: { value: number }) {
  const reduced = usePrefersReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString("fr-FR"));

  useEffect(() => {
    motionValue.set(reduced ? value : 0);
    if (!reduced) motionValue.set(value);
  }, [value, reduced, motionValue]);

  return <motion.span>{display}</motion.span>;
}

const accents = {
  navy: "from-ireduc-navy/15 to-transparent text-ireduc-navy",
  red: "from-ireduc-primary/15 to-transparent text-ireduc-primary",
  success: "from-emerald-500/15 to-transparent text-ireduc-success",
  warning: "from-amber-500/15 to-transparent text-amber-700",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "navy",
  className,
}: Props) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "card-surface card-lift relative overflow-hidden p-5",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          accents[accent]
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            <AnimatedNumber value={value} />
          </p>
          {trend != null ? (
            <p
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-bold",
                trend >= 0 ? "text-ireduc-success" : "text-ireduc-primary"
              )}
            >
              {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend >= 0 ? "+" : ""}
              {trend}% vs période préc.
            </p>
          ) : null}
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-white/10">
          <Icon size={20} />
        </span>
      </div>
    </motion.div>
  );
}
