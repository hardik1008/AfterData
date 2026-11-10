"""
Module 9: Simple Linear Regression (OLS)
Computes Ordinary Least Squares bivariate regression, standard errors, coefficient CIs,
ANOVA decomposition, residual diagnostics, and prediction intervals.
"""

import math
from typing import List, Dict, Any, Optional
from .math_utils import t_cdf, t_ppf, f_cdf


def fit_simple_linear_regression(
    x_data: List[float],
    y_data: List[float],
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Fits an OLS simple linear regression model y = beta_0 + beta_1 * x + epsilon.
    """
    if len(x_data) != len(y_data):
        raise ValueError(f"x_data and y_data lengths do not match ({len(x_data)} != {len(y_data)}).")

    pairs = [
        (float(x), float(y))
        for x, y in zip(x_data, y_data)
        if x is not None and y is not None and not (math.isnan(x) or math.isnan(y) or math.isinf(x) or math.isinf(y))
    ]
    n = len(pairs)
    if n < 3:
        raise ValueError("Simple linear regression requires at least 3 valid observation pairs.")

    xs = [p[0] for p in pairs]
    ys = [p[1] for p in pairs]

    mean_x = sum(xs) / n
    mean_y = sum(ys) / n

    ss_x = sum((x - mean_x) ** 2 for x in xs)
    if ss_x == 0:
        raise ValueError("Predictor x is constant (zero variance). OLS slope is undefined.")

    cov_xy = sum((x - mean_x) * (y - mean_y) for x, y in pairs)

    # Slope beta_1 and Intercept beta_0
    slope = cov_xy / ss_x
    intercept = mean_y - slope * mean_x

    # Fitted values and residuals
    y_pred = [intercept + slope * x for x in xs]
    residuals = [y - y_hat for y, y_hat in zip(ys, y_pred)]

    # Sum of squares
    ss_tot = sum((y - mean_y) ** 2 for y in ys)
    ss_res = sum(e ** 2 for e in residuals)
    ss_reg = max(0.0, ss_tot - ss_res)

    df_reg = 1
    df_res = n - 2
    r_squared = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    r_squared = max(0.0, min(1.0, r_squared))
    adj_r_squared = 1.0 - (1.0 - r_squared) * ((n - 1) / df_res)

    # Residual standard error
    mse_res = ss_res / df_res
    s_e = math.sqrt(mse_res)

    # Standard errors of coefficients
    se_slope = s_e / math.sqrt(ss_x)
    se_intercept = s_e * math.sqrt((1.0 / n) + (mean_x ** 2) / ss_x)

    # t-statistics and p-values
    t_slope = slope / se_slope if se_slope > 0 else 0.0
    p_slope = 2.0 * (1.0 - t_cdf(abs(t_slope), df_res))

    t_intercept = intercept / se_intercept if se_intercept > 0 else 0.0
    p_intercept = 2.0 * (1.0 - t_cdf(abs(t_intercept), df_res))

    # Overall F-statistic = MSReg / MSRes
    ms_reg = ss_reg / df_reg
    f_stat = ms_reg / mse_res if mse_res > 0 else 0.0
    f_pvalue = 1.0 - f_cdf(f_stat, df_reg, df_res)

    # Confidence intervals for coefficients
    alpha = 1.0 - confidence_level
    t_crit = t_ppf(1.0 - alpha / 2.0, df_res)

    slope_ci_lower = slope - t_crit * se_slope
    slope_ci_upper = slope + t_crit * se_slope

    intercept_ci_lower = intercept - t_crit * se_intercept
    intercept_ci_upper = intercept + t_crit * se_intercept

    # Durbin-Watson statistic for autocorrelation: sum((e_i - e_{i-1})^2) / sum(e_i^2)
    diff_sum = sum((residuals[i] - residuals[i - 1]) ** 2 for i in range(1, n))
    durbin_watson = diff_sum / ss_res if ss_res > 0 else 2.0

    return {
        "status": "success",
        "sample_size": n,
        "degrees_of_freedom_residual": df_res,
        "intercept": {
            "estimate": round(intercept, 6),
            "standard_error": round(se_intercept, 6),
            "t_statistic": round(t_intercept, 6),
            "p_value": round(p_intercept, 6),
            "ci_lower": round(intercept_ci_lower, 6),
            "ci_upper": round(intercept_ci_upper, 6),
        },
        "slope": {
            "estimate": round(slope, 6),
            "standard_error": round(se_slope, 6),
            "t_statistic": round(t_slope, 6),
            "p_value": round(p_slope, 6),
            "ci_lower": round(slope_ci_lower, 6),
            "ci_upper": round(slope_ci_upper, 6),
        },
        "model_fit": {
            "r_squared": round(r_squared, 6),
            "adjusted_r_squared": round(adj_r_squared, 6),
            "residual_standard_error": round(s_e, 6),
            "f_statistic": round(f_stat, 6),
            "f_p_value": round(f_pvalue, 6),
            "is_model_significant": f_pvalue < 0.05,
        },
        "residual_diagnostics": {
            "mean_residual": round(sum(residuals) / n, 8),
            "sum_squared_residuals": round(ss_res, 6),
            "durbin_watson_statistic": round(durbin_watson, 4),
            "autocorrelation_detected": abs(durbin_watson - 2.0) > 0.5,
        },
        "training_summary": {
            "mean_x": round(mean_x, 6),
            "mean_y": round(mean_y, 6),
            "ss_x": round(ss_x, 6),
            "formula": f"y = {round(intercept, 4)} + {round(slope, 4)} * x",
        },
    }


def predict_simple_linear_regression(
    model_result: Dict[str, Any],
    new_x: float,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Computes point prediction y_hat, 95% confidence interval for the mean response,
    and 95% prediction interval for an individual new observation.
    """
    intercept = model_result["intercept"]["estimate"]
    slope = model_result["slope"]["estimate"]
    n = model_result["sample_size"]
    df_res = model_result["degrees_of_freedom_residual"]
    s_e = model_result["model_fit"]["residual_standard_error"]
    mean_x = model_result["training_summary"]["mean_x"]
    ss_x = model_result["training_summary"]["ss_x"]

    y_hat = intercept + slope * new_x

    alpha = 1.0 - confidence_level
    t_crit = t_ppf(1.0 - alpha / 2.0, df_res)

    # Standard error of mean response: s_e * sqrt(1/n + (x0 - mean_x)^2 / ss_x)
    se_mean_response = s_e * math.sqrt((1.0 / n) + ((new_x - mean_x) ** 2) / ss_x)
    mean_ci_lower = y_hat - t_crit * se_mean_response
    mean_ci_upper = y_hat + t_crit * se_mean_response

    # Standard error of single prediction: s_e * sqrt(1 + 1/n + (x0 - mean_x)^2 / ss_x)
    se_prediction = s_e * math.sqrt(1.0 + (1.0 / n) + ((new_x - mean_x) ** 2) / ss_x)
    pred_ci_lower = y_hat - t_crit * se_prediction
    pred_ci_upper = y_hat + t_crit * se_prediction

    return {
        "x_value": new_x,
        "point_prediction_y": round(y_hat, 6),
        "mean_response_ci": {
            "confidence_level": confidence_level,
            "standard_error": round(se_mean_response, 6),
            "ci_lower": round(mean_ci_lower, 6),
            "ci_upper": round(mean_ci_upper, 6),
            "formatted": f"[{round(mean_ci_lower, 4)}, {round(mean_ci_upper, 4)}]",
        },
        "individual_prediction_interval": {
            "confidence_level": confidence_level,
            "standard_error": round(se_prediction, 6),
            "pi_lower": round(pred_ci_lower, 6),
            "pi_upper": round(pred_ci_upper, 6),
            "formatted": f"[{round(pred_ci_lower, 4)}, {round(pred_ci_upper, 4)}]",
        },
    }
