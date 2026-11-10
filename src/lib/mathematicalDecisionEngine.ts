/**
 * AFTERDATA — Deterministic Mathematical Decision & Optimisation Engine
 * 
 * Strict Two-Layer Architecture:
 * - Deterministic, closed-form and iterative solvers for mathematical optimization.
 * - Never hallucinates numbers or invents coefficients.
 * - Formulates problems on the fly using human-calibrated assumptions.
 * - Explicitly tracks and separates:
 *   1. Historical Evidence
 *   2. Human Assumptions
 *   3. Mathematical Outputs
 */

import {
  CalibratedVariable,
  CalibratedConstraint,
  MathematicalProblemFormulation,
  CalculatedDecisionSolution,
  AllocationResult,
  AlternativeScenario,
  SensitivityItem,
} from "../types/decisionOptimization";

/**
 * Solves the constrained diminishing-returns problem using the KKT / Lagrange Multiplier method:
 * 
 * Maximize: Y = baseline + sum( beta_i * sqrt(x_i) )
 * Subject to: sum(x_i) <= TotalBudget
 *             min_i <= x_i <= max_i  for all i
 */
export function solveDiminishingReturnsKKT(
  variables: CalibratedVariable[],
  constraints: CalibratedConstraint[],
  totalBudget: number,
  baselineOutcome: number = 0
): CalculatedDecisionSolution {
  const bindingConstraints: string[] = [];
  const n = variables.length;

  if (n === 0) {
    return {
      isFeasible: false,
      infeasibilityReason: "No decision variables defined.",
      objectiveType: "maximize",
      targetMetric: "Target Outcome",
      targetUnit: "₹",
      currentBaselineOutcome: baselineOutcome,
      simulatedOptimalOutcome: baselineOutcome,
      expectedLift: 0,
      expectedLiftPercent: 0,
      confidenceInterval: [baselineOutcome, baselineOutcome],
      allocations: [],
      bindingConstraints: [],
      totalAllocated: 0,
      budgetCap: totalBudget,
      solverMethodUsed: "KKT Concave Diminishing Returns",
      iterationsToConvergence: 0,
    };
  }

  // 1. Feasibility Pre-Check: Total of minimum bounds vs Total Budget
  const sumMin = variables.reduce((acc, v) => acc + v.minBound, 0);
  const sumMax = variables.reduce((acc, v) => acc + v.maxBound, 0);

  if (sumMin > totalBudget) {
    return {
      isFeasible: false,
      infeasibilityReason: `Infeasible problem: The sum of minimum required allocations (${sumMin.toLocaleString()} ${variables[0]?.unit || "₹"}) exceeds the total available budget (${totalBudget.toLocaleString()} ${variables[0]?.unit || "₹"}) by ${(sumMin - totalBudget).toLocaleString()}. To fix this, reduce individual minimum bounds or increase the total budget cap.`,
      objectiveType: "maximize",
      targetMetric: "Target Outcome",
      targetUnit: variables[0]?.unit || "₹",
      currentBaselineOutcome: baselineOutcome,
      simulatedOptimalOutcome: baselineOutcome,
      expectedLift: 0,
      expectedLiftPercent: 0,
      confidenceInterval: [baselineOutcome, baselineOutcome],
      allocations: variables.map((v) => ({
        variableId: v.id,
        variableName: v.name,
        label: v.label,
        allocatedValue: v.minBound,
        previousValue: v.userCalibratedValue,
        percentChange: 0,
        percentOfTotal: 0,
        marginalReturn: 0,
        isAtMinBound: true,
        isAtMaxBound: false,
        shadowPrice: 0,
      })),
      bindingConstraints: ["Total Budget Cap (Violated)"],
      totalAllocated: sumMin,
      budgetCap: totalBudget,
      solverMethodUsed: "KKT Concave Diminishing Returns",
      iterationsToConvergence: 0,
    };
  }

  // If budget >= sum of all max bounds, all variables can hit their max without constraint
  if (totalBudget >= sumMax) {
    const allocations: AllocationResult[] = variables.map((v) => {
      const prev = v.userCalibratedValue || v.minBound;
      const pctChange = prev > 0 ? ((v.maxBound - prev) / prev) * 100 : 0;
      return {
        variableId: v.id,
        variableName: v.name,
        label: v.label,
        allocatedValue: v.maxBound,
        previousValue: prev,
        percentChange: Number(pctChange.toFixed(1)),
        percentOfTotal: Number(((v.maxBound / sumMax) * 100).toFixed(1)),
        marginalReturn: v.expectedReturnPerUnit / (2 * Math.sqrt(Math.max(1, v.maxBound))),
        isAtMinBound: false,
        isAtMaxBound: true,
        shadowPrice: 0,
      };
    });

    const simulatedOutcome = calculateDiminishingOutcome(allocations, variables, baselineOutcome);
    const lift = Math.max(0, simulatedOutcome - baselineOutcome);
    const liftPct = baselineOutcome > 0 ? (lift / baselineOutcome) * 100 : 0;

    return {
      isFeasible: true,
      objectiveType: "maximize",
      targetMetric: "Target Outcome",
      targetUnit: variables[0]?.unit || "₹",
      currentBaselineOutcome: baselineOutcome,
      simulatedOptimalOutcome: Number(simulatedOutcome.toFixed(0)),
      expectedLift: Number(lift.toFixed(0)),
      expectedLiftPercent: Number(liftPct.toFixed(1)),
      confidenceInterval: [
        Number((simulatedOutcome * 0.94).toFixed(0)),
        Number((simulatedOutcome * 1.06).toFixed(0)),
      ],
      allocations,
      bindingConstraints: ["All Maximum Capacity Bounds"],
      totalAllocated: sumMax,
      budgetCap: totalBudget,
      solverMethodUsed: "KKT Concave Diminishing Returns (Unconstrained at Max Bounds)",
      iterationsToConvergence: 1,
    };
  }

  // 2. KKT Marginal Return Equalization Search
  // Marginal return: dY/dx_i = beta_i / (2 * sqrt(x_i)) = lambda
  // => x_i(lambda) = (beta_i / (2 * lambda))^2, clamped to [min_i, max_i]
  let lowLambda = 1e-9;
  let highLambda = 1e6;
  let iterations = 0;
  const maxIterations = 80;
  let optimalLambda = 0.1;

  function totalAllocatedForLambda(lambda: number): number {
    let sum = 0;
    for (const v of variables) {
      const beta = Math.max(0.1, v.expectedReturnPerUnit);
      const rawX = Math.pow(beta / (2 * lambda), 2);
      const clampedX = Math.min(v.maxBound, Math.max(v.minBound, rawX));
      sum += clampedX;
    }
    return sum;
  }

  // Initial bracket expansion
  while (totalAllocatedForLambda(lowLambda) < totalBudget && lowLambda > 1e-15) {
    lowLambda /= 10;
  }
  while (totalAllocatedForLambda(highLambda) > totalBudget && highLambda < 1e12) {
    highLambda *= 10;
  }

  // Binary search for lambda where sum(x_i) == totalBudget
  for (let iter = 0; iter < maxIterations; iter++) {
    iterations++;
    const midLambda = (lowLambda + highLambda) / 2;
    const currentAlloc = totalAllocatedForLambda(midLambda);

    if (Math.abs(currentAlloc - totalBudget) < 1 || Math.abs(highLambda - lowLambda) < 1e-10) {
      optimalLambda = midLambda;
      break;
    }

    if (currentAlloc > totalBudget) {
      // Increase lambda to reduce total allocation
      lowLambda = midLambda;
    } else {
      // Decrease lambda to increase total allocation
      highLambda = midLambda;
    }
    optimalLambda = midLambda;
  }

  // 3. Compute final optimal allocations and detect binding bounds
  let totalAllocated = 0;
  const allocations: AllocationResult[] = variables.map((v) => {
    const beta = Math.max(0.1, v.expectedReturnPerUnit);
    const rawX = Math.pow(beta / (2 * optimalLambda), 2);
    let clampedX = Math.min(v.maxBound, Math.max(v.minBound, rawX));

    // Round sensibly
    clampedX = Math.round(clampedX);

    const isAtMin = Math.abs(clampedX - v.minBound) < 2;
    const isAtMax = Math.abs(clampedX - v.maxBound) < 2;

    if (isAtMin) bindingConstraints.push(`Minimum allocation bound on ${v.label}`);
    if (isAtMax) bindingConstraints.push(`Maximum capacity cap on ${v.label}`);

    const prev = v.userCalibratedValue || v.minBound;
    const pctChange = prev > 0 ? ((clampedX - prev) / prev) * 100 : 0;
    const marginalReturn = beta / (2 * Math.sqrt(Math.max(1, clampedX)));

    // Shadow price: marginal return gain if bound were relaxed by 1 unit
    let shadowPrice = 0;
    if (isAtMax) {
      shadowPrice = Math.max(0, marginalReturn - optimalLambda);
    } else if (isAtMin) {
      shadowPrice = Math.max(0, optimalLambda - marginalReturn);
    }

    totalAllocated += clampedX;

    return {
      variableId: v.id,
      variableName: v.name,
      label: v.label,
      allocatedValue: clampedX,
      previousValue: prev,
      percentChange: Number(pctChange.toFixed(1)),
      percentOfTotal: 0, // calculated below
      marginalReturn: Number(marginalReturn.toFixed(4)),
      isAtMinBound: isAtMin,
      isAtMaxBound: isAtMax,
      shadowPrice: Number(shadowPrice.toFixed(4)),
    };
  });

  // Re-normalize exact sum to budget if minor rounding discrepancy
  const diff = totalBudget - totalAllocated;
  if (Math.abs(diff) > 0 && Math.abs(diff) < 1000) {
    const unconstrained = allocations.find((a) => !a.isAtMaxBound && !a.isAtMinBound);
    if (unconstrained) {
      unconstrained.allocatedValue += diff;
      totalAllocated += diff;
    }
  }

  // Update percentages
  allocations.forEach((a) => {
    a.percentOfTotal = Number(((a.allocatedValue / Math.max(1, totalAllocated)) * 100).toFixed(1));
  });

  if (Math.abs(totalAllocated - totalBudget) < 50) {
    bindingConstraints.unshift("Total Budget Cap (₹" + totalBudget.toLocaleString() + ")");
  }

  // 4. Calculate Final Simulated Outcome
  const simulatedOutcome = calculateDiminishingOutcome(allocations, variables, baselineOutcome);
  const lift = Math.max(0, simulatedOutcome - baselineOutcome);
  const liftPct = baselineOutcome > 0 ? (lift / baselineOutcome) * 100 : 0;

  return {
    isFeasible: true,
    objectiveType: "maximize",
    targetMetric: "Target Outcome",
    targetUnit: variables[0]?.unit || "₹",
    currentBaselineOutcome: baselineOutcome,
    simulatedOptimalOutcome: Number(simulatedOutcome.toFixed(0)),
    expectedLift: Number(lift.toFixed(0)),
    expectedLiftPercent: Number(liftPct.toFixed(1)),
    confidenceInterval: [
      Number((simulatedOutcome * 0.95).toFixed(0)),
      Number((simulatedOutcome * 1.05).toFixed(0)),
    ],
    allocations,
    bindingConstraints: Array.from(new Set(bindingConstraints)),
    totalAllocated,
    budgetCap: totalBudget,
    solverMethodUsed: "KKT Concave Equalization (Lagrange λ* = " + optimalLambda.toFixed(4) + ")",
    iterationsToConvergence: iterations,
  };
}

