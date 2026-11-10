export interface MethodRegistration {
  methodId: string;
  name: string;
  conceptNumber: number; // 1 to 10
  objective: string;
  supportedVariableTypes: string[];
  minimumSampleSize: number;
  requiredVariableCount: number;
  assumptions: {
    name: string;
    verifiableFromData: boolean;
    description: string;
  }[];
  diagnostics: string[];
  limitations: string[];
  resultSchema: Record<string, string>;
}

export const METHOD_REGISTRY: Record<string, MethodRegistration> = {
  // 1. Descriptive statistics
  METH_01_DESCRIPTIVE: {
    methodId: "METH_01_DESCRIPTIVE",
    name: "Descriptive Summary & Central Tendency",
    conceptNumber: 1,
    objective: "Calculate central location, dispersion, and shape of a numeric distribution.",
    supportedVariableTypes: ["continuous"],
    minimumSampleSize: 3,
    requiredVariableCount: 1,
    assumptions: [
      { name: "Measurement Scale", verifiableFromData: true, description: "Variable is interval or ratio scaled." },
      { name: "Valid Domain", verifiableFromData: true, description: "Observations fall within plausible bounds." }
    ],
    diagnostics: ["Skewness check", "Kurtosis check", "Missingness rate"],
    limitations: ["Describes sample only; does not infer population parameters or causation."],
    resultSchema: { mean: "float", median: "float", stdDev: "float", variance: "float", iqr: "float", skewness: "float" }
  },

  // 2. Probability and normal distribution
  METH_02_NORMAL_DISTRIBUTION: {
    methodId: "METH_02_NORMAL_DISTRIBUTION",
    name: "Probability Modeling & Gaussian Normality Test",
    conceptNumber: 2,
    objective: "Evaluate alignment of sample distribution with the theoretical Normal model.",
    supportedVariableTypes: ["continuous"],
    minimumSampleSize: 8,
    requiredVariableCount: 1,
    assumptions: [
      { name: "Continuous Support", verifiableFromData: true, description: "Data can take any real value in an interval." },
      { name: "Unimodal Shape", verifiableFromData: true, description: "Single dominant peak in frequency distribution." }
    ],
    diagnostics: ["Tukey IQR fence", "Z-score outlier audit (|z| >= 3)", "Skewness-Kurtosis symmetry"],
    limitations: ["Strict normality rarely holds in real business data; robust to minor deviations when N is large."],
    resultSchema: { zOutliersCount: "int", isApproxNormal: "bool", empirical68Pct: "float", empirical95Pct: "float" }
  },

  // 3. Sampling and Central Limit Theorem
  METH_03_SAMPLING_CLT: {
    methodId: "METH_03_SAMPLING_CLT",
    name: "Sampling Distribution & Central Limit Theorem Assessment",
    conceptNumber: 3,
    objective: "Evaluate standard error of the mean and sampling distribution convergence.",
    supportedVariableTypes: ["continuous"],
    minimumSampleSize: 30,
    requiredVariableCount: 1,
    assumptions: [
      { name: "Independent Observations", verifiableFromData: false, description: "Sample elements are independently drawn (study design dependent)." },
      { name: "Finite Variance", verifiableFromData: true, description: "Population standard deviation exists and is finite." }
    ],
    diagnostics: ["Sample size N >= 30 check", "Heavy tail / Pareto distribution screening"],
    limitations: ["CLT guarantees normality of sample mean, NOT of raw individual observations."],
    resultSchema: { standardErrorMean: "float", cltStatus: "string", sampleSize: "int" }
  },

  // 4. Confidence intervals for means
  METH_04_CI_MEANS: {
    methodId: "METH_04_CI_MEANS",
    name: "Student's t Confidence Interval for Population Mean",
    conceptNumber: 4,
    objective: "Estimate the true population mean with 95% confidence interval bounds.",
    supportedVariableTypes: ["continuous"],
    minimumSampleSize: 5,
    requiredVariableCount: 1,
    assumptions: [
      { name: "Independent Sampling", verifiableFromData: false, description: "Sampling units do not cluster or repeat (design dependent)." },
      { name: "Approximate Normality or N >= 30", verifiableFromData: true, description: "Sample distribution is non-extreme or sample size is large." }
    ],
    diagnostics: ["Student t degrees of freedom", "Margin of error relative to mean"],
    limitations: ["Confidence level applies to repeated hypothetical sampling, not the specific single interval."],
    resultSchema: { confidenceLevel: "float", pointEstimate: "float", ciLower: "float", ciUpper: "float", marginOfError: "float" }
  },

  // 5. Confidence intervals for proportions and sample size
  METH_05_CI_PROPORTIONS: {
    methodId: "METH_05_CI_PROPORTIONS",
    name: "Wilson / Wald Confidence Interval for Binary Proportions",
    conceptNumber: 5,
    objective: "Estimate true population proportion and assess minimum sample size adequacy.",
    supportedVariableTypes: ["boolean", "categorical"],
    minimumSampleSize: 20,
    requiredVariableCount: 1,
    assumptions: [
      { name: "Binomial Trials", verifiableFromData: true, description: "Each observation is binary (success or failure)." },
      { name: "Success-Failure Condition", verifiableFromData: true, description: "np >= 5 and n(1-p) >= 5 for normal approximation." }
    ],
    diagnostics: ["Minimum expected count check", "Wilson score continuity adjustment"],
    limitations: ["Wald interval degrades near 0% or 100%; Wilson score adjustment required."],
    resultSchema: { proportion: "float", ciLower: "float", ciUpper: "float", requiredSampleSize95: "int" }
  },

  // 6. Hypothesis testing for means and proportions
  METH_06_HYPOTHESIS_TESTING: {
    methodId: "METH_06_HYPOTHESIS_TESTING",
    name: "Welch's Two-Sample t-Test & Chi-Square Independence",
    conceptNumber: 6,
    objective: "Test null hypothesis of equal means across two cohorts without assuming equal variance.",
    supportedVariableTypes: ["continuous", "categorical"],
    minimumSampleSize: 10,
    requiredVariableCount: 2,
    assumptions: [
      { name: "Independent Groups", verifiableFromData: false, description: "Group membership is mutually exclusive and unclustered." },
      { name: "Continuous Outcome", verifiableFromData: true, description: "Target metric is continuous numeric." },
      { name: "Heteroscedasticity Robustness", verifiableFromData: true, description: "Welch correction applied to handle unequal variance." }
    ],
    diagnostics: ["Subgroup sample sizes n1, n2 >= 5", "Welch-Satterthwaite degrees of freedom"],
    limitations: ["Rejection of H0 proves statistical difference, not business importance or root causation."],
    resultSchema: { testStatistic: "float", pValue: "float", nullHypothesis: "string", decision: "string", meanDiff: "float" }
  },

  // 7. P-values, Type I and Type II errors and power
  METH_07_POWER_ANALYSIS: {
    methodId: "METH_07_POWER_ANALYSIS",
    name: "Statistical Power, Effect Size (Cohen's d) & Error Risk Audit",
    conceptNumber: 7,
    objective: "Calculate standardized effect magnitude, post-hoc statistical power, and Type II error risk.",
    supportedVariableTypes: ["continuous", "categorical"],
    minimumSampleSize: 10,
    requiredVariableCount: 2,
    assumptions: [
      { name: "Fixed Alpha", verifiableFromData: true, description: "Significance threshold alpha fixed at 0.05 prior to testing." },
      { name: "Symmetric Two-Tailed Test", verifiableFromData: true, description: "Evaluates both positive and negative deviations." }
    ],
    diagnostics: ["Cohen's d magnitude (<0.2 small, 0.5 moderate, >0.8 large)", "Power estimate (1 - beta)"],
    limitations: ["Low power (N < 30) risks false negatives (Type II error)."],
    resultSchema: { cohensD: "float", observedPower: "float", typeIAlpha: "float", typeIIBeta: "float" }
  },

  // 8. Correlation and covariance
  METH_08_CORRELATION_COV: {
    methodId: "METH_08_CORRELATION_COV",
    name: "Pearson Product-Moment & Spearman Rank Correlation",
    conceptNumber: 8,
    objective: "Quantify direction and linear/monotonic strength of association between two continuous variables.",
    supportedVariableTypes: ["continuous"],
    minimumSampleSize: 6,
    requiredVariableCount: 2,
    assumptions: [
      { name: "Paired Observations", verifiableFromData: true, description: "Each row represents a joint measurement on the same entity." },
      { name: "Linearity (Pearson)", verifiableFromData: true, description: "Relationship follows a linear trajectory." }
    ],
    diagnostics: ["Fisher z-transformation 95% CI", "Bivariate leverage outlier audit"],
    limitations: ["Correlation does NOT equal causation. Confounding third variables may drive both."],
    resultSchema: { pearsonR: "float", spearmanRho: "float", covariance: "float", pValue: "float", ci95: "array" }
  },

  // 9. Simple linear regression
  METH_09_SIMPLE_LINEAR_REGRESSION: {
    methodId: "METH_09_SIMPLE_LINEAR_REGRESSION",
    name: "Ordinary Least Squares (OLS) Simple Linear Regression",
    conceptNumber: 9,
    objective: "Model linear relationship Y = beta0 + beta1 * X + epsilon and quantify R-squared variance explained.",
    supportedVariableTypes: ["continuous"],
    minimumSampleSize: 8,
    requiredVariableCount: 2,
    assumptions: [
      { name: "Linearity", verifiableFromData: true, description: "Expected value of Y is a linear function of X." },
      { name: "Homoscedasticity", verifiableFromData: true, description: "Residual variance is constant across values of X." },
      { name: "Residual Normality", verifiableFromData: true, description: "Errors follow approximate zero-mean normal distribution." }
    ],
    diagnostics: ["R-squared metric", "Residual standard error (RSE)", "Slope t-statistic and p-value"],
    limitations: ["Extrapolation outside observed X range is mathematically invalid and untrustworthy."],
    resultSchema: { slope: "float", intercept: "float", rSquared: "float", fStatistic: "float", pValue: "float" }
  },

  // 10. Multiple linear regression
  METH_10_MULTIPLE_REGRESSION: {
    methodId: "METH_10_MULTIPLE_REGRESSION",
    name: "Ordinary Least Squares (OLS) Multiple Linear Regression",
    conceptNumber: 10,
    objective: "Model Y using multiple predictor variables (X1, X2, ...) controlling for mutual confounding.",
    supportedVariableTypes: ["continuous"],
    minimumSampleSize: 15,
    requiredVariableCount: 3,
    assumptions: [
      { name: "No Multicollinearity", verifiableFromData: true, description: "Predictors are not collinear (VIF < 5.0)." },
      { name: "Sample Ratio", verifiableFromData: true, description: "At least 10–15 observations per predictor variable." }
    ],
    diagnostics: ["Adjusted R-squared", "Overall Model F-test", "Coefficients p-values"],
    limitations: ["Omitted variable bias can distort coefficient signs and magnitudes."],
    resultSchema: { coefficients: "object", adjRSquared: "float", fStatistic: "float", overallPValue: "float" }
  }
};
