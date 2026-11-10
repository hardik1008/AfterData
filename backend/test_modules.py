"""
Comprehensive Unit Test Suite for All Ten AFTERDATA Deterministic Mathematical Modules
Tests known mathematical answers, edge cases, missing values, small samples,
numerical stability, and output schema conformity.
"""

import unittest
import math

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


class TestModule01Descriptive(unittest.TestCase):
    def test_known_dataset(self):
        # Known textbook sample: [2, 4, 4, 4, 5, 5, 7, 9]
        data = [2, 4, 4, 4, 5, 5, 7, 9]
        res = compute_descriptive_statistics(data)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["valid_count"], 8)
        self.assertEqual(res["mean"], 5.0)
        self.assertEqual(res["median"], 4.5)
        self.assertEqual(res["mode"], 4.0)
        self.assertEqual(res["min"], 2.0)
        self.assertEqual(res["max"], 9.0)
        self.assertEqual(res["range"], 7.0)
        # Sample variance: 32 / 7 = 4.571429
        self.assertAlmostEqual(res["sample_variance"], 4.571429, places=5)
        self.assertAlmostEqual(res["sample_std_dev"], math.sqrt(32 / 7), places=5)

    def test_missing_and_dirty_values(self):
        dirty = [10, None, "NaN", "  ", 20, "null", 30]
        res = compute_descriptive_statistics(dirty)
        self.assertEqual(res["total_count"], 7)
        self.assertEqual(res["valid_count"], 3)
        self.assertEqual(res["missing_count"], 4)
        self.assertAlmostEqual(res["mean"], 20.0, places=5)

    def test_outlier_detection(self):
        # 100 is a clear Tukey IQR outlier
        data = [10, 11, 12, 13, 14, 15, 100]
        res = compute_descriptive_statistics(data)
        outliers = res["outlier_analysis"]["tukey_outliers"]
        self.assertIn(100.0, outliers)

    def test_edge_cases(self):
        # Empty list
        res_empty = compute_descriptive_statistics([])
        self.assertEqual(res_empty["status"], "insufficient_data")
        # Single element
        res_single = compute_descriptive_statistics([42])
        self.assertEqual(res_single["mean"], 42.0)
        self.assertEqual(res_single["sample_variance"], 0.0)


class TestModule02NormalDistribution(unittest.TestCase):
    def test_z_scores(self):
        vals = [10.0, 20.0, 30.0]
        z = compute_z_scores(vals)
        self.assertAlmostEqual(z[0], -1.0, places=5)
        self.assertAlmostEqual(z[1], 0.0, places=5)
        self.assertAlmostEqual(z[2], 1.0, places=5)

    def test_known_normal_probabilities(self):
        # Standard normal: P(Z <= 0) = 0.5, P(Z <= 1.95996) ~ 0.975
        res = evaluate_normal_probabilities(mu=0.0, sigma=1.0, point_value=0.0)
        self.assertAlmostEqual(res["point_evaluation"]["prob_below_x"], 0.5, places=5)

        res_interval = evaluate_normal_probabilities(mu=0.0, sigma=1.0, lower_threshold=-1.0, upper_threshold=1.0)
        # 68.27% within 1 SD
        self.assertAlmostEqual(res_interval["interval_probability"]["prob_between"], 0.682689, places=4)

    def test_normality_audit_defensibility(self):
        # Symmetrical normal-like sample
        symmetric_sample = [-2.0, -1.0, -0.5, 0.0, 0.5, 1.0, 2.0]
        res = evaluate_normal_probabilities(mu=0.0, sigma=1.0, sample_data=symmetric_sample)
        self.assertTrue(res["normality_audit"]["is_normality_defensible"])


