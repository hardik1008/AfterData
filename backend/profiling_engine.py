"""
AFTERDATA Python Ingestion & Profiling Engine
Deterministic profiling pipeline using Pandas, NumPy, and SciPy.
Operates completely independently of any LLM.
"""
from typing import Dict, Any, List, Optional
import re
import pandas as pd
import numpy as np
from datetime import datetime

def profile_dataframe(df: pd.DataFrame, filename: str = "dataset.csv", sheet_name: Optional[str] = None) -> Dict[str, Any]:
    row_count = len(df)
    columns = list(df.columns)
    column_count = len(columns)

    # 1. Duplicate rows
    duplicate_count = int(df.duplicated().sum())
    duplicate_percentage = float(round((duplicate_count / max(row_count, 1)) * 100, 1))
    duplicate_sample_indices = df[df.duplicated()].index.tolist()[:10]

    date_columns = []
    numeric_columns = []
    categorical_columns = []
    identifier_candidates = []
    data_quality_issues = []
    column_profiles = []

    total_missing_cells = int(df.isna().sum().sum())
    global_missing_pct = float(round((total_missing_cells / max(row_count * column_count, 1)) * 100, 1))
    columns_with_nulls = []

    # Global duplicate issue
    if duplicate_count > 0:
        data_quality_issues.append({
            "id": "issue_duplicates",
            "severity": "critical" if duplicate_percentage > 5 else "warning",
            "category": "duplicates",
            "title": "Exact Duplicate Rows Detected",
            "description": f"Found {duplicate_count} identical records ({duplicate_percentage}% of total dataset).",
            "affected_row_count": duplicate_count,
            "affected_row_percentage": duplicate_percentage,
            "recommendation": "Preserve raw data. Investigate whether duplicates reflect repeated exports or duplicate transactions."
        })

    for col in columns:
        series = df[col]
        non_nulls = series.dropna()
        null_count = int(series.isna().sum())
        null_pct = float(round((null_count / max(row_count, 1)) * 100, 1))

        if null_count > 0:
            columns_with_nulls.append({"column": str(col), "count": null_count, "percentage": null_pct})

        unique_count = int(non_nulls.nunique())
        is_constant = unique_count <= 1

        # Type inference
        inferred = "categorical"
        if pd.api.types.is_datetime64_any_dtype(series):
            inferred = "temporal"
            date_columns.append(str(col))
        elif pd.api.types.is_numeric_dtype(series):
            is_numeric_metric = bool(re.search(r'(score|nps|ticket|count|item|rating|spend|revenue|value|hour|minute|day|age|loss|error|rate|pct|percent)', str(col), re.IGNORECASE))
            if unique_count <= 5 and row_count > 30 and not is_numeric_metric:
                inferred = "categorical"
                categorical_columns.append(str(col))
            else:
                inferred = "continuous"
                numeric_columns.append(str(col))
        else:
            # Test date parsing
            try:
                sample_parsed = pd.to_datetime(non_nulls.iloc[:20])
                inferred = "temporal"
                date_columns.append(str(col))
            except Exception:
                if null_count == 0 and unique_count == row_count and row_count > 10:
                    inferred = "identifier"
                    identifier_candidates.append(str(col))
                else:
                    inferred = "categorical"
                    categorical_columns.append(str(col))

        col_profile: Dict[str, Any] = {
            "name": str(col),
            "inferred_type": inferred,
            "non_null_count": int(len(non_nulls)),
            "null_count": null_count,
            "null_percentage": null_pct,
            "unique_count": unique_count,
            "is_constant": is_constant,
            "is_identifier": bool(inferred == "identifier")
        }

        # Outlier detection using Tukey's IQR for numeric columns
        if inferred == "continuous" and len(non_nulls) > 0:
            nums = non_nulls.astype(float)
            q1 = float(nums.quantile(0.25))
            q3 = float(nums.quantile(0.75))
            iqr = q3 - q1
            lower_fence = q1 - 1.5 * iqr
            upper_fence = q3 + 1.5 * iqr

            outliers_series = nums[(nums < lower_fence) | (nums > upper_fence)]
            outlier_count = int(len(outliers_series))
            outlier_pct = float(round((outlier_count / max(len(nums), 1)) * 100, 1))

            col_profile["min_value"] = float(nums.min())
            col_profile["max_value"] = float(nums.max())
            col_profile["mean_value"] = float(round(nums.mean(), 2))
            col_profile["std_value"] = float(round(nums.std(), 2))
            col_profile["q1"] = q1
            col_profile["q3"] = q3
            col_profile["iqr"] = iqr

            if outlier_count > 0:
                col_profile["outliers"] = {
                    "count": outlier_count,
                    "percentage": outlier_pct,
                    "lower_fence": lower_fence,
                    "upper_fence": upper_fence
                }
                if outlier_pct >= 2.0:
                    data_quality_issues.append({
                        "id": f"issue_outlier_{col}",
                        "severity": "warning" if outlier_pct > 8.0 else "advisory",
                        "category": "outliers",
                        "title": f"Tukey Outliers in {col}",
                        "description": f"Found {outlier_count} values ({outlier_pct}%) outside fences [{lower_fence:.1f}, {upper_fence:.1f}].",
                        "affected_column": str(col),
                        "affected_row_count": outlier_count,
                        "affected_row_percentage": outlier_pct,
                        "recommendation": "Review potential extreme events or entry anomalies before parametric testing."
                    })

        # Constant column issue
        if is_constant and row_count > 5:
            data_quality_issues.append({
                "id": f"issue_constant_{col}",
                "severity": "warning",
                "category": "constant_column",
                "title": f"Zero-Variance Field {col}",
                "description": f"Column contains only 1 distinct value across all rows.",
                "affected_column": str(col),
                "affected_row_count": row_count,
                "affected_row_percentage": 100.0,
                "recommendation": "Constant fields cannot explain variation in target business metrics."
            })

        # High missingness issue
        if null_pct > 20:
            data_quality_issues.append({
                "id": f"issue_missing_{col}",
                "severity": "critical" if null_pct > 50 else "warning",
                "category": "missing_data",
                "title": f"High Missingness in {col} ({null_pct}%)",
                "description": f"{null_count} cells missing. Potential attrition or reporting bias.",
                "affected_column": str(col),
                "affected_row_count": null_count,
                "affected_row_percentage": null_pct,
                "recommendation": "Never silently impute as 0. Evaluate whether missingness correlates with other factors."
            })

        column_profiles.append(col_profile)

    # Time coverage & Partial period detection
    time_coverage: Dict[str, Any] = {"has_temporal_data": False, "has_partial_period": False}
    if date_columns:
        date_col = date_columns[0]
        try:
            d_series = pd.to_datetime(df[date_col].dropna()).sort_values()
            if len(d_series) >= 5:
                start_d = str(d_series.iloc[0].date())
                end_d = str(d_series.iloc[-1].date())
                monthly_counts = d_series.dt.to_period("M").value_counts().sort_index()

                has_partial = False
                details = None
                if len(monthly_counts) >= 3:
                    prior_avg = float(monthly_counts.iloc[:-1].mean())
                    last_count = float(monthly_counts.iloc[-1])
                    if last_count < prior_avg * 0.4 and prior_avg >= 10:
                        has_partial = True
                        details = f"Final period {monthly_counts.index[-1]} volume ({int(last_count)}) is <40% of preceding average ({int(prior_avg)})."
                        data_quality_issues.append({
                            "id": "issue_partial_period",
                            "severity": "warning",
                            "category": "partial_period",
                            "title": "Possible Partial Period Detected",
                            "description": details,
                            "affected_column": date_col,
                            "affected_row_count": int(last_count),
                            "affected_row_percentage": float(round((last_count / row_count) * 100, 1)),
                            "recommendation": "Exclude the incomplete period from cumulative or trend analysis."
                        })

                time_coverage = {
                    "has_temporal_data": True,
                    "date_column": date_col,
                    "start_date": start_d,
                    "end_date": end_d,
                    "has_partial_period": has_partial,
                    "partial_period_details": details
                }
        except Exception:
            pass

    # Row-level granularity
    granularity = {
        "detected_granularity": f"One row per {identifier_candidates[0]}" if identifier_candidates else "Event/Transaction Log",
        "primary_key_candidate": identifier_candidates[0] if identifier_candidates else None,
        "uniqueness_ratio": 1.0 if identifier_candidates else 0.0
    }

    return {
        "dataset_id": "dataset_" + datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
        "filename": filename,
        "sheet_name": sheet_name,
        "row_count": row_count,
        "column_count": column_count,
        "columns": column_profiles,
        "date_columns": date_columns,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "identifier_candidates": identifier_candidates,
        "missing_values": {
            "total_missing_cells": total_missing_cells,
            "global_missing_percentage": global_missing_pct,
            "columns_with_nulls": columns_with_nulls
        },
        "duplicate_count": duplicate_count,
        "duplicate_percentage": duplicate_percentage,
        "sample_duplicate_row_indices": duplicate_sample_indices,
        "data_quality_issues": data_quality_issues,
        "time_coverage": time_coverage,
        "granularity": granularity
    }
