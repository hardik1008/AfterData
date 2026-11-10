"""
AFTERDATA Deterministic Mathematical Decision & Optimisation Module (Module 12)
Solves constrained allocation and decision problems using exact KKT / Lagrange and Simplex methods.
Zero hallucination. Independently testable.
"""
from typing import Dict, Any, List, Optional
import math

def solve_diminishing_returns_kkt(
    variables: List[Dict[str, Any]],
    total_budget: float,
    baseline_outcome: float = 0.0
) -> Dict[str, Any]:
    """
    Maximize: Y = baseline + sum( beta_i * sqrt(x_i) )
    Subject to: sum(x_i) <= total_budget
                min_i <= x_i <= max_i
    """
    if not variables:
        return {
            "is_feasible": False,
            "infeasibility_reason": "No decision variables provided.",
            "allocations": [],
            "simulated_outcome": baseline_outcome,
            "expected_lift": 0.0
        }

    sum_min = sum(float(v.get("min_bound", 0.0)) for v in variables)
    sum_max = sum(float(v.get("max_bound", 0.0)) for v in variables)

    # Infeasibility Check
    if sum_min > total_budget:
        return {
            "is_feasible": False,
            "infeasibility_reason": f"Sum of minimum required allocations ({sum_min:,.0f}) exceeds total budget ({total_budget:,.0f}).",
            "allocations": [{
                "id": v.get("id", ""),
                "name": v.get("name", ""),
                "allocated": float(v.get("min_bound", 0.0))
            } for v in variables],
            "simulated_outcome": baseline_outcome,
            "expected_lift": 0.0
        }

    # If budget >= sum of all max bounds, all variables can hit their max
    if total_budget >= sum_max:
        allocations = []
        simulated = baseline_outcome
        for v in variables:
            max_b = float(v.get("max_bound", 0.0))
            beta = float(v.get("expected_return", 1.0))
            simulated += beta * math.sqrt(max(0.0, max_b))
            allocations.append({
                "id": v.get("id", ""),
                "name": v.get("name", ""),
                "allocated": max_b,
                "is_at_max": True,
                "is_at_min": False,
                "marginal_return": beta / (2.0 * math.sqrt(max(1.0, max_b)))
            })
        return {
            "is_feasible": True,
            "simulated_outcome": round(simulated, 2),
            "expected_lift": round(max(0.0, simulated - baseline_outcome), 2),
            "total_allocated": sum_max,
            "binding_constraints": ["All Maximum Capacity Bounds"],
            "allocations": allocations,
            "iterations": 1
        }

    # Binary search for Lagrange multiplier lambda
    # Marginal return: beta_i / (2 * sqrt(x_i)) = lambda => x_i = (beta_i / (2 * lambda))^2
    low_lambda = 1e-9
    high_lambda = 1e6
    optimal_lambda = 0.1
    iterations = 0

    def total_alloc_for_lambda(lmb: float) -> float:
        total = 0.0
        for v in variables:
            beta = max(0.01, float(v.get("expected_return", 1.0)))
            raw_x = (beta / (2.0 * lmb)) ** 2
            min_b = float(v.get("min_bound", 0.0))
            max_b = float(v.get("max_bound", 0.0))
            clamped = min(max_b, max(min_b, raw_x))
            total += clamped
        return total

    # Expand brackets
    while total_alloc_for_lambda(low_lambda) < total_budget and low_lambda > 1e-15:
        low_lambda /= 10.0
    while total_alloc_for_lambda(high_lambda) > total_budget and high_lambda < 1e12:
        high_lambda *= 10.0

    for _ in range(80):
        iterations += 1
        mid_lambda = (low_lambda + high_lambda) / 2.0
        curr_alloc = total_alloc_for_lambda(mid_lambda)
        if abs(curr_alloc - total_budget) < 0.1 or abs(high_lambda - low_lambda) < 1e-10:
            optimal_lambda = mid_lambda
            break
        if curr_alloc > total_budget:
            low_lambda = mid_lambda
        else:
            high_lambda = mid_lambda
        optimal_lambda = mid_lambda

    # Final allocations
    allocations = []
    total_alloc = 0.0
    simulated = baseline_outcome
    binding = []

    for v in variables:
        beta = max(0.01, float(v.get("expected_return", 1.0)))
        raw_x = (beta / (2.0 * optimal_lambda)) ** 2
        min_b = float(v.get("min_bound", 0.0))
        max_b = float(v.get("max_bound", 0.0))
        clamped = round(min(max_b, max(min_b, raw_x)))

        is_min = abs(clamped - min_b) < 1
        is_max = abs(clamped - max_b) < 1
        if is_min:
            binding.append(f"Min bound on {v.get('name')}")
        if is_max:
            binding.append(f"Max bound on {v.get('name')}")

        total_alloc += clamped
        simulated += beta * math.sqrt(max(0.0, clamped))
        allocations.append({
            "id": v.get("id", ""),
            "name": v.get("name", ""),
            "allocated": clamped,
            "is_at_min": is_min,
            "is_at_max": is_max,
            "marginal_return": beta / (2.0 * math.sqrt(max(1.0, clamped)))
        })

    if abs(total_alloc - total_budget) < 100:
        binding.insert(0, f"Total Budget Cap ({total_budget:,.0f})")

    return {
        "is_feasible": True,
        "simulated_outcome": round(simulated, 2),
        "expected_lift": round(max(0.0, simulated - baseline_outcome), 2),
        "total_allocated": total_alloc,
        "binding_constraints": binding,
        "allocations": allocations,
        "optimal_lambda": optimal_lambda,
        "iterations": iterations
    }

