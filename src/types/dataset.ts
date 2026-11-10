export type ColumnType = "continuous" | "categorical" | "temporal" | "boolean" | "identifier";

export interface OutlierSummary {
  count: number;
  percentage: number;
  method: "IQR" | "Z-Score";
  lowerBound: number;
  upperBound: number;
  sampleOutliers: { value: number; rowIndex: number }[];
}

export interface InconsistentValueSummary {
  hasInconsistencies: boolean;
  typeMismatchCount: number;
  casingVariants: { normalized: string; variants: string[] }[];
  whitespaceVariantsCount: number;
  sampleInvalidValues: string[];
}

export interface ColumnProfile {
  name: string;
  inferredType: ColumnType;
  nonNullCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
  isConstant: boolean;
  isIdentifierCandidate: boolean;
  // Numerical stats
  minValue?: number;
  maxValue?: number;
  meanValue?: number;
  stdValue?: number;
  medianValue?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  outliers?: OutlierSummary;
  // Categorical / string stats
  topCategories?: { value: string; count: number; percentage: number }[];
  inconsistencies?: InconsistentValueSummary;
}

export type IssueSeverity = "critical" | "warning" | "advisory";
export type IssueCategory =
  | "duplicates"
  | "missing_data"
  | "constant_column"
  | "outliers"
  | "inconsistent_types"
  | "partial_period"
  | "unbalanced_cardinality"
  | "identifier_collision"
  | "reconciliation_gap"
  | "non_independent_observations"
  | "pre_launch_missingness"
  | "inconsistent_indicator";

export interface DataQualityIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  affectedColumn?: string;
  affectedRowCount: number;
  affectedRowPercentage: number;
  sampleViolations?: { rowIndex: number; value: any; details?: string }[];
  recommendation: string;
}

export interface TimeCoverage {
  hasTemporalData: boolean;
  dateColumn?: string;
  startDate?: string;
  endDate?: string;
  totalSpanDays?: number;
  detectedFrequency?: "daily" | "weekly" | "monthly" | "yearly" | "irregular" | "none";
  hasPartialPeriod: boolean;
  partialPeriodDetails?: string | null;
  periodVolumeDistribution?: { period: string; count: number; isPartial?: boolean }[];
}

export interface GranularityAnalysis {
  detectedGranularity: string;
  primaryKeyCandidate: string | null;
  compositeKeyCandidates: string[];
  uniquenessRatio: number;
  explanation: string;
}

export interface RatePairCandidate {
  numerator: string;
  denominator: string;
  metricLabel: string;
  ratioSampleMean: number;
  complianceRate: number; // Percentage where numerator <= denominator
  description: string;
}

export interface MeasurableMetric {
  name: string;
  originalColumn: string;
  category: "outcome" | "driver" | "grouping" | "volume";
  description?: string;
  sampleSummary?: string;
}

export interface DataQualityAlert {
  title: string;
  detail: string;
  severity: "critical" | "warning" | "advisory" | "clean";
  affectedColumn?: string;
}

export interface InvestigableQuestion {
  question: string;
  intent: string;
  suggestedTest?: string;
  targetVar?: string;
  groupVar?: string;
  primaryVariables?: string[];
  explanation?: string;
}

export interface DatasetUnderstanding {
  status: "success" | "fallback";
  headline: string; // e.g. "We found 5,000 records containing information about website visits, app usage, policy sales and revenue."
  whatItIsAbout: string; // 1-2 plain English sentences a 10-year-old can understand
  informationCollected: {
    recordsCount: number;
    recordsText: string;
    columnsCount: number;
    columnsText: string;
    dateCoverageText: string;
    hasDateCoverage: boolean;
    granularityText: string;
  };
  whatWeCanMeasure: MeasurableMetric[];
  thingsToBeCarefulAbout: DataQualityAlert[];
  whatWeCanInvestigate: InvestigableQuestion[];
}

export interface DatasetProfile {
  datasetId: string;
  filename: string;
  fileSize: number;
  sheetName?: string;
  availableSheets: string[];
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  dateColumns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  identifierCandidates: string[];
  missingValues: {
    totalMissingCells: number;
    globalMissingPercentage: number;
    columnsWithNulls: { column: string; count: number; percentage: number }[];
  };
  duplicateCount: number;
  duplicatePercentage: number;
  sampleDuplicateRowIndices: number[];
  dataQualityIssues: DataQualityIssue[];
  timeCoverage: TimeCoverage;
  granularity: GranularityAnalysis;
  potentialRatePairs: RatePairCandidate[];
  records: Record<string, any>[];
  uploadedAt: string;
  transformationsAuditLog: {
    timestamp: string;
    action: string;
    details: string;
  }[];
  independenceAudit?: {
    isIndependentObservations: boolean;
    unitOfAnalysis: string;
    rationale: string;
    dependenceType: "time_series" | "panel" | "clustered" | "independent";
  };
  reconciliationAudit?: {
    isReconciled: boolean;
    formula: string;
    discrepantRowsCount: number;
    maxDiscrepancy: number;
    details: string;
  }[];
  preLaunchAudit?: {
    hasPreLaunchPeriod: boolean;
    preLaunchRowCount: number;
    postLaunchRowCount: number;
    details: string;
    rateMissingnessNotice?: string;
  };
  understanding?: DatasetUnderstanding;
}