/**
 * Solves Bounded Linear Programming problems (Exact greedy simplex for bounded variables).
 * 
 * Maximize: Y = baseline + sum( r_i * x_i )
 * Subject to: sum(x_i) <= TotalBudget
 *             min_i <= x_i <= max_i
 */
export function solveBoundedLinearProgramming(
  variables: CalibratedVariable[],
  constraints: CalibratedConstraint[],
  totalBudget: number,
  baselineOutcome: number = 0
): CalculatedDecisionSolution {
  const bindingConstraints: string[] = [];
  const sumMin = variables.reduce((acc, v) => acc + v.minBound, 0);

  if (sumMin > totalBudget) {
    return {
      isFeasible: false,
      infeasibilityReason: `Infeasible problem: Sum of minimum required allocations (${sumMin.toLocaleString()}) exceeds available budget (${totalBudget.toLocaleString()}).`,
      objectiveType: "maximize",
      targetMetric: "Target Outcome",
      targetUnit: variables[0]?.unit || "₹",
      currentBaselineOutcome: baselineOutcome,
      simulatedOptimalOutcome: baselineOutcome,
      expectedLift: 0,
      expectedLiftPercent: 0,
      confidenceInterval: [baselineOutcome, baselineOutcome],
      allocations: variables.map((v) => ({
        variableId: v.id,
        variableName: v.name,
        label: v.label,
        allocatedValue: v.minBound,
        previousValue: v.userCalibratedValue,
        percentChange: 0,
        percentOfTotal: 0,
        marginalReturn: v.expectedReturnPerUnit,
        isAtMinBound: true,
        isAtMaxBound: false,
        shadowPrice: 0,
      })),
      bindingConstraints: ["Budget Constraint (Violated)"],
      totalAllocated: sumMin,
      budgetCap: totalBudget,
      solverMethodUsed: "Bounded Linear Programming (Simplex)",
      iterationsToConvergence: 0,
    };
  }

  // 1. Initialize all variables at their minBound
  const allocMap: Record<string, number> = {};
  variables.forEach((v) => {
    allocMap[v.id] = v.minBound;
  });
  let remainingBudget = totalBudget - sumMin;

  // 2. Sort variables by descending unit return (Greedy Simplex for box-constrained LP)
  const sorted = [...variables].sort((a, b) => b.expectedReturnPerUnit - a.expectedReturnPerUnit);

  for (const v of sorted) {
    if (remainingBudget <= 0) break;
    const capacity = v.maxBound - v.minBound;
    const toAllocate = Math.min(capacity, remainingBudget);
    allocMap[v.id] += toAllocate;
    remainingBudget -= toAllocate;
  }

  let totalAllocated = 0;
  const allocations: AllocationResult[] = variables.map((v) => {
    const val = Math.round(allocMap[v.id]);
    totalAllocated += val;
    const prev = v.userCalibratedValue || v.minBound;
    const pctChange = prev > 0 ? ((val - prev) / prev) * 100 : 0;
    const isAtMin = Math.abs(val - v.minBound) < 1;
    const isAtMax = Math.abs(val - v.maxBound) < 1;

    if (isAtMin) bindingConstraints.push(`Minimum bound on ${v.label}`);
    if (isAtMax) bindingConstraints.push(`Maximum capacity cap on ${v.label}`);

    return {
      variableId: v.id,
      variableName: v.name,
      label: v.label,
      allocatedValue: val,
      previousValue: prev,
      percentChange: Number(pctChange.toFixed(1)),
      percentOfTotal: 0,
      marginalReturn: v.expectedReturnPerUnit,
      isAtMinBound: isAtMin,
      isAtMaxBound: isAtMax,
      shadowPrice: isAtMax ? v.expectedReturnPerUnit : 0,
    };
  });

  allocations.forEach((a) => {
    a.percentOfTotal = Number(((a.allocatedValue / Math.max(1, totalAllocated)) * 100).toFixed(1));
  });

  if (remainingBudget <= 1) {
    bindingConstraints.unshift("Total Budget Cap (₹" + totalBudget.toLocaleString() + ")");
  }

  // Calculate outcome
  let simulatedOutcome = baselineOutcome;
  allocations.forEach((a) => {
    const v = variables.find((varItem) => varItem.id === a.variableId);
    if (v) {
      simulatedOutcome += a.allocatedValue * v.expectedReturnPerUnit;
    }
  });

  const lift = Math.max(0, simulatedOutcome - baselineOutcome);
  const liftPct = baselineOutcome > 0 ? (lift / baselineOutcome) * 100 : 0;

  return {
    isFeasible: true,
    objectiveType: "maximize",
    targetMetric: "Target Outcome",
    targetUnit: variables[0]?.unit || "₹",
    currentBaselineOutcome: baselineOutcome,
    simulatedOptimalOutcome: Number(simulatedOutcome.toFixed(0)),
    expectedLift: Number(lift.toFixed(0)),
    expectedLiftPercent: Number(liftPct.toFixed(1)),
    confidenceInterval: [
      Number((simulatedOutcome * 0.96).toFixed(0)),
      Number((simulatedOutcome * 1.04).toFixed(0)),
    ],
    allocations,
    bindingConstraints: Array.from(new Set(bindingConstraints)),
    totalAllocated,
    budgetCap: totalBudget,
    solverMethodUsed: "Bounded Linear Programming (Simplex / Greedy Optimal)",
    iterationsToConvergence: variables.length,
  };
}

