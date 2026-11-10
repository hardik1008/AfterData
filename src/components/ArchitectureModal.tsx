import React, { useState, useEffect } from "react";
import { X, Check, Terminal, Server, ShieldCheck, Cpu, Code2, AlertCircle } from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "philosophy" | "concepts" | "python_backend" | "deploy">("overview");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/architecture-status")
        .then((r) => r.json())
        .then((data) => setStatus(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              AFTERDATA Architecture & Statistical Core
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Production structure, statistical defense boundaries, and environment specifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Controls */}
        <div className="px-6 pt-3 border-b border-neutral-100 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Environment Status
          </button>
          <button
            onClick={() => setActiveTab("philosophy")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "philosophy"
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            6-Step Philosophy
          </button>
          <button
            onClick={() => setActiveTab("concepts")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "concepts"
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            10 Statistical Concepts
          </button>
          <button
            onClick={() => setActiveTab("python_backend")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "python_backend"
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Python Backend Codebase
          </button>
          <button
            onClick={() => setActiveTab("deploy")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "deploy"
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Deploy & Run
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-neutral-600">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center gap-2 text-neutral-900 font-medium">
                  <AlertCircle className="w-4 h-4 text-neutral-700" />
                  <span>Transparent Environment Notice</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  The AI Studio runtime operates in an unprivileged Node.js container ({status?.node_version || "Node.js v22"}).
                  While <span className="font-mono text-neutral-800">python3</span> (Python 3.10) is installed, the container environment does not provide root package manager privileges (<span className="font-mono text-neutral-800">pip</span>) to compile native C-extensions required for <span className="font-mono text-neutral-800">scipy</span> and <span className="font-mono text-neutral-800">statsmodels</span> on-the-fly.
                </p>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Rather than silently replacing the statistical pipeline with approximations, AFTERDATA implements a <strong>dual-engine architecture</strong>:
                </p>
                <div className="text-xs space-y-1.5 pl-2 border-l border-neutral-300 pt-1">
                  <div>
                    <strong className="text-neutral-900">1. Production Python FastAPI Service:</strong> Built inside the <code className="font-mono bg-white px-1 py-0.5 border border-neutral-200 rounded">/backend</code> directory with full Pandas, NumPy, SciPy, Statsmodels, and Dockerfile ready for external container deployment.
                  </div>
                  <div>
                    <strong className="text-neutral-900">2. Embedded Rigorous Statistical Math Engine:</strong> Implements exact Welch t-test formulas, degrees of freedom, Student t-distribution p-values, Fisher z-transformations for correlation, and OLS regression to ensure 100% mathematical reproducibility in this web runtime without hallucination.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Active Runtime Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-neutral-200">
                    <span className="text-neutral-400 block mb-1">Frontend Framework</span>
                    <span className="font-medium text-neutral-900">React 19 + TypeScript + Vite</span>
                  </div>
                  <div className="p-3 rounded-lg border border-neutral-200">
                    <span className="text-neutral-400 block mb-1">Styling & Motion</span>
                    <span className="font-medium text-neutral-900">Tailwind CSS + Framer Motion</span>
                  </div>
                  <div className="p-3 rounded-lg border border-neutral-200">
                    <span className="text-neutral-400 block mb-1">Language Model</span>
                    <span className="font-medium text-neutral-900">Gemini 3.8 Flash (Server-Side)</span>
                  </div>
                  <div className="p-3 rounded-lg border border-neutral-200">
                    <span className="text-neutral-400 block mb-1">Database Architecture</span>
                    <span className="font-medium text-neutral-900">SQLite (Drop-in PostgreSQL ready)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "philosophy" && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">
                AFTERDATA is founded on six strict engineering and statistical commitments:
              </p>
              <div className="space-y-3">
                {[
                  {
                    step: "1. LLM Understands",
                    desc: "Translates conversational business questions into structured statistical hypotheses without executing calculations.",
                  },
                  {
                    step: "2. Deterministic Engine Decides",
                    desc: "Selects the exact appropriate test (Welch t-test, OLS regression, Pearson r, Chi-Square) based on variable types.",
                  },
                  {
                    step: "3. Statistical Core Calculates",
                    desc: "Computes exact statistics, p-values, effect sizes (Cohen's d, r²), and 95% confidence intervals deterministically.",
                  },
                  {
                    step: "4. Validation Engine Verifies",
                    desc: "Audits statistical power (N >= 30), skewness, missingness rates, and heteroscedasticity prior to confirming results.",
                  },
                  {
                    step: "5. LLM Explains",
                    desc: "Translates verified numeric outputs into clean, jargon-free prose and intuitive playground analogies for anyone to grasp.",
                  },
                  {
                    step: "6. Evidence Trail Proves",
                    desc: "Provides an unassailable mathematical audit ledger showing formulas, variable substitutions, and test statistics.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-neutral-200 flex gap-3">
                    <span className="font-mono text-xs font-semibold text-neutral-400 w-5">
                      0{idx + 1}
                    </span>
                    <div>
                      <h5 className="font-semibold text-neutral-900 text-xs">{item.step}</h5>
                      <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "concepts" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Deterministic Method Registry (10 Core Concepts)
                </h4>
                <p className="text-xs text-neutral-500">
                  Each concept operates deterministically without LLM math. The engine audits data structures, validates sample power, and records why methods are selected or rejected.
                </p>
              </div>

              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {[
                  {
                    num: 1,
                    id: "METH_01_DESCRIPTIVE",
                    name: "Descriptive Statistics",
                    desc: "Summary statistics (mean, median, IQR, std dev, skewness, missingness) for continuous and categorical variables.",
                    minN: "N >= 1",
                  },
                  {
                    num: 2,
                    id: "METH_02_NORMAL_DISTRIBUTION",
                    name: "Probability & Normal Distribution",
                    desc: "Empirical density vs standard normal, skewness audit, and 68-95-99.7 empirical rule validation.",
                    minN: "N >= 20",
                  },
                  {
                    num: 3,
                    id: "METH_03_SAMPLING_CLT",
                    name: "Sampling & Central Limit Theorem",
                    desc: "Standard error of the mean (SE = s / √n) and finite population correction factors.",
                    minN: "N >= 30",
                  },
                  {
                    num: 4,
                    id: "METH_04_CI_MEANS",
                    name: "Confidence Intervals for Means",
                    desc: "Parametric Student-t confidence intervals with exact critical values (t* · SE).",
                    minN: "N >= 10",
                  },
                  {
                    num: 5,
                    id: "METH_05_CI_PROPORTIONS",
                    name: "Confidence Intervals for Proportions & Sample Size",
                    desc: "Wilson Score & Wald intervals for binary conversion/retention proportions.",
                    minN: "n·p >= 5 and n·(1-p) >= 5",
                  },
                  {
                    num: 6,
                    id: "METH_06_HYPOTHESIS_TESTING",
                    name: "Hypothesis Testing for Means & Proportions",
                    desc: "Welch's Two-Sample t-test (unequal variances) & Two-Proportion z-test with explicit null & alternative hypotheses.",
                    minN: "N >= 15 per group",
                  },
                  {
                    num: 7,
                    id: "METH_07_POWER_ANALYSIS",
                    name: "P-Values, Error Rates & Statistical Power",
                    desc: "Alpha=0.05 calibration, Cohen's d effect size, and statistical power (1 - Beta) audit against Type II error.",
                    minN: "N >= 30 recommended",
                  },
                  {
                    num: 8,
                    id: "METH_08_CORRELATION_COV",
                    name: "Correlation & Covariance",
                    desc: "Pearson r, sample covariance, Fisher z-transformation confidence intervals, and t-test of independence.",
                    minN: "N >= 10 pairs",
                  },
                  {
                    num: 9,
                    id: "METH_09_SIMPLE_LINEAR_REGRESSION",
                    name: "Simple Linear Regression",
                    desc: "Ordinary Least Squares (OLS) slope, intercept, R², F-statistic, and standard error of regression.",
                    minN: "N >= 10 pairs",
                  },
                  {
                    num: 10,
                    id: "METH_10_MULTIPLE_REGRESSION",
                    name: "Multiple Linear Regression",
                    desc: "OLS coefficients with >=2 predictors, adjusted R², overall ANOVA F-test, and multicollinearity variance inflation checks.",
                    minN: "N >= 20 observations",
                  },
                ].map((concept) => (
                  <div
                    key={concept.id}
                    className="p-3 rounded-xl border border-neutral-200 bg-white space-y-1 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-neutral-400">
                          {concept.num < 10 ? `0${concept.num}` : concept.num}
                        </span>
                        <span className="font-semibold text-neutral-900">{concept.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                        {concept.minN}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      {concept.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "python_backend" && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">
                The complete Python FastAPI backend is provided in the root <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">/backend</code> folder:
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex justify-between">
                  <span>backend/main.py</span>
                  <span className="text-neutral-400">FastAPI application & routes</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex justify-between">
                  <span>backend/statistical_engine.py</span>
                  <span className="text-neutral-400">Pandas, NumPy, SciPy & Statsmodels calculations</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex justify-between">
                  <span>backend/validation.py</span>
                  <span className="text-neutral-400">Statistical assumption verification & power checks</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex justify-between">
                  <span>backend/database.py</span>
                  <span className="text-neutral-400">SQLAlchemy SQLite & PostgreSQL drop-in engine</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex justify-between">
                  <span>backend/Dockerfile</span>
                  <span className="text-neutral-400">Container recipe for Cloud Run or Docker</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deploy" && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Running the Standalone Python Microservice
              </h4>
              <div className="p-3 rounded-lg bg-neutral-900 text-neutral-100 font-mono text-xs space-y-2 overflow-x-auto">
                <div className="text-neutral-400"># 1. Install dependencies in your Python environment</div>
                <div>pip install -r backend/requirements.txt</div>
                <div className="text-neutral-400 pt-2"># 2. Run the FastAPI server on port 8000</div>
                <div>uvicorn backend.main:app --port 8000 --reload</div>
                <div className="text-neutral-400 pt-2"># 3. Or deploy via Docker with PostgreSQL</div>
                <div>docker build -t afterdata-backend ./backend</div>
                <div>docker run -p 8000:8000 -e DATABASE_URL="postgresql://user:pass@host/db" afterdata-backend</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
};
