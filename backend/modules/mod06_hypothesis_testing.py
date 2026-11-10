"""
Module 6: Hypothesis Testing for Means, Proportions, and Contingency
Implements One-Sample t-test, Welch's Two-Sample t-test, Paired t-test,
Two-Proportion z-test, Chi-Square test of independence, and Mann-Whitney U rank-sum test.
"""

import math
from typing import List, Dict, Any, Optional, Tuple
from .math_utils import t_cdf, normal_cdf, chi2_cdf, rank_data


def one_sample_t_test(
    data: List[float],
    mu_0: float = 0.0,
    alternative: str = "two-sided"  # "two-sided" | "greater" | "less"
) -> Dict[str, Any]:
    """Computes one-sample Student's t-test against null mean mu_0."""
    clean = [float(x) for x in data if x is not None and not (isinstance(x, float) and (math.isnan(x) or math.isinf(x)))]
    n = len(clean)
    if n < 2:
        raise ValueError("One-sample t-test requires at least 2 valid observations.")

    mean_val = sum(clean) / n
    variance = sum((x - mean_val) ** 2 for x in clean) / (n - 1)
    std_dev = math.sqrt(variance)
    se = std_dev / math.sqrt(n)

    if se == 0:
        t_stat = 0.0
        p_val = 1.0 if mean_val == mu_0 else 0.0
    else:
        t_stat = (mean_val - mu_0) / se
        df = n - 1
        if alternative == "two-sided":
            p_val = 2.0 * (1.0 - t_cdf(abs(t_stat), df))
        elif alternative == "greater":
            p_val = 1.0 - t_cdf(t_stat, df)
        elif alternative == "less":
            p_val = t_cdf(t_stat, df)
        else:
            raise ValueError("Alternative must be 'two-sided', 'greater', or 'less'.")

    return {
        "test_name": "One-Sample Student's t-test",
        "sample_size": n,
        "sample_mean": round(mean_val, 6),
        "hypothesized_mean": mu_0,
        "degrees_of_freedom": n - 1,
        "test_statistic_t": round(t_stat, 6),
        "p_value": round(p_val, 6),
        "is_significant_alpha_05": p_val < 0.05,
        "null_hypothesis": f"Population mean equals {mu_0}",
        "alternative_hypothesis": f"Population mean does not equal {mu_0}",
    }


def welch_two_sample_t_test(
    group_a: List[float],
    group_b: List[float],
    alternative: str = "two-sided"
) -> Dict[str, Any]:
    """
    Computes Welch's Two-Sample t-test for unequal variances with Satterthwaite degrees of freedom.
    """
    clean_a = [float(x) for x in group_a if x is not None and not (isinstance(x, float) and math.isnan(x))]
    clean_b = [float(x) for x in group_b if x is not None and not (isinstance(x, float) and math.isnan(x))]

    na, nb = len(clean_a), len(clean_b)
    if na < 2 or nb < 2:
        raise ValueError("Each group must contain at least 2 valid observations.")

    mean_a = sum(clean_a) / na
    mean_b = sum(clean_b) / nb

    var_a = sum((x - mean_a) ** 2 for x in clean_a) / (na - 1)
    var_b = sum((x - mean_b) ** 2 for x in clean_b) / (nb - 1)

    std_a = math.sqrt(var_a)
    std_b = math.sqrt(var_b)

    se_a = var_a / na
    se_b = var_b / nb
    se_diff = math.sqrt(se_a + se_b)

    if se_diff == 0:
        t_stat = 0.0
        p_val = 1.0 if mean_a == mean_b else 0.0
        df = float(na + nb - 2)
    else:
        t_stat = (mean_a - mean_b) / se_diff
        # Welch-Satterthwaite equation
        df_num = (se_a + se_b) ** 2
        df_denom = (se_a ** 2) / (na - 1) + (se_b ** 2) / (nb - 1)
        df = df_num / df_denom if df_denom > 0 else float(na + nb - 2)

        if alternative == "two-sided":
            p_val = 2.0 * (1.0 - t_cdf(abs(t_stat), df))
        elif alternative == "greater":
            p_val = 1.0 - t_cdf(t_stat, df)
        else:
            p_val = t_cdf(t_stat, df)

    # Effect Size: Cohen's d (pooled standard deviation)
    pooled_sd = math.sqrt(((na - 1) * var_a + (nb - 1) * var_b) / (na + nb - 2)) if (na + nb - 2) > 0 else 1.0
    cohens_d = (mean_a - mean_b) / pooled_sd if pooled_sd > 0 else 0.0

    return {
        "test_name": "Welch's Two-Sample t-test (Unequal Variances)",
        "sample_size_a": na,
        "sample_size_b": nb,
        "mean_a": round(mean_a, 6),
        "mean_b": round(mean_b, 6),
        "std_a": round(std_a, 6),
        "std_b": round(std_b, 6),
        "mean_difference": round(mean_a - mean_b, 6),
        "degrees_of_freedom": round(df, 4),
        "test_statistic_t": round(t_stat, 6),
        "p_value": round(p_val, 6),
        "cohens_d": round(cohens_d, 6),
        "is_significant_alpha_05": p_val < 0.05,
    }


