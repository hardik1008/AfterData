import React from "react";
import { DatasetProfile, StatisticalResult } from "../../types/dataset";
import {
  BookOpen,
  AlertCircle,
  TrendingDown,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { AnimatedCounter } from "./AnimatedCounter";

interface LearnExperienceProps {
  dataset: DatasetProfile;
  result: StatisticalResult;
  targetVar?: string;
  groupVar?: string;
}

export const LearnExperience: React.FC<LearnExperienceProps> = ({
  dataset,
  result,
  targetVar,
  groupVar,
}) => {
  const continuousCols = dataset.columns.filter((c) => c.inferredType === "continuous");
  const categoricalCols = dataset.columns.filter((c) => c.inferredType === "categorical");

  const metricName = targetVar || continuousCols[0]?.name || "Performance Metric";
  const groupName = groupVar || categoricalCols[0]?.name;

  const vals: number[] = [];
  dataset.records?.forEach((r) => {
    const v = Number(r[metricName]);
    if (!isNaN(v) && v !== null) vals.push(v);
  });
  vals.sort((a, b) => a - b);

  const n = vals.length;
  const q1 = vals[Math.floor(n * 0.25)] || 0;
  const q2 = vals[Math.floor(n * 0.5)] || 0;
  const q4 = vals[Math.floor(n * 0.75)] || 0;

  // Performance gap between top quartile and bottom quartile
  const performanceGap = q4 - q1;
  const gapPercentage = q1 !== 0 ? (performanceGap / q1) * 100 : 0;

  // Quantified Missed Opportunity:
  // If bottom quartile reached median efficiency, how much performance gain?
  const bottomQuartileCount = Math.floor(n * 0.25);
  const bottomVals = vals.slice(0, bottomQuartileCount);
  const bottomMean = bottomVals.reduce((a, b) => a + b, 0) / Math.max(bottomVals.length, 1);
  const potentialGainPerObservation = Math.max(0, q2 - bottomMean);
  const totalMissedOpportunity = potentialGainPerObservation * bottomQuartileCount;

  // Cohort anomalies if group exists
  const cohortScores: { name: string; mean: number; count: number; status: "outperformer" | "lagging" | "typical" }[] = [];
  if (groupName) {
    const map = new Map<string, number[]>();
    dataset.records?.forEach((r) => {
      const g = String(r[groupName] ?? "").trim();
      const v = Number(r[metricName]);
      if (g && !isNaN(v)) {
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push(v);
      }
    });

    map.forEach((cVals, g) => {
      const cMean = cVals.reduce((a, b) => a + b, 0) / cVals.length;
      cohortScores.push({
        name: g,
        mean: Number(cMean.toFixed(1)),
        count: cVals.length,
        status: cMean < q1 ? "lagging" : cMean > q4 ? "outperformer" : "typical",
      });
    });
    cohortScores.sort((a, b) => a.mean - b.mean);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Experience Header */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Experience D: Learn
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          What mistakes or missed opportunities exist?
        </h2>
        <p className="text-xs text-neutral-500">
          Auditing performance dispersion, trailing cohorts, and quantified opportunity gaps across <span className="font-semibold text-neutral-800 font-mono">{metricName}</span>.
        </p>
      </div>

      {/* Statistical Anomaly Caution (Strict Requirement) */}
      <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-neutral-900 block">
            Objective Variance Notice (Not Automatically Management Mistakes)
          </span>
          <p className="text-neutral-600 leading-relaxed">
            Statistical deviations, trailing cohorts, and dispersion gaps identify friction points worthy of deeper audit. They must not be conflated with human or leadership error without qualitative investigation of local constraints and territory differences.
          </p>
        </div>
      </div>

      {/* Quantified Opportunity & Gap Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
            Quartile Dispersion Gap
          </span>
          <div className="text-3xl font-bold text-neutral-900">
            <AnimatedCounter value={performanceGap} decimals={1} />
          </div>
          <span className="text-xs text-neutral-500 block">
            Spread between Top 25% (Q4={q4.toFixed(1)}) and Bottom 25% (Q1={q1.toFixed(1)})
          </span>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
            Trailing Tail Volume
          </span>
          <div className="text-3xl font-bold text-neutral-900">
            <AnimatedCounter value={bottomQuartileCount} decimals={0} />
          </div>
          <span className="text-xs text-neutral-500 block">
            Observations performing below the Q1 boundary
          </span>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
            Quantified Missed Opportunity
          </span>
          <div className="text-3xl font-bold text-emerald-600">
            +<AnimatedCounter value={totalMissedOpportunity} decimals={0} />
          </div>
          <span className="text-xs text-neutral-500 block">
            Potential upside if trailing segment reached median performance (Q2={q2.toFixed(1)})
          </span>
        </div>
      </div>

      {/* Visual Cohort Gap Breakdown with Highlight Animations */}
      {cohortScores.length > 0 && (
        <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Performance Gaps Across {groupName}
              </h3>
              <p className="text-xs text-neutral-500">
                Segmented by efficiency tiers relative to overall distribution
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Median Benchmark: {q2.toFixed(1)}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {cohortScores.map((c, idx) => {
              const diffFromMedian = c.mean - q2;
              const isLagging = c.status === "lagging";
              const isTop = c.status === "outperformer";

              return (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isLagging
                      ? "border-amber-200 bg-amber-50/40"
                      : isTop
                      ? "border-neutral-300 bg-neutral-50/60"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 font-mono">
                        {c.name}
                      </span>
                      <span className="text-neutral-400 font-mono">(N={c.count})</span>
                      {isLagging && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 animate-pulse">
                          Investigation Priority
                        </span>
                      )}
                      {isTop && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 text-white">
                          Benchmark Cohort
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold text-neutral-900 text-sm">
                        {c.mean.toFixed(1)}
                      </span>
                      <span className={`text-xs ${diffFromMedian >= 0 ? "text-neutral-600" : "text-amber-700 font-semibold"}`}>
                        {diffFromMedian >= 0 ? `+${diffFromMedian.toFixed(1)}` : diffFromMedian.toFixed(1)} vs median
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insight Cards: Root Audit Inquiries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
            <Zap className="w-3.5 h-3.5 text-neutral-700" />
            <span>Process Standardization Potential</span>
          </div>
          <p className="text-neutral-600 leading-relaxed">
            High variance between cohorts often indicates disparate operating practices. Replicating the workflows of top performers can lift the median without additional capital expense.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-700" />
            <span>Underlying Friction Audit</span>
          </div>
          <p className="text-neutral-600 leading-relaxed">
            Check whether trailing cohorts face structural disadvantages (e.g. smaller account sizes, different geographic density, or older inventory batches).
          </p>
        </div>
      </div>
    </div>
  );
};
