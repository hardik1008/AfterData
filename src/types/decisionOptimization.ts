/**
 * AFTERDATA — Human-Calibrated Mathematical Decision Engine Types
 * 
 * Strict separation of:
 * 1. Historical Evidence (observed facts from uploaded data)
 * 2. Human Assumptions (calibrated, estimated, or approved by the user)
 * 3. Mathematical Outputs (computed on the fly by deterministic solvers)
 */

export type InputSourceTag =
  | "derived_from_data"
  | "supplied_by_user"
  | "estimated_by_user"
  | "suggested_by_engine"
  | "assumed_for_scenario";

export type BusinessGoalCategory =
  | "revenue_growth"
  | "profit_costs"
  | "marketing_allocation"
  | "operations_resources"
  | "pricing_commercial"
  | "risk_constraints"
  | "custom_problem";

export type MathematicalSolverMethod =
  | "kkt_diminishing_returns"
  | "bounded_linear_programming"
  | "multi_objective_pareto"
  | "resource_knapsack";

export interface CalibratedVariable {
  id: string;
  name: string;
  label: string;
  source: InputSourceTag;
  unit: string; // e.g. "₹", "%", "hours", "units"
  currentHistoricalValue?: number;
  userCalibratedValue: number;
  minBound: number;
  maxBound: number;
  expectedReturnPerUnit: number; // Marginal revenue or utility per unit
  diminishingReturns: boolean; // concave sqrt curvature vs linear
  notes: string;
}

export interface CalibratedConstraint {
  id: string;
  name: string;
  type: "budget_total" | "min_allocation" | "max_allocation" | "capacity_limit" | "risk_ceiling";
  limitValue: number;
  unit: string;
  source: InputSourceTag;
  isHardConstraint: boolean;
  isBinding?: boolean;
  description: string;
}

export interface DecisionCapability {
  id: string;
  category: BusinessGoalCategory;
  categoryTitle: string;
  title: string;
  problemSolved: string;
  controllableVariables: string[];
  requiredInformation: string[];
  mathematicalApproach: string;
  solverMethod: MathematicalSolverMethod;
  outputDescription: string;
  dataSuitability: "ready_with_data" | "needs_human_calibration" | "user_defined_only";
  defaultTemplate: {
    objectiveType: "maximize" | "minimize";
    targetMetric: string;
    targetUnit: string;
    budgetTotal: number;
    variables: Omit<CalibratedVariable, "id">[];
    constraints: Omit<CalibratedConstraint, "id">[];
  };
}

export interface MathematicalProblemFormulation {
  objectiveType: "maximize" | "minimize";
  targetMetric: string;
  targetUnit: string;
  formulaLatex: string;
  formulaDisplay: string;
  solverMethod: MathematicalSolverMethod;
  totalBudget: number;
  budgetUnit: string;
  controllableVariables: CalibratedVariable[];
  constraints: CalibratedConstraint[];
  assumptionsApprovedByHuman: boolean;
  provenance: {
    historicalEvidence: string[];
    humanAssumptions: string[];
    mathematicalOutputs: string[];
  };
}

export interface AllocationResult {
  variableId: string;
  variableName: string;
  label: string;
  allocatedValue: number;
  previousValue: number;
  percentChange: number;
  percentOfTotal: number;
  marginalReturn: number;
  isAtMinBound: boolean;
  isAtMaxBound: boolean;
  shadowPrice: number; // Marginal value of relaxing bound by 1 unit
}

export interface CalculatedDecisionSolution {
  isFeasible: boolean;
  infeasibilityReason?: string;
  objectiveType: "maximize" | "minimize";
  targetMetric: string;
  targetUnit: string;
  currentBaselineOutcome: number;
  simulatedOptimalOutcome: number;
  expectedLift: number;
  expectedLiftPercent: number;
  confidenceInterval: [number, number];
  allocations: AllocationResult[];
  bindingConstraints: string[];
  totalAllocated: number;
  budgetCap: number;
  solverMethodUsed: string;
  iterationsToConvergence: number;
}

export interface AlternativeScenario {
  id: "conservative" | "balanced" | "aggressive" | "custom";
  name: string;
  tagline: string;
  description: string;
  riskProfile: "Low Risk" | "Target Balanced" | "High Return Focus" | "User Custom";
  targetOutcome: number;
  liftPercent: number;
  allocations: Record<string, number>;
}

export interface SensitivityItem {
  parameter: string;
  shiftDescription: string;
  outcomeWithShift: number;
  outcomeDelta: number;
  percentImpact: number;
  interpretation: string;
}

export interface DecisionEngineWorkspaceState {
  step: "objective_input" | "human_calibration" | "solved_workspace";
  userObjectiveText: string;
  selectedCapabilityId: string;
  formulation: MathematicalProblemFormulation;
  solution: CalculatedDecisionSolution | null;
  activeScenarioId: "conservative" | "balanced" | "aggressive" | "custom";
  alternativeScenarios: AlternativeScenario[];
  sensitivityAnalysis: SensitivityItem[];
  liveOverrides: Record<string, number>; // Live slider adjustments for real-time calculation
}
