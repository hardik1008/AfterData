"""
AFTERDATA Statistical Engine (Python, Pandas, NumPy, SciPy, Statsmodels)
Rigorous, deterministic statistical calculation pipeline.
Ensures no mathematical hallucination by the LLM.
"""
from typing import Dict, Any, List, Tuple
import re
import pandas as pd
import numpy as np
import scipy.stats as stats
import statsmodels.api as sm

def analyze_dataset_structure(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Inspects DataFrame columns and classifies them into rigorous statistical data types."""
    columns_info = []
    for col in df.columns:
        series = df[col].dropna()
        n_unique = series.nunique()
        total_non_null = len(series)
        null_count = int(df[col].isna().sum())

        # Determine type
        if pd.api.types.is_bool_dtype(df[col]):
            inferred = "boolean"
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            inferred = "temporal"
        elif pd.api.types.is_numeric_dtype(df[col]):
            is_numeric_metric = bool(re.search(r'(score|nps|ticket|count|item|rating|spend|revenue|value|hour|minute|day|age|loss|error|rate|pct|percent)', str(col), re.IGNORECASE))
            if n_unique <= 5 and (n_unique / max(total_non_null, 1) < 0.05) and not is_numeric_metric:
                inferred = "categorical"
            else:
                inferred = "continuous"
        else:
            # Try parsing date
            try:
                pd.to_datetime(series.iloc[:20])
                inferred = "temporal"
            except Exception:
                if n_unique / max(total_non_null, 1) > 0.85 and total_non_null > 20:
                    inferred = "identifier"
                else:
                    inferred = "categorical"

        col_dict: Dict[str, Any] = {
            "name": str(col),
            "inferred_type": inferred,
            "non_null_count": total_non_null,
            "null_count": null_count,
            "unique_count": n_unique,
            "sample_values": series.head(5).tolist()
        }

        if inferred == "continuous" and len(series) > 0:
            col_dict["min_value"] = float(series.min())
            col_dict["max_value"] = float(series.max())
            col_dict["mean_value"] = float(series.mean())
            col_dict["std_value"] = float(series.std(ddof=1)) if len(series) > 1 else 0.0

        columns_info.append(col_dict)
    return columns_info

def run_welch_ttest(
    df: pd.DataFrame,
    group_col: str,
    metric_col: str,
    group_a_val: Any,
    group_b_val: Any
) -> Dict[str, Any]:
    """Runs Welch's two-sample t-test (unequal variances assumed) with effect size (Cohen's d)."""
    sub_a = df[df[group_col] == group_a_val][metric_col].dropna().astype(float)
    sub_b = df[df[group_col] == group_b_val][metric_col].dropna().astype(float)

    n_a, n_b = len(sub_a), len(sub_b)
    if n_a < 3 or n_b < 3:
        raise ValueError(f"Insufficient sample sizes for t-test: Group A ({n_a}), Group B ({n_b}). Minimum 3 required.")

    t_stat, p_val = stats.ttest_ind(sub_a, sub_b, equal_var=False)

    mean_a, mean_b = float(sub_a.mean()), float(sub_b.mean())
    var_a, var_b = float(sub_a.var(ddof=1)), float(sub_b.var(ddof=1))

    # Pooled standard deviation for Cohen's d
    s_pooled = np.sqrt(((n_a - 1) * var_a + (n_b - 1) * var_b) / (n_a + n_b - 2)) if (n_a + n_b - 2) > 0 else 1.0
    cohens_d = (mean_a - mean_b) / s_pooled if s_pooled > 0 else 0.0

    # 95% Confidence interval for difference in means
    se_diff = np.sqrt(var_a / n_a + var_b / n_b)
    # Welch-Satterthwaite degrees of freedom
    df_welch = ((var_a / n_a + var_b / n_b) ** 2) / (
        ((var_a / n_a) ** 2) / (n_a - 1) + ((var_b / n_b) ** 2) / (n_b - 1)
    )
    t_crit = stats.t.ppf(0.975, df=df_welch)
    diff = mean_a - mean_b
    ci_lower = diff - t_crit * se_diff
    ci_upper = diff + t_crit * se_diff

    return {
        "test": "Welch Two-Sample t-test",
        "statistic": float(t_stat),
        "p_value": float(p_val),
        "is_significant": bool(p_val < 0.05),
        "effect_size_cohens_d": float(cohens_d),
        "mean_difference": float(diff),
        "confidence_interval_95": [float(ci_lower), float(ci_upper)],
        "degrees_of_freedom": float(df_welch),
        "group_a": {"name": str(group_a_val), "mean": mean_a, "std": np.sqrt(var_a), "n": n_a},
        "group_b": {"name": str(group_b_val), "mean": mean_b, "std": np.sqrt(var_b), "n": n_b},
        "sample_size": n_a + n_b
    }

def run_ols_regression(
    df: pd.DataFrame,
    dependent_var: str,
    independent_vars: List[str]
) -> Dict[str, Any]:
    """Runs Ordinary Least Squares (OLS) regression using Statsmodels with rigorous diagnostics."""
    clean_df = df[[dependent_var] + independent_vars].dropna()
    y = clean_df[dependent_var].astype(float)
    X = clean_df[independent_vars].astype(float)
    X = sm.add_constant(X)

    model = sm.OLS(y, X).fit()

    coefficients = {}
    p_values = {}
    for var in [const for const in X.columns]:
        coefficients[var] = float(model.params[var])
        p_values[var] = float(model.pvalues[var])

    return {
        "test": "OLS Linear Regression",
        "r_squared": float(model.rsquared),
        "adj_r_squared": float(model.rsquared_adj),
        "f_statistic": float(model.fvalue),
        "f_pvalue": float(model.f_pvalue),
        "coefficients": coefficients,
        "p_values": p_values,
        "sample_size": int(len(clean_df)),
        "is_significant": bool(model.f_pvalue < 0.05)
    }

def run_pearson_correlation(
    df: pd.DataFrame,
    var_x: str,
    var_y: str
) -> Dict[str, Any]:
    """Calculates Pearson & Spearman correlation coefficient with p-value and confidence interval."""
    clean = df[[var_x, var_y]].dropna().astype(float)
    x = clean[var_x]
    y = clean[var_y]
    n = len(clean)

    if n < 4:
        raise ValueError(f"Insufficient samples for correlation: N={n}. Minimum 4 required.")

    r, p_val = stats.pearsonr(x, y)
    rho, spearman_p = stats.spearmanr(x, y)

    # Fisher z-transformation for 95% CI on Pearson r
    z = np.arctanh(r)
    se = 1.0 / np.sqrt(n - 3)
    z_low = z - 1.96 * se
    z_high = z + 1.96 * se
    ci_low = np.tanh(z_low)
    ci_high = np.tanh(z_high)

    return {
        "test": "Pearson & Spearman Correlation",
        "pearson_r": float(r),
        "p_value": float(p_val),
        "spearman_rho": float(rho),
        "spearman_p": float(spearman_p),
        "confidence_interval_95": [float(ci_low), float(ci_high)],
        "sample_size": n,
        "is_significant": bool(p_val < 0.05)
    }
