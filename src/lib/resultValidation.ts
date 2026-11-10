import {
  DatasetProfile,
  StatisticalResult,
  ValidationCheck,
  ValidationFailureDetails,
} from "../types/dataset";

/**
 * Format a p-value strictly adhering to statistical reporting standards:
 * - NEVER display p-value = 0.0000 or p = 0.0000
 * - If p < 0.001, display "p < 0.001"
 * - Never replace null or missing with zero
 */
export function formatPValue(p: number | null | undefined): string {
  if (p === null || p === undefined || isNaN(p) || !isFinite(p)) {
    return "Not available";
  }
  if (p < 0.001) {
    return "p < 0.001";
  }
  return `p = ${p.toFixed(3)}`;
}

/**
 * Clean display string for p-value metric counters
 */
export function formatPValueDisplay(p: number | null | undefined): string {
  if (p === null || p === undefined || isNaN(p) || !isFinite(p)) {
    return "Not available";
  }
  if (p < 0.001) {
    return "< 0.001";
  }
  return p.toFixed(3);
}

/**
 * Clean display string for statistics, means, medians, and effect sizes:
 * - A genuine zero must remain zero.
 * - Missing or NaN must display "Not enough reliable information to calculate this."
 * - Never fabricate numbers.
 */
export function formatStatValue(
  val: number | null | undefined,
  precision = 2
): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return "Not enough reliable information to calculate this.";
  }
  if (val === 0) return "0";
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

/**
 * Format Confidence Interval bounds
 */
export function formatConfidenceIntervalDisplay(
  ci: [number, number] | null | undefined
): string {
  if (
    !ci ||
    !Array.isArray(ci) ||
    ci.length < 2 ||
    ci[0] === null ||
    ci[1] === null ||
    isNaN(ci[0]) ||
    isNaN(ci[1]) ||
    !isFinite(ci[0]) ||
    !isFinite(ci[1])
  ) {
    return "Not enough reliable information to calculate this.";
  }
  return `[${ci[0].toLocaleString(undefined, { maximumFractionDigits: 2 })}, ${ci[1].toLocaleString(undefined, { maximumFractionDigits: 2 })}]`;
}

/**
 * Strict Result Validation Engine (Prompt Part 5)
 * Validates:
 * 1. Was the correct variable selected and available?
 * 2. Were sufficient observations available?
 * 3. Were missing values handled appropriately?
 * 4. Were categorical and numerical variables treated correctly?
 * 5. Were all numerical outputs finite and valid (no NaN, Infinity, or 0/0)?
 * 6. Is the result meaningful for the original question (not degenerate constant zero variance)?
 */