def paired_t_test(
    before: List[float],
    after: List[float],
    alternative: str = "two-sided"
) -> Dict[str, Any]:
    """Computes paired sample Student's t-test on differences (after - before)."""
    if len(before) != len(after):
        raise ValueError(f"Paired samples must have identical lengths ({len(before)} != {len(after)}).")

    pairs = [(b, a) for b, a in zip(before, after) if b is not None and a is not None and not (math.isnan(b) or math.isnan(a))]
    n = len(pairs)
    if n < 2:
        raise ValueError("Paired t-test requires at least 2 complete pairs.")

    diffs = [a - b for b, a in pairs]
    mean_diff = sum(diffs) / n
    var_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1)
    std_diff = math.sqrt(var_diff)
    se_diff = std_diff / math.sqrt(n)

    if se_diff == 0:
        t_stat = 0.0
        p_val = 1.0 if mean_diff == 0 else 0.0
    else:
        t_stat = mean_diff / se_diff
        df = n - 1
        if alternative == "two-sided":
            p_val = 2.0 * (1.0 - t_cdf(abs(t_stat), df))
        elif alternative == "greater":
            p_val = 1.0 - t_cdf(t_stat, df)
        else:
            p_val = t_cdf(t_stat, df)

    return {
        "test_name": "Paired Samples Student's t-test",
        "pair_count": n,
        "mean_difference": round(mean_diff, 6),
        "std_dev_difference": round(std_diff, 6),
        "degrees_of_freedom": n - 1,
        "test_statistic_t": round(t_stat, 6),
        "p_value": round(p_val, 6),
        "is_significant_alpha_05": p_val < 0.05,
    }


def two_proportion_z_test(
    k1: int, n1: int,
    k2: int, n2: int,
    alternative: str = "two-sided"
) -> Dict[str, Any]:
    """Computes two-sample z-test for difference in independent proportions."""
    if n1 <= 0 or n2 <= 0:
        raise ValueError("Sample sizes must be strictly positive.")
    if k1 < 0 or k1 > n1 or k2 < 0 or k2 > n2:
        raise ValueError("Success counts must be between 0 and sample size.")

    p1 = k1 / n1
    p2 = k2 / n2

    # Pooled proportion under H0: p1 = p2
    p_pool = (k1 + k2) / (n1 + n2)
    se_pool = math.sqrt(p_pool * (1.0 - p_pool) * (1.0 / n1 + 1.0 / n2))

    if se_pool == 0:
        z_stat = 0.0
        p_val = 1.0 if p1 == p2 else 0.0
    else:
        z_stat = (p1 - p2) / se_pool
        if alternative == "two-sided":
            p_val = 2.0 * (1.0 - normal_cdf(abs(z_stat)))
        elif alternative == "greater":
            p_val = 1.0 - normal_cdf(z_stat)
        else:
            p_val = normal_cdf(z_stat)

    return {
        "test_name": "Two-Sample Proportion z-test",
        "n1": n1, "k1": k1, "p1": round(p1, 6),
        "n2": n2, "k2": k2, "p2": round(p2, 6),
        "pooled_proportion": round(p_pool, 6),
        "proportion_difference": round(p1 - p2, 6),
        "test_statistic_z": round(z_stat, 6),
        "p_value": round(p_val, 6),
        "is_significant_alpha_05": p_val < 0.05,
    }