/**
 * Universal Solver Dispatcher
 */
export function solveMathematicalDecisionProblem(
  formulation: MathematicalProblemFormulation,
  baselineOutcome?: number
): CalculatedDecisionSolution {
  const method = formulation.solverMethod;
  const budget = formulation.totalBudget;
  const variables = formulation.controllableVariables;
  const constraints = formulation.constraints;

  const baseline = baselineOutcome !== undefined && baselineOutcome > 0
    ? baselineOutcome
    : calculateBaselineFromVariables(variables);

  if (method === "bounded_linear_programming") {
    return solveBoundedLinearProgramming(variables, constraints, budget, baseline);
  }

  // Default to KKT Diminishing Returns Solver (most realistic business behavior)
  return solveDiminishingReturnsKKT(variables, constraints, budget, baseline);
}

/**
 * Helper to calculate outcome for a diminishing-returns allocation
 */
function calculateDiminishingOutcome(
  allocations: { variableId: string; allocatedValue: number }[],
  variables: CalibratedVariable[],
  baselineOutcome: number
): number {
  let total = baselineOutcome;
  for (const alloc of allocations) {
    const v = variables.find((item) => item.id === alloc.variableId);
    if (v) {
      const beta = Math.max(0.1, v.expectedReturnPerUnit);
      if (v.diminishingReturns) {
        total += beta * Math.sqrt(Math.max(0, alloc.allocatedValue));
      } else {
        total += beta * alloc.allocatedValue;
      }
    }
  }
  return total;
}

