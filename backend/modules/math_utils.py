"""
High-Precision Mathematical and Statistical Utility Functions
Self-contained, reproducible numerical algorithms implementing distributions,
linear algebra, and numerical quadrature with zero mandatory external C-extensions.
Optional imports for scipy.stats and numpy are used when present in production.
"""

import math
from typing import List, Tuple, Optional

# Optional native imports if available in production environment
try:
    import numpy as np  # type: ignore
    HAS_NUMPY = True
except ImportError:
    np = None  # type: ignore
    HAS_NUMPY = False

try:
    import scipy.stats as sp_stats  # type: ignore
    HAS_SCIPY = True
except ImportError:
    sp_stats = None  # type: ignore
    HAS_SCIPY = False


def normal_pdf(x: float, mu: float = 0.0, sigma: float = 1.0) -> float:
    """Standard or general normal probability density function."""
    if sigma <= 0:
        raise ValueError("Standard deviation sigma must be positive.")
    z = (x - mu) / sigma
    return (1.0 / (sigma * math.sqrt(2.0 * math.pi))) * math.exp(-0.5 * z * z)


def normal_cdf(x: float, mu: float = 0.0, sigma: float = 1.0) -> float:
    """Cumulative distribution function for N(mu, sigma^2)."""
    if sigma <= 0:
        raise ValueError("Standard deviation sigma must be positive.")
    z = (x - mu) / (sigma * math.sqrt(2.0))
    return 0.5 * (1.0 + math.erf(z))