def chi_square_contingency(table: List[List[int]]) -> Dict[str, Any]:
    """Computes Pearson's Chi-Square Test of Independence on an r x c contingency table."""
    r = len(table)
    if r < 2:
        raise ValueError("Contingency table requires at least 2 rows.")
    c = len(table[0])
    if c < 2:
        raise ValueError("Contingency table requires at least 2 columns.")

    row_sums = [sum(row) for row in table]
    col_sums = [sum(table[i][j] for i in range(r)) for j in range(c)]
    total = sum(row_sums)

    if total == 0:
        raise ValueError("Contingency table total sum cannot be zero.")

    chi2_stat = 0.0
    expected_table: List[List[float]] = []
    min_expected = float("inf")

    for i in range(r):
        exp_row: List[float] = []
        for j in range(c):
            e_ij = (row_sums[i] * col_sums[j]) / total
            exp_row.append(round(e_ij, 4))
            if e_ij < min_expected:
                min_expected = e_ij
            if e_ij > 0:
                chi2_stat += ((table[i][j] - e_ij) ** 2) / e_ij
        expected_table.append(exp_row)

    df = (r - 1) * (c - 1)
    p_val = 1.0 - chi2_cdf(chi2_stat, df)

    return {
        "test_name": "Pearson's Chi-Square Test of Independence",
        "table_dimensions": f"{r}x{c}",
        "total_observations": total,
        "degrees_of_freedom": df,
        "chi_square_statistic": round(chi2_stat, 6),
        "p_value": round(p_val, 6),
        "min_expected_cell_count": round(min_expected, 4),
        "is_cochran_criterion_met": min_expected >= 5.0,
        "is_significant_alpha_05": p_val < 0.05,
    }


def mann_whitney_u_test(group_a: List[float], group_b: List[float]) -> Dict[str, Any]:
    """Non-parametric Mann-Whitney U rank-sum test for two independent groups."""
    clean_a = [x for x in group_a if x is not None and not math.isnan(x)]
    clean_b = [x for x in group_b if x is not None and not math.isnan(x)]

    n1, n2 = len(clean_a), len(clean_b)
    if n1 == 0 or n2 == 0:
        raise ValueError("Both groups must contain at least 1 valid observation.")

    combined = clean_a + clean_b
    ranks = rank_data(combined)

    rank_sum_a = sum(ranks[:n1])
    rank_sum_b = sum(ranks[n1:])

    u1 = rank_sum_a - (n1 * (n1 + 1)) / 2.0
    u2 = rank_sum_b - (n2 * (n2 + 1)) / 2.0
    u_stat = min(u1, u2)

    # Normal approximation for large sample (n1 >= 10, n2 >= 10)
    mu_u = (n1 * n2) / 2.0
    sigma_u = math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12.0)
    z_u = (u_stat - mu_u) / sigma_u if sigma_u > 0 else 0.0
    p_val = 2.0 * (1.0 - normal_cdf(abs(z_u)))

    return {
        "test_name": "Mann-Whitney U Test (Non-parametric)",
        "sample_size_a": n1,
        "sample_size_b": n2,
        "rank_sum_a": round(rank_sum_a, 2),
        "rank_sum_b": round(rank_sum_b, 2),
        "u_statistic": round(u_stat, 4),
        "asymptotic_z": round(z_u, 4),
        "p_value": round(p_val, 6),
        "is_significant_alpha_05": p_val < 0.05,
    }
