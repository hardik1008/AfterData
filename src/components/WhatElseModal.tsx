import React from "react";
import {
  X,
  Compass,
  Stethoscope,
  Sliders,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DatasetProfile } from "../types/dataset";

interface WhatElseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: DatasetProfile;
  onSelectInvestigation: (question: string, testName?: string, targetVar?: string, groupVar?: string) => void;
}

export const WhatElseModal: React.FC<WhatElseModalProps> = ({
  isOpen,
  onClose,
  dataset,
  onSelectInvestigation,
}) => {
  if (!isOpen) return null;

  const continuousCols = dataset.columns.filter((c) => c.inferredType === "continuous");
  const categoricalCols = dataset.columns.filter((c) => c.inferredType === "categorical");
  const temporalCols = dataset.columns.filter((c) => c.inferredType === "temporal");

  const primaryMetric =
    continuousCols.find((c) => /revenue|sales|spend|amount|value/i.test(c.name))?.name ||
    continuousCols[0]?.name ||
    "Primary Metric";

  const groupCol =
    categoricalCols.find((c) => /launch|post|channel|group|tier|segment/i.test(c.name))?.name ||
    categoricalCols[0]?.name;

  const capabilities = [
    {
      id: "CAP-01",
      category: "Cohort & Intervention Comparison",
      icon: Compass,
      title: `Compare ${primaryMetric} across key operating cohorts`,
      description: `Evaluate whether a statistically significant difference exists between ${groupCol || "operating groups"} using Welch's t-test or Mann-Whitney U rank-sum test.`,
      testName: "Welch Two-Sample t-test",
      question: `Did ${primaryMetric} differ significantly across ${groupCol || "groups"}?`,
      isFeasible: Boolean(primaryMetric && (groupCol || continuousCols.length >= 2)),
      variables: [primaryMetric, groupCol || "Cohort"],
    },
    {
      id: "CAP-02",
      category: "Drivers & Multiple Regression",
      icon: Stethoscope,
      title: `Identify what factors predict and drive ${primaryMetric}`,
      description: "Estimate multi-variable OLS regression equation with R-squared, standard errors, and VIF multicollinearity checks.",
      testName: "Multiple Linear Regression (OLS)",
      question: `What variables drive and predict ${primaryMetric}?`,
      isFeasible: continuousCols.length >= 2,
      variables: continuousCols.slice(0, 3).map((c) => c.name),
    },
    {
      id: "CAP-03",
      category: "Trend Consistency & Longitudinal Stability",
      icon: TrendingUp,
      title: `Audit if performance trends in ${primaryMetric} are sustained or decaying`,
      description: "Examine trajectory slopes, novelty spike decay, daily coefficient of variation, and residual serial autocorrelation.",
      testName: "Trend Consistency Audit",
      question: `Was the trend in ${primaryMetric} sustained over time?`,
      isFeasible: temporalCols.length >= 1 || (dataset.timeCoverage?.hasTemporalData === true),
      variables: [primaryMetric, temporalCols[0]?.name || "Date"],
    },
    {
      id: "CAP-04",
      category: "Anomalies & Operating Disparities",
      icon: Sliders,
      title: `Detect statistical anomalies and extreme variance in ${primaryMetric}`,
      description: "Map interquartile dispersion, Tukey's 1.5x IQR outlier boundaries, and identify atypical operational days or records.",
      testName: "Anomaly & Outlier Audit",
      question: `Are there significant anomalies or outliers in ${primaryMetric}?`,
      isFeasible: continuousCols.length >= 1,
      variables: [primaryMetric],
    },
    {
      id: "CAP-05",
      category: "Constrained Resource Optimisation",
      icon: Target,
      title: `Find the best possible resource allocation to maximize ${primaryMetric}`,
      description: "Solve non-linear diminishing-returns optimization under defined budget caps and operational constraints with real-time sliders.",
      testName: "Constrained Business Optimisation",
      question: `How should budget be optimally allocated to maximize ${primaryMetric}?`,
      isFeasible: continuousCols.length >= 2 && dataset.rowCount >= 15,
      variables: continuousCols.slice(0, 3).map((c) => c.name),
    },
    {
      id: "CAP-06",
      category: "Strategic Decisions & Test Blueprints",
      icon: Lightbulb,
      title: "Synthesize 9-field executive recommendations & experiment blueprints",
      description: "Translate empirical findings into prioritized actions with confidence ratings, risk audits, KPI tracking, and A/B holdout designs.",
      testName: "Executive Decision Support",
      question: `What should management do next regarding ${primaryMetric}?`,
      isFeasible: true,
      variables: [primaryMetric],
    },
  ];

  const handlePick = (cap: typeof capabilities[0]) => {
    onSelectInvestigation(cap.question, cap.testName, primaryMetric, groupCol);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative w-full max-w-4xl bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neutral-800" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                  Platform Capability Matrix
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900">
                What else can AFTERDATA investigate?
              </h3>
              <p className="text-xs text-neutral-500">
                Grounded strictly in {dataset.filename} (N = {dataset.rowCount.toLocaleString()} records, {dataset.columns.length} columns)
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Capabilities Grid */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capabilities.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.id}
                    className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      cap.isFeasible
                        ? "border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50/50"
                        : "border-neutral-200 bg-neutral-50/60 opacity-60"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                          {cap.category}
                        </span>
                        {cap.isFeasible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Supported</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            <span>Requires Variables</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 leading-snug">
                            {cap.title}
                          </h4>
                          <p className="text-xs text-neutral-500 leading-relaxed pt-1">
                            {cap.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                        <span>Vars:</span>
                        <span>{cap.variables.filter(Boolean).join(", ")}</span>
                      </div>

                      {cap.isFeasible && (
                        <button
                          onClick={() => handlePick(cap)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
            <span>
              AFTERDATA only runs statistical methods supported by verified columns in your uploaded data.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
