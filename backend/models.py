"""
AFTERDATA Backend Data & Request Models (Pydantic & SQLAlchemy)
Generic across industries, with clean separation between statistical execution and LLM explanation.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ColumnMetadata(BaseModel):
    name: str
    inferred_type: str  # 'continuous' | 'categorical' | 'temporal' | 'identifier' | 'boolean'
    non_null_count: int
    null_count: int
    unique_count: int
    sample_values: List[Any]
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    mean_value: Optional[float] = None
    std_value: Optional[float] = None

class DatasetSchema(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    column_count: int
    columns: List[ColumnMetadata]

class SuggestedQuestion(BaseModel):
    id: str
    question: str
    category: str  # 'Drivers & Causes' | 'Cohort Comparisons' | 'Anomaly Detection' | 'Trends'
    primary_variables: List[str]
    suggested_test: str  # 'Welch Two-Sample t-test' | 'OLS Linear Regression' | 'Pearson Correlation' | 'Chi-Square Independence'
    feasibility_status: str  # 'Feasible' | 'Low Power' | 'Missing Variables'
    statistical_power_rating: str  # 'High (N>200)' | 'Moderate' | 'Constrained'

class InvestigationRequest(BaseModel):
    dataset_id: str
    question: str
    selected_test: Optional[str] = None
    target_variable: Optional[str] = None
    grouping_variable: Optional[str] = None
    confidence_level: float = 0.95

class ValidationCheck(BaseModel):
    check_name: str
    passed: bool
    details: str
    recommendation: Optional[str] = None

class InvestigationResult(BaseModel):
    question: str
    test_used: str
    null_hypothesis: str
    alternative_hypothesis: str
    p_value: float
    is_statistically_significant: bool
    test_statistic: float
    effect_size: Optional[float] = None
    confidence_interval: Optional[List[float]] = None
    sample_size: int
    validation_checks: List[ValidationCheck]
    plain_english_summary: str
    ten_year_old_explanation: str
    mathematical_proof: str
    chart_payload: Dict[str, Any]
    limitations: List[str]

class QuestionInterpreterRequest(BaseModel):
    question: str
    dataset_id: Optional[str] = None
    available_columns: Optional[List[str]] = None

class QuestionInterpreterResponse(BaseModel):
    business_objective: str
    intent: str
    outcome_candidates: List[str]
    predictor_candidates: List[str]
    time_dimension_candidates: List[str]
    hypotheses: List[str]
    requested_experiences: List[str]
    clarification_required: bool
    candidate_test: Optional[str] = None