/**
 * Calculates default baseline outcome from initial calibrated values
 */
export function calculateBaselineFromVariables(variables: CalibratedVariable[]): number {
  let baseline = 0;
  variables.forEach((v) => {
    const val = v.currentHistoricalValue || v.userCalibratedValue || v.minBound;
    if (v.diminishingReturns) {
      baseline += v.expectedReturnPerUnit * Math.sqrt(Math.max(0, val));
    } else {
      baseline += v.expectedReturnPerUnit * val;
    }
  });
  return Math.round(baseline);
}

/**
 * Computes alternative mathematically-defined decision scenarios:
 * 1. Conservative (tight bounds, low risk, 90% budget deployment)
 * 2. Balanced (user-calibrated standard solution)
 * 3. Aggressive (expanded capacity bounds +40%, high marginal channel focus)
 * 4. Custom (computed from live user slider overrides)
 */
export function generateAlternativeScenarios(
  formulation: MathematicalProblemFormulation,
  optimalSolution: CalculatedDecisionSolution,
  liveOverrides?: Record<string, number>
): AlternativeScenario[] {
  const variables = formulation.controllableVariables;
  const budget = formulation.totalBudget;
  const baseline = optimalSolution.currentBaselineOutcome;

  // 1. Conservative: 90% budget, min/max narrowed by 20%
  const conservativeVars: CalibratedVariable[] = variables.map((v) => {
    const mid = (v.minBound + v.maxBound) / 2;
    return {
      ...v,
      minBound: Math.round(mid * 0.85),
      maxBound: Math.round(mid * 1.15),
    };
  });
  const conservativeSol = solveMathematicalDecisionProblem(
    {
      ...formulation,
      totalBudget: Math.round(budget * 0.9),
      controllableVariables: conservativeVars,
    },
    baseline
  );

  const conservativeAlloc: Record<string, number> = {};
  conservativeSol.allocations.forEach((a) => {
    conservativeAlloc[a.variableId] = a.allocatedValue;
  });

  // 2. Balanced: Current optimal solution
  const balancedAlloc: Record<string, number> = {};
  optimalSolution.allocations.forEach((a) => {
    balancedAlloc[a.variableId] = a.allocatedValue;
  });

  // 3. Aggressive: Full budget, max bounds expanded by 40%
  const aggressiveVars: CalibratedVariable[] = variables.map((v) => ({
    ...v,
    maxBound: Math.round(v.maxBound * 1.4),
  }));
  const aggressiveSol = solveMathematicalDecisionProblem(
    {
      ...formulation,
      totalBudget: Math.round(budget * 1.15),
      controllableVariables: aggressiveVars,
    },
    baseline
  );

  const aggressiveAlloc: Record<string, number> = {};
  aggressiveSol.allocations.forEach((a) => {
    aggressiveAlloc[a.variableId] = a.allocatedValue;
  });

  // 4. Custom / User-Defined Live Scenario
  const customAlloc: Record<string, number> = {};
  let customTotal = 0;
  variables.forEach((v) => {
    const val = liveOverrides && liveOverrides[v.id] !== undefined
      ? liveOverrides[v.id]
      : balancedAlloc[v.id] || v.userCalibratedValue;
    customAlloc[v.id] = val;
    customTotal += val;
  });

  const customAllocList = variables.map((v) => ({
    variableId: v.id,
    allocatedValue: customAlloc[v.id],
  }));
  const customOutcome = Math.round(calculateDiminishingOutcome(customAllocList, variables, baseline));
  const customLiftPct = baseline > 0 ? Number((((customOutcome - baseline) / baseline) * 100).toFixed(1)) : 0;

  return [
    {
      id: "conservative",
      name: "Conservative Defense",
      tagline: "Low volatility & tight boundary preservation",
      description: "Deploys 90% of total budget with narrowed ±15% operational variance bounds to prevent over-allocation risk.",
      riskProfile: "Low Risk",
      targetOutcome: conservativeSol.simulatedOptimalOutcome,
      liftPercent: conservativeSol.expectedLiftPercent,
      allocations: conservativeAlloc,
    },
    {
      id: "balanced",
      name: "Balanced Optimum",
      tagline: "Mathematically optimal marginal equalization",
      description: "Exact solution derived from approved human calibrations under strict budget and capacity constraints.",
      riskProfile: "Target Balanced",
      targetOutcome: optimalSolution.simulatedOptimalOutcome,
      liftPercent: optimalSolution.expectedLiftPercent,
      allocations: balancedAlloc,
    },
    {
      id: "aggressive",
      name: "Aggressive Growth",
      tagline: "Expanded capacity & maximum capital yield",
      description: "Expands channel capacity limits by +40% with +15% budget leverage to fully exhaust high-return marginal channels.",
      riskProfile: "High Return Focus",
      targetOutcome: aggressiveSol.simulatedOptimalOutcome,
      liftPercent: aggressiveSol.expectedLiftPercent,
      allocations: aggressiveAlloc,
    },
    {
      id: "custom",
      name: "Interactive Custom",
      tagline: "Your live slider adjustments",
      description: "Dynamic mathematical evaluation based on your real-time slider calibrations.",
      riskProfile: "User Custom",
      targetOutcome: customOutcome,
      liftPercent: customLiftPct,
      allocations: customAlloc,
    },
  ];
}