class TestModule03SamplingCLT(unittest.TestCase):
    def test_standard_error(self):
        res = compute_standard_error(sample_std=10.0, sample_size=100)
        self.assertEqual(res["standard_error"], 1.0)

    def test_finite_population_correction(self):
        res = compute_standard_error(sample_std=10.0, sample_size=100, population_size=200)
        expected_fpc = math.sqrt(100.0 / 199.0)
        self.assertAlmostEqual(res["finite_population_correction_factor"], expected_fpc, places=5)

    def test_sampling_distribution_simulation_reproducibility(self):
        pop = list(range(1, 101))
        sim1 = simulate_sampling_distribution(pop, sample_size=30, num_replications=200, seed=123)
        sim2 = simulate_sampling_distribution(pop, sample_size=30, num_replications=200, seed=123)
        self.assertEqual(sim1["empirical_simulation_results"]["simulated_mean"], sim2["empirical_simulation_results"]["simulated_mean"])


class TestModule04CIMeans(unittest.TestCase):
    def test_known_t_interval(self):
        # Known sample: [10, 12, 14, 16, 18], n=5, mean=14, s=3.162277, df=4
        # t*(0.025, 4) = 2.776445, SE = 1.41421356, margin = 3.92649
        data = [10.0, 12.0, 14.0, 16.0, 18.0]
        res = compute_mean_confidence_interval(data, confidence_level=0.95, method="t_distribution")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["mean"], 14.0)
        t_int = res["t_interval"]
        self.assertAlmostEqual(t_int["critical_value_t"], 2.776445, places=4)
        self.assertAlmostEqual(t_int["ci_lower"], 14.0 - 3.92649, places=3)
        self.assertAlmostEqual(t_int["ci_upper"], 14.0 + 3.92649, places=3)

    def test_bootstrap_reproducibility(self):
        data = [5.0, 10.0, 15.0, 20.0, 25.0]
        res1 = compute_mean_confidence_interval(data, method="bootstrap", seed=999)
        res2 = compute_mean_confidence_interval(data, method="bootstrap", seed=999)
        self.assertEqual(res1["bootstrap_interval"]["ci_lower"], res2["bootstrap_interval"]["ci_lower"])


class TestModule05CIProportions(unittest.TestCase):
    def test_wilson_interval(self):
        # k = 50, n = 100, 95% CI
        res = compute_proportion_confidence_interval(successes=50, total_trials=100, confidence_level=0.95)
        wilson = res["wilson_interval"]
        self.assertAlmostEqual(wilson["ci_lower"], 0.4038, places=3)
        self.assertAlmostEqual(wilson["ci_upper"], 0.5962, places=3)

    def test_sample_size_formula(self):
        # E = 0.05, p = 0.5, 95% confidence -> required n = 385
        res = compute_sample_size_for_proportion(margin_of_error=0.05, confidence_level=0.95, estimated_proportion=0.5)
        self.assertEqual(res["required_sample_size"], 385)


class TestModule06HypothesisTesting(unittest.TestCase):
    def test_one_sample_t(self):
        data = [10.0, 10.0, 10.0, 10.0]
        res = one_sample_t_test(data, mu_0=10.0)
        self.assertEqual(res["test_statistic_t"], 0.0)
        self.assertEqual(res["p_value"], 1.0)

    def test_welch_t_test_significant(self):
        # Big separation
        group_a = [10.0, 11.0, 12.0, 10.5, 11.5]
        group_b = [20.0, 21.0, 22.0, 20.5, 21.5]
        res = welch_two_sample_t_test(group_a, group_b)
        self.assertTrue(res["is_significant_alpha_05"])
        self.assertLess(res["p_value"], 0.001)

    def test_paired_t_test(self):
        before = [10.0, 12.0, 14.0, 16.0]
        after = [12.0, 14.0, 16.0, 18.0]  # constant +2 change
        res = paired_t_test(before, after)
        self.assertEqual(res["mean_difference"], 2.0)
        self.assertTrue(res["is_significant_alpha_05"])

    def test_chi_square_contingency(self):
        table = [[50, 10], [10, 50]]  # Strong association
        res = chi_square_contingency(table)
        self.assertEqual(res["degrees_of_freedom"], 1)
        self.assertTrue(res["is_significant_alpha_05"])

    def test_mann_whitney_u(self):
        a = [1.0, 2.0, 3.0]
        b = [10.0, 20.0, 30.0]
        res = mann_whitney_u_test(a, b)
        self.assertEqual(res["u_statistic"], 0.0)


