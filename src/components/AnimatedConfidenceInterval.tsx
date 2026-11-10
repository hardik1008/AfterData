import React from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

interface AnimatedConfidenceIntervalProps {
  pointEstimate: number;
  lower: number;
  upper: number;
  label?: string;
  unit?: string;
  confidenceLevel?: number;
}

export const AnimatedConfidenceInterval: React.FC<AnimatedConfidenceIntervalProps> = ({
  pointEstimate,
  lower,
  upper,
  label = "Effect Difference",
  unit = "",
  confidenceLevel = 95,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  // Determine scale bounds: ensure 0 is in view if near, plus comfortable padding
  const minVal = Math.min(lower, 0, pointEstimate);
  const maxVal = Math.max(upper, 0, pointEstimate);
  const range = maxVal - minVal || 1;
  const padding = range * 0.15;
  const scaleMin = minVal - padding;
  const scaleMax = maxVal + padding;
  const totalSpan = scaleMax - scaleMin;

  const toPercent = (val: number) => {
    return Math.max(0, Math.min(100, ((val - scaleMin) / totalSpan) * 100));
  };

  const pLower = toPercent(lower);
  const pUpper = toPercent(upper);
  const pPoint = toPercent(pointEstimate);
  const pZero = toPercent(0);

  const includesZero = lower <= 0 && upper >= 0;

  return (
    <div className="space-y-3 p-4 rounded-xl border border-neutral-200 bg-white font-mono text-xs">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-800 font-sans">{label}</span>
          <span className="text-neutral-400">· {confidenceLevel}% Confidence Range</span>
        </div>
        <div className="text-neutral-500 font-medium">
          [{lower.toFixed(2)}, {upper.toFixed(2)}] {unit}
        </div>
      </div>

      {/* Visual Expanding Interval Track */}
      <div className="relative h-9 bg-neutral-100/70 rounded-lg overflow-hidden flex items-center px-2">
        {/* Zero Baseline Marker */}
        {scaleMin <= 0 && scaleMax >= 0 && (
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-neutral-300 z-10 flex flex-col justify-between items-center"
            style={{ left: `${pZero}%` }}
          >
            <span className="text-[9px] text-neutral-400 -mt-0.5">0</span>
            <span className="text-[9px] text-neutral-400 -mb-0.5">0</span>
          </div>
        )}

        {/* Confidence Interval Shaded Range Expanding Outwards */}
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { left: `${pPoint}%`, width: "0%" }}
          animate={{
            left: `${pLower}%`,
            width: `${Math.max(1, pUpper - pLower)}%`,
          }}
          transition={{
            duration: reducedMotion ? 0 : 0.7,
            ease: "easeOut" as const,
          }}
          className={`absolute h-3.5 rounded-sm z-20 ${
            includesZero ? "bg-neutral-300" : "bg-neutral-900"
          }`}
        />

        {/* Point Estimate Dot */}
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.4, duration: 0.3 }}
          className="absolute z-30 w-3 h-3 rounded-full bg-white border-2 border-neutral-900 shadow-xs -translate-x-1/2"
          style={{ left: `${pPoint}%` }}
        />
      </div>

      {/* Numerical Bounds Footnote */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400">
        <span>Lower: {lower.toFixed(2)}</span>
        <span className="text-neutral-700 font-semibold font-sans">
          Point Estimate: {pointEstimate.toFixed(2)}
        </span>
        <span>Upper: {upper.toFixed(2)}</span>
      </div>

      {includesZero && (
        <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-100 font-sans">
          Confidence interval crosses zero: cannot reject null hypothesis of zero difference with {confidenceLevel}% certainty.
        </div>
      )}
    </div>
  );
};
