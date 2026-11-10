"""
Module 8: Correlation and Covariance
Implements Pearson r, Spearman rank rho, sample covariance, Fisher z-transformation CIs,
t-test of correlation significance, and nonlinearity/outlier discrepancy diagnostics.
"""

import math
from typing import List, Dict, Any, Tuple
from .math_utils import t_cdf, normal_ppf, rank_data


def compute_correlation_and_covariance(
    x_data: List[float],
    y_data: List[float],
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Computes Pearson and Spearman correlation, covariance, hypothesis test of zero correlation,
    Fisher z-transformation confidence interval, and non-linearity diagnostics.
    """
    if len(x_data) != len(y_data):
        raise ValueError(f"x_data and y_data must have identical lengths ({len(x_data)} != {len(y_data)}).")

    # Pairwise complete observations
    pairs = [
        (float(x), float(y))
        for x, y in zip(x_data, y_data)
        if x is not None and y is not None and not (math.isnan(x) or math.isnan(y) or math.isinf(x) or math.isinf(y))
    ]
    n = len(pairs)
    if n < 3:
        raise ValueError("Correlation and covariance analysis requires at least 3 complete pairs.")

    xs = [p[0] for p in pairs]
    ys = [p[1] for p in pairs]

    mean_x = sum(xs) / n
    mean_y = sum(ys) / n

    # Covariance
    cov_numerator = sum((x - mean_x) * (y - mean_y) for x, y in pairs)
    sample_cov = cov_numerator / (n - 1)

    ss_x = sum((x - mean_x) ** 2 for x in xs)
    ss_y = sum((y - mean_y) ** 2 for y in ys)

    # Pearson correlation r
    denom = math.sqrt(ss_x * ss_y)
    if denom == 0:
        pearson_r = 0.0
    else:
        pearson_r = cov_numerator / denom
        pearson_r = max(-1.0, min(1.0, pearson_r))

    # Significance t-test for Pearson r
    # t = r * sqrt((n - 2) / (1 - r^2))
    df = n - 2
    if abs(pearson_r) >= 1.0:
        t_stat = float("inf") if pearson_r > 0 else -float("inf")
        p_val = 0.0
    else:
        t_stat = pearson_r * math.sqrt(df / (1.0 - pearson_r * pearson_r))
        p_val = 2.0 * (1.0 - t_cdf(abs(t_stat), df))

    # Fisher z-transformation confidence interval for r
    # z_r = 0.5 * ln((1 + r) / (1 - r))
    # SE_z = 1 / sqrt(n - 3)
    alpha = 1.0 - confidence_level
    z_crit = normal_ppf(1.0 - alpha / 2.0)
    if n > 3 and abs(pearson_r) < 0.9999:
        zr = 0.5 * math.log((1.0 + pearson_r) / (1.0 - pearson_r))
        se_zr = 1.0 / math.sqrt(n - 3)
        zr_low = zr - z_crit * se_zr
        zr_high = zr + z_crit * se_zr
        # Convert back via tanh
        r_ci_lower = math.tanh(zr_low)
        r_ci_upper = math.tanh(zr_high)
    else:
        r_ci_lower = pearson_r
        r_ci_upper = pearson_r

    # Spearman rank correlation rho
    ranks_x = rank_data(xs)
    ranks_y = rank_data(ys)
    mean_rx = sum(ranks_x) / n
    mean_ry = sum(ranks_y) / n
    ss_rx = sum((rx - mean_rx) ** 2 for rx in ranks_x)
    ss_ry = sum((ry - mean_ry) ** 2 for ry in ranks_y)
    cov_r = sum((rx - mean_rx) * (ry - mean_ry) for rx, ry in zip(ranks_x, ranks_y))
    denom_r = math.sqrt(ss_rx * ss_ry)
    spearman_rho = cov_r / denom_r if denom_r > 0 else 0.0
    spearman_rho = max(-1.0, min(1.0, spearman_rho))

    # Nonlinearity & Outlier Discrepancy Diagnostics
    discrepancy = abs(pearson_r - spearman_rho)
    diagnostics = []
    if discrepancy > 0.20:
        diagnostics.append(
            f"Substantial discrepancy between Pearson r ({round(pearson_r, 2)}) and Spearman rho ({round(spearman_rho, 2)}). "
            f"Suggests monotonic non-linearity or influential leverage outliers distorting the linear correlation."
        )

    # Downsampled scatter points for visual chart
    step = max(1, n // 100)
    scatter_sample = [{"x": round(xs[i], 4), "y": round(ys[i], 4)} for i in range(0, n, step)]

    return {
        "status": "success",
        "sample_size": n,
        "sample_covariance": round(sample_cov, 6),
        "pearson_correlation_r": round(pearson_r, 6),
        "coefficient_of_determination_r2": round(pearson_r ** 2, 6),
        "test_statistic_t": round(t_stat, 6),
        "degrees_of_freedom": df,
        "p_value": round(p_val, 6),
        "is_significant_alpha_05": p_val < 0.05,
        "fisher_z_confidence_interval": {
            "confidence_level": confidence_level,
            "ci_lower": round(r_ci_lower, 6),
            "ci_upper": round(r_ci_upper, 6),
            "formatted": f"[{round(r_ci_lower, 4)}, {round(r_ci_upper, 4)}]",
        },
        "spearman_rank_correlation_rho": round(spearman_rho, 6),
        "correlation_discrepancy": round(discrepancy, 4),
        "diagnostics": diagnostics if diagnostics else ["Pearson and Spearman metrics are consistent."],
        "scatter_sample": scatter_sample[:100],
    }
