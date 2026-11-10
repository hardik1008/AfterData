"""
Module 1: Descriptive Statistics
Computes comprehensive univariate sample statistics, quantiles, moments,
and outlier diagnostics deterministically.
"""

import math
from typing import List, Dict, Any, Optional, Union
from collections import Counter


def compute_descriptive_statistics(
    data: List[Any],
    remove_missing: bool = True
) -> Dict[str, Any]:
    """
    Computes complete descriptive statistics for a sequence of observations.

    Parameters:
        data: List of raw values (numbers, strings, Nones).
        remove_missing: If True, filters out None, NaN, and whitespace-only values.

    Returns:
        Structured dictionary conforming to the AFTERDATA descriptive statistics schema.
    """
    if not isinstance(data, list):
        raise TypeError(f"Expected list for 'data', got {type(data).__name__}")

    total_count = len(data)
    valid_numbers: List[float] = []
    missing_count = 0

    for x in data:
        if x is None:
            missing_count += 1
            continue
        if isinstance(x, str):
            s = x.strip()
            if s == "" or s.lower() in ("nan", "null", "none", "na", "."):
                missing_count += 1
                continue
            try:
                val = float(s)
                if math.isnan(val) or math.isinf(val):
                    missing_count += 1
                else:
                    valid_numbers.append(val)
            except ValueError:
                missing_count += 1
        elif isinstance(x, (int, float)):
            if math.isnan(x) or math.isinf(x):
                missing_count += 1
            else:
                valid_numbers.append(float(x))
        else:
            missing_count += 1

    n_valid = len(valid_numbers)
    missing_pct = (missing_count / total_count * 100.0) if total_count > 0 else 0.0

    if n_valid == 0:
        return {
            "total_count": total_count,
            "valid_count": 0,
            "missing_count": missing_count,
            "missing_percentage": round(missing_pct, 4),
            "status": "insufficient_data",
            "message": "No valid numeric observations found in sequence.",
        }

    # Sort for quantile and median computation
    sorted_vals = sorted(valid_numbers)

    # Sum, Mean
    sum_val = sum(sorted_vals)
    mean_val = sum_val / n_valid

    # Median (Q2)
    if n_valid % 2 == 1:
        median_val = sorted_vals[n_valid // 2]
    else:
        median_val = (sorted_vals[n_valid // 2 - 1] + sorted_vals[n_valid // 2]) / 2.0

    # Mode
    # Round to reasonable precision for grouping floats
    rounded_for_mode = [round(v, 6) for v in sorted_vals]
    counts = Counter(rounded_for_mode)
    max_freq = max(counts.values())
    if max_freq > 1:
        modes = [k for k, v in counts.items() if v == max_freq]
        mode_val: Optional[Union[float, List[float]]] = modes[0] if len(modes) == 1 else modes
    else:
        mode_val = None

    # Min, Max, Range
    min_val = sorted_vals[0]
    max_val = sorted_vals[-1]
    range_val = max_val - min_val

    # Percentiles (Linear interpolation method, matching standard numpy/R type 7)
    def _percentile(p: float) -> float:
        if n_valid == 1:
            return sorted_vals[0]
        k = (n_valid - 1) * p
        f = math.floor(k)
        c = math.ceil(k)
        if f == c:
            return sorted_vals[int(k)]
        d0 = sorted_vals[int(f)] * (c - k)
        d1 = sorted_vals[int(c)] * (k - f)
        return d0 + d1

    q1 = _percentile(0.25)
    q2 = median_val
    q3 = _percentile(0.75)
    iqr_val = q3 - q1

    # Variance and Standard Deviation
    if n_valid > 1:
        # Two-pass algorithm for numerical stability
        ss = sum((x - mean_val) ** 2 for x in sorted_vals)
        sample_var = ss / (n_valid - 1)
        pop_var = ss / n_valid
        sample_std = math.sqrt(sample_var)
        pop_std = math.sqrt(pop_var)
    else:
        sample_var = 0.0
        pop_var = 0.0
        sample_std = 0.0
        pop_std = 0.0

    # Skewness (Sample adjusted Fisher-Pearson g1)
    if n_valid >= 3 and sample_std > 0:
        m3 = sum((x - mean_val) ** 3 for x in sorted_vals) / n_valid
        m2 = sum((x - mean_val) ** 2 for x in sorted_vals) / n_valid
        skew_val = (m3 / (m2 ** 1.5)) * math.sqrt(n_valid * (n_valid - 1)) / (n_valid - 2)
    else:
        skew_val = 0.0

    # Kurtosis (Excess kurtosis)
    if n_valid >= 4 and sample_std > 0:
        m4 = sum((x - mean_val) ** 4 for x in sorted_vals) / n_valid
        m2 = sum((x - mean_val) ** 2 for x in sorted_vals) / n_valid
        raw_kurt = m4 / (m2 ** 2)
        # Sample excess kurtosis
        excess_kurt = (
            ((n_valid - 1) / ((n_valid - 2) * (n_valid - 3)))
            * ((n_valid + 1) * raw_kurt - 3.0 * (n_valid - 1))
        )
    else:
        excess_kurt = 0.0

    # Tukey Outliers (IQR Method)
    lower_fence = q1 - 1.5 * iqr_val
    upper_fence = q3 + 1.5 * iqr_val
    iqr_outliers = [x for x in sorted_vals if x < lower_fence or x > upper_fence]

    # Z-Score Outliers (|z| > 3.0)
    z_score_outliers = []
    if sample_std > 0:
        z_score_outliers = [x for x in sorted_vals if abs((x - mean_val) / sample_std) > 3.0]

    return {
        "status": "success",
        "total_count": total_count,
        "valid_count": n_valid,
        "missing_count": missing_count,
        "missing_percentage": round(missing_pct, 4),
        "mean": round(mean_val, 6),
        "median": round(median_val, 6),
        "mode": mode_val,
        "min": round(min_val, 6),
        "max": round(max_val, 6),
        "range": round(range_val, 6),
        "q1": round(q1, 6),
        "q2": round(q2, 6),
        "q3": round(q3, 6),
        "iqr": round(iqr_val, 6),
        "sample_variance": round(sample_var, 6),
        "sample_std_dev": round(sample_std, 6),
        "population_variance": round(pop_var, 6),
        "population_std_dev": round(pop_std, 6),
        "skewness": round(skew_val, 6),
        "excess_kurtosis": round(excess_kurt, 6),
        "five_number_summary": {
            "min": round(min_val, 6),
            "q1": round(q1, 6),
            "median": round(q2, 6),
            "q3": round(q3, 6),
            "max": round(max_val, 6),
        },
        "outlier_analysis": {
            "tukey_lower_fence": round(lower_fence, 6),
            "tukey_upper_fence": round(upper_fence, 6),
            "tukey_outlier_count": len(iqr_outliers),
            "tukey_outliers": [round(x, 4) for x in iqr_outliers],
            "z_score_outlier_count": len(z_score_outliers),
            "z_score_outliers": [round(x, 4) for x in z_score_outliers],
        },
    }
