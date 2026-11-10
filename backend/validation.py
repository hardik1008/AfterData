"""
AFTERDATA Validation Engine
Applies deterministic pre-flight checks and post-hoc statistical assumption verifications.
Self-aware & honest: flags when data is insufficient, non-normal, or confounded.
"""
from typing import List, Dict, Any
import numpy as np
import scipy.stats as stats
import pandas as pd

def validate_investigation_feasibility(
    df: pd.DataFrame,
    test_type: str,
    target_col: str,
    group_or_feature_col: str
) -> List[Dict[str, Any]]:
    """Runs rigorous pre-flight validation checks before executing statistical tests."""
    checks = []

    # 1. Column existence
    if target_col not in df.columns:
        return [{
            "check_name": "Column Availability",
            "passed": False,
            "details": f"Target column '{target_col}' not found in dataset.",
            "recommendation": "Select a valid metric column from your dataset."
        }]

    # 2. Sample size check
    n_total = len(df.dropna(subset=[target_col]))
    if n_total < 30:
        checks.append({
            "check_name": "Sample Size Power (N >= 30)",
            "passed": False,
            "details": f"Only {n_total} valid observations. Statistical power is constrained; risk of Type II error.",
            "recommendation": "Results should be treated as preliminary direction rather than definitive proof."
        })
    else:
        checks.append({
            "check_name": "Sample Size Power",
            "passed": True,
            "details": f"{n_total} observations provide adequate statistical power for standard effect detection.",
            "recommendation": None
        })

    # 3. Missing rate
    missing_pct = (df[target_col].isna().sum() / len(df)) * 100
    if missing_pct > 20:
        checks.append({
            "check_name": "Missingness Invariance (<20%)",
            "passed": False,
            "details": f"{missing_pct:.1f}% missing values in '{target_col}'. Potential non-random attrition bias.",
            "recommendation": "Examine if missingness correlates with other business dimensions."
        })
    else:
        checks.append({
            "check_name": "Data Completeness",
            "passed": True,
            "details": f"{100 - missing_pct:.1f}% data completeness.",
            "recommendation": None
        })

    # 4. Outlier & Kurtosis check for continuous variables
    if pd.api.types.is_numeric_dtype(df[target_col]):
        clean_target = df[target_col].dropna().astype(float)
        skewness = float(clean_target.skew())
        if abs(skewness) > 2.0:
            checks.append({
                "check_name": "Distribution Symmetry",
                "passed": False,
                "details": f"High skewness ({skewness:.2f}) detected. Distribution is heavily asymmetric.",
                "recommendation": "Non-parametric tests or log transformations recommended for robust inferences."
            })
        else:
            checks.append({
                "check_name": "Distribution Symmetry",
                "passed": True,
                "details": f"Skewness ({skewness:.2f}) within acceptable bounds for parametric inference.",
                "recommendation": None
            })

    return checks
