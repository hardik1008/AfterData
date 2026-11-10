"""
Module 4: Confidence Intervals for Means
Implements Student-t parametric intervals, normal z-intervals, and non-parametric
percentile bootstrap confidence intervals with configurable confidence levels.
"""

import math
import random
from typing import List, Dict, Any, Optional
from .math_utils import t_ppf, normal_ppf


def compute_mean_confidence_interval(
    data: List[float],
    confidence_level: float = 0.95,
    method: str = "t_distribution",  # "t_distribution" | "bootstrap" | "both"
    bootstrap_replications: int = 2000,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Computes confidence interval for population mean with exact critical values.

    Parameters:
        data: List of numeric observations.
        confidence_level: Desired coverage probability in (0, 1) (default: 0.95).
        method: Interval estimation method.
        bootstrap_replications: Number of resamples if method is bootstrap or both.
        seed: Seed for reproducible bootstrap.
    """
    if not (0.0 < confidence_level < 1.0):
        raise ValueError("Confidence level must be strictly between 0 and 1.")

    clean_data = [float(x) for x in data if x is not None and not (isinstance(x, float) and (math.isnan(x) or math.isinf(x)))]
    n = len(clean_data)

    if n < 2:
        return {
            "status": "insufficient_data",
            "message": "Confidence interval for the mean requires at least 2 valid observations.",
            "sample_size": n,
        }

    alpha = 1.0 - confidence_level
    mean_val = sum(clean_data) / n
    variance = sum((x - mean_val) ** 2 for x in clean_data) / (n - 1)
    std_dev = math.sqrt(variance)
    std_err = std_dev / math.sqrt(n)

    result: Dict[str, Any] = {
        "status": "success",
        "sample_size": n,
        "mean": round(mean_val, 6),
        "sample_std": round(std_dev, 6),
        "standard_error": round(std_err, 6),
        "confidence_level": confidence_level,
        "alpha": round(alpha, 6),
    }

    # 1. Student-t based Interval
    if method in ("t_distribution", "both"):
        df = n - 1
        t_crit = t_ppf(1.0 - alpha / 2.0, df)
        margin_of_error = t_crit * std_err
        ci_lower = mean_val - margin_of_error
        ci_upper = mean_val + margin_of_error

        result["t_interval"] = {
            "method": "Student's t-distribution",
            "degrees_of_freedom": df,
            "critical_value_t": round(t_crit, 6),
            "margin_of_error": round(margin_of_error, 6),
            "ci_lower": round(ci_lower, 6),
            "ci_upper": round(ci_upper, 6),
            "interval_formatted": f"[{round(ci_lower, 4)}, {round(ci_upper, 4)}]",
        }

    # 2. Bootstrap Percentile Interval
    if method in ("bootstrap", "both"):
        rng = random.Random(seed)
        boot_means: List[float] = []
        for _ in range(bootstrap_replications):
            resample = [clean_data[rng.randint(0, n - 1)] for _ in range(n)]
            boot_means.append(sum(resample) / n)

        boot_means.sort()
        idx_lower = int(math.floor((alpha / 2.0) * bootstrap_replications))
        idx_upper = int(math.ceil((1.0 - alpha / 2.0) * bootstrap_replications)) - 1
        idx_lower = max(0, min(idx_lower, bootstrap_replications - 1))
        idx_upper = max(0, min(idx_upper, bootstrap_replications - 1))

        boot_ci_lower = boot_means[idx_lower]
        boot_ci_upper = boot_means[idx_upper]

        result["bootstrap_interval"] = {
            "method": "Percentile Bootstrap (Non-parametric)",
            "replications": bootstrap_replications,
            "seed": seed,
            "ci_lower": round(boot_ci_lower, 6),
            "ci_upper": round(boot_ci_upper, 6),
            "interval_formatted": f"[{round(boot_ci_lower, 4)}, {round(boot_ci_upper, 4)}]",
        }

    return result
