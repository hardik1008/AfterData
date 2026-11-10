import React, { useState, useMemo } from "react";
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Eye,
  Ban,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  Scale,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DatasetProfile,
  StatisticalResult,
  BusinessRecommendation,
  RecommendationCategory,
  RecommendationPriorityWeights,
} from "../../types/dataset";
import {
  generateBusinessRecommendations,
  DEFAULT_PRIORITY_WEIGHTS,
  calculatePriorityScore,
} from "../../lib/recommendationEngine";
import { usePrefersReducedMotion } from "../../lib/usePrefersReducedMotion";

interface DecideExperienceProps {
  dataset: DatasetProfile;
  result: StatisticalResult;
  targetVar?: string;
  groupVar?: string;
  onSelectExperiment?: (experiment: BusinessRecommendation["nextExperiment"]) => void;
}

export const DecideExperience: React.FC<DecideExperienceProps> = ({
  dataset,
  result,
  targetVar,
  groupVar,
  onSelectExperiment,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedCardId, setExpandedCardId] = useState<string | null>("REC-01");
  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const [weights, setWeights] = useState<RecommendationPriorityWeights>(DEFAULT_PRIORITY_WEIGHTS);

  // Compute recommendations
  const allRecommendations = useMemo(() => {
    return generateBusinessRecommendations(result, dataset, weights);
  }, [result, dataset, weights]);

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === "all") return allRecommendations;
    return allRecommendations.filter((r) => r.category === selectedCategory);
  }, [allRecommendations, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRecommendations.length };
    allRecommendations.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [allRecommendations]);

  const getCategoryBadge = (cat: RecommendationCategory) => {
    switch (cat) {
      case "implement":
        return {
          label: "Implement",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
        };
      case "test_first":
        return {
          label: "Test First (A/B Holdout)",
          bg: "bg-amber-50 text-amber-900 border-amber-200",
          icon: FlaskConical,
        };
      case "investigate_further":
        return {
          label: "Investigate Further",
          bg: "bg-purple-50 text-purple-900 border-purple-200",
          icon: Lightbulb,
        };
      case "monitor":
        return {
          label: "Monitor",
          bg: "bg-blue-50 text-blue-900 border-blue-200",
          icon: Eye,
        };
      case "avoid_for_now":
        return {
          label: "Avoid For Now",
          bg: "bg-rose-50 text-rose-900 border-rose-200",
          icon: Ban,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Experience Header Banner */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                Experience F — Decide
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">
              What should my business do next?
            </h3>
            <p className="text-xs text-neutral-500">
              Evidence-backed executive actions, prioritized by statistical power, feasibility, and risk
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWeightSliders((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-neutral-500" />
              <span>Prioritization Weights</span>
              {showWeightSliders ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </button>
          </div>
        </div>

        {/* Prioritization Weights Drawer (Configurable Criteria) */}
        <AnimatePresence>
          {showWeightSliders && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">
                  Custom Decision Prioritization Weighting
                </span>
                <button
                  onClick={() => setWeights(DEFAULT_PRIORITY_WEIGHTS)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                >
                  Reset to Defaults
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(weights).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      <span className="font-mono font-medium">{Math.round(val * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.5}
                      step={0.05}
                      value={val}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [key]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-neutral-900 cursor-pointer h-1"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: "all", label: "All Recommendations" },
            { id: "implement", label: "Implement" },
            { id: "test_first", label: "Test First" },
            { id: "investigate_further", label: "Investigate Further" },
            { id: "monitor", label: "Monitor" },
            { id: "avoid_for_now", label: "Avoid For Now" },
          ].map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            if (count === 0 && cat.id !== "all") return null;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-neutral-800 text-white" : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {filteredRecommendations.map((rec) => {
          const badge = getCategoryBadge(rec.category);
          const BadgeIcon = badge.icon;
          const isExpanded = expandedCardId === rec.id;

          return (
            <motion.div
              key={rec.id}
              layout={!reducedMotion}
              className={`rounded-2xl border transition-all overflow-hidden bg-white ${
                isExpanded
                  ? "border-neutral-300 shadow-sm ring-1 ring-neutral-200/50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {/* Card Header Bar */}
              <div
                onClick={() => setExpandedCardId(isExpanded ? null : rec.id)}
                className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[11px] text-neutral-400 font-mono">
                      Priority: {rec.priorityScore}/100
                    </span>

                    <span className="text-[11px] text-neutral-400">·</span>

                    <span className="text-[11px] font-medium text-neutral-600">
                      Evidence Confidence:{" "}
                      <strong className={rec.confidence === "High" ? "text-emerald-700" : "text-amber-700"}>
                        {rec.confidence}
                      </strong>
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                    {rec.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-neutral-400 block uppercase font-mono">Score</span>
                    <span className="text-lg font-bold text-neutral-900 font-mono">
                      {rec.priorityScore}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded 9-Field Details Drawer */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 pt-0 border-t border-neutral-100 space-y-5 text-xs"
                  >
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. Finding */}
                      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                          1. What the data revealed
                        </span>
                        <p className="text-neutral-800 leading-relaxed font-medium">
                          {rec.finding}
                        </p>
                      </div>

                      {/* 2. Opportunity or Problem */}
                      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                          2. Why this matters
                        </span>
                        <p className="text-neutral-800 leading-relaxed font-medium">
                          {rec.opportunityOrProblem}
                        </p>
                      </div>

                      {/* 3. Recommended Action */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-emerald-800 block tracking-wider">
                          3. Recommended Management Action
                        </span>
                        <p className="text-emerald-950 leading-relaxed font-semibold">
                          {rec.recommendedAction}
                        </p>
                      </div>

                      {/* 4. Expected Outcome */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-emerald-800 block tracking-wider">
                          4. Expected Business Outcome
                        </span>
                        <p className="text-emerald-950 leading-relaxed font-semibold">
                          {rec.expectedOutcome}
                        </p>
                      </div>

                      {/* 5. Evidence & Statistical Rigor */}
                      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                          5. Statistical Evidence Backing
                        </span>
                        <p className="text-neutral-700 leading-relaxed font-mono text-[11px]">
                          {rec.evidence}
                        </p>
                      </div>

                      {/* 7. Risk & What Could Go Wrong */}
                      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-amber-800 block tracking-wider">
                          7. Identified Operational Risks
                        </span>
                        <p className="text-amber-900 leading-relaxed">
                          {rec.risk}
                        </p>
                      </div>
                    </div>

                    {/* 8. KPI Measurement Bar */}
                    <div className="p-3.5 rounded-xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                          8. Measurement KPI to Monitor
                        </span>
                        <p className="font-semibold text-xs text-white">
                          {rec.measurementKPI}
                        </p>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Tracking daily variance
                      </span>
                    </div>

                    {/* 9. Next Experiment Blueprint Card */}
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2.5">
                      <div className="flex items-center gap-2 text-neutral-800 font-semibold">
                        <FlaskConical className="w-4 h-4 text-purple-600" />
                        <span>9. Next Experiment Blueprint: &ldquo;{rec.nextExperiment.title}&rdquo;</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                        <div className="p-2.5 rounded-lg bg-white border border-neutral-200">
                          <span className="text-neutral-400 block text-[10px] uppercase font-mono">Design Split</span>
                          <span className="font-medium text-neutral-800">{rec.nextExperiment.design}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-neutral-200">
                          <span className="text-neutral-400 block text-[10px] uppercase font-mono">Sample / Horizon</span>
                          <span className="font-medium text-neutral-800">{rec.nextExperiment.sampleSizeOrDuration}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-neutral-200">
                          <span className="text-neutral-400 block text-[10px] uppercase font-mono">Primary Target Metric</span>
                          <span className="font-medium text-neutral-800">{rec.nextExperiment.successMetric}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
