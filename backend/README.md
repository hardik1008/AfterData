# AFTERDATA Statistical Engine Backend

## Architectural Overview
This backend implements the core statistical and validation layers of AFTERDATA:
1. **Deterministic Statistical Computation**: Powered by Pandas, NumPy, SciPy, and Statsmodels. All tests (Welch t-tests, OLS Regressions, Pearson correlations, Chi-Square independence) are computed mathematically to prevent LLM hallucinations.
2. **Pre-flight & Post-hoc Validation Engine**: Audits sample size sufficiency, missingness invariance, skewness/kurtosis, and confounding risk.
3. **Storage**: SQLite for zero-config local operations, drop-in configurable to PostgreSQL by setting the `DATABASE_URL` environment variable.

## Running Locally / Deployment
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Docker Deployment
```bash
docker build -t afterdata-backend .
docker run -p 8000:8000 -e DATABASE_URL="postgresql://user:pass@host:5432/afterdata" afterdata-backend
```
