"""
Module 2: Probability and Normal Distribution
Implements Z-scores, normal PDF/CDF, threshold probabilities, empirical comparison,
and explicit checks for whether a normal model is statistically defensible.
"""

import math
from typing import List, Dict, Any, Optional
from .math_utils import normal_cdf, normal_pdf, normal_ppf


def compute_z_scores(values: List[float], mu: Optional[float] = None, sigma: Optional[float] = None) -> List[float]:
    """Computes standardized z-scores for an array of numeric values."""
    if not values:
        return []
    if mu is None:
        mu = sum(values) / len(values)
    if sigma is None:
        if len(values) <= 1:
            raise ValueError("Standard deviation requires at least 2 observations.")
        var = sum((x - mu) ** 2 for x in values) / (len(values) - 1)
        sigma = math.sqrt(var)

    if sigma <= 0:
        return [0.0 for _ in values]
    return [(x - mu) / sigma for x in values]


def evaluate_normal_probabilities(
    mu: float,
    sigma: float,
    lower_threshold: Optional[float] = None,
    upper_threshold: Optional[float] = None,
    point_value: Optional[float] = None,
    sample_data: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Evaluates theoretical and empirical probabilities under a normal distribution model,
    including cumulative, above, below, and interval bounds, with normality defensibility checks.
    """
    if sigma <= 0:
        raise ValueError("Standard deviation sigma must be strictly positive.")

    result: Dict[str, Any] = {
        "status": "success",
        "parameters": {"mu": mu, "sigma": sigma},
    }

    # Point evaluation
    if point_value is not None:
        z_point = (point_value - mu) / sigma
        p_below = normal_cdf(point_value, mu, sigma)
        p_above = 1.0 - p_below
        pdf_density = normal_pdf(point_value, mu, sigma)
        result["point_evaluation"] = {
            "x": point_value,
            "z_score": round(z_point, 6),
            "density_pdf": round(pdf_density, 8),
            "prob_below_x": round(p_below, 6),
            "prob_above_x": round(p_above, 6),
            "percentile": round(p_below * 100.0, 4),
        }

    # Interval evaluation
    if lower_threshold is not None or upper_threshold is not None:
        lower = lower_threshold if lower_threshold is not None else -float("inf")
        upper = upper_threshold if upper_threshold is not None else float("inf")

        if lower > upper:
            raise ValueError(f"lower_threshold ({lower}) cannot exceed upper_threshold ({upper}).")

        cdf_low = normal_cdf(lower, mu, sigma) if lower != -float("inf") else 0.0
        cdf_high = normal_cdf(upper, mu, sigma) if upper != float("inf") else 1.0

        p_between = max(0.0, cdf_high - cdf_low)

        result["interval_probability"] = {
            "lower_threshold": lower if lower != -float("inf") else None,
            "upper_threshold": upper if upper != float("inf") else None,
            "prob_between": round(p_between, 6),
            "percentage_between": round(p_between * 100.0, 4),
        }

    # Empirical validation & Normality Defensibility Check
    if sample_data and len(sample_data) >= 5:
        n = len(sample_data)
        emp_mean = sum(sample_data) / n
        emp_var = sum((x - emp_mean) ** 2 for x in sample_data) / (n - 1)
        emp_std = math.sqrt(emp_var) if emp_var > 0 else 1.0

        # Empirical 68-95-99.7 check
        within_1sd = sum(1 for x in sample_data if abs(x - emp_mean) <= 1.0 * emp_std) / n
        within_2sd = sum(1 for x in sample_data if abs(x - emp_mean) <= 2.0 * emp_std) / n
        within_3sd = sum(1 for x in sample_data if abs(x - emp_mean) <= 3.0 * emp_std) / n

        # Skewness
        m3 = sum((x - emp_mean) ** 3 for x in sample_data) / n
        skew = (m3 / (emp_std ** 3)) if emp_std > 0 else 0.0

        # Defensibility criteria
        # Moderate skewness < 1.0, and 2-sd coverage >= 85% (no heavy excess tails)
        is_defensible = abs(skew) < 1.0 and (within_2sd >= 0.85)

        reasons = []
        if abs(skew) >= 1.0:
            reasons.append(f"Data exhibits substantial skewness (skew = {round(skew, 2)}), violating symmetry.")
        if within_2sd < 0.85:
            reasons.append(f"Empirical 2-SD coverage ({round(within_2sd * 100, 1)}%) is below 85%, indicating heavy tails.")

        result["normality_audit"] = {
            "sample_size": n,
            "empirical_mean": round(emp_mean, 6),
            "empirical_std": round(emp_std, 6),
            "empirical_skewness": round(skew, 4),
            "empirical_rule_coverage": {
                "within_1sd": round(within_1sd, 4),  # Expect ~0.6827
                "within_2sd": round(within_2sd, 4),  # Expect ~0.9545
                "within_3sd": round(within_3sd, 4),  # Expect ~0.9973
            },
            "is_normality_defensible": is_defensible,
            "warnings": reasons if not is_defensible else ["Normal distribution assumption is empirically defensible."],
        }

    return result
