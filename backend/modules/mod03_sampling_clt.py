"""
Module 3: Sampling and Central Limit Theorem (CLT)
Implements analytical standard error, sampling distributions, simulation with replacement,
and CLT convergence diagnostics and limitations.
"""

import math
import random
from typing import List, Dict, Any, Optional
from .math_utils import normal_cdf


def compute_standard_error(
    sample_std: float,
    sample_size: int,
    population_size: Optional[int] = None
) -> Dict[str, Any]:
    """
    Computes analytical standard error of the mean, with optional finite population correction (FPC).
    """
    if sample_size <= 0:
        raise ValueError("Sample size n must be positive.")
    if sample_std < 0:
        raise ValueError("Standard deviation must be non-negative.")

    base_se = sample_std / math.sqrt(sample_size)
    fpc = 1.0
    has_fpc = False

    if population_size is not None and population_size > sample_size:
        # FPC = sqrt((N - n) / (N - 1))
        fpc = math.sqrt((population_size - sample_size) / (population_size - 1))
        has_fpc = True

    adjusted_se = base_se * fpc

    return {
        "sample_size": sample_size,
        "sample_std": round(sample_std, 6),
        "population_size": population_size,
        "standard_error": round(adjusted_se, 6),
        "unadjusted_standard_error": round(base_se, 6),
        "finite_population_correction_factor": round(fpc, 6) if has_fpc else None,
        "sample_mean_variance": round(adjusted_se ** 2, 8),
    }


def simulate_sampling_distribution(
    population_data: List[float],
    sample_size: int,
    num_replications: int = 1000,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Simulates repeated sampling with replacement to demonstrate CLT convergence empirically.
    Guarantees reproducible results using deterministic seed.
    """
    if not population_data:
        raise ValueError("Population data cannot be empty.")
    if sample_size <= 0:
        raise ValueError("Sample size must be positive.")
    if num_replications <= 1:
        raise ValueError("Replications must be >= 2.")

    rng = random.Random(seed)
    N_pop = len(population_data)
    pop_mean = sum(population_data) / N_pop
    pop_var = sum((x - pop_mean) ** 2 for x in population_data) / N_pop
    pop_std = math.sqrt(pop_var)

    # Parent skewness
    pop_m3 = sum((x - pop_mean) ** 3 for x in population_data) / N_pop
    pop_skew = pop_m3 / (pop_std ** 3) if pop_std > 0 else 0.0

    # Draw replications with replacement
    sample_means: List[float] = []
    for _ in range(num_replications):
        draw = [population_data[rng.randint(0, N_pop - 1)] for _ in range(sample_size)]
        sample_means.append(sum(draw) / sample_size)

    # Moments of the simulated sampling distribution
    sim_mean = sum(sample_means) / num_replications
    sim_var = sum((m - sim_mean) ** 2 for m in sample_means) / (num_replications - 1)
    sim_se = math.sqrt(sim_var)

    sim_m3 = sum((m - sim_mean) ** 3 for m in sample_means) / num_replications
    sim_skew = sim_m3 / (sim_se ** 3) if sim_se > 0 else 0.0

    # Theoretical standard error: sigma / sqrt(n)
    theo_se = pop_std / math.sqrt(sample_size)

    # CLT diagnostics
    clt_holds_well = sample_size >= 30 or (abs(pop_skew) < 0.5 and sample_size >= 15)
    limitations = []
    if sample_size < 30 and abs(pop_skew) >= 1.0:
        limitations.append(
            f"Sample size (n={sample_size}) is below 30 and population is skewed (skew={round(pop_skew, 2)}). "
            f"Sampling distribution of mean may retain residual skewness."
        )
    if N_pop < 20:
        limitations.append(
            f"Parent population size ({N_pop}) is very small; resampling fidelity is constrained."
        )

    return {
        "status": "success",
        "sample_size": sample_size,
        "num_replications": num_replications,
        "population_parameters": {
            "population_size": N_pop,
            "mean": round(pop_mean, 6),
            "std_dev": round(pop_std, 6),
            "skewness": round(pop_skew, 4),
        },
        "theoretical_sampling_distribution": {
            "expected_mean": round(pop_mean, 6),
            "expected_standard_error": round(theo_se, 6),
            "expected_mean_skewness": round(pop_skew / math.sqrt(sample_size), 4) if sample_size > 0 else 0.0,
        },
        "empirical_simulation_results": {
            "simulated_mean": round(sim_mean, 6),
            "simulated_standard_error": round(sim_se, 6),
            "simulated_mean_skewness": round(sim_skew, 4),
            "se_difference_percentage": round(abs(sim_se - theo_se) / theo_se * 100.0, 2) if theo_se > 0 else 0.0,
        },
        "clt_diagnostics": {
            "is_clt_sufficient": clt_holds_well,
            "clt_benchmark_met": sample_size >= 30,
            "limitations": limitations if limitations else ["Sample size is sufficient for normal approximation under CLT."],
        },
    }