def solve_bounded_lp(
    variables: List[Dict[str, Any]],
    total_budget: float,
    baseline_outcome: float = 0.0
) -> Dict[str, Any]:
    """
    Maximize: Y = baseline + sum( r_i * x_i )
    Subject to: sum(x_i) <= total_budget
                min_i <= x_i <= max_i
    Exact greedy simplex solution for box-constrained linear program.
    """
    sum_min = sum(float(v.get("min_bound", 0.0)) for v in variables)
    if sum_min > total_budget:
        return {
            "is_feasible": False,
            "infeasibility_reason": f"Sum of min bounds ({sum_min:,.0f}) exceeds budget ({total_budget:,.0f}).",
            "allocations": [],
            "simulated_outcome": baseline_outcome
        }

    # Initialize at min bounds
    alloc_map = {v.get("id"): float(v.get("min_bound", 0.0)) for v in variables}
    remaining = total_budget - sum_min

    # Sort descending by unit return
    sorted_vars = sorted(variables, key=lambda v: float(v.get("expected_return", 0.0)), reverse=True)

    for v in sorted_vars:
        if remaining <= 0:
            break
        cap = float(v.get("max_bound", 0.0)) - float(v.get("min_bound", 0.0))
        to_alloc = min(cap, remaining)
        alloc_map[v.get("id")] += to_alloc
        remaining -= to_alloc

    simulated = baseline_outcome
    allocations = []
    total_alloc = 0.0
    binding = []

    for v in variables:
        val = round(alloc_map[v.get("id")])
        total_alloc += val
        beta = float(v.get("expected_return", 0.0))
        simulated += val * beta
        is_min = abs(val - float(v.get("min_bound", 0.0))) < 1
        is_max = abs(val - float(v.get("max_bound", 0.0))) < 1
        if is_min:
            binding.append(f"Min bound on {v.get('name')}")
        if is_max:
            binding.append(f"Max bound on {v.get('name')}")
        allocations.append({
            "id": v.get("id"),
            "name": v.get("name"),
            "allocated": val,
            "is_at_min": is_min,
            "is_at_max": is_max,
            "unit_return": beta
        })

    if remaining <= 1:
        binding.insert(0, f"Total Budget Cap ({total_budget:,.0f})")

    return {
        "is_feasible": True,
        "simulated_outcome": round(simulated, 2),
        "expected_lift": round(max(0.0, simulated - baseline_outcome), 2),
        "total_allocated": total_alloc,
        "binding_constraints": binding,
        "allocations": allocations
    }
