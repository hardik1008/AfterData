"""
Unit Test Suite for AFTERDATA Statistical Decision Engine
Validates all 10 statistical concepts, selection rationale, rejection reasons, and assumption checks.
Runs independently of external LLMs or network services.
"""
import unittest
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.method_registry import METHOD_REGISTRY, list_all_registered_methods
from backend.decision_engine import StatisticalDecisionEngine

class TestStatisticalDecisionEngine(unittest.TestCase):
    def setUp(self):
        self.engine = StatisticalDecisionEngine()

    def test_registry_contains_ten_concepts(self):
        """Verifies that all 10 requested statistical concepts are formally registered."""
        methods = list_all_registered_methods()
        self.assertEqual(len(methods), 10)
        concepts = set(m.concept_number for m in methods)
        self.assertEqual(concepts, set(range(1, 11)))

    def test_cohort_comparison_decision(self):
        """Tests Welch t-test selection and power analysis for continuous target and categorical grouping."""
        dataset_profile = {
            "row_count": 240,
            "columns": [
                {"name": "Monthly_Spend", "inferred_type": "continuous", "null_percentage": 0.0, "skewness": 0.4},
                {"name": "Plan_Tier", "inferred_type": "categorical", "null_percentage": 0.0, "unique_count": 3}
            ],
            "granularity": {"detected_granularity": "Unique entity records", "primary_key_candidate": "Customer_ID"}
        }

        plan = self.engine.evaluate_investigation(
            question_id="Q001",
            question="Do enterprise customers spend more than starter customers?",
            intent="relationship_and_comparison",
            dataset_profile=dataset_profile,
            target_variable="Monthly_Spend",
            predictor_variables=["Plan_Tier"]
        )

        self.assertEqual(plan["status"], "approved")
        selected_ids = [m["method_id"] for m in plan["selected_methods"]]
        self.assertIn("METH_01_DESCRIPTIVE", selected_ids)
        self.assertIn("METH_06_HYPOTHESIS_TESTING", selected_ids)
        self.assertIn("METH_07_POWER_ANALYSIS", selected_ids)
        self.assertIn("METH_04_CI_MEANS", selected_ids)

        # Multiple regression should be rejected because only 1 categorical predictor is given
        rejected_ids = [m["method_id"] for m in plan["rejected_methods"]]
        self.assertIn("METH_10_MULTIPLE_REGRESSION", rejected_ids)

    def test_correlation_and_regression_decision(self):
        """Tests Pearson correlation and OLS simple linear regression selection for two continuous variables."""
        dataset_profile = {
            "row_count": 150,
            "columns": [
                {"name": "Sales", "inferred_type": "continuous", "null_percentage": 0.0, "skewness": 0.1},
                {"name": "Marketing_Spend", "inferred_type": "continuous", "null_percentage": 0.0, "skewness": 0.3}
            ],
            "granularity": {"detected_granularity": "One row per Store_ID", "primary_key_candidate": "Store_ID"}
        }

        plan = self.engine.evaluate_investigation(
            question_id="Q002",
            question="Does marketing spend drive sales?",
            intent="driver_analysis",
            dataset_profile=dataset_profile,
            target_variable="Sales",
            predictor_variables=["Marketing_Spend"]
        )

        selected_ids = [m["method_id"] for m in plan["selected_methods"]]
        self.assertIn("METH_08_CORRELATION_COV", selected_ids)
        self.assertIn("METH_09_SIMPLE_LINEAR_REGRESSION", selected_ids)

        # Hypothesis test for means (t-test) should be rejected (no categorical factor)
        rejected_ids = [m["method_id"] for m in plan["rejected_methods"]]
        self.assertIn("METH_06_HYPOTHESIS_TESTING", rejected_ids)

    def test_multiple_regression_selection(self):
        """Tests Multiple Linear Regression selection when 2+ continuous predictors are provided."""
        dataset_profile = {
            "row_count": 300,
            "columns": [
                {"name": "Sales", "inferred_type": "continuous", "null_percentage": 0.0},
                {"name": "Marketing_Spend", "inferred_type": "continuous", "null_percentage": 0.0},
                {"name": "Store_Size", "inferred_type": "continuous", "null_percentage": 0.0}
            ],
            "granularity": {"detected_granularity": "One row per Store_ID"}
        }

        plan = self.engine.evaluate_investigation(
            question_id="Q003",
            question="Model sales predicted by marketing and store size.",
            intent="driver_analysis",
            dataset_profile=dataset_profile,
            target_variable="Sales",
            predictor_variables=["Marketing_Spend", "Store_Size"]
        )

        selected_ids = [m["method_id"] for m in plan["selected_methods"]]
        self.assertIn("METH_10_MULTIPLE_REGRESSION", selected_ids)

    def test_insufficient_sample_size_rejection(self):
        """Tests that engine rejects investigation when N < 10 to prevent Type II errors."""
        dataset_profile = {
            "row_count": 6,
            "columns": [
                {"name": "Output", "inferred_type": "continuous", "null_percentage": 0.0},
                {"name": "Team", "inferred_type": "categorical", "null_percentage": 0.0}
            ],
            "granularity": {"detected_granularity": "Team records"}
        }

        plan = self.engine.evaluate_investigation(
            question_id="Q004",
            question="Compare team outputs",
            intent="relationship_and_comparison",
            dataset_profile=dataset_profile,
            target_variable="Output",
            predictor_variables=["Team"]
        )

        self.assertEqual(plan["status"], "rejected")
        self.assertTrue(len(plan["missing_requirements"]) > 0)
        self.assertTrue(any("sample size" in req.lower() for req in plan["missing_requirements"]))

    def test_assumption_check_transparency(self):
        """Tests that study design dependent assumptions (like independence) are flagged as unverified when data is event log."""
        dataset_profile = {
            "row_count": 200,
            "columns": [
                {"name": "Latency", "inferred_type": "continuous", "null_percentage": 0.0},
                {"name": "Server", "inferred_type": "categorical", "null_percentage": 0.0}
            ],
            "granularity": {"detected_granularity": "Transaction / Event Log (Multi-row entity records)"}
        }

        plan = self.engine.evaluate_investigation(
            question_id="Q005",
            question="Test latency across servers",
            intent="relationship_and_comparison",
            dataset_profile=dataset_profile,
            target_variable="Latency",
            predictor_variables=["Server"]
        )

        independence_check = next((c for c in plan["assumption_checks"] if c["assumption"] == "Independent Observations"), None)
        self.assertIsNotNone(independence_check)
        self.assertEqual(independence_check["status"], "unverified")
        self.assertEqual(independence_check["source"], "study_design_dependent")

    def test_five_canonical_questions_produce_question_specific_decisions(self):
        """Verifies Prompt 4 requirement: identical dataset yields completely different methods per question."""
        dataset_profile = {
            "row_count": 180,
            "columns": [
                {"name": "revenue", "inferred_type": "continuous", "null_percentage": 0.0, "skewness": 0.2},
                {"name": "conversions", "inferred_type": "continuous", "null_percentage": 0.0},
                {"name": "channel", "inferred_type": "categorical", "null_percentage": 0.0, "unique_count": 2},
                {"name": "launch_period", "inferred_type": "categorical", "null_percentage": 0.0, "unique_count": 2},
                {"name": "date", "inferred_type": "temporal", "null_percentage": 0.0}
            ],
            "granularity": {"detected_granularity": "Daily channel aggregates", "primary_key_candidate": "date_channel"}
        }

        # Question 1: "What was the average revenue?"
        p1 = self.engine.evaluate_investigation(
            "Q1", "What was the average revenue?", "data_exploration", dataset_profile, target_variable="revenue"
        )
        self.assertEqual(p1["archetype"], "DESCRIPTIVE_DISTRIBUTION")
        p1_selected = [m["method_id"] for m in p1["selected_methods"]]
        self.assertIn("METH_01_DESCRIPTIVE", p1_selected)
        self.assertIn("METH_02_NORMAL_DISTRIBUTION", p1_selected)
        self.assertIn("METH_04_CI_MEANS", p1_selected)
        p1_rejected = [m["method_id"] for m in p1["rejected_methods"]]
        self.assertIn("METH_06_HYPOTHESIS_TESTING", p1_rejected)

        # Question 2: "Did revenue increase after the app launch?"
        p2 = self.engine.evaluate_investigation(
            "Q2", "Did revenue increase after the app launch?", "relationship_and_comparison", dataset_profile,
            target_variable="revenue", predictor_variables=["launch_period"]
        )
        self.assertEqual(p2["archetype"], "INTERVENTION_COMPARISON")
        p2_selected = [m["method_id"] for m in p2["selected_methods"]]
        self.assertIn("METH_06_HYPOTHESIS_TESTING", p2_selected)
        self.assertIn("METH_07_POWER_ANALYSIS", p2_selected)

        # Question 3: "Was the increase consistent?"
        p3 = self.engine.evaluate_investigation(
            "Q3", "Was the increase consistent?", "trend_analysis", dataset_profile, target_variable="revenue"
        )
        self.assertEqual(p3["archetype"], "TREND_CONSISTENCY")
        p3_selected = [m["method_id"] for m in p3["selected_methods"]]
        self.assertIn("METH_09_SIMPLE_LINEAR_REGRESSION", p3_selected)
        # Check autocorrelation assumption
        autocorr_check = next((c for c in p3["assumption_checks"] if "Autocorrelation" in c["assumption"]), None)
        self.assertIsNotNone(autocorr_check)

        # Question 4: "Did the app take customers away from the website?"
        p4 = self.engine.evaluate_investigation(
            "Q4", "Did the app take customers away from the website?", "relationship_and_comparison", dataset_profile,
            target_variable="revenue", predictor_variables=["channel"]
        )
        self.assertEqual(p4["archetype"], "CHANNEL_CANNIBALIZATION")
        cannibal_check = next((c for c in p4["assumption_checks"] if c["assumption"] == "Customer-Level Identification Design"), None)
        self.assertIsNotNone(cannibal_check)
        self.assertEqual(cannibal_check["status"], "violated")

        # Question 5: "Which channel converts better?"
        p5 = self.engine.evaluate_investigation(
            "Q5", "Which channel converts better?", "relationship_and_comparison", dataset_profile,
            target_variable="conversions", predictor_variables=["channel"]
        )
        self.assertEqual(p5["archetype"], "PROPORTION_RATE_COMPARISON")
        p5_selected = [m["method_id"] for m in p5["selected_methods"]]
        self.assertIn("METH_05_CI_PROPORTIONS", p5_selected)
        p5_rejected = [m["method_id"] for m in p5["rejected_methods"]]
        self.assertIn("METH_06_HYPOTHESIS_TESTING", p5_rejected)

if __name__ == "__main__":
    unittest.main()
