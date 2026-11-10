"""
Module 5: Confidence Intervals for Proportions and Sample Size
Implements Wilson Score interval, Wald approximation, Clopper-Pearson exact binomial
intervals, and sample size planning for specified confidence and margins of error.
"""

import math
from typing import Dict, Any, Optional
from .math_utils import normal_ppf, betainc


def compute_proportion_confidence_interval(
    successes: int,
    total_trials: int,
    confidence_level: float = 0.95,
    method: str = "wilson"  # "wilson" | "wald" | "clopper_pearson" | "all"
) -> Dict[str, Any]:
    """
    Computes confidence intervals for binomial proportions.
    """
    if total_trials <= 0:
        raise ValueError("Total trials n must be positive.")
    if successes < 0 or successes > total_trials:
        raise ValueError(f"Successes ({successes}) must be between 0 and total trials ({total_trials}).")
    if not (0.0 < confidence_level < 1.0):
        raise ValueError("Confidence level must be in (0, 1).")

    n = total_trials
    k = successes
    p_hat = k / n
    alpha = 1.0 - confidence_level
    z = normal_ppf(1.0 - alpha / 2.0)

    result: Dict[str, Any] = {
        "status": "success",
        "successes": k,
        "total_trials": n,
        "sample_proportion": round(p_hat, 6),
        "confidence_level": confidence_level,
        "alpha": round(alpha, 6),
        "z_critical": round(z, 6),
    }

    # 1. Wilson Score Interval (Recommended across small and large samples)
    denom = 1.0 + (z * z) / n
    center = (p_hat + (z * z) / (2.0 * n)) / denom
    margin = (z / denom) * math.sqrt((p_hat * (1.0 - p_hat) / n) + (z * z) / (4.0 * n * n))
    wilson_lower = max(0.0, center - margin)
    wilson_upper = min(1.0, center + margin)

    result["wilson_interval"] = {
        "method": "Wilson Score Interval",
        "ci_lower": round(wilson_lower, 6),
        "ci_upper": round(wilson_upper, 6),
        "margin_of_error": round((wilson_upper - wilson_lower) / 2.0, 6),
        "formatted": f"[{round(wilson_lower, 4)}, {round(wilson_upper, 4)}]",
    }

    # 2. Wald Normal Approximation Interval
    wald_se = math.sqrt(p_hat * (1.0 - p_hat) / n)
    wald_moe = z * wald_se
    wald_lower = max(0.0, p_hat - wald_moe)
    wald_upper = min(1.0, p_hat + wald_moe)

    # Rule of thumb: n*p >= 5 and n*(1-p) >= 5
    wald_defensible = (n * p_hat >= 5.0) and (n * (1.0 - p_hat) >= 5.0)

    result["wald_interval"] = {
        "method": "Wald Normal Approximation",
        "standard_error": round(wald_se, 6),
        "margin_of_error": round(wald_moe, 6),
        "ci_lower": round(wald_lower, 6),
        "ci_upper": round(wald_upper, 6),
        "is_defensible": wald_defensible,
        "formatted": f"[{round(wald_lower, 4)}, {round(wald_upper, 4)}]",
        "warning": None if wald_defensible else "n*p or n*(1-p) < 5; Wald approximation has poor coverage.",
    }

    # 3. Clopper-Pearson Exact Binomial Interval (Beta distribution inversion)
    # Lower: B(alpha/2; k, n - k + 1)
    # Upper: B(1 - alpha/2; k + 1, n - k)
    if k == 0:
        cp_lower = 0.0
    else:
        # Solve for p such that betainc(k, n - k + 1, p) = alpha / 2
        # Use bisection root finding
        low_p, high_p = 0.0, p_hat
        for _ in range(50):
            mid_p = (low_p + high_p) / 2.0
            if betainc(k, n - k + 1, mid_p) < (alpha / 2.0):
                low_p = mid_p
            else:
                high_p = mid_p
        cp_lower = (low_p + high_p) / 2.0

    if k == n:
        cp_upper = 1.0
    else:
        low_p, high_p = p_hat, 1.0
        for _ in range(50):
            mid_p = (low_p + high_p) / 2.0
            if betainc(k + 1, n - k, mid_p) < (1.0 - alpha / 2.0):
                low_p = mid_p
            else:
                high_p = mid_p
        cp_upper = (low_p + high_p) / 2.0

    result["clopper_pearson_exact"] = {
        "method": "Clopper-Pearson (Exact Binomial)",
        "ci_lower": round(cp_lower, 6),
        "ci_upper": round(cp_upper, 6),
        "formatted": f"[{round(cp_lower, 4)}, {round(cp_upper, 4)}]",
    }

    return result


def compute_sample_size_for_proportion(
    margin_of_error: float,
    confidence_level: float = 0.95,
    estimated_proportion: Optional[float] = None,
    population_size: Optional[int] = None
) -> Dict[str, Any]:
    """
    Calculates the minimum required sample size n to achieve a desired margin of error E
    at a specified confidence level.
    Formula: n_0 = (z^2 * p * (1 - p)) / E^2
    """
    if margin_of_error <= 0.0 or margin_of_error >= 1.0:
        raise ValueError("Margin of error E must be in (0, 1).")
    if not (0.0 < confidence_level < 1.0):
        raise ValueError("Confidence level must be in (0, 1).")

    p = estimated_proportion if estimated_proportion is not None else 0.5  # 0.5 is conservative worst-case
    if not (0.0 < p < 1.0):
        raise ValueError("Estimated proportion p must be strictly in (0, 1).")

    alpha = 1.0 - confidence_level
    z = normal_ppf(1.0 - alpha / 2.0)

    n_unbounded = (z * z * p * (1.0 - p)) / (margin_of_error * margin_of_error)
    required_n = math.ceil(n_unbounded)

    # Finite population correction adjustment if N is provided
    adjusted_n = required_n
    has_fpc = False
    if population_size is not None and population_size > 0:
        # n_adj = (N * n_0) / (n_0 + N - 1)
        adjusted_n = math.ceil((population_size * n_unbounded) / (n_unbounded + population_size - 1))
        has_fpc = True

    return {
        "margin_of_error": margin_of_error,
        "confidence_level": confidence_level,
        "assumed_proportion": p,
        "is_conservative_max_variance": estimated_proportion is None,
        "critical_z": round(z, 6),
        "required_sample_size": adjusted_n,
        "unadjusted_sample_size": required_n,
        "finite_population_size": population_size,
        "fpc_applied": has_fpc,
    }
