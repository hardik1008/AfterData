import { DatasetProfile, StatisticalResult } from "../types/dataset";
import { StatisticalDecisionPlan } from "./decisionEngine";

export type ExperienceType = "discover" | "diagnose" | "experiment" | "learn" | "forecast" | "decide" | "optimise";

export interface ExperienceEligibility {
  type: ExperienceType;
  title: string;
  tagline: string;
  isEligible: boolean;
  isPrimary: boolean;
  reason: string;
  iconName: "Compass" | "Stethoscope" | "Sliders" | "BookOpen" | "TrendingUp" | "Lightbulb" | "Target";
}

export interface DynamicExperiencesPlan {
  eligibleExperiences: ExperienceEligibility[];
  primaryExperience: ExperienceType;
  allEvaluations: Record<ExperienceType, ExperienceEligibility>;
  selectionSummary: string;
}

/**
 * Deterministically determines which of the five experiences are eligible
 * based on question intent, dataset schema/coverage, and statistical findings.
 * Never forces all five experiences onto every user.
 */
export function evaluateDynamicExperiences(
  question: string,
  dataset: DatasetProfile,
  result: StatisticalResult,
  decisionPlan?: StatisticalDecisionPlan | null,
  targetVar?: string,
  groupVar?: string
): DynamicExperiencesPlan {
  const qLower = question.toLowerCase();

  // 1. Dataset characteristics
  const continuousCols = dataset.columns.filter((c) => c.inferredType === "continuous");
  const categoricalCols = dataset.columns.filter((c) => c.inferredType === "categorical");
  const hasTimeData = dataset.timeCoverage?.hasTemporalData === true;
  const timeSpanDays = dataset.timeCoverage?.totalSpanDays || 0;
  const dateCol = dataset.timeCoverage?.dateColumn || dataset.dateColumns?.[0];
  const hasMultipleContinuous = continuousCols.length >= 2;
  const rowCount = dataset.rowCount || 0;

  // 2. Statistical result characteristics
  const isCorrelation =
    result.testUsed.toLowerCase().includes("correlation") ||
    result.testUsed.toLowerCase().includes("regression") ||
    result.chartType === "scatter_regression";
  const hasOutliers =
    dataset.columns.some((c) => (c.outliers?.count || 0) > 0) ||
    result.testUsed.toLowerCase().includes("anomaly") ||
    result.testUsed.toLowerCase().includes("outlier");

  // 3. Evaluate DISCOVER ("What is happening in my business?")
  // Discover is the fundamental baseline: always eligible to understand distributions, cohorts, and averages.
  const isDiscoverPrimary =
    qLower.includes("what is") ||
    qLower.includes("average") ||
    qLower.includes("distribution") ||
    qLower.includes("overview") ||
    qLower.includes("breakdown") ||
    (!qLower.includes("why") && !qLower.includes("what if") && !qLower.includes("forecast") && !qLower.includes("mistake"));

  const discoverEval: ExperienceEligibility = {
    type: "discover",
    title: "Discover",
    tagline: "What is happening in my business?",
    isEligible: true, // Always eligible as verified descriptive and cohort baseline
    isPrimary: isDiscoverPrimary,
    reason: "Sufficient data available to profile averages, cohorts, and distribution spread.",
    iconName: "Compass",
  };

  // 4. Evaluate DIAGNOSE ("Why is this happening?")
  // Relevant if question asks why, drivers, factors, relationship, correlation, or if regression/multi-group is verified
  const asksWhy =
    qLower.includes("why") ||
    qLower.includes("cause") ||
    qLower.includes("driver") ||
    qLower.includes("relationship") ||
    qLower.includes("factor") ||
    qLower.includes("lead to") ||
    qLower.includes("correlat");

  const hasDiagnoseEvidence =
    isCorrelation ||
    categoricalCols.length >= 1 ||
    continuousCols.length >= 2 ||
    result.testUsed.toLowerCase().includes("t-test") ||
    result.testUsed.toLowerCase().includes("anova");

  const isDiagnoseEligible = asksWhy || isCorrelation || (continuousCols.length >= 2 && result.isSignificant);
  const isDiagnosePrimary = asksWhy && isDiagnoseEligible;

  const diagnoseEval: ExperienceEligibility = {
    type: "diagnose",
    title: "Diagnose",
    tagline: "Why is this happening?",
    isEligible: isDiagnoseEligible,
    isPrimary: isDiagnosePrimary,
    reason: isDiagnoseEligible
      ? "Identified measurable relationships and cohort differences between business variables."
      : "Question does not explore drivers and dataset lacks multivariate relationship pairs.",
    iconName: "Stethoscope",
  };

  // 5. Evaluate EXPERIMENT ("What happens if I change something?")
  // Relevant if question asks "what if", "scenario", "change", "increase", "decrease", "optimize"
  // AND there is a continuous predictor X and outcome Y to simulate without reckless extrapolation
  const asksWhatIf =
    qLower.includes("what if") ||
    qLower.includes("if i change") ||
    qLower.includes("increase") ||
    qLower.includes("decrease") ||
    qLower.includes("scenario") ||
    qLower.includes("what happens if");

  // Can we support scenario modeling? Requires either correlation/regression or at least two continuous metrics
  const canSupportExperiment =
    (isCorrelation || hasMultipleContinuous) &&
    rowCount >= 20 &&
    continuousCols.length >= 1;

  const isExperimentEligible = (asksWhatIf && canSupportExperiment) || (isCorrelation && result.isSignificant);
  const isExperimentPrimary = asksWhatIf && isExperimentEligible;

  const experimentEval: ExperienceEligibility = {
    type: "experiment",
    title: "Experiment",
    tagline: "What happens if I change something?",
    isEligible: isExperimentEligible,
    isPrimary: isExperimentPrimary,
    reason: isExperimentEligible
      ? "Verified regression relationship allows bounded scenario simulation with uncertainty intervals."
      : asksWhatIf && !canSupportExperiment
      ? "Cannot run scenario experiment: requires at least two continuous variables with verified association."
      : "Question does not request scenario simulation and no regression model is active.",
    iconName: "Sliders",
  };

  // 6. Evaluate LEARN ("What mistakes is my business making?")
  // Relevant if question asks "mistake", "error", "gap", "missed", "opportunity", "underperform", "worst"
  // OR if significant anomalies or quartile performance gaps are detected
  const asksLearn =
    qLower.includes("mistake") ||
    qLower.includes("error") ||
    qLower.includes("gap") ||
    qLower.includes("missed") ||
    qLower.includes("opportunity") ||
    qLower.includes("underperform") ||
    qLower.includes("worst") ||
    qLower.includes("inefficien");

  const hasLearnEvidence =
    hasOutliers ||
    dataset.dataQualityIssues?.length > 0 ||
    categoricalCols.length >= 1 ||
    (continuousCols[0]?.outliers?.count || 0) > 0;

  const isLearnEligible = asksLearn || (hasLearnEvidence && (asksWhy || isDiscoverPrimary));
  const isLearnPrimary = asksLearn && isLearnEligible;

  const learnEval: ExperienceEligibility = {
    type: "learn",
    title: "Learn",
    tagline: "What mistakes is my business making?",
    isEligible: isLearnEligible,
    isPrimary: isLearnPrimary,
    reason: isLearnEligible
      ? "Detected notable performance gaps and statistical anomalies between operating cohorts."
      : "No substantial performance gaps or anomalous cohorts detected in this dataset.",
    iconName: "BookOpen",
  };

  // 7. Evaluate FORECAST ("What might happen next?")
  // Relevant if question asks "forecast", "future", "next", "predict", "trend", "quarter"
  // AND dataset has sufficient temporal history (at least 5 periods) to support backtesting
  const asksForecast =
    qLower.includes("forecast") ||
    qLower.includes("next") ||
    qLower.includes("future") ||
    qLower.includes("predict") ||
    qLower.includes("trend") ||
    qLower.includes("quarter") ||
    qLower.includes("tomorrow");

  // Check temporal coverage
  const hasSufficientHistory =
    hasTimeData &&
    (dataset.timeCoverage?.periodVolumeDistribution?.length || 0) >= 5;

  const isForecastEligible = hasSufficientHistory && (asksForecast || hasTimeData);
  const isForecastPrimary = asksForecast && isForecastEligible;

  const forecastEval: ExperienceEligibility = {
    type: "forecast",
    title: "Forecast",
    tagline: "What might happen next?",
    isEligible: isForecastEligible,
    isPrimary: isForecastPrimary,
    reason: isForecastEligible
      ? `Sufficient longitudinal history (${dataset.timeCoverage.periodVolumeDistribution?.length || 0} periods) available for backtested trajectory projection.`
      : asksForecast && !hasSufficientHistory
      ? "Forecasting unavailable: dataset lacks temporal timestamp column or has fewer than 5 sequential periods."
      : "Question is not forward-looking and dataset does not prioritize time series.",
    iconName: "TrendingUp",
  };

  // 8. Evaluate DECIDE ("What should my business do next?")
  const asksDecide =
    qLower.includes("what should") ||
    qLower.includes("recommend") ||
    qLower.includes("what next") ||
    qLower.includes("action") ||
    qLower.includes("strategy") ||
    qLower.includes("decision") ||
    qLower.includes("how can we improve");

  const isDecideEligible =
    asksDecide ||
    result.isValidCalculation !== false; // Any verified statistical result generates structured recommendations
  const isDecidePrimary = asksDecide && isDecideEligible;

  const decideEval: ExperienceEligibility = {
    type: "decide",
    title: "Decide",
    tagline: "What should my business do next?",
    isEligible: isDecideEligible,
    isPrimary: isDecidePrimary,
    reason: isDecideEligible
      ? "Verified statistical findings provide an empirical basis for structured business recommendations and test design."
      : "No verified findings available to ground business recommendations.",
    iconName: "Lightbulb",
  };

  // 9. Evaluate OPTIMISE ("What is the best feasible combination of business decisions?")
  const asksOptimise =
    qLower.includes("optimis") ||
    qLower.includes("optimiz") ||
    qLower.includes("allocate") ||
    qLower.includes("allocation") ||
    qLower.includes("best combination") ||
    qLower.includes("budget") ||
    qLower.includes("maximize") ||
    qLower.includes("maximise") ||
    qLower.includes("minimize") ||
    qLower.includes("minimise") ||
    qLower.includes("trade-off") ||
    qLower.includes("tradeoff");

  const controllableCols = continuousCols.filter((c) =>
    /spend|budget|cost|price|discount|marketing|rate|channel|visits|users/i.test(c.name)
  );
  const canSupportOptimise =
    (controllableCols.length >= 1 || continuousCols.length >= 2) &&
    rowCount >= 15;

  const isOptimiseEligible = (asksOptimise && canSupportOptimise) || (canSupportOptimise && (isCorrelation || isExperimentEligible));
  const isOptimisePrimary = asksOptimise && isOptimiseEligible;

  const optimiseEval: ExperienceEligibility = {
    type: "optimise",
    title: "Optimise",
    tagline: "What is the best feasible combination of business decisions?",
    isEligible: isOptimiseEligible,
    isPrimary: isOptimisePrimary,
    reason: isOptimiseEligible
      ? `Controllable decision variables (${controllableCols.map((c) => c.name).slice(0, 3).join(", ") || "channel metrics"}) mapped to target outcome for constrained optimization.`
      : asksOptimise && !canSupportOptimise
      ? "Optimization unavailable: dataset lacks controllable input variables (e.g., spend, budget, price) or outcome metrics."
      : "Question does not request mathematical optimization.",
    iconName: "Target",
  };

  const allEvaluations: Record<ExperienceType, ExperienceEligibility> = {
    discover: discoverEval,
    diagnose: diagnoseEval,
    experiment: experimentEval,
    learn: learnEval,
    forecast: forecastEval,
    decide: decideEval,
    optimise: optimiseEval,
  };

  // Filter only eligible experiences
  const eligibleExperiences = Object.values(allEvaluations).filter((e) => e.isEligible);

  // Determine primary experience
  let primaryExperience: ExperienceType = "discover";
  if (optimiseEval.isPrimary) primaryExperience = "optimise";
  else if (decideEval.isPrimary) primaryExperience = "decide";
  else if (forecastEval.isPrimary) primaryExperience = "forecast";
  else if (experimentEval.isPrimary) primaryExperience = "experiment";
  else if (learnEval.isPrimary) primaryExperience = "learn";
  else if (diagnoseEval.isPrimary) primaryExperience = "diagnose";
  else if (discoverEval.isPrimary) primaryExperience = "discover";
  else if (eligibleExperiences.length > 0) {
    primaryExperience = eligibleExperiences[0].type;
  }

  // Update isPrimary in the array
  eligibleExperiences.forEach((e) => {
    e.isPrimary = e.type === primaryExperience;
  });

  const selectedCount = eligibleExperiences.length;
  const selectionSummary = `Dynamically activated ${selectedCount} of 7 experiences (${eligibleExperiences.map((e) => e.title).join(", ")}) based on verified question intent and statistical eligibility.`;

  return {
    eligibleExperiences,
    primaryExperience,
    allEvaluations,
    selectionSummary,
  };
}