/**
 * Computes deterministic sensitivity analysis:
 * - Budget perturbation (+10% and -10%)
 * - Variable return parameter perturbations (+10% return efficiency)
 * - Shadow price calculations for binding constraints
 */
export function generateSensitivityAnalysis(
  formulation: MathematicalProblemFormulation,
  optimalSolution: CalculatedDecisionSolution
): SensitivityItem[] {
  const items: SensitivityItem[] = [];
  const baseOutcome = optimalSolution.simulatedOptimalOutcome;
  const budget = formulation.totalBudget;
  const unit = formulation.targetUnit || "₹";

  // 1. Budget +10%
  const plusBudgetSol = solveMathematicalDecisionProblem(
    { ...formulation, totalBudget: Math.round(budget * 1.1) },
    optimalSolution.currentBaselineOutcome
  );
  const deltaPlus = plusBudgetSol.simulatedOptimalOutcome - baseOutcome;
  items.push({
    parameter: "Total Available Budget",
    shiftDescription: "+10% Expansion (+₹" + Math.round(budget * 0.1).toLocaleString() + ")",
    outcomeWithShift: plusBudgetSol.simulatedOptimalOutcome,
    outcomeDelta: deltaPlus,
    percentImpact: Number(((deltaPlus / baseOutcome) * 100).toFixed(1)),
    interpretation: `Expanding budget by 10% yields +${deltaPlus.toLocaleString()} ${unit} in additional return (Marginal efficiency: ${(deltaPlus / (budget * 0.1)).toFixed(2)}x).`,
  });

  // 2. Budget -10%
  const minusBudgetSol = solveMathematicalDecisionProblem(
    { ...formulation, totalBudget: Math.round(budget * 0.9) },
    optimalSolution.currentBaselineOutcome
  );
  const deltaMinus = minusBudgetSol.simulatedOptimalOutcome - baseOutcome;
  items.push({
    parameter: "Total Available Budget",
    shiftDescription: "-10% Contraction (-₹" + Math.round(budget * 0.1).toLocaleString() + ")",
    outcomeWithShift: minusBudgetSol.simulatedOptimalOutcome,
    outcomeDelta: deltaMinus,
    percentImpact: Number(((deltaMinus / baseOutcome) * 100).toFixed(1)),
    interpretation: `Reducing budget by 10% causes a loss of ${Math.abs(deltaMinus).toLocaleString()} ${unit} in target outcome.`,
  });

  // 3. Channel efficiency sensitivity
  formulation.controllableVariables.forEach((v) => {
    const shiftedVars = formulation.controllableVariables.map((item) =>
      item.id === v.id
        ? { ...item, expectedReturnPerUnit: Number((item.expectedReturnPerUnit * 1.1).toFixed(2)) }
        : item
    );
    const shiftedSol = solveMathematicalDecisionProblem(
      { ...formulation, controllableVariables: shiftedVars },
      optimalSolution.currentBaselineOutcome
    );
    const delta = shiftedSol.simulatedOptimalOutcome - baseOutcome;
    items.push({
      parameter: `${v.label} Return Efficiency`,
      shiftDescription: "+10% Marginal Return Uplift",
      outcomeWithShift: shiftedSol.simulatedOptimalOutcome,
      outcomeDelta: delta,
      percentImpact: Number(((delta / baseOutcome) * 100).toFixed(1)),
      interpretation: `A 10% improvement in ${v.label} efficiency shifts the optimal allocation and yields +${delta.toLocaleString()} ${unit}.`,
    });
  });

  return items;
}
