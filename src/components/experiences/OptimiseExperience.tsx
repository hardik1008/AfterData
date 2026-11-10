import React, { useState, useMemo, useEffect } from "react";
import {
  Target,
  Sliders,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Info,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DatasetProfile, OptimisationResult } from "../../types/dataset";
import {
  runConstrainedBusinessOptimisation,
  evaluateOutcomeForAllocation,
  fitDiminishingReturnsModel,
} from "../../lib/optimisationEngine";
import { AnimatedCounter } from "./AnimatedCounter";
import { usePrefersReducedMotion } from "../../lib/usePrefersReducedMotion";

interface OptimiseExperienceProps {
  dataset: DatasetProfile;
  targetOutcome?: string;
  onApplyRecommendation?: (allocation: Record<string, number>) => void;
}

export const OptimiseExperience: React.FC<OptimiseExperienceProps> = ({
  dataset,
  targetOutcome,
  onApplyRecommendation,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  // 1. Run Baseline Deterministic Optimization
  const baseOptimisation = useMemo(() => {
    return runConstrainedBusinessOptimisation(dataset, targetOutcome);
  }, [dataset, targetOutcome]);

  const [totalBudget, setTotalBudget] = useState<number>(() => {
    return Object.values(baseOptimisation.currentAllocation).reduce((a, b) => a + b, 0);
  });

  // Re-run optimization if budget changes
  const optimisation: OptimisationResult = useMemo(() => {
    return runConstrainedBusinessOptimisation(dataset, targetOutcome, totalBudget);
  }, [dataset, targetOutcome, totalBudget]);

  // Interactive slider state (defaults to optimal allocation)
  const [interactiveAllocation, setInteractiveAllocation] = useState<Record<string, number>>(
    optimisation.optimalAllocation
  );

  useEffect(() => {
    setInteractiveAllocation(optimisation.optimalAllocation);
  }, [optimisation.optimalAllocation]);

  // Fit model for interactive evaluations
  const modelFit = useMemo(() => {
    const predictorNames = optimisation.controllableVariables.map((v) => v.name);
    return fitDiminishingReturnsModel(dataset.records || [], optimisation.targetOutcomeVariable, predictorNames);
  }, [dataset.records, optimisation.targetOutcomeVariable, optimisation.controllableVariables]);

  // Real-time evaluation of interactive allocation
  const interactiveScenario = useMemo(() => {
    return evaluateOutcomeForAllocation(
      interactiveAllocation,
      modelFit,
      totalBudget,
      optimisation.controllableVariables
    );
  }, [interactiveAllocation, modelFit, totalBudget, optimisation.controllableVariables]);

  const [showModelDrawer, setShowModelDrawer] = useState(false);

  // Spend calculations
  const totalAllocated = Object.values(interactiveAllocation).reduce((a, b) => a + b, 0);
  const budgetUtilizationPct = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
  const isOverBudget = totalAllocated > totalBudget * 1.005;

  const currentOutcome = optimisation.currentOutcome;
  const simulatedOutcome = interactiveScenario.expectedOutcome;
  const simulatedLift = simulatedOutcome - currentOutcome;
  const simulatedLiftPct = currentOutcome > 0 ? ((simulatedLift / currentOutcome) * 100).toFixed(1) : "0";

  const handleSliderChange = (varName: string, val: number) => {
    setInteractiveAllocation((prev) => ({
      ...prev,
      [varName]: val,
    }));
  };

  const handleResetToOptimal = () => {
    setInteractiveAllocation(optimisation.optimalAllocation);
  };

  const handleResetToCurrent = () => {
    setInteractiveAllocation(optimisation.currentAllocation);
  };

  return (
    <div className="space-y-6">
      {/* Experience Header Banner */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                Experience G — Optimise
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Find the best possible business decision
            </h3>
            <p className="text-xs text-neutral-500">
              Combining fitted response elasticity with constrained mathematical optimization
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToOptimal}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Recommended Optimal
            </button>
            <button
              onClick={handleResetToCurrent}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Historical Current
            </button>
          </div>
        </div>

        {/* Executive Summary Cards: Current vs. Proposed Allocation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Card 1: Historical Baseline */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
              Current Baseline
            </span>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              ${currentOutcome.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-400 block">
              Estimated from historical average allocation
            </span>
          </div>

          {/* Card 2: Simulated / Optimal Outcome */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-900 block">
              Simulated Outcome
            </span>
            <div className="text-xl sm:text-2xl font-bold text-purple-950 font-mono tabular-nums">
              ${simulatedOutcome.toLocaleString()}
            </div>
            <span className="text-[10px] text-purple-700 block">
              95% Uncertainty: [${interactiveScenario.outcomeConfidenceInterval[0].toLocaleString()} – $
              {interactiveScenario.outcomeConfidenceInterval[1].toLocaleString()}]
            </span>
          </div>

          {/* Card 3: Expected Lift */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 block">
              Expected Efficiency Lift
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-950 font-mono tabular-nums">
              {simulatedLift >= 0 ? "+" : ""}${simulatedLift.toLocaleString()} ({simulatedLiftPct}%)
            </div>
            <span className="text-[10px] text-emerald-700 block">
              Gained purely from resource reallocation
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controllable Decision Variables Sliders */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">
              Interactive Decision Sliders &amp; Resource Allocation
            </h4>
            <p className="text-xs text-neutral-500">
              Adjust controllable variables to see real-time model projections under budget limits
            </p>
          </div>

          {/* Budget Constraint Meter */}
          <div className="text-right sm:w-64 space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-500">Total Allocated:</span>
              <span className={`font-bold ${isOverBudget ? "text-rose-600" : "text-neutral-900"}`}>
                ${totalAllocated.toLocaleString()} / ${totalBudget.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  isOverBudget ? "bg-rose-500" : budgetUtilizationPct >= 99 ? "bg-emerald-500" : "bg-neutral-800"
                }`}
                style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
              />
            </div>
            {isOverBudget && (
              <span className="text-[10px] text-rose-600 font-semibold block">
                Exceeds total budget constraint by ${(totalAllocated - totalBudget).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-5">
          {optimisation.controllableVariables.map((v) => {
            const currentAlloc = interactiveAllocation[v.name] ?? v.currentValue;
            const optimalAlloc = optimisation.optimalAllocation[v.name] ?? v.currentValue;
            const baselineAlloc = optimisation.currentAllocation[v.name] ?? v.currentValue;
            const isAtOptimal = Math.abs(currentAlloc - optimalAlloc) < 50;

            return (
              <div key={v.name} className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900">{v.label}</span>
                      {isAtOptimal && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.2 rounded-full border border-purple-200">
                          Optimal Setpoint
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Historical baseline: ${baselineAlloc.toLocaleString()} · Optimal target: $
                      {optimalAlloc.toLocaleString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-neutral-900 font-mono">
                      ${currentAlloc.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      {totalAllocated > 0 ? ((currentAlloc / totalAllocated) * 100).toFixed(1) : 0}% of budget
                    </span>
                  </div>
                </div>

                {/* Slider input */}
                <input
                  type="range"
                  min={v.minAllowed}
                  max={v.maxAllowed}
                  step={v.step}
                  value={currentAlloc}
                  onChange={(e) => handleSliderChange(v.name, parseInt(e.target.value, 10))}
                  className="w-full accent-neutral-900 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Min: ${v.minAllowed.toLocaleString()}</span>
                  <span>Max: ${v.maxAllowed.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Binding Constraints & Feasibility Status */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Binding Constraints Audit</span>
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              {optimisation.bindingConstraints.length} binding limits
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {optimisation.bindingConstraints.map((c) => (
              <div key={c.id} className="p-2.5 rounded-lg bg-white border border-neutral-200/80 text-[11px] space-y-0.5">
                <div className="flex items-center justify-between font-medium text-neutral-800">
                  <span>{c.name}</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                    Binding ($ {c.limitValue.toLocaleString()})
                  </span>
                </div>
                <p className="text-neutral-500 text-[10px] leading-relaxed">
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sensitivity Analysis Table */}
        <div className="space-y-2 pt-1 text-xs">
          <span className="font-semibold text-neutral-900 block">
            Sensitivity Analysis (What if Total Budget Changes by ±10%?)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {optimisation.sensitivity.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white border border-neutral-200 space-y-0.5">
                <div className="flex justify-between font-medium text-neutral-800">
                  <span>{s.parameter}</span>
                  <span className="font-mono text-neutral-500">{s.change}</span>
                </div>
                <div className="text-[11px] text-neutral-600 font-mono">
                  Estimated Outcome Shift:{" "}
                  <strong className={s.estimatedOutcomeImpact >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {s.estimatedOutcomeImpact >= 0 ? "+" : ""}${s.estimatedOutcomeImpact.toLocaleString()}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observational Disclaimer & Extrapolation Warnings */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Statistical Safeguard: Model-Based Estimation vs. Guaranteed Causality</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {optimisation.observationalCaveat}
          </p>
          {optimisation.extrapolationWarnings.length > 0 && (
            <div className="pt-1 border-t border-amber-200 text-[10px] text-amber-900">
              <strong>Extrapolation Notice:</strong> {optimisation.extrapolationWarnings[0]}
            </div>
          )}
        </div>

        {/* Model Specification Accordion Drawer */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
          <button
            onClick={() => setShowModelDrawer((prev) => !prev)}
            className="w-full flex items-center justify-between p-3.5 text-xs text-left text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-purple-700" />
              <span className="font-semibold text-neutral-900">
                Fitted Mathematical Optimization Formula &amp; Diagnostics
              </span>
            </div>
            {showModelDrawer ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          <AnimatePresence>
            {showModelDrawer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 pt-0 border-t border-neutral-200/80 space-y-3 text-xs"
              >
                <div className="pt-3 space-y-2">
                  <div className="p-3 rounded-lg bg-white border border-neutral-200 font-mono text-[11px] text-neutral-900">
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">Fitted Response Equation</span>
                    {optimisation.modelSummary.formula}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-white border border-neutral-200">
                      <span className="text-[10px] text-neutral-400 block font-sans">Model R²</span>
                      <span className="font-bold">{optimisation.modelSummary.rSquared}</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-neutral-200">
                      <span className="text-[10px] text-neutral-400 block font-sans">F-Statistic</span>
                      <span className="font-bold">{optimisation.modelSummary.fStatistic}</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-neutral-200">
                      <span className="text-[10px] text-neutral-400 block font-sans">p-Value</span>
                      <span className="font-bold">{optimisation.modelSummary.pValue}</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-neutral-200">
                      <span className="text-[10px] text-neutral-400 block font-sans">Std Error</span>
                      <span className="font-bold">${optimisation.uncertaintyMargin}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