class TestModule07PowerAnalysis(unittest.TestCase):
    def test_power_benchmark(self):
        # For d = 0.50 (medium effect) and n = 64 per group, two-sided alpha=0.05 yields ~80% power
        res = compute_statistical_power_two_sample(effect_size_d=0.50, sample_size_per_group=64, alpha=0.05)
        self.assertGreaterEqual(res["statistical_power"], 0.79)
        self.assertTrue(res["is_power_adequate"])

    def test_sample_size_for_power(self):
        res = compute_sample_size_for_power(target_effect_size_d=0.50, target_power=0.80, alpha=0.05)
        # Should be approximately 64 per group
        self.assertIn(res["required_sample_size_per_group"], [63, 64])


class TestModule08CorrelationCovariance(unittest.TestCase):
    def test_perfect_linear_correlation(self):
        x = [1.0, 2.0, 3.0, 4.0, 5.0]
        y = [2.0, 4.0, 6.0, 8.0, 10.0]
        res = compute_correlation_and_covariance(x, y)
        self.assertAlmostEqual(res["pearson_correlation_r"], 1.0, places=5)
        self.assertAlmostEqual(res["spearman_rank_correlation_rho"], 1.0, places=5)
        self.assertAlmostEqual(res["sample_covariance"], 5.0, places=5)

    def test_zero_correlation(self):
        # Symmetrical square pattern
        x = [-1.0, 1.0, -1.0, 1.0]
        y = [-1.0, -1.0, 1.0, 1.0]
        res = compute_correlation_and_covariance(x, y)
        self.assertAlmostEqual(res["pearson_correlation_r"], 0.0, places=5)


class TestModule09SimpleLinearRegression(unittest.TestCase):
    def test_known_line(self):
        # y = 1.0 + 2.0 * x
        x = [1.0, 2.0, 3.0, 4.0, 5.0]
        y = [3.0, 5.0, 7.0, 9.0, 11.0]
        res = fit_simple_linear_regression(x, y)
        self.assertEqual(res["status"], "success")
        self.assertAlmostEqual(res["intercept"]["estimate"], 1.0, places=5)
        self.assertAlmostEqual(res["slope"]["estimate"], 2.0, places=5)
        self.assertAlmostEqual(res["model_fit"]["r_squared"], 1.0, places=5)

        # Test prediction at x = 6
        pred = predict_simple_linear_regression(res, new_x=6.0)
        self.assertAlmostEqual(pred["point_prediction_y"], 13.0, places=5)

    def test_constant_x_error(self):
        x = [5.0, 5.0, 5.0]
        y = [1.0, 2.0, 3.0]
        with self.assertRaises(ValueError):
            fit_simple_linear_regression(x, y)


class TestModule10MultipleLinearRegression(unittest.TestCase):
    def test_known_plane(self):
        # y = 5.0 + 2.0 * x1 + 3.0 * x2
        X = [
            [1.0, 1.0],
            [1.0, 2.0],
            [2.0, 1.0],
            [2.0, 2.0],
            [3.0, 3.0],
            [4.0, 2.0],
        ]
        y = [10.0, 13.0, 12.0, 15.0, 20.0, 19.0]
        res = fit_multiple_linear_regression(X, y, predictor_names=["spend", "visits"])
        self.assertEqual(res["status"], "success")
        coefs = {c["term"]: c["estimate"] for c in res["coefficients"]}
        self.assertAlmostEqual(coefs["(Intercept)"], 5.0, places=5)
        self.assertAlmostEqual(coefs["spend"], 2.0, places=5)
        self.assertAlmostEqual(coefs["visits"], 3.0, places=5)
        self.assertAlmostEqual(res["model_fit"]["r_squared"], 1.0, places=5)

    def test_collinear_predictors_error(self):
        # x2 is exactly 2 * x1
        X = [
            [1.0, 2.0],
            [2.0, 4.0],
            [3.0, 6.0],
            [4.0, 8.0],
        ]
        y = [5.0, 10.0, 15.0, 20.0]
        with self.assertRaises(ValueError):
            fit_multiple_linear_regression(X, y)


if __name__ == "__main__":
    unittest.main()