def normal_ppf(p: float, mu: float = 0.0, sigma: float = 1.0) -> float:
    """
    Inverse of the normal cumulative distribution function (quantile function).
    High-precision rational approximation (Peter J. Acklam algorithm).
    Accurate to within 1.15e-9 across the entire domain (0, 1).
    """
    if not (0.0 < p < 1.0):
        if p == 0.0:
            return -float("inf")
        if p == 1.0:
            return float("inf")
        raise ValueError("Probability p must be in (0, 1).")

    if HAS_SCIPY:
        return float(sp_stats.norm.ppf(p, loc=mu, scale=sigma))

    # Coefficients in rational approximations
    a = [
        -3.969683028665376e01,
        2.209460984245205e02,
        -2.759285104469687e02,
        1.383577518672690e02,
        -3.066479806614716e01,
        2.506628277459239e00,
    ]
    b = [
        -5.447609879822406e01,
        1.615858368580409e02,
        -1.556989798598866e02,
        6.680131188771972e01,
        -1.328068155288572e01,
    ]
    c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e00,
        -2.549732539343734e00,
        4.374664141464968e00,
        2.938163982698783e00,
    ]
    d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e00,
        3.754408661907416e00,
    ]

    p_low = 0.02425
    p_high = 1.0 - p_low

    if p < p_low:
        q = math.sqrt(-2.0 * math.log(p))
        z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / (
            (((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0
        )
    elif p <= p_high:
        q = p - 0.5
        r = q * q
        z = (
            (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5])
            * q
            / (
                (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)
            )
        )
    else:
        q = math.sqrt(-2.0 * math.log(1.0 - p))
        z = -(
            ((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]
        ) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)

    return mu + z * sigma


def _inc_beta_cf(a: float, b: float, x: float) -> float:
    """Continued fraction expansion for regularized incomplete beta function."""
    max_iter = 200
    eps = 3.0e-12
    qab = a + b
    qap = a + 1.0
    qam = a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < 1.0e-30:
        d = 1.0e-30
    d = 1.0 / d
    h = d
    for m in range(1, max_iter + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < 1.0e-30:
            d = 1.0e-30
        c = 1.0 + aa / c
        if abs(c) < 1.0e-30:
            c = 1.0e-30
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < 1.0e-30:
            d = 1.0e-30
        c = 1.0 + aa / c
        if abs(c) < 1.0e-30:
            c = 1.0e-30
        d = 1.0 / d
        del_h = d * c
        h *= del_h
        if abs(del_h - 1.0) < eps:
            break
    return h


def betainc(a: float, b: float, x: float) -> float:
    """Regularized incomplete beta function I_x(a, b)."""
    if x < 0.0 or x > 1.0:
        raise ValueError("x must be in [0, 1] for betainc.")
    if x == 0.0:
        return 0.0
    if x == 1.0:
        return 1.0

    # ln(Beta(a, b)) = lgamma(a) + lgamma(b) - lgamma(a + b)
    bt = math.exp(
        math.lgamma(a + b)
        - math.lgamma(a)
        - math.lgamma(b)
        + a * math.log(x)
        + b * math.log(1.0 - x)
    )
    if x < (a + 1.0) / (a + b + 2.0):
        return bt * _inc_beta_cf(a, b, x) / a
    else:
        return 1.0 - bt * _inc_beta_cf(b, a, 1.0 - x) / b


def t_cdf(t_val: float, df: float) -> float:
    """Cumulative distribution function for Student's t-distribution."""
    if df <= 0:
        raise ValueError("Degrees of freedom df must be positive.")
    if HAS_SCIPY:
        return float(sp_stats.t.cdf(t_val, df))

    x = df / (df + t_val * t_val)
    prob = 0.5 * betainc(0.5 * df, 0.5, x)
    if t_val >= 0:
        return 1.0 - prob
    else:
        return prob


def t_ppf(p: float, df: float) -> float:
    """Quantile function (inverse CDF) for Student's t-distribution."""
    if not (0.0 < p < 1.0):
        if p == 0.0:
            return -float("inf")
        if p == 1.0:
            return float("inf")
        raise ValueError("Probability p must be in (0, 1).")
    if df <= 0:
        raise ValueError("Degrees of freedom df must be positive.")

    if HAS_SCIPY:
        return float(sp_stats.t.ppf(p, df))

    # For large df, approaches standard normal
    if df > 500:
        return normal_ppf(p)

    # Initial approximation via Cornish-Fisher expansion
    zp = normal_ppf(p)
    # Hill (1970) approximation or Newton-Raphson refinement
    t_est = zp + (zp**3 + zp) / (4.0 * df) + (5.0 * zp**5 + 16.0 * zp**3 + 3.0 * zp) / (96.0 * df * df)

    # Refine using Newton-Raphson
    for _ in range(12):
        cdf_val = t_cdf(t_est, df)
        err = cdf_val - p
        if abs(err) < 1.0e-11:
            break
        # Student-t pdf
        pdf = (
            math.exp(math.lgamma(0.5 * (df + 1.0)) - math.lgamma(0.5 * df))
            / (math.sqrt(math.pi * df) * (1.0 + (t_est * t_est) / df) ** (0.5 * (df + 1.0)))
        )
        if pdf <= 0:
            break
        step = err / pdf
        t_est -= step
        if abs(step) < 1.0e-11:
            break

    return t_est


def gammainc_lower(a: float, x: float) -> float:
    """Regularized lower incomplete gamma function P(a, x) = gamma(a, x) / Gamma(a)."""
    if a <= 0 or x < 0:
        raise ValueError("a must be > 0 and x >= 0.")
    if x == 0.0:
        return 0.0

    # Series representation for x < a + 1
    if x < a + 1.0:
        ap = a
        sum_val = 1.0 / a
        del_val = sum_val
        for _ in range(100):
            ap += 1.0
            del_val *= x / ap
            sum_val += del_val
            if abs(del_val) < abs(sum_val) * 1.0e-12:
                break
        return sum_val * math.exp(-x + a * math.log(x) - math.lgamma(a))
    else:
        # Continued fraction for x >= a + 1
        b = x + 1.0 - a
        c = 1.0 / 1.0e-30
        d = 1.0 / b
        h = d
        for i in range(1, 100):
            an = -i * (i - a)
            b += 2.0
            d = an * d + b
            if abs(d) < 1.0e-30:
                d = 1.0e-30
            c = b + an / c
            if abs(c) < 1.0e-30:
                c = 1.0e-30
            d = 1.0 / d
            del_h = d * c
            h *= del_h
            if abs(del_h - 1.0) < 1.0e-12:
                break
        gammcf = math.exp(-x + a * math.log(x) - math.lgamma(a)) * h
        return 1.0 - gammcf


def chi2_cdf(x: float, df: float) -> float:
    """Cumulative distribution function for Chi-square distribution."""
    if df <= 0:
        raise ValueError("df must be positive.")
    if x <= 0:
        return 0.0
    if HAS_SCIPY:
        return float(sp_stats.chi2.cdf(x, df))
    return gammainc_lower(0.5 * df, 0.5 * x)


def f_cdf(f_val: float, df1: float, df2: float) -> float:
    """Cumulative distribution function for Snedecor's F-distribution."""
    if df1 <= 0 or df2 <= 0:
        raise ValueError("Degrees of freedom must be positive.")
    if f_val <= 0:
        return 0.0
    if HAS_SCIPY:
        return float(sp_stats.f.cdf(f_val, df1, df2))
    x = (df1 * f_val) / (df1 * f_val + df2)
    return betainc(0.5 * df1, 0.5 * df2, x)


# --- Linear Algebra for OLS Regression ---

def matrix_transpose(A: List[List[float]]) -> List[List[float]]:
    """Transpose matrix A (m x n -> n x m)."""
    if not A or not A[0]:
        return []
    m, n = len(A), len(A[0])
    return [[A[i][j] for i in range(m)] for j in range(n)]


def matrix_multiply(A: List[List[float]], B: List[List[float]]) -> List[List[float]]:
    """Multiply matrices A (m x k) and B (k x n) -> (m x n)."""
    m, k = len(A), len(A[0])
    k2, n = len(B), len(B[0])
    if k != k2:
        raise ValueError(f"Incompatible dimensions for multiplication: {k} != {k2}")
    result = [[0.0] * n for _ in range(m)]
    for i in range(m):
        for p in range(k):
            a_ip = A[i][p]
            if a_ip != 0.0:
                for j in range(n):
                    result[i][j] += a_ip * B[p][j]
    return result


def matrix_inverse_gauss_jordan(A: List[List[float]]) -> List[List[float]]:
    """Invert square matrix A using Gauss-Jordan elimination with partial pivoting."""
    n = len(A)
    for row in A:
        if len(row) != n:
            raise ValueError("Matrix must be square for inversion.")

    # Augmented matrix [A | I]
    augmented = [row[:] + [1.0 if i == j else 0.0 for j in range(n)] for i, row in enumerate(A)]

    for col in range(n):
        # Partial pivoting: find max pivot in col
        max_row = col
        max_val = abs(augmented[col][col])
        for r in range(col + 1, n):
            val = abs(augmented[r][col])
            if val > max_val:
                max_val = val
                max_row = r

        if max_val < 1.0e-12:
            raise ValueError("Matrix is singular or near-singular and cannot be inverted.")

        # Swap rows
        augmented[col], augmented[max_row] = augmented[max_row], augmented[col]

        # Scale pivot row to 1
        pivot = augmented[col][col]
        for c in range(2 * n):
            augmented[col][c] /= pivot

        # Eliminate other rows
        for r in range(n):
            if r != col:
                factor = augmented[r][col]
                if factor != 0.0:
                    for c in range(col, 2 * n):
                        augmented[r][c] -= factor * augmented[col][c]

    # Extract inverse
    inv = [[augmented[i][j + n] for j in range(n)] for i in range(n)]
    return inv


def rank_data(values: List[float]) -> List[float]:
    """Assign fractional ranks to data (handling ties via mid-rank), 1-indexed."""
    n = len(values)
    indexed = sorted(enumerate(values), key=lambda x: x[1])
    ranks = [0.0] * n

    i = 0
    while i < n:
        j = i
        while j < n - 1 and indexed[j + 1][1] == indexed[j][1]:
            j += 1
        # Assign average rank
        avg_rank = (i + 1 + j + 1) / 2.0
        for k in range(i, j + 1):
            ranks[indexed[k][0]] = avg_rank
        i = j + 1

    return ranks
