"""
CLI & JSON Execution Bridge for the Ten Deterministic Mathematical Modules
Allows backend and server endpoints to execute any module deterministically.
"""

import sys
import os
import json
from typing import Dict, Any

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.modules.mod01_descriptive import compute_descriptive_statistics
from backend.modules.mod02_normal_distribution import (
    compute_z_scores,
    evaluate_normal_probabilities,
)
from backend.modules.mod03_sampling_clt import (
    compute_standard_error,
    simulate_sampling_distribution,
)
from backend.modules.mod04_ci_means import compute_mean_confidence_interval
from backend.modules.mod05_ci_proportions import (
    compute_proportion_confidence_interval,
    compute_sample_size_for_proportion,
)
from backend.modules.mod06_hypothesis_testing import (
    one_sample_t_test,
    welch_two_sample_t_test,
    paired_t_test,
    two_proportion_z_test,
    chi_square_contingency,
    mann_whitney_u_test,
)
from backend.modules.mod07_power_analysis import (
    compute_statistical_power_two_sample,
    compute_sample_size_for_power,
)
from backend.modules.mod08_correlation_covariance import (
    compute_correlation_and_covariance,
)
from backend.modules.mod09_simple_linear_regression import (
    fit_simple_linear_regression,
    predict_simple_linear_regression,
)
from backend.modules.mod10_multiple_linear_regression import (
    fit_multiple_linear_regression,
)


def dispatch(module_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    mod = module_name.lower().replace("-", "_")

    if mod in ("mod01", "mod01_descriptive", "meth_01_descriptive", "descriptive"):
        return compute_descriptive_statistics(
            payload.get("data", []),
            remove_missing=payload.get("remove_missing", True)
        )

    elif mod in ("mod02", "mod02_normal", "meth_02_normal_distribution", "normal"):
        if "values" in payload and "lower_threshold" not in payload and "point_value" not in payload:
            return {"z_scores": compute_z_scores(payload["values"])}
        return evaluate_normal_probabilities(
            mu=payload.get("mu", 0.0),
            sigma=payload.get("sigma", 1.0),
            lower_threshold=payload.get("lower_threshold"),
            upper_threshold=payload.get("upper_threshold"),
            point_value=payload.get("point_value"),
            sample_data=payload.get("sample_data")
        )

    elif mod in ("mod03", "mod03_sampling", "meth_03_sampling_clt", "sampling"):
        if "population_data" in payload:
            return simulate_sampling_distribution(
                population_data=payload["population_data"],
                sample_size=payload.get("sample_size", 30),
                num_replications=payload.get("num_replications", 1000),
                seed=payload.get("seed", 42)
            )
        return compute_standard_error(
            sample_std=payload.get("sample_std", 1.0),
            sample_size=payload.get("sample_size", 30),
            population_size=payload.get("population_size")
        )

    elif mod in ("mod04", "mod04_ci_means", "meth_04_ci_means", "ci_means"):
        return compute_mean_confidence_interval(
            data=payload.get("data", []),
            confidence_level=payload.get("confidence_level", 0.95),
            method=payload.get("method", "t_distribution"),
            bootstrap_replications=payload.get("bootstrap_replications", 2000),
            seed=payload.get("seed", 42)
        )

    elif mod in ("mod05", "mod05_ci_proportions", "meth_05_ci_proportions", "ci_proportions"):
        if "margin_of_error" in payload and "successes" not in payload:
            return compute_sample_size_for_proportion(
                margin_of_error=payload["margin_of_error"],
                confidence_level=payload.get("confidence_level", 0.95),
                estimated_proportion=payload.get("estimated_proportion"),
                population_size=payload.get("population_size")
            )
        return compute_proportion_confidence_interval(
            successes=payload.get("successes", 0),
            total_trials=payload.get("total_trials", 1),
            confidence_level=payload.get("confidence_level", 0.95),
            method=payload.get("method", "wilson")
        )

    elif mod in ("mod06", "mod06_hypothesis_testing", "meth_06_hypothesis_testing", "hypothesis"):
        test_type = payload.get("test_type", "welch")
        if test_type == "one_sample":
            return one_sample_t_test(payload["data"], mu_0=payload.get("mu_0", 0.0))
        elif test_type == "paired":
            return paired_t_test(payload["before"], payload["after"])
        elif test_type == "two_proportion":
            return two_proportion_z_test(payload["k1"], payload["n1"], payload["k2"], payload["n2"])
        elif test_type == "chi_square":
            return chi_square_contingency(payload["table"])
        elif test_type == "mann_whitney":
            return mann_whitney_u_test(payload["group_a"], payload["group_b"])
        else:
            return welch_two_sample_t_test(payload["group_a"], payload["group_b"])

    elif mod in ("mod07", "mod07_power", "meth_07_power_analysis", "power"):
        if "target_effect_size_d" in payload:
            return compute_sample_size_for_power(
                target_effect_size_d=payload["target_effect_size_d"],
                target_power=payload.get("target_power", 0.80),
                alpha=payload.get("alpha", 0.05)
            )
        return compute_statistical_power_two_sample(
            effect_size_d=payload.get("effect_size_d", 0.5),
            sample_size_per_group=payload.get("sample_size_per_group", 30),
            alpha=payload.get("alpha", 0.05)
        )

    elif mod in ("mod08", "mod08_correlation", "meth_08_correlation_cov", "correlation"):
        return compute_correlation_and_covariance(
            x_data=payload.get("x_data", []),
            y_data=payload.get("y_data", []),
            confidence_level=payload.get("confidence_level", 0.95)
        )

    elif mod in ("mod09", "mod09_regression", "meth_09_simple_linear_regression", "simple_regression"):
        if payload.get("predict_x") is not None and "model_result" in payload:
            return predict_simple_linear_regression(
                model_result=payload["model_result"],
                new_x=float(payload["predict_x"]),
                confidence_level=payload.get("confidence_level", 0.95)
            )
        return fit_simple_linear_regression(
            x_data=payload.get("x_data", []),
            y_data=payload.get("y_data", []),
            confidence_level=payload.get("confidence_level", 0.95)
        )

    elif mod in ("mod10", "mod10_multiple_regression", "meth_10_multiple_regression", "multiple_regression"):
        return fit_multiple_linear_regression(
            X_matrix=payload.get("X_matrix", []),
            y_vector=payload.get("y_vector", []),
            predictor_names=payload.get("predictor_names"),
            confidence_level=payload.get("confidence_level", 0.95)
        )

    else:
        raise ValueError(f"Unknown module '{module_name}'.")


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 backend/run_module.py <module_name>"}))
        sys.exit(1)

    module_name = sys.argv[1]
    raw_input = sys.stdin.read()
    payload = json.loads(raw_input) if raw_input.strip() else {}

    try:
        output = dispatch(module_name, payload)
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
