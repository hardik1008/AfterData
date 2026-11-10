"""
Unit Tests for Module 12: Mathematical Decision & Optimisation Solver
Verifies mathematical correctness, constraint satisfaction, KKT conditions, and infeasibility handling.
"""
import unittest
import math
from backend.modules.mod12_mathematical_decision_solver import (
    solve_diminishing_returns_kkt,
    solve_bounded_lp
)

class TestMathematicalDecisionSolver(unittest.TestCase):
    def setUp(self):
        self.sample_vars = [
            {
                "id": "v1",
                "name": "Website Marketing",
                "min_bound": 100000.0,
                "max_bound": 600000.0,
                "expected_return": 120.0
            },
            {
                "id": "v2",
                "name": "App Marketing",
                "min_bound": 100000.0,
                "max_bound": 700000.0,
                "expected_return": 180.0
            },
            {
                "id": "v3",
                "name": "Direct Search",
                "min_bound": 50000.0,
                "max_bound": 400000.0,
                "expected_return": 90.0
            }
        ]
        self.total_budget = 1000000.0
        self.baseline = 500000.0

    def test_kkt_solver_feasible_solution(self):
        """Verify feasible KKT solution satisfies budget cap and individual bounds."""
        res = solve_diminishing_returns_kkt(self.sample_vars, self.total_budget, self.baseline)
        self.assertTrue(res["is_feasible"])
        self.assertGreater(res["simulated_outcome"], self.baseline)
        self.assertGreater(res["expected_lift"], 0)

        # Budget constraint satisfaction
        total_allocated = res["total_allocated"]
        self.assertLessEqual(total_allocated, self.total_budget + 10.0)

        # Bounds satisfaction
        for alloc in res["allocations"]:
            var_def = next(v for v in self.sample_vars if v["id"] == alloc["id"])
            self.assertGreaterEqual(alloc["allocated"], var_def["min_bound"] - 1.0)
            self.assertLessEqual(alloc["allocated"], var_def["max_bound"] + 1.0)

        # Marginal return equalization: higher beta should receive more allocation
        v2_alloc = next(a["allocated"] for a in res["allocations"] if a["id"] == "v2")
        v1_alloc = next(a["allocated"] for a in res["allocations"] if a["id"] == "v1")
        self.assertGreater(v2_alloc, v1_alloc, "Variable with higher return parameter must receive higher allocation under concave KKT.")

    def test_infeasible_constraints_detected(self):
        """Verify solver detects when sum of min bounds exceeds total budget."""
        infeasible_budget = 200000.0 # sum of min bounds is 100k + 100k + 50k = 250k
        res = solve_diminishing_returns_kkt(self.sample_vars, infeasible_budget, self.baseline)
        self.assertFalse(res["is_feasible"])
        self.assertIn("exceeds total budget", res["infeasibility_reason"])

    def test_unconstrained_at_max_bounds(self):
        """Verify solver sets all variables to max when budget exceeds sum of max bounds."""
        large_budget = 5000000.0
        res = solve_diminishing_returns_kkt(self.sample_vars, large_budget, self.baseline)
        self.assertTrue(res["is_feasible"])
        for alloc in res["allocations"]:
            var_def = next(v for v in self.sample_vars if v["id"] == alloc["id"])
            self.assertEqual(alloc["allocated"], var_def["max_bound"])
            self.assertTrue(alloc["is_at_max"])

    def test_bounded_linear_programming(self):
        """Verify greedy bounded LP allocates first to highest return variables."""
        lp_vars = [
            {"id": "a", "name": "A", "min_bound": 10.0, "max_bound": 50.0, "expected_return": 5.0},
            {"id": "b", "name": "B", "min_bound": 10.0, "max_bound": 50.0, "expected_return": 10.0},
        ]
        budget = 70.0
        res = solve_bounded_lp(lp_vars, budget, 100.0)
        self.assertTrue(res["is_feasible"])
        alloc_b = next(a["allocated"] for a in res["allocations"] if a["id"] == "b")
        alloc_a = next(a["allocated"] for a in res["allocations"] if a["id"] == "a")

        # B has higher return (10 vs 5), so B should hit max_bound (50), and A gets remainder (20)
        self.assertEqual(alloc_b, 50.0)
        self.assertEqual(alloc_a, 20.0)
        self.assertEqual(res["total_allocated"], 70.0)

    def test_empty_variables_handling(self):
        """Verify graceful handling when no variables provided."""
        res = solve_diminishing_returns_kkt([], 1000.0, 100.0)
        self.assertFalse(res["is_feasible"])

if __name__ == "__main__":
    unittest.main()
