"""
Module 10: Multiple Linear Regression (OLS)
Implements multivariate OLS estimation via (X'X)^(-1) X'y, coefficient CIs,
ANOVA F-test, Variance Inflation Factor (VIF) multicollinearity diagnostics,
leverage and Cook's distance influential point audits, and model specification warnings.
"""

import math
from typing import List, Dict, Any, Optional
from .math_utils import (
    matrix_transpose,
    matrix_multiply,
    matrix_inverse_gauss_jordan,
    t_cdf,
    t_ppf,
    f_cdf,
)


def fit_multiple_linear_regression(
    X_matrix: List[List[float]],
    y_vector: List[float],
    predictor_names: Optional[List[str]] = None,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Fits an OLS multiple linear regression model: y = beta_0 + sum(beta_j * x_j) + eps.

    Parameters:
        X_matrix: Matrix of size (n x k) containing predictor values.
        y_vector: Target vector of size n.
        predictor_names: Optional list of predictor names (length k).
        confidence_level: Coverage probability for coefficient CIs.
    """
    n = len(y_vector)
    if n == 0 or len(X_matrix) != n:
        raise ValueError(f"X_matrix rows ({len(X_matrix)}) must match y_vector length ({n}).")

    k = len(X_matrix[0])
    if k == 0:
        raise ValueError("X_matrix must contain at least 1 predictor column.")

    for row in X_matrix:
        if len(row) != k:
            raise ValueError(f"Inconsistent number of columns in X_matrix (expected {k}).")

    if n <= k + 1:
        raise ValueError(f"Insufficient degrees of freedom: n ({n}) must be strictly greater than k + 1 ({k + 1}).")

    if predictor_names is None:
        names = [f"x{j+1}" for j in range(k)]
    else:
        if len(predictor_names) != k:
            raise ValueError(f"Length of predictor_names ({len(predictor_names)}) must equal k ({k}).")
        names = predictor_names

    # Clean missing/invalid data rows
    clean_X: List[List[float]] = []
    clean_y: List[float] = []

    for i in range(n):
        y_val = y_vector[i]
        x_row = X_matrix[i]
        if y_val is None or math.isnan(y_val) or math.isinf(y_val):
            continue
        if any(v is None or math.isnan(v) or math.isinf(v) for v in x_row):
            continue
        clean_X.append([float(v) for v in x_row])
        clean_y.append(float(y_val))

    n_clean = len(clean_y)
    if n_clean <= k + 1:
        raise ValueError(f"After removing missing observations, valid N ({n_clean}) <= k + 1 ({k + 1}).")

    # Construct design matrix X with leading column of 1s for the intercept: (n x (k + 1))
    p = k + 1  # Total parameters including intercept
    X_design = [[1.0] + row for row in clean_X]

    # X^T
    Xt = matrix_transpose(X_design)

    # XtX = X^T * X: (p x p)
    XtX = matrix_multiply(Xt, X_design)

    # (X^T * X)^(-1)
    try:
        inv_XtX = matrix_inverse_gauss_jordan(XtX)
    except ValueError as err:
        raise ValueError(f"Multicollinearity failure: (X^T * X) is singular or collinear. {err}")

    # X^T * y: (p x 1)
    y_col = [[y] for y in clean_y]
    Xty = matrix_multiply(Xt, y_col)

    # beta_hat = (X^T * X)^(-1) * X^T * y: (p x 1)
    beta_hat_matrix = matrix_multiply(inv_XtX, Xty)
    beta = [row[0] for row in beta_hat_matrix]

    # Predicted values and residuals
    y_fitted: List[float] = []
    residuals: List[float] = []
    for i in range(n_clean):
        y_hat = sum(X_design[i][j] * beta[j] for j in range(p))
        y_fitted.append(y_hat)
        residuals.append(clean_y[i] - y_hat)

    # Sum of squares
    mean_y = sum(clean_y) / n_clean
    ss_tot = sum((y - mean_y) ** 2 for y in clean_y)
    ss_res = sum(e ** 2 for e in residuals)
    ss_reg = max(0.0, ss_tot - ss_res)

    df_reg = k
    df_res = n_clean - p

    r_squared = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    r_squared = max(0.0, min(1.0, r_squared))
    adj_r_squared = 1.0 - (1.0 - r_squared) * ((n_clean - 1) / df_res) if df_res > 0 else 0.0

    # Residual variance and standard error
    s2_e = ss_res / df_res if df_res > 0 else 0.0
    s_e = math.sqrt(s2_e)

    # Standard errors of coefficients: sqrt(s2_e * inv_XtX[j][j])
    se_beta = [math.sqrt(max(0.0, s2_e * inv_XtX[j][j])) for j in range(p)]

    # t-statistics and p-values
    alpha = 1.0 - confidence_level
    t_crit = t_ppf(1.0 - alpha / 2.0, df_res)

    coef_details: List[Dict[str, Any]] = []
    var_labels = ["(Intercept)"] + names

    for j in range(p):
        se_j = se_beta[j]
        t_j = beta[j] / se_j if se_j > 0 else 0.0
        p_j = 2.0 * (1.0 - t_cdf(abs(t_j), df_res))
        ci_low = beta[j] - t_crit * se_j
        ci_high = beta[j] + t_crit * se_j

        coef_details.append({
            "term": var_labels[j],
            "estimate": round(beta[j], 6),
            "standard_error": round(se_j, 6),
            "t_statistic": round(t_j, 6),
            "p_value": round(p_j, 6),
            "ci_lower": round(ci_low, 6),
            "ci_upper": round(ci_high, 6),
            "is_significant_alpha_05": p_j < 0.05,
        })

    # Overall ANOVA F-test
    ms_reg = ss_reg / df_reg if df_reg > 0 else 0.0
    f_stat = ms_reg / s2_e if s2_e > 0 else 0.0
    f_pvalue = 1.0 - f_cdf(f_stat, df_reg, df_res)

    # --- Multicollinearity Diagnostics: Variance Inflation Factor (VIF) ---
    vif_results: Dict[str, float] = {}
    high_vif_warnings: List[str] = []

    if k > 1:
        for idx in range(k):
            # Regress predictor x_idx on the other k - 1 predictors
            sub_y = [row[idx] for row in clean_X]
            sub_X = [[row[m] for m in range(k) if m != idx] for row in clean_X]
            try:
                sub_fit = fit_multiple_linear_regression(sub_X, sub_y, confidence_level=confidence_level)
                sub_r2 = sub_fit["model_fit"]["r_squared"]
                vif_j = 1.0 / (1.0 - sub_r2) if sub_r2 < 0.9999 else 999.99
            except Exception:
                vif_j = 1.0

            vif_results[names[idx]] = round(vif_j, 3)
            if vif_j >= 10.0:
                high_vif_warnings.append(
                    f"Predictor '{names[idx]}' has severe multicollinearity (VIF = {round(vif_j, 1)} >= 10)."
                )
            elif vif_j >= 5.0:
                high_vif_warnings.append(
                    f"Predictor '{names[idx]}' has moderate multicollinearity (VIF = {round(vif_j, 1)} >= 5)."
                )

    # --- Influential Observations: Leverage (Hat diagonal) and Cook's Distance ---
    # H = X * (X'X)^(-1) * X': for observation i, h_ii = sum_j sum_m X_ij * inv_XtX_jm * X_im
    leverage_threshold = 2.0 * p / n_clean
    influential_points: List[Dict[str, Any]] = []

    for i in range(n_clean):
        row_i = X_design[i]
        # h_ii = row_i * inv_XtX * row_i^T
        temp = [sum(row_i[j] * inv_XtX[j][m] for j in range(p)) for m in range(p)]
        h_ii = sum(temp[m] * row_i[m] for m in range(p))

        # Cook's distance: D_i = (e_i^2 / (p * s2_e)) * (h_ii / (1 - h_ii)^2)
        e_i = residuals[i]
        cooks_d = 0.0
        if s2_e > 0 and (1.0 - h_ii) > 1.0e-9:
            cooks_d = (e_i ** 2 / (p * s2_e)) * (h_ii / ((1.0 - h_ii) ** 2))

        if cooks_d > 0.5 or h_ii > leverage_threshold:
            influential_points.append({
                "observation_index": i,
                "residual": round(e_i, 4),
                "leverage_h_ii": round(h_ii, 4),
                "cooks_distance": round(cooks_d, 4),
                "is_high_leverage": h_ii > leverage_threshold,
                "is_influential_cooks": cooks_d > 0.5,
            })

    # Model specification warnings
    warnings: List[str] = list(high_vif_warnings)
    if (n_clean / k) < 10:
        warnings.append(
            f"Low observation-to-predictor ratio ({round(n_clean / k, 1)}:1). "
            f"A minimum of 10–20 observations per predictor is recommended to guard against overfitting."
        )
    if len(influential_points) > 0:
        warnings.append(
            f"Identified {len(influential_points)} high-leverage or influential observation(s) (Cook's D > 0.5 or high leverage)."
        )

    return {
        "status": "success",
        "sample_size": n_clean,
        "predictor_count": k,
        "degrees_of_freedom_residual": df_res,
        "coefficients": coef_details,
        "model_fit": {
            "r_squared": round(r_squared, 6),
            "adjusted_r_squared": round(adj_r_squared, 6),
            "residual_standard_error": round(s_e, 6),
            "f_statistic": round(f_stat, 6),
            "f_p_value": round(f_pvalue, 6),
            "is_model_significant": f_pvalue < 0.05,
        },
        "multicollinearity_vif": vif_results,
        "influential_diagnostics": {
            "leverage_benchmark_threshold": round(leverage_threshold, 4),
            "influential_observation_count": len(influential_points),
            "influential_observations": influential_points[:10],  # Top 10
        },
        "specification_warnings": warnings if warnings else ["Model specification meets standard linear regression criteria."],
    }
