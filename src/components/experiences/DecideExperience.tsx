import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Calculator,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Lock,
  Plus,
  Trash2,
  Info,
  DollarSign,
  HelpCircle,
  FileSpreadsheet,
  Compass,
} from "lucide-react";
import { DatasetProfile, StatisticalResult } from "../../types/dataset";
import {
  CalibratedVariable,
  CalibratedConstraint,
  MathematicalProblemFormulation,
  CalculatedDecisionSolution,
  InputSourceTag,
  DecisionCapability,
  AlternativeScenario,
  SensitivityItem,
} from "../../types/decisionOptimization";
import {
  DECISION_CAPABILITIES,
  CAPABILITY_CATEGORIES,
  matchCapabilityFromGoal,
} from "../../lib/decisionCapabilities";
import {
  solveMathematicalDecisionProblem,
  generateAlternativeScenarios,
  generateSensitivityAnalysis,
  calculateBaselineFromVariables,
} from "../../lib/mathematicalDecisionEngine";

interface DecideExperienceProps {
  dataset: DatasetProfile;
  result: StatisticalResult;
  targetVar?: string;
  groupVar?: string;
}

export const DecideExperience: React.FC<DecideExperienceProps> = ({
  dataset,
  result,
  targetVar,
  groupVar,
}) => {
  // 1. Core Workflow Stage:
  // "objective_input" -> "human_calibration" -> "solved_workspace"
  const [currentStage, setCurrentStage] = useState<"objective_input" | "human_calibration" | "solved_workspace">("objective_input");

  // User's natural-language objective input
  const [userObjective, setUserObjective] = useState<string>(
    "I want to distribute my marketing budget across website, mobile app and other channels to maximise revenue."
  );

  // Selected Capability
  const [selectedCapability, setSelectedCapability] = useState<DecisionCapability>(() =>
    matchCapabilityFromGoal(userObjective, dataset)
  );

  // Filter for Capability Discovery Catalog
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  // Calibration Form State (Editable by user)
  const [calibratedBudget, setCalibratedBudget] = useState<number>(() => selectedCapability.defaultTemplate.budgetTotal);
  const [calibratedVariables, setCalibratedVariables] = useState<CalibratedVariable[]>(() =>
    selectedCapability.defaultTemplate.variables.map((v, i) => ({
      ...v,
      id: `var_${i + 1}`,
    }))
  );
  const [calibratedConstraints, setCalibratedConstraints] = useState<CalibratedConstraint[]>(() =>
    selectedCapability.defaultTemplate.constraints.map((c, i) => ({
      ...c,
      id: `const_${i + 1}`,
    }))
  );
  const [assumptionsApproved, setAssumptionsApproved] = useState<boolean>(false);

  // Solved State & Live Overrides
  const [activeScenarioId, setActiveScenarioId] = useState<"conservative" | "balanced" | "aggressive" | "custom">("balanced");
  const [liveSliderOverrides, setLiveSliderOverrides] = useState<Record<string, number>>({});
  const [showMathDrawer, setShowMathDrawer] = useState<boolean>(false);
  const [showSensitivityDrawer, setShowSensitivityDrawer] = useState<boolean>(false);

  // Quick Goal Suggestions
  const goalSuggestions = [
    "I want to maximise total revenue across marketing channels",
    "I want to improve contribution profit while reducing operating costs",
    "I want to distribute a ₹10,00,000 budget under diminishing returns",
    "I want to balance customer acquisition and retention investments",
    "I want to optimise workforce capacity and eliminate bottlenecks",
    "I want to define my own custom decision problem",
  ];

  // Helper to load a capability into calibration form
  const handleSelectCapability = (cap: DecisionCapability) => {
    setSelectedCapability(cap);
    setCalibratedBudget(cap.defaultTemplate.budgetTotal);

    // If dataset has relevant historical values (Mode 1: Data-assisted), adapt initial values
    const continuousCols = dataset.columns.filter((c) => c.inferredType === "continuous");
    const revCol = continuousCols.find((c) => /revenue|sales/i.test(c.name));
    const spendCols = continuousCols.filter((c) => /spend|market|cost|budget/i.test(c.name));

    const vars: CalibratedVariable[] = cap.defaultTemplate.variables.map((v, idx) => {
      let histVal = v.currentHistoricalValue;
      let sourceTag: InputSourceTag = v.source;

      if (spendCols.length > idx && spendCols[idx].meanValue !== undefined) {
        histVal = Math.round(spendCols[idx].meanValue! * (dataset.rowCount > 50 ? 30 : 1));
        sourceTag = "derived_from_data";
      }

      return {
        ...v,
        id: `var_${idx + 1}`,
        currentHistoricalValue: histVal,
        userCalibratedValue: histVal || v.userCalibratedValue,
        source: sourceTag,
      };
    });

    setCalibratedVariables(vars);
    setCalibratedConstraints(
      cap.defaultTemplate.constraints.map((c, idx) => ({
        ...c,
        id: `const_${idx + 1}`,
      }))
    );
    setAssumptionsApproved(false);
    setCurrentStage("human_calibration");
  };

  // Helper to handle goal input submission
  const handleProceedFromGoal = () => {
    const matched = matchCapabilityFromGoal(userObjective, dataset);
    handleSelectCapability(matched);
  };

  // Mathematical Problem Formulation Object
  const formulation: MathematicalProblemFormulation = useMemo(() => {
    const isDiminishing = calibratedVariables.some((v) => v.diminishingReturns);
    const formulaLatex = isDiminishing
      ? `\\max Y = \\text{Baseline} + \\sum_{i=1}^{${calibratedVariables.length}} \\beta_i \\sqrt{x_i} \\quad \\text{s.t.} \\quad \\sum x_i \\le ${calibratedBudget.toLocaleString()}`
      : `\\max Y = \\text{Baseline} + \\sum_{i=1}^{${calibratedVariables.length}} r_i x_i \\quad \\text{s.t.} \\quad \\sum x_i \\le ${calibratedBudget.toLocaleString()}`;

    const formulaDisplay = isDiminishing
      ? `Max ${selectedCapability.defaultTemplate.targetMetric} = Baseline + Σ [ βᵢ · √(Allocationᵢ) ] subject to Total Spend ≤ ${calibratedBudget.toLocaleString()} ${selectedCapability.defaultTemplate.targetUnit}`
      : `Max ${selectedCapability.defaultTemplate.targetMetric} = Baseline + Σ [ Returnᵢ · Allocationᵢ ] subject to Total Spend ≤ ${calibratedBudget.toLocaleString()} ${selectedCapability.defaultTemplate.targetUnit}`;

    // Provenance Tracking
    const historicalEvidence: string[] = [];
    const humanAssumptions: string[] = [];
    const mathematicalOutputs: string[] = [];

    // Historical items from uploaded dataset
    if (dataset.rowCount > 0) {
      historicalEvidence.push(
        `Uploaded dataset '${dataset.filename || "data.csv"}' provides N=${dataset.rowCount} records covering ${dataset.columns.length} business columns.`
      );
    }
    calibratedVariables.forEach((v) => {
      if (v.source === "derived_from_data" && v.currentHistoricalValue) {
        historicalEvidence.push(
          `Historical observed benchmark for '${v.label}': ${v.currentHistoricalValue.toLocaleString()} ${v.unit}.`
        );
      } else {
        humanAssumptions.push(
          `User calibrated '${v.label}': Expected return parameter = ${v.expectedReturnPerUnit}, allowed range [${v.minBound.toLocaleString()} to ${v.maxBound.toLocaleString()} ${v.unit}].`
        );
      }
    });

    humanAssumptions.push(
      `User approved total budget cap of ${calibratedBudget.toLocaleString()} ${selectedCapability.defaultTemplate.targetUnit}.`
    );

    return {
      objectiveType: selectedCapability.defaultTemplate.objectiveType,
      targetMetric: selectedCapability.defaultTemplate.targetMetric,
      targetUnit: selectedCapability.defaultTemplate.targetUnit,
      formulaLatex,
      formulaDisplay,
      solverMethod: selectedCapability.solverMethod,
      totalBudget: calibratedBudget,
      budgetUnit: selectedCapability.defaultTemplate.targetUnit,
      controllableVariables: calibratedVariables,
      constraints: calibratedConstraints,
      assumptionsApprovedByHuman: assumptionsApproved,
      provenance: {
        historicalEvidence,
        humanAssumptions,
        mathematicalOutputs,
      },
    };
  }, [calibratedVariables, calibratedConstraints, calibratedBudget, selectedCapability, assumptionsApproved, dataset]);

  // Baseline outcome calculated from variables
  const baselineOutcome = useMemo(() => {
    return calculateBaselineFromVariables(calibratedVariables);
  }, [calibratedVariables]);

  // Solver execution
  const optimalSolution: CalculatedDecisionSolution = useMemo(() => {
    return solveMathematicalDecisionProblem(formulation, baselineOutcome);
  }, [formulation, baselineOutcome]);

  // Alternative Scenarios
  const alternativeScenarios: AlternativeScenario[] = useMemo(() => {
    return generateAlternativeScenarios(formulation, optimalSolution, liveSliderOverrides);
  }, [formulation, optimalSolution, liveSliderOverrides]);

  // Sensitivity Analysis
  const sensitivityAnalysis: SensitivityItem[] = useMemo(() => {
    return generateSensitivityAnalysis(formulation, optimalSolution);
  }, [formulation, optimalSolution]);

  // Active Display Scenario (or Custom Live Sliders)
  const currentDisplayedScenario = useMemo(() => {
    return alternativeScenarios.find((s) => s.id === activeScenarioId) || alternativeScenarios[1];
  }, [alternativeScenarios, activeScenarioId]);

  // Live Slider Allocation Total
  const liveTotalAllocated = useMemo(() => {
    let sum = 0;
    calibratedVariables.forEach((v) => {
      const val = liveSliderOverrides[v.id] !== undefined
        ? liveSliderOverrides[v.id]
        : currentDisplayedScenario.allocations[v.id] || v.userCalibratedValue;
      sum += val;
    });
    return sum;
  }, [calibratedVariables, liveSliderOverrides, currentDisplayedScenario]);

  // Handle live slider adjustment
  const handleSliderChange = (varId: string, newVal: number) => {
    setLiveSliderOverrides((prev) => ({
      ...prev,
      [varId]: newVal,
    }));
    setActiveScenarioId("custom");
  };

  // Helper for source tag styling
  const renderSourceBadge = (source: InputSourceTag) => {
    switch (source) {
      case "derived_from_data":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileSpreadsheet className="w-2.5 h-2.5" />
            <span>Derived from uploaded data</span>
          </span>
        );
      case "supplied_by_user":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Supplied by user</span>
          </span>
        );
      case "estimated_by_user":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Estimated by user</span>
          </span>
        );
      case "suggested_by_engine":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <HelpCircle className="w-2.5 h-2.5" />
            <span>Suggested by AFTERDATA</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
            <span>Scenario assumption</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* STAGE 1: WHAT WOULD YOU LIKE TO IMPROVE? (OBJECTIVE CAPTURE & DISCOVERY) */}
      {/* ========================================================================= */}
      {currentStage === "objective_input" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Hero Header */}
          <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200/90 bg-white shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-purple-700">
              <Compass className="w-4 h-4" />
              <span>Human-in-the-Loop Mathematical Decision Engine</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
                What would you like to improve?
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed">
                Tell AFTERDATA what you want to achieve. We will not dictate generic AI advice. Instead, we’ll help you define your controllable variables, calibrate your assumptions, and calculate the mathematically best decision.
              </p>
            </div>

            {/* Natural-Language Input Bar */}
            <div className="pt-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={userObjective}
                  onChange={(e) => setUserObjective(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleProceedFromGoal()}
                  placeholder="e.g. I want to distribute my ₹10 lakh marketing budget across website and app to maximise revenue..."
                  className="w-full pl-4 pr-32 py-3.5 text-sm sm:text-base bg-neutral-50/80 hover:bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-neutral-900 rounded-2xl outline-hidden transition-all text-neutral-900 placeholder:text-neutral-400 font-normal"
                />
                <button
                  onClick={handleProceedFromGoal}
                  className="absolute right-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Formulate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Goal Suggestion Chips */}
              <div className="pt-3.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400 font-medium">Examples:</span>
                {goalSuggestions.map((g, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserObjective(g);
                      const matched = matchCapabilityFromGoal(g, dataset);
                      handleSelectCapability(matched);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-100 hover:border-neutral-300 text-neutral-700 transition-colors cursor-pointer text-left"
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Capability Discovery Section (Section 3) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Explore What AFTERDATA Can Mathematically Solve
                </h3>
                <p className="text-xs text-neutral-500">
                  Select any decision capability to calibrate your variables and compute optimal trade-offs.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setActiveCategoryFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    activeCategoryFilter === "all"
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  All ({DECISION_CAPABILITIES.length})
                </button>
                {CAPABILITY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                      activeCategoryFilter === cat.id
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Capability Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DECISION_CAPABILITIES.filter(
                (cap) => activeCategoryFilter === "all" || cap.category === activeCategoryFilter
              ).map((cap) => {
                const isDataSupported = cap.dataSuitability === "ready_with_data";
                return (
                  <div
                    key={cap.id}
                    onClick={() => handleSelectCapability(cap)}
                    className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold text-purple-700 tracking-wider uppercase">
                          {cap.categoryTitle}
                        </span>
                        {isDataSupported ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ready with your data
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Human-calibrated
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-semibold text-neutral-900 group-hover:text-purple-900 transition-colors">
                        {cap.title}
                      </h4>

                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {cap.problemSolved}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Controllable levers:</span>
                        <span className="font-mono text-neutral-800 font-medium">
                          {cap.controllableVariables.length} variables
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Mathematical engine:</span>
                        <span className="text-neutral-800 truncate max-w-[200px]" title={cap.mathematicalApproach}>
                          {cap.solverMethod === "kkt_diminishing_returns" ? "Concave KKT Equalization" : "Bounded LP Simplex"}
                        </span>
                      </div>
                      <div className="pt-2 flex items-center justify-end text-neutral-900 font-medium group-hover:translate-x-1 transition-transform">
                        <span className="text-xs">Calibrate problem</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: HUMAN CALIBRATION & ASSUMPTION APPROVAL WORKSPACE */}
      {/* ========================================================================= */}
      {currentStage === "human_calibration" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header & Back Action */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStage("objective_input")}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change Objective or Capability</span>
            </button>
            <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              Step 2 of 3: Human Calibration
            </span>
          </div>

          {/* Problem Overview Card */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <Layers className="w-4 h-4 text-neutral-700" />
              <span>Formulated Business Problem</span>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900">
              {selectedCapability.title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Below are the variables you can control and the business parameters for your problem. Review the numbers, adjust any estimates, and approve the assumptions. AFTERDATA calculates on the fly strictly using your approved values.
            </p>
          </div>

          {/* 1. Objective & Global Constraints Calibration */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-neutral-900">
                  1. Objective &amp; Total Budget Limit
                </h4>
                <p className="text-xs text-neutral-500">
                  What is the target metric and total allowable investment cap?
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                User-Calibrated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700">Primary Objective</label>
                <input
                  type="text"
                  readOnly
                  value={`Maximise ${selectedCapability.defaultTemplate.targetMetric}`}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm font-medium text-neutral-800 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 flex items-center justify-between">
                  <span>Total Available Budget Cap</span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    Current: ₹{calibratedBudget.toLocaleString()}
                  </span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-neutral-400 font-medium">₹</span>
                  <input
                    type="number"
                    value={calibratedBudget}
                    onChange={(e) => setCalibratedBudget(Math.max(1000, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-xs sm:text-sm font-mono font-semibold text-neutral-900 outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Controllable Decision Variables Calibration */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-neutral-900">
                  2. Controllable Decision Variables ({calibratedVariables.length})
                </h4>
                <p className="text-xs text-neutral-500">
                  Calibrate your minimum required allocations, maximum capacity caps, and expected return coefficients.
                </p>
              </div>
              <button
                onClick={() => {
                  const newIdx = calibratedVariables.length + 1;
                  setCalibratedVariables((prev) => [
                    ...prev,
                    {
                      id: `var_${Date.now()}`,
                      name: `channel_${newIdx}`,
                      label: `New Channel ${newIdx}`,
                      source: "supplied_by_user",
                      unit: "₹",
                      userCalibratedValue: 100000,
                      minBound: 50000,
                      maxBound: 300000,
                      expectedReturnPerUnit: 100,
                      diminishingReturns: true,
                      notes: "User-added controllable decision variable.",
                    },
                  ]);
                }}
                className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variable</span>
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {calibratedVariables.map((v, idx) => (
                <div
                  key={v.id}
                  className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-neutral-200 text-neutral-700 text-xs font-mono font-semibold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={v.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCalibratedVariables((prev) =>
                            prev.map((item) => (item.id === v.id ? { ...item, label: val } : item))
                          );
                        }}
                        className="text-sm font-semibold text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-900 outline-hidden px-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {renderSourceBadge(v.source)}
                      {calibratedVariables.length > 2 && (
                        <button
                          onClick={() => {
                            setCalibratedVariables((prev) => prev.filter((item) => item.id !== v.id));
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove variable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calibration Inputs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-500">Min Required</label>
                      <input
                        type="number"
                        value={v.minBound}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCalibratedVariables((prev) =>
                            prev.map((item) => (item.id === v.id ? { ...item, minBound: val } : item))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-500">Max Capacity Cap</label>
                      <input
                        type="number"
                        value={v.maxBound}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCalibratedVariables((prev) =>
                            prev.map((item) => (item.id === v.id ? { ...item, maxBound: val } : item))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-500">Expected Yield (β)</label>
                      <input
                        type="number"
                        value={v.expectedReturnPerUnit}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCalibratedVariables((prev) =>
                            prev.map((item) => (item.id === v.id ? { ...item, expectedReturnPerUnit: val } : item))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-500">Curvature Model</label>
                      <button
                        onClick={() => {
                          setCalibratedVariables((prev) =>
                            prev.map((item) =>
                              item.id === v.id ? { ...item, diminishingReturns: !item.diminishingReturns } : item
                            )
                          );
                        }}
                        className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer text-center ${
                          v.diminishingReturns
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-neutral-100 text-neutral-700 border-neutral-200"
                        }`}
                      >
                        {v.diminishingReturns ? "Diminishing (√)" : "Linear"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Human Approval Gate (Section 4 & Section 7) */}
          <div className="p-6 rounded-3xl border border-neutral-300 bg-neutral-900 text-white shadow-md space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Assumption Approval &amp; Confirmation</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-semibold">
                Confirm your assumptions before mathematical calculation
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
                AFTERDATA will never fabricate predictions or manufacture advice. The solver executes purely on the numbers, bounds, and curvature models you have approved above.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-800">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={assumptionsApproved}
                  onChange={(e) => setAssumptionsApproved(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-neutral-200 font-medium">
                  These are the assumptions I'll use. Calculate the best feasible solution.
                </span>
              </label>

              <button
                disabled={!assumptionsApproved}
                onClick={() => setCurrentStage("solved_workspace")}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  assumptionsApproved
                    ? "bg-white text-neutral-900 hover:bg-neutral-100 shadow-sm"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Calculate Best Feasible Solution</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: INTERACTIVE DECISION & OPTIMISATION WORKSPACE */}
      {/* ========================================================================= */}
      {currentStage === "solved_workspace" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Bar with Re-calibrate Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mathematically Solved &amp; Verified</span>
              </span>
              <span className="text-xs text-neutral-500 hidden sm:inline">
                Solver: {optimalSolution.solverMethodUsed}
              </span>
            </div>

            <button
              onClick={() => setCurrentStage("human_calibration")}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-300 hover:border-neutral-400 bg-white text-xs font-medium text-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-calibrate Assumptions</span>
            </button>
          </div>

          {/* Infeasibility Alert if constraints cannot be satisfied */}
          {!optimalSolution.isFeasible && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                <span>Infeasible Constraint Formulation</span>
              </div>
              <p className="text-xs leading-relaxed">
                {optimalSolution.infeasibilityReason}
              </p>
              <button
                onClick={() => setCurrentStage("human_calibration")}
                className="mt-2 px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-medium hover:bg-amber-800 cursor-pointer"
              >
                Adjust Minimum Bounds or Budget Cap
              </button>
            </div>
          )}

          {/* Executive Results Cards (Section 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-1">
              <span className="text-xs text-neutral-500 font-medium">Current Baseline Outcome</span>
              <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
                ₹{optimalSolution.currentBaselineOutcome.toLocaleString()}
              </div>
              <span className="text-[11px] text-neutral-400 block">
                Calculated from starting values
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs space-y-1">
              <span className="text-xs text-emerald-800 font-medium flex items-center justify-between">
                <span>Simulated Feasible Optimum</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-950 tabular-nums">
                ₹{currentDisplayedScenario.targetOutcome.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700 block font-mono">
                95% CI: [₹{optimalSolution.confidenceInterval[0].toLocaleString()} - ₹{optimalSolution.confidenceInterval[1].toLocaleString()}]
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 shadow-xs space-y-1">
              <span className="text-xs text-purple-800 font-medium">Expected Target Lift</span>
              <div className="text-2xl font-bold font-mono text-purple-950 tabular-nums">
                +{currentDisplayedScenario.liftPercent}%
              </div>
              <span className="text-[11px] text-purple-700 block font-mono">
                +₹{(currentDisplayedScenario.targetOutcome - optimalSolution.currentBaselineOutcome).toLocaleString()} net uplift
              </span>
            </div>
          </div>

          {/* Interactive Decision Workspace: Live Sliders (Section 9 & Section 10) */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>Interactive Decision Levers</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Drag any slider to explore what-if allocations. Mathematical outcomes recalculate instantly on the fly.
                </p>
              </div>

              {Object.keys(liveSliderOverrides).length > 0 && (
                <button
                  onClick={() => {
                    setLiveSliderOverrides({});
                    setActiveScenarioId("balanced");
                  }}
                  className="text-xs text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Calculated Optimum</span>
                </button>
              )}
            </div>

            {/* Budget Utilization Meter */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-medium">
                  Total Allocated: <strong className="font-mono text-neutral-900">₹{liveTotalAllocated.toLocaleString()}</strong> of ₹{calibratedBudget.toLocaleString()}
                </span>
                <span className={`font-mono font-semibold ${liveTotalAllocated > calibratedBudget ? "text-red-600" : "text-emerald-700"}`}>
                  {liveTotalAllocated > calibratedBudget
                    ? `Over budget by ₹${(liveTotalAllocated - calibratedBudget).toLocaleString()}`
                    : `Remaining: ₹${(calibratedBudget - liveTotalAllocated).toLocaleString()}`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    liveTotalAllocated > calibratedBudget ? "bg-red-500" : "bg-neutral-900"
                  }`}
                  style={{
                    width: `${Math.min(100, (liveTotalAllocated / Math.max(1, calibratedBudget)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Variable Sliders */}
            <div className="space-y-4 pt-1">
              {optimalSolution.allocations.map((alloc) => {
                const varDef = calibratedVariables.find((v) => v.id === alloc.variableId);
                const currentVal = liveSliderOverrides[alloc.variableId] !== undefined
                  ? liveSliderOverrides[alloc.variableId]
                  : alloc.allocatedValue;
                const min = varDef?.minBound || 0;
                const max = varDef?.maxBound || alloc.allocatedValue * 2;

                return (
                  <div key={alloc.variableId} className="space-y-2 p-3.5 rounded-2xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">{alloc.label}</span>
                        {varDef && renderSourceBadge(varDef.source)}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-neutral-400 text-[11px]">
                          Prev: ₹{alloc.previousValue.toLocaleString()}
                        </span>
                        <span className="font-semibold text-neutral-900 text-sm">
                          ₹{currentVal.toLocaleString()}
                        </span>
                        <span className={`text-[11px] font-semibold ${alloc.percentChange >= 0 ? "text-emerald-600" : "text-neutral-500"}`}>
                          ({alloc.percentChange >= 0 ? "+" : ""}{alloc.percentChange}%)
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={5000}
                      value={currentVal}
                      onChange={(e) => handleSliderChange(alloc.variableId, Number(e.target.value))}
                      className="w-full accent-neutral-900 cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <span>Min: ₹{min.toLocaleString()}</span>
                      <span>
                        Marginal yield: {(alloc.marginalReturn * 100).toFixed(2)} pts/₹
                      </span>
                      <span>Max Cap: ₹{max.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Strict 3-Way Provenance Separation Card */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <Shield className="w-4 h-4 text-neutral-700" />
              <span>Strict Two-Layer Provenance Separation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Box 1: Historical Evidence */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Historical Evidence</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Observed facts from uploaded data. Never manufactured.
                </p>
                <ul className="text-xs space-y-1.5 text-neutral-700 font-mono pt-1">
                  {formulation.provenance.historicalEvidence.map((ev, i) => (
                    <li key={i} className="leading-snug">• {ev}</li>
                  ))}
                </ul>
              </div>

              {/* Box 2: Human Assumptions */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Human Assumptions</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Calibrated and approved by you. Not automatic AI choices.
                </p>
                <ul className="text-xs space-y-1.5 text-neutral-700 font-mono pt-1">
                  {formulation.provenance.humanAssumptions.slice(0, 3).map((asmp, i) => (
                    <li key={i} className="leading-snug">• {asmp}</li>
                  ))}
                </ul>
              </div>

              {/* Box 3: Mathematical Outputs */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-800">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Mathematical Outputs</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Calculated deterministically from the model and assumptions.
                </p>
                <ul className="text-xs space-y-1.5 text-neutral-700 font-mono pt-1">
                  <li className="leading-snug">• Solver: {optimalSolution.solverMethodUsed}</li>
                  <li className="leading-snug">• Optimum: ₹{optimalSolution.simulatedOptimalOutcome.toLocaleString()} (+{optimalSolution.expectedLiftPercent}%)</li>
                  <li className="leading-snug">• Binding limits: {optimalSolution.bindingConstraints.join(", ")}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Alternative Scenarios Comparison (Section 8 & Section 9) */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Alternative Calculated Solutions
                </h3>
                <p className="text-xs text-neutral-500">
                  Calculated using distinct mathematical parameters (conservative vs aggressive bounds), not narrative fluff.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              {alternativeScenarios.map((scen) => {
                const isSelected = activeScenarioId === scen.id;
                return (
                  <button
                    key={scen.id}
                    onClick={() => {
                      setActiveScenarioId(scen.id);
                      if (scen.id !== "custom") {
                        setLiveSliderOverrides({});
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                        : "border-neutral-200 bg-white hover:border-neutral-300 text-neutral-800"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-mono font-semibold ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                          {scen.riskProfile}
                        </span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>
                      <h4 className="text-sm font-bold">{scen.name}</h4>
                      <p className={`text-[11px] leading-relaxed line-clamp-2 ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                        {scen.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100/20 font-mono">
                      <div className="text-base font-bold tabular-nums">
                        ₹{scen.targetOutcome.toLocaleString()}
                      </div>
                      <div className={`text-xs ${isSelected ? "text-emerald-300" : "text-emerald-600"}`}>
                        +{scen.liftPercent}% lift
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expandable Accordions: Mathematical Proof & Sensitivity Analysis */}
          <div className="space-y-3">
            {/* Accordion 1: Mathematical Formulation */}
            <div className="border border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
              <button
                onClick={() => setShowMathDrawer((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                    <Calculator className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 block">
                      Mathematical Formulation &amp; Optimization Proof
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Inspect the objective function, constraints, and KKT marginal conditions
                    </span>
                  </div>
                </div>
                {showMathDrawer ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </button>

              <AnimatePresence>
                {showMathDrawer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 pt-0 border-t border-neutral-100 space-y-3 text-xs font-mono"
                  >
                    <div className="p-3.5 rounded-xl bg-neutral-900 text-neutral-200 space-y-1.5 pt-3">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Objective Function:</span>
                      <div className="text-sm text-emerald-400">{formulation.formulaDisplay}</div>
                    </div>

                    <div className="space-y-1 pt-1 text-neutral-700">
                      <span className="font-semibold block text-neutral-900">Active Binding Constraints:</span>
                      {optimalSolution.bindingConstraints.map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion 2: Sensitivity Analysis */}
            <div className="border border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
              <button
                onClick={() => setShowSensitivityDrawer((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 block">
                      Sensitivity Analysis (±10% Perturbation)
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Understand how results shift if budget or parameters change by 10%
                    </span>
                  </div>
                </div>
                {showSensitivityDrawer ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </button>

              <AnimatePresence>
                {showSensitivityDrawer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 pt-0 border-t border-neutral-100 space-y-2 text-xs"
                  >
                    <div className="overflow-x-auto rounded-xl border border-neutral-200 pt-1">
                      <table className="w-full text-left font-mono">
                        <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                          <tr>
                            <th className="px-3 py-2">Parameter</th>
                            <th className="px-3 py-2">Perturbation</th>
                            <th className="px-3 py-2">Simulated Outcome</th>
                            <th className="px-3 py-2">Impact (Δ)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-800">
                          {sensitivityAnalysis.map((item, idx) => (
                            <tr key={idx} className="hover:bg-neutral-50/50">
                              <td className="px-3 py-2 font-medium">{item.parameter}</td>
                              <td className="px-3 py-2 text-neutral-600">{item.shiftDescription}</td>
                              <td className="px-3 py-2">₹{item.outcomeWithShift.toLocaleString()}</td>
                              <td className={`px-3 py-2 font-semibold ${item.outcomeDelta >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                {item.outcomeDelta >= 0 ? "+" : ""}₹{item.outcomeDelta.toLocaleString()} ({item.percentImpact}%)
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Observational Causality Disclaimer (Section 7) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Mathematical Decision Notice:</strong> The calculated allocation represents the mathematically optimal resource mix conditional on your approved business assumptions and curvature model. It demonstrates the logical consequence of your chosen parameters. To confirm causal responses in production, validate through holdout A/B testing.
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
