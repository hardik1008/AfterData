"""
AFTERDATA Statistical Method Registry
Central deterministic registry implementing the 10 core statistical concepts.
Works completely independently of Gemini or any other LLM.
"""
from typing import Dict, Any, List, Callable, Optional
from dataclasses import dataclass, field
import math

@dataclass
class MethodRegistration:
    method_id: str
    name: str
    concept_number: int  # 1 to 10
    objective: str
    supported_variable_types: List[str]
    minimum_sample_size: int
    required_variable_count: int
    assumptions: List[Dict[str, Any]]
    diagnostics: List[str]
    limitations: List[str]
    result_schema: Dict[str, str]

METHOD_REGISTRY: Dict[str, MethodRegistration] = {
    # 1. Descriptive Statistics
    "METH_01_DESCRIPTIVE": MethodRegistration(
        method_id="METH_01_DESCRIPTIVE",
        name="Descriptive Summary & Central Tendency",
        concept_number=1,
        objective="Calculate central location, dispersion, and shape of a numeric distribution.",
        supported_variable_types=["continuous"],
        minimum_sample_size=3,
        required_variable_count=1,
        assumptions=[
            {"name": "Measurement Scale", "verifiable_from_data": True, "description": "Variable is interval or ratio scaled."},
            {"name": "Valid Domain", "verifiable_from_data": True, "description": "Observations fall within plausible bounds."}
        ],
        diagnostics=["Skewness check", "Kurtosis check", "Missingness rate"],
        limitations=["Describes sample only; does not infer population parameters or causation."],
        result_schema={
            "mean": "float", "median": "float", "std_dev": "float", "variance": "float",
            "q1": "float", "q3": "float", "iqr": "float", "skewness": "float"
        }
    ),

    # 2. Probability and Normal Distribution
    "METH_02_NORMAL_DISTRIBUTION": MethodRegistration(
        method_id="METH_02_NORMAL_DISTRIBUTION",
        name="Probability Modeling & Gaussian Normality Test",
        concept_number=2,
        objective="Evaluate alignment of sample distribution with the theoretical Normal model.",
        supported_variable_types=["continuous"],
        minimum_sample_size=8,
        required_variable_count=1,
        assumptions=[
            {"name": "Continuous Support", "verifiable_from_data": True, "description": "Data can take any real value in an interval."},
            {"name": "Unimodal Shape", "verifiable_from_data": True, "description": "Single dominant peak in frequency distribution."}
        ],
        diagnostics=["Tukey IQR fence", "Z-score outlier audit (|z| >= 3)", "D'Agostino-Pearson skewness test"],
        limitations=["Strict normality rarely holds in real business data; robust to minor deviations when N is large."],
        result_schema={
            "z_scores_outliers_count": "int", "is_approximately_normal": "bool",
            "empirical_68_pct": "float", "empirical_95_pct": "float"
        }
    ),

    # 3. Sampling and Central Limit Theorem
    "METH_03_SAMPLING_CLT": MethodRegistration(
        method_id="METH_03_SAMPLING_CLT",
        name="Sampling Distribution & Central Limit Theorem Assessment",
        concept_number=3,
        objective="Evaluate standard error of the mean and sampling distribution convergence.",
        supported_variable_types=["continuous"],
        minimum_sample_size=30,
        required_variable_count=1,
        assumptions=[
            {"name": "Independent Observations", "verifiable_from_data": False, "description": "Sample elements are independently drawn (study design dependent)."},
            {"name": "Finite Variance", "verifiable_from_data": True, "description": "Population standard deviation exists and is finite."}
        ],
        diagnostics=["Sample size N >= 30 check", "Heavy tail / Pareto distribution screening"],
        limitations=["CLT guarantees normality of sample mean, NOT of raw observations."],
        result_schema={"standard_error_mean": "float", "clt_convergence_status": "str", "sample_size": "int"}
    ),

    # 4. Confidence Intervals for Means
    "METH_04_CI_MEANS": MethodRegistration(
        method_id="METH_04_CI_MEANS",
        name="Student's t Confidence Interval for Population Mean",
        concept_number=4,
        objective="Estimate the true population mean with 95% confidence interval bounds.",
        supported_variable_types=["continuous"],
        minimum_sample_size=5,
        required_variable_count=1,
        assumptions=[
            {"name": "Independent Sampling", "verifiable_from_data": False, "description": "Sampling units do not cluster or repeat (design dependent)."},
            {"name": "Approximate Normality or N >= 30", "verifiable_from_data": True, "description": "Sample distribution is non-extreme or sample size is large."}
        ],
        diagnostics=["Student t degrees of freedom", "Margin of error relative to mean"],
        limitations=["Confidence level applies to repeated hypothetical sampling, not the specific single interval."],
        result_schema={"confidence_level": "float", "point_estimate": "float", "ci_lower": "float", "ci_upper": "float", "margin_of_error": "float"}
    ),

    # 5. Confidence Intervals for Proportions and Sample Size
    "METH_05_CI_PROPORTIONS": MethodRegistration(
        method_id="METH_05_CI_PROPORTIONS",
        name="Wilson / Wald Confidence Interval for Binary Proportions",
        concept_number=5,
        objective="Estimate true population proportion and assess minimum sample size adequacy.",
        supported_variable_types=["boolean", "categorical"],
        minimum_sample_size=20,
        required_variable_count=1,
        assumptions=[
            {"name": "Binomial Trials", "verifiable_from_data": True, "description": "Each observation is binary (success or failure)."},
            {"name": "Success-Failure Condition", "verifiable_from_data": True, "description": "np >= 5 and n(1-p) >= 5 for normal approximation."}
        ],
        diagnostics=["Minimum expected count check", "Wilson score continuity adjustment"],
        limitations=["Wald interval degrades near 0% or 100%; Wilson score adjustment required."],
        result_schema={"proportion": "float", "ci_lower": "float", "ci_upper": "float", "required_sample_size_95": "int"}
    ),

    # 6. Hypothesis Testing for Means and Proportions
    "METH_06_HYPOTHESIS_TESTING": MethodRegistration(
        method_id="METH_06_HYPOTHESIS_TESTING",
        name="Welch's Two-Sample t-Test & Chi-Square Independence",
        concept_number=6,
        objective="Test null hypothesis of equal means across two cohorts without assuming equal variance.",
        supported_variable_types=["continuous", "categorical"],
        minimum_sample_size=10,
        required_variable_count=2,
        assumptions=[
            {"name": "Independent Groups", "verifiable_from_data": False, "description": "Group membership is mutually exclusive and unclustered."},
            {"name": "Continuous Outcome", "verifiable_from_data": True, "description": "Target metric is continuous numeric."},
            {"name": "Heteroscedasticity Robustness", "verifiable_from_data": True, "description": "Welch correction applied to handle unequal variance."}
        ],
        diagnostics=["Subgroup sample sizes n1, n2 >= 5", "Welch-Satterthwaite degrees of freedom"],
        limitations=["Rejection of H0 proves statistical difference, not business importance or root causation."],
        result_schema={"test_statistic": "float", "p_value": "float", "null_hypothesis": "str", "decision": "str", "mean_difference": "float"}
    ),

    # 7. P-values, Type I/II Errors and Power
    "METH_07_POWER_ANALYSIS": MethodRegistration(
        method_id="METH_07_POWER_ANALYSIS",
        name="Statistical Power, Effect Size (Cohen's d) & Error Risk Audit",
        concept_number=7,
        objective="Calculate standardized effect magnitude, post-hoc statistical power, and Type II error risk.",
        supported_variable_types=["continuous", "categorical"],
        minimum_sample_size=10,
        required_variable_count=2,
        assumptions=[
            {"name": "Fixed Alpha", "verifiable_from_data": True, "description": "Significance threshold alpha fixed at 0.05 prior to testing."},
            {"name": "Symmetric Two-Tailed Test", "verifiable_from_data": True, "description": "Evaluates both positive and negative deviations."}
        ],
        diagnostics=["Cohen's d magnitude (<0.2 small, 0.5 moderate, >0.8 large)", "Power estimate (1 - beta)"],
        limitations=["Low power (N < 30) risks false negatives (Type II error)."],
        result_schema={"cohens_d": "float", "observed_power": "float", "type_i_alpha": "float", "type_ii_beta": "float"}
    ),

    # 8. Correlation and Covariance
    "METH_08_CORRELATION_COV": MethodRegistration(
        method_id="METH_08_CORRELATION_COV",
        name="Pearson Product-Moment & Spearman Rank Correlation",
        concept_number=8,
        objective="Quantify direction and linear/monotonic strength of association between two continuous variables.",
        supported_variable_types=["continuous"],
        minimum_sample_size=6,
        required_variable_count=2,
        assumptions=[
            {"name": "Paired Observations", "verifiable_from_data": True, "description": "Each row represents a joint measurement on the same entity."},
            {"name": "Linearity (Pearson)", "verifiable_from_data": True, "description": "Relationship follows a linear trajectory."}
        ],
        diagnostics=["Fisher z-transformation 95% CI", "Bivariate leverage outlier audit"],
        limitations=["Correlation does NOT equal causation. Confounding third variables may drive both."],
        result_schema={"pearson_r": "float", "spearman_rho": "float", "covariance": "float", "p_value": "float", "ci_95": "List[float]"}
    ),

    # 9. Simple Linear Regression
    "METH_09_SIMPLE_LINEAR_REGRESSION": MethodRegistration(
        method_id="METH_09_SIMPLE_LINEAR_REGRESSION",
        name="Ordinary Least Squares (OLS) Simple Linear Regression",
        concept_number=9,
        objective="Model linear relationship Y = beta0 + beta1 * X + epsilon and quantify R-squared variance explained.",
        supported_variable_types=["continuous"],
        minimum_sample_size=8,
        required_variable_count=2,
        assumptions=[
            {"name": "Linearity", "verifiable_from_data": True, "description": "Expected value of Y is a linear function of X."},
            {"name": "Homoscedasticity", "verifiable_from_data": True, "description": "Residual variance is constant across values of X."},
            {"name": "Residual Normality", "verifiable_from_data": True, "description": "Errors follow approximate zero-mean normal distribution."}
        ],
        diagnostics=["R-squared metric", "Residual standard error (RSE)", "Slope t-statistic and p-value"],
        limitations=["Extrapolation outside observed X range is mathematically invalid and untrustworthy."],
        result_schema={"slope": "float", "intercept": "float", "r_squared": "float", "f_statistic": "float", "p_value": "float"}
    ),

    # 10. Multiple Linear Regression
    "METH_10_MULTIPLE_REGRESSION": MethodRegistration(
        method_id="METH_10_MULTIPLE_REGRESSION",
        name="Ordinary Least Squares (OLS) Multiple Linear Regression",
        concept_number=10,
        objective="Model Y using multiple predictor variables (X1, X2, ...) controlling for mutual confounding.",
        supported_variable_types=["continuous"],
        minimum_sample_size=15,
        required_variable_count=3,
        assumptions=[
            {"name": "No Multicollinearity", "verifiable_from_data": True, "description": "Predictors are not collinear (VIF < 5.0)."},
            {"name": "Sample Ratio", "verifiable_from_data": True, "description": "At least 10–15 observations per predictor variable."}
        ],
        diagnostics=["Adjusted R-squared", "Overall Model F-test", "Coefficients p-values"],
        limitations=["Omitted variable bias can distort coefficient signs and magnitudes."],
        result_schema={"coefficients": "Dict[str, float]", "adj_r_squared": "float", "f_statistic": "float", "overall_p_value": "float"}
    ),
}

def get_registered_method(method_id: str) -> Optional[MethodRegistration]:
    return METHOD_REGISTRY.get(method_id)

def list_all_registered_methods() -> List[MethodRegistration]:
    return list(METHOD_REGISTRY.values())