export type QuestionCategory =
  | "Drivers & Causes"
  | "Cohort Comparisons"
  | "Anomaly Detection"
  | "Trends & Dynamics";

export interface QuestionLibraryItem {
  id: string;
  question: string;
  business_context: string;
  statistical_concept: string;
  intent: string;
  required_data_types: string[];
  outcome_candidates: string[];
  predictor_candidates: string[];
  time_dimension_candidates?: string[];
  suggested_test: string;
  requested_experiences: string[];
  relevance_score?: number;
}

export type QuestionFeasibilityStatus = "ready" | "partial" | "needs_data";

export interface BusinessQuestion {
  id: string;
  theme: string;
  question: string;
  intent: string;
  targetVar?: string;
  groupVar?: string;
  suggestedTest: string;
  feasibility: QuestionFeasibilityStatus;
  feasibilityLabel: string;
  explanation: string;
  missingRequirementExplanation?: string;
  businessValue?: string;
}

export interface BusinessQuestionLibrary {
  centralBusinessProblem: string;
  datasetContextSummary: string;
  themes: string[];
  questions: BusinessQuestion[];
}

export type QuestionIntentCategory =
  | "BUSINESS_ANALYSIS"
  | "STATISTICAL_ANALYSIS"
  | "COMPARISON"
  | "TREND_ANALYSIS"
  | "RELATIONSHIP_ANALYSIS"
  | "EXPERIMENTATION"
  | "FORECASTING"
  | "DATA_QUALITY"
  | "DATA_EXPLORATION"
  | "GENERAL_PRODUCT_CAPABILITY"
  | "IRRELEVANT"
  | "GIBBERISH"
  | "AMBIGUOUS"
  | "UNSUPPORTED"
  | "ADVERSARIAL";

export type RelevanceGateClassification =
  | "ANSWERABLE"
  | "PARTIALLY_ANSWERABLE"
  | "IRRELEVANT"
  | "AMBIGUOUS"
  | "INSUFFICIENT_EVIDENCE"
  | "GIBBERISH"
  | "UNSUPPORTED"
  | "ADVERSARIAL";

export interface StructuredQuestionInterpretation {
  decision: RelevanceGateClassification;
  intentCategory: QuestionIntentCategory;
  isValid: boolean; // true if ANSWERABLE or PARTIALLY_ANSWERABLE
  headline: string;
  politeResponse: string;
  business_objective: string;
  intent: "relationship_and_comparison" | "driver_analysis" | "outlier_detection" | "trend_analysis" | "segment_disparity";
  outcome_candidates: string[];
  predictor_candidates: string[];
  time_dimension_candidates: string[];
  hypotheses: string[];
  requested_experiences: string[];
  clarification_required: boolean;
  candidate_test?: string;
  clarificationOptions?: string[];
  missingConcepts?: string[];
  suggestedAlternatives?: string[];
  statisticalExecutionPermitted?: boolean;
  causalityDistinction?: {
    isCausalInquiry: boolean;
    observationalAssociationOnly: boolean;
    explanation: string;
  };
}

export interface RelevanceGateResult {
  classification: RelevanceGateClassification;
  headline: string;
  explanation: string;
  matchedColumns: string[];
  missingConcepts: string[];
  clarificationOptions?: string[];
  isPass: boolean; // true if ANSWERABLE or PARTIALLY_ANSWERABLE
  politeResponse?: string;
  intentCategory?: QuestionIntentCategory;
  suggestedAlternatives?: string[];
  statisticalExecutionPermitted?: boolean;
  causalityDistinction?: {
    isCausalInquiry: boolean;
    observationalAssociationOnly: boolean;
    explanation: string;
  };
}

export type InvestigationAvailability =
  | "Available"
  | "Available with limitations"
  | "Requires additional data"
  | "Not currently supported";

export type InvestigationDataSupport =
  | "Supported by data"
  | "Partially supported"
  | "Not supported by current data";