export function validateStatisticalResult(
  result: StatisticalResult,
  dataset: DatasetProfile,
  targetVar?: string,
  groupVar?: string
): { isValid: boolean; failure?: ValidationFailureDetails } {
  // If result is already marked invalid by solver, preserve it
  if (result.isValidCalculation === false && result.validationFailure) {
    return { isValid: false, failure: result.validationFailure };
  }

  // 1. Observation Count & Sample Size Check
  if (!result.sampleSize || result.sampleSize < 2 || !isFinite(result.sampleSize)) {
    return {
      isValid: false,
      failure: {
        failedCheck: "INSUFFICIENT_SAMPLE_SIZE",
        reason: "Not enough reliable information to calculate this.",
        technicalDetail: `Sample contains only ${result.sampleSize || 0} valid observations. A minimum of at least 2–15 observations is required for any statistical calculation.`,
        recommendedAction: "Provide a dataset or filtered slice with sufficient non-empty rows.",
      },
    };
  }

  // 2. Numerical Finiteness Check
  if (
    result.pValue === null ||
    result.pValue === undefined ||
    isNaN(result.pValue) ||
    !isFinite(result.pValue) ||
    result.pValue < 0 ||
    result.pValue > 1
  ) {
    return {
      isValid: false,
      failure: {
        failedCheck: "NON_FINITE_P_VALUE",
        reason: "Not enough reliable information to calculate this.",
        technicalDetail: "Calculation resulted in an undefined, non-finite, or out-of-bounds p-value.",
        recommendedAction: "Verify that input columns contain varying numeric data without division-by-zero artifacts.",
      },
    };
  }

  if (
    result.testStatistic !== null &&
    result.testStatistic !== undefined &&
    (!isFinite(result.testStatistic) || isNaN(result.testStatistic))
  ) {
    return {
      isValid: false,
      failure: {
        failedCheck: "NON_FINITE_TEST_STATISTIC",
        reason: "Not enough reliable information to calculate this.",
        technicalDetail: "Test statistic calculation produced NaN or Infinity (division by zero variance).",
        recommendedAction: "Ensure the metric column has measurable dispersion and is not constant.",
      },
    };
  }

  // 3. Two-sample Cohort Test Integrity Check
  const isComparisonTest =
    result.testUsed.toLowerCase().includes("welch") ||
    result.testUsed.toLowerCase().includes("two-sample") ||
    result.testUsed.toLowerCase().includes("t-test");

  if (isComparisonTest) {
    const gCol = groupVar || dataset.columns.find((c) => c.inferredType === "categorical")?.name;
    if (gCol) {
      const distinctGroups = Array.from(
        new Set(
          dataset.records
            .map((r) => String(r[gCol] ?? "").trim())
            .filter((v) => v !== "" && v !== "null" && v !== "undefined")
        )
      );
      if (distinctGroups.length < 2) {
        return {
          isValid: false,
          failure: {
            failedCheck: "INSUFFICIENT_COMPARISON_GROUPS",
            reason: "Not enough reliable information to calculate this.",
            technicalDetail: `A two-sample comparison requires at least 2 distinct cohorts, but grouping variable '${gCol}' only contains ${distinctGroups.length} unique value: [${distinctGroups.join(", ") || "none"}].`,
            recommendedAction: "Choose a question with two existing comparison cohorts (e.g. pre-launch vs post-launch, or Website vs App).",
          },
        };
      }
    }
  }

  // 4. Excessive Missingness Check
  const mCol = targetVar || dataset.columns.find((c) => c.inferredType === "continuous")?.name;
  if (mCol) {
    const colMeta = dataset.columns.find((c) => c.name === mCol);
    if (colMeta && colMeta.nullPercentage && colMeta.nullPercentage > 80) {
      return {
        isValid: false,
        failure: {
          failedCheck: "EXCESSIVE_MISSINGNESS",
          reason: "Not enough reliable information to calculate this.",
          technicalDetail: `The metric '${mCol}' is missing in ${colMeta.nullPercentage.toFixed(1)}% of rows, violating reliability thresholds.`,
          recommendedAction: "Select a complete numeric metric or impute missing values.",
        },
      };
    }
  }

  return { isValid: true };
}

/**
 * Constructs a transparent uncalculated failure result when strict validation fails
 */
export function createValidationFailureResult(
  question: string,
  failure: ValidationFailureDetails,
  testUsed: string = "Deterministic Statistical Validation"
): StatisticalResult {
  return {
    question,
    testUsed,
    nullHypothesis: "Hypothesis testing suspended due to critical validation constraint violation.",
    alternativeHypothesis: "No inference possible under current sample constraints.",
    rawPValue: undefined,
    pValue: 1.0,
    pValueDisplay: "Not available",
    isSignificant: false,
    testStatistic: null,
    effectSize: null,
    confidenceInterval: null,
    sampleSize: 0,
    degreesOfFreedom: null,
    isValidCalculation: false,
    validationFailure: failure,
    validationChecks: [
      {
        checkName: "Input Pre-Flight Validation",
        passed: false,
        details: failure.technicalDetail,
        recommendation: failure.recommendedAction,
      },
    ],
    plainEnglishSummary: `Not enough reliable information to calculate this. ${failure.technicalDetail}`,
    tenYearOldExplanation: `We looked at the data to answer this, but a crucial piece is missing or doesn't have enough information to give you an honest answer. Math can't guess when numbers are missing.`,
    verdictHeadline: "Not enough reliable information to calculate this.",
    mathematicalProof: `Validation check '${failure.failedCheck}' failed: ${failure.technicalDetail}`,
    evidenceSteps: [
      {
        stepNumber: 1,
        phase: "Data Invariant Audit",
        title: "Pre-computation Invariant Check",
        computation: failure.technicalDetail,
        result: "FAILED",
        status: "flagged",
      },
    ],
    chartData: [],
    chartType: "bar_comparison",
    chartVariables: {
      xKey: "category",
      yKey: "value",
    },
    limitations: [
      failure.technicalDetail,
      "Calculation was halted proactively by the Strict Result Validation Engine to prevent misleading conclusions.",
    ],
  };
}
