"""
Module 7: P-values, Type I/II Errors and Power Analysis
Computes statistical power, sample size planning for specified effect sizes,
and explicitly analyzes practical effect importance vs raw statistical significance.
"""

import math
from typing import Dict, Any, Optional
from .math_utils import normal_ppf, normal_cdf


def compute_statistical_power_two_sample(
    effect_size_d: float,
    sample_size_per_group: int,
    alpha: float = 0.05,
    alternative: str = "two-sided"
) -> Dict[str, Any]:
    """
    Computes statistical power (1 - Beta) for a two-sample independent t-test given Cohen's d.
    """
    if sample_size_per_group <= 1:
        raise ValueError("Sample size per group n must be >= 2.")
    if not (0.0 < alpha < 1.0):
        raise ValueError("Significance level alpha must be in (0, 1).")

    n = sample_size_per_group
    d = abs(effect_size_d)

    # Critical z or t for alpha
    z_crit = normal_ppf(1.0 - alpha / 2.0) if alternative == "two-sided" else normal_ppf(1.0 - alpha)

    # Non-centrality parameter delta = d * sqrt(n / 2)
    delta = d * math.sqrt(n / 2.0)

    # Power approx = 1 - Phi(z_crit - delta)
    power = 1.0 - normal_cdf(z_crit - delta)
    if alternative == "two-sided":
        power += normal_cdf(-z_crit - delta)

    beta = 1.0 - power

    # Practical vs statistical significance audit
    effect_magnitude = "Negligible"
    if d >= 0.8:
        effect_magnitude = "Large (Substantial practical difference)"
    elif d >= 0.5:
        effect_magnitude = "Medium (Noticeable practical difference)"
    elif d >= 0.2:
        effect_magnitude = "Small (Subtle practical difference)"

    return {
        "cohens_d": round(effect_size_d, 4),
        "effect_magnitude": effect_magnitude,
        "sample_size_per_group": n,
        "total_sample_size": n * 2,
        "alpha_significance_level": alpha,
        "type_i_error_rate": alpha,
        "type_ii_error_rate_beta": round(beta, 4),
        "statistical_power": round(power, 4),
        "power_percentage": round(power * 100.0, 2),
        "is_power_adequate": power >= 0.80,  # Standard 80% benchmark
        "business_importance_verdict": (
            f"An effect size of d={round(effect_size_d, 2)} represents a {effect_magnitude.lower()}. "
            f"With power={round(power*100, 1)}%, this test has a {round((1-power)*100, 1)}% risk of missing a real effect (Type II error)."
        ),
    }


def compute_sample_size_for_power(
    target_effect_size_d: float,
    target_power: float = 0.80,
    alpha: float = 0.05,
    alternative: str = "two-sided"
) -> Dict[str, Any]:
    """
    Computes required sample size per group to detect a specified Cohen's d at desired power.
    Formula: n = 2 * ((z_alpha + z_beta) / d)^2
    """
    if target_effect_size_d <= 0:
        raise ValueError("Target effect size Cohen's d must be strictly positive.")
    if not (0.50 < target_power < 1.0):
        raise ValueError("Target power must be in (0.50, 1.0).")
    if not (0.0 < alpha < 1.0):
        raise ValueError("Alpha must be in (0, 1).")

    z_alpha = normal_ppf(1.0 - alpha / 2.0) if alternative == "two-sided" else normal_ppf(1.0 - alpha)
    z_beta = normal_ppf(target_power)

    n_exact = 2.0 * ((z_alpha + z_beta) / target_effect_size_d) ** 2
    n_required = math.ceil(n_exact)

    return {
        "target_effect_size_d": target_effect_size_d,
        "target_power": target_power,
        "alpha": alpha,
        "required_sample_size_per_group": n_required,
        "required_total_sample_size": n_required * 2,
        "formula_reference": "n = 2 * ((z_(1-a/2) + z_(1-b)) / d)^2",
    }