export interface DiscoveredInvestigation {
  id: string;
  title: string;
  experienceCategory: string; // "Understand what happened" | "Investigate why it happened" | "Explore possible changes" | "Discover missed opportunities" | "Explore what might happen next"
  simpleExplanation: string; // What it means in simple language
  whyUseful: string; // Why it might be useful
  dataSupportStatus: InvestigationDataSupport; // Whether the data supports it
  dataSupportReason: string; // Plain-English reasoning for the data support status
  additionalInformationNeeded: string; // What additional information might be needed
  requiredVariables: string[];
  candidateMethods: string[];
  missingDataRequirements?: string;
  potentialLimitations: string[];
  availability: InvestigationAvailability;
  isSelectable: boolean;
  isRecommended: boolean;
  deterministicApproval?: {
    isApproved: boolean;
    approvedMethod: string;
    reason: string;
    variablesFound: string[];
    missingVariables: string[];
    samplePowerSufficient: boolean;
  };
}

export interface CapabilityDiscoveryResult {
  originalQuestion: string;
  relevance: RelevanceGateResult;
  investigations: DiscoveredInvestigation[];
  recommendedCount: number;
}

export interface SuggestedQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  primaryVariables: string[];
  suggestedTest: string;
  feasibilityStatus: "High Feasibility" | "Moderate Feasibility" | "Limited Sample";
  hypothesis: string;
  targetVariable?: string;
  groupingVariable?: string;
}

export interface ValidationCheck {
  checkName: string;
  passed: boolean;
  details: string;
  recommendation?: string | null;
}

export interface EvidenceStep {
  stepNumber: number;
  phase: string;
  title: string;
  formula?: string;
  computation: string;
  result: string;
  status: "verified" | "flagged" | "passed";
}

export interface ValidationFailureDetails {
  failedCheck: string;
  reason: string;
  technicalDetail: string;
  recommendedAction: string;
  missingDataRequirement?: string;
}

export interface StatisticalResult {
  question: string;
  testUsed: string;
  nullHypothesis: string;
  alternativeHypothesis: string;
  rawPValue?: number;
  pValue: number;
  pValueDisplay?: string;
  isSignificant: boolean;
  testStatistic: number | null;
  effectSize?: number | null;
  confidenceInterval?: [number, number] | null;
  sampleSize: number;
  degreesOfFreedom?: number | null;
  validationChecks: ValidationCheck[];
  plainEnglishSummary: string;
  tenYearOldExplanation: string;
  verdictHeadline: string;
  mathematicalProof: string;
  evidenceSteps: EvidenceStep[];
  chartData: any[];
  chartType: "bar_comparison" | "scatter_regression" | "distribution_histogram" | "contingency_matrix";
  chartVariables: {
    xKey: string;
    yKey: string;
    label?: string;
  };
  limitations: string[];
  provenanceRecord?: AnalysisProvenanceRecord;
  explanationLayer?: LLMExplanationOutput;
  isValidCalculation?: boolean;
  validationFailure?: ValidationFailureDetails;
}

export interface LLMExplanationOutput {
  oneLineAnswer: string;
  mainFinding: string;
  simpleExplanation: string;
  relevantVisualisationType: "bar_comparison" | "scatter_regression" | "distribution_histogram" | "contingency_matrix";
  businessImplication: string;
  recommendedNextStep: string;
  importantLimitations: string[];
  suggestedFollowUpQuestions: string[];
  validationStatus: "passed_strict_checks" | "adjusted";
  aiEngineStatus?: {
    isAvailable: boolean;
    model: string;
    usedCache?: boolean;
    notice?: string;
  };
}

export interface AnalysisProvenanceRecord {
  id: string;
  dataset_id: string;
  dataset_version: string;
  dataset_fingerprint: string;
  source_sheet: string;
  source_columns: string[];
  row_filters: {
    filter_description: string;
    complete_cases_only: boolean;
    excluded_count: number;
    missingness_exclusions: number;
    criteria: string[];
  };
  data_transformations: string[];
  statistical_objective: string;
  selected_method: {
    method_id: string;
    name: string;
    concept_number: number;
    assigned_role: string;
  };
  rejected_alternatives: {
    method_id: string;
    name: string;
    concept_number: number;
    rejection_reason: string;
  }[];
  method_version: string;
  formula_or_model_specification: string;
  parameters: {
    alpha: number;
    alternative: string;
    confidence_level: number;
    [key: string]: any;
  };
  sample_size: {
    total_records: number;
    analyzed_records: number;
    excluded_records: number;
    degrees_of_freedom?: number | null;
    groups_breakdown?: Record<string, number>;
  };
  numerical_results: {
    test_statistic: number | null;
    p_value: number;
    effect_size?: number | null;
    is_significant: boolean;
    mean_difference?: number;
    standard_error?: number;
    r_squared?: number;
    [key: string]: any;
  };
  confidence_intervals: {
    level: number;
    lower: number;
    upper: number;
    margin_of_error?: number;
    formatted: string;
  };
  assumption_checks: {
    assumption: string;
    status: "verified_from_data" | "unverified" | "violated";
    source: string;
    details: string;
  }[];
  diagnostics: string[];
  warnings: string[];
  calculation_code_version: string;
  execution_timestamp: string;
  llm_explanation_version: string;
  provenance_audit_hash: string;
}

export interface AdversarialTestCaseResult {
  id: string;
  category:
    | "Valid business questions"
    | "Irrelevant questions"
    | "Gibberish and adversarial questions"
    | "Unsupported questions";
  originalQuestion: string;
  questionClassification: RelevanceGateClassification;
  interpretedObjective: string;
  mappedColumns: string[];
  selectedMethods: string[];
  rejectedMethods: string[];
  finalResponse: string;
  statisticalExecutionPermitted: boolean;
  isFactuallyGrounded: boolean;
  causalityDistinction?: {
    isCausalInquiry: boolean;
    observationalAssociationOnly: boolean;
    explanation: string;
  };
  passedValidation: boolean;
  validationNotes: string[];
}

export interface AdversarialBenchmarkReport {
  timestamp: string;
  datasetName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  tests: AdversarialTestCaseResult[];
}

// --- Experience F: DECIDE Experience Types ---
export type RecommendationCategory =
  | "implement"
  | "test_first"
  | "investigate_further"
  | "monitor"
  | "avoid_for_now";

export interface BusinessRecommendation {
  id: string;
  category: RecommendationCategory;
  priorityScore: number; // 0 to 100
  title: string;

  // 9 Required Fields
  finding: string;               // 1. What did the data reveal?
  opportunityOrProblem: string;  // 2. Why does it matter?
  recommendedAction: string;     // 3. What should management do?
  expectedOutcome: string;       // 4. What might improve?
  evidence: string;              // 5. Which statistical results support this?
  confidence: "High" | "Moderate" | "Low"; // 6. How strong is the available evidence?
  risk: string;                  // 7. What could go wrong?
  measurementKPI: string;        // 8. Which KPI should be monitored?
  nextExperiment: {              // 9. How can the recommendation be tested?
    title: string;
    design: string;
    sampleSizeOrDuration: string;
    successMetric: string;
  };

  // Prioritization Factors (1-5 scale)
  factors: {
    evidenceStrength: number;
    potentialImpact: number;
    feasibility: number;
    cost: number;
    operationalRisk: number;
    timeToValue: number;
  };
}

export interface RecommendationPriorityWeights {
  evidenceStrength: number;
  potentialImpact: number;
  feasibility: number;
  cost: number;
  operationalRisk: number;
  timeToValue: number;
}

// --- Experience G: OPTIMISE Experience Types ---
export interface ControllableVariable {
  name: string;
  label: string;
  currentValue: number;
  minAllowed: number;
  maxAllowed: number;
  step: number;
  unit: string;
}

export interface OptimisationConstraint {
  id: string;
  name: string;
  type: "budget_total" | "min_allocation" | "max_allocation" | "custom";
  description: string;
  limitValue: number;
  isBinding: boolean;
}

export interface OptimisationScenario {
  allocation: Record<string, number>;
  expectedOutcome: number;
  outcomeConfidenceInterval: [number, number];
  isFeasible: boolean;
  bindingConstraints: string[];
}

export interface OptimisationResult {
  objective: string;
  targetOutcomeVariable: string;
  controllableVariables: ControllableVariable[];
  currentAllocation: Record<string, number>;
  currentOutcome: number;
  optimalAllocation: Record<string, number>;
  optimalOutcome: number;
  outcomeLift: number;
  outcomeLiftPercent: number;
  bindingConstraints: OptimisationConstraint[];
  modelSummary: {
    modelType: "Multiple Linear Regression (OLS)" | "Diminishing Returns Log-Linear" | "Polynomial Response";
    formula: string;
    rSquared: number;
    fStatistic: number;
    pValue: number;
    vifDiagnostics?: Record<string, number>;
  };
  sensitivity: {
    parameter: string;
    change: string;
    estimatedOutcomeImpact: number;
  }[];
  uncertaintyMargin: number;
  extrapolationWarnings: string[];
  observationalCaveat: string;
}


