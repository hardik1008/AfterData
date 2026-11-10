import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  Cpu,
  Layers,
  RotateCcw,
  Binary,
  Hash,
  Database,
  Filter,
  Info,
  Check,
  XCircle,
  ExternalLink,
} from "lucide-react";
import {
  AnalysisProvenanceRecord,
  DatasetProfile,
  StatisticalResult,
} from "../types/dataset";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { verifyAnalysisReproducibility } from "../lib/provenance";

interface HowDoWeKnowModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AnalysisProvenanceRecord;
  dataset: DatasetProfile | null;
  result: StatisticalResult;
  onRunReproduced?: () => void;
}

export const HowDoWeKnowModal: React.FC<HowDoWeKnowModalProps> = ({
  isOpen,
  onClose,
  record,
  dataset,
  result,
  onRunReproduced,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  const [activeTab, setActiveTab] = useState<
    | "origin"
    | "observations"
    | "selection"
    | "calculation"
    | "assumptions"
    | "limitations"
  >("origin");

  const [reproductionResult, setReproductionResult] = useState<{
    tested: boolean;
    canReproduce: boolean;
    headline: string;
    explanation: string;
    discrepancies: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleReproduce = () => {
    const outcome = verifyAnalysisReproducibility(record, dataset);
    setReproductionResult({
      tested: true,
      canReproduce: outcome.canReproduce,
      headline: outcome.headline,
      explanation: outcome.explanation,
      discrepancies: outcome.discrepancies,
    });
    if (outcome.canReproduce && onRunReproduced) {
      onRunReproduced();
    }
  };

  const tabs = [
    { id: "origin", label: "Where data came from" },
    { id: "observations", label: "Which observations" },
    { id: "selection", label: "Why method selected" },
    { id: "calculation", label: "How calculation works" },
    { id: "assumptions", label: "What assumptions" },
    { id: "limitations", label: "What limitations" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.98, y: reducedMotion ? 0 : 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
                  How Do We Know?
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200/70 text-neutral-800">
                  {record.id}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Complete evidence trail, cryptographic provenance, and mathematical reproducibility audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Tabs Navigation */}
        <div className="px-6 pt-2 border-b border-neutral-100 flex gap-1 overflow-x-auto bg-white shrink-0 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-600 flex-1">
          {/* TAB 1: Where the data came from */}
          {activeTab === "origin" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Data Lineage &amp; Cryptographic Fingerprint
                </h3>
                <p className="text-neutral-500">
                  Original source location, sheet partition, and cryptographic hash verifying data immutability.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                  <span className="text-neutral-400 block text-[10px] uppercase">Original Dataset ID</span>
                  <span className="font-semibold text-neutral-900 block">{record.dataset_id}</span>
                  <span className="text-[10px] text-neutral-500">Version: {record.dataset_version}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                  <span className="text-neutral-400 block text-[10px] uppercase">Source Sheet &amp; File</span>
                  <span className="font-semibold text-neutral-900 block truncate">
                    {dataset?.filename || "Primary Upload"}
                  </span>
                  <span className="text-[10px] text-neutral-500">Sheet: &ldquo;{record.source_sheet}&rdquo;</span>
                </div>
              </div>

              {/* Cryptographic SHA-256 Fingerprint */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-neutral-700" />
                    Dataset Cryptographic Fingerprint
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">SHA-256 Checksum</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-900 text-neutral-100 font-mono text-[11px] break-all select-all">
                  {record.dataset_fingerprint}
                </div>
                <p className="text-[11px] text-neutral-500">
                  If even a single cell or row in the dataset is altered, this hash changes, preventing false reproducibility claims.
                </p>
              </div>

              {/* Source Columns */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                  Source Columns Bound to Investigation
                </span>
                <div className="flex flex-wrap gap-2">
                  {record.source_columns.map((col, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 font-mono text-[11px] text-neutral-800"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recorded Transformations */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                  Data Transformations &amp; Lineage Log
                </span>
                <ul className="space-y-1.5 text-neutral-600 list-disc list-inside">
                  {record.data_transformations.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Which observations were used */}
          {activeTab === "observations" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Observation Accounting &amp; Exclusions
                </h3>
                <p className="text-neutral-500">
                  Traceability of every record included or excluded. Missing values are never silently replaced.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
                  <span className="text-neutral-400 block text-[10px] uppercase">Total In File</span>
                  <span className="text-lg font-bold text-neutral-900 tabular-nums">
                    {record.sample_size.total_records}
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Rows detected</span>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
                  <span className="text-neutral-400 block text-[10px] uppercase">Analyzed</span>
                  <span className="text-lg font-bold text-emerald-700 tabular-nums">
                    {record.sample_size.analyzed_records}
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Complete cases</span>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
                  <span className="text-neutral-400 block text-[10px] uppercase">Excluded</span>
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      record.sample_size.excluded_records > 0
                        ? "text-amber-600"
                        : "text-neutral-500"
                    }`}
                  >
                    {record.sample_size.excluded_records}
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Null / Invalid</span>
                </div>
              </div>

              {/* Exclusion Details Card */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neutral-700" />
                  <span className="font-semibold text-neutral-900">
                    Row Filtering &amp; Incomplete Case Policy
                  </span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  {record.row_filters.filter_description}. Following AFTERDATA&apos;s anti-slop data immortality rules, missing values are excluded from the test equations rather than being imputed with fabricated averages.
                </p>
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-[11px] text-neutral-700">
                  Filter Criteria: {record.row_filters.criteria.join("; ")}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Why the method was selected */}
          {activeTab === "selection" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Method Selection &amp; Disqualification Rationale
                </h3>
                <p className="text-neutral-500">
                  The deterministic decision engine evaluates variables and sample sizes to select eligible tests and reject unsuitable ones.
                </p>
              </div>

              {/* Selected Method */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">
                    Concept {record.selected_method.concept_number} Selected
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-white">
                    {record.selected_method.method_id}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-neutral-900">
                  {record.selected_method.name}
                </h4>
                <p className="text-neutral-600">
                  <span className="font-medium text-neutral-800">Assigned role: </span>
                  {record.selected_method.assigned_role}
                </p>
              </div>

              {/* Rejected Alternatives */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                  Rejected Alternative Methods ({record.rejected_alternatives.length})
                </span>
                <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                  {record.rejected_alternatives.map((alt) => (
                    <div key={alt.method_id} className="p-3 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900">
                          {alt.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">
                          Concept {alt.concept_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        <span className="text-rose-600 font-medium">Disqualified: </span>
                        {alt.rejection_reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: How the calculation works */}
          {activeTab === "calculation" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Mathematical Specification &amp; Execution Proof
                </h3>
                <p className="text-neutral-500">
                  Deterministic mathematical formulas, parameters, and variable substitutions.
                </p>
              </div>

              {/* Model Formula */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2">
                <span className="text-[10px] font-mono text-neutral-400 uppercase block">
                  Model Equation
                </span>
                <div className="p-3 rounded-lg bg-neutral-900 text-neutral-100 font-mono text-xs">
                  {record.formula_or_model_specification}
                </div>
              </div>

              {/* Exact Numerical Values */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <span className="text-neutral-400 block text-[10px]">Test Statistic</span>
                  <span className="text-sm font-bold text-neutral-900 tabular-nums">
                    {record.numerical_results.test_statistic}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <span className="text-neutral-400 block text-[10px]">p-value</span>
                  <span className="text-sm font-bold text-neutral-900 tabular-nums">
                    {record.numerical_results.p_value}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <span className="text-neutral-400 block text-[10px]">Degrees of Freedom</span>
                  <span className="text-sm font-bold text-neutral-900 tabular-nums">
                    {record.sample_size.degrees_of_freedom ?? "N/A"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <span className="text-neutral-400 block text-[10px]">95% CI</span>
                  <span className="text-xs font-bold text-neutral-900 tabular-nums truncate block">
                    {record.confidence_intervals.formatted}
                  </span>
                </div>
              </div>

              {/* Calculation Code Version */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-[11px] text-neutral-500">
                <span>Engine Version: {record.calculation_code_version}</span>
                <span>Executed: {record.execution_timestamp}</span>
              </div>
            </div>
          )}

          {/* TAB 5: What assumptions were made */}
          {activeTab === "assumptions" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Mathematical Assumptions Audit
                </h3>
                <p className="text-neutral-500">
                  Distinguishing between facts verified directly from data and assumptions that rely on experimental study design.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                {record.assumption_checks.map((check, idx) => (
                  <div key={idx} className="p-3.5 bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">{check.assumption}</span>
                      {check.status === "verified_from_data" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified from Data
                        </span>
                      ) : check.status === "violated" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Violated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                          <HelpCircle className="w-3 h-3 text-neutral-500" />
                          Study Design Dependent
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500">{check.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: What the limitations are */}
          {activeTab === "limitations" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Honesty &amp; Causality Boundaries
                </h3>
                <p className="text-neutral-500">
                  Explicit boundaries on what this data can and cannot prove.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3">
                <span className="font-semibold text-neutral-900 block">
                  Methodological Limitations
                </span>
                <ul className="space-y-2 text-neutral-600 list-disc list-inside">
                  {result.limitations.map((lim, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {lim}
                    </li>
                  ))}
                  <li>
                    Statistical significance ($p &lt; 0.05$) demonstrates that observed differences are unlikely due to random chance, but does not guarantee commercial importance.
                  </li>
                </ul>
              </div>

              {record.warnings.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Active Diagnostics Warnings</span>
                  </div>
                  <ul className="space-y-1 text-amber-800">
                    {record.warnings.map((w, idx) => (
                      <li key={idx}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Reproduce Analysis Run Action Card */}
          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-900 block">
                  Deterministic Run Reproducibility
                </span>
                <p className="text-[11px] text-neutral-500">
                  Re-execute the exact equations against the cryptographic fingerprint to independently verify all numbers.
                </p>
              </div>

              <button
                onClick={handleReproduce}
                className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 hover:border-neutral-500 rounded-lg transition-colors whitespace-nowrap shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Verify &amp; Reproduce Run</span>
              </button>
            </div>

            {/* Reproduction Result Feedback */}
            {reproductionResult && (
              <div
                className={`p-4 rounded-xl border animate-in fade-in duration-200 ${
                  reproductionResult.canReproduce
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-rose-200 bg-rose-50/60"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {reproductionResult.canReproduce ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <h5
                      className={`text-xs font-bold ${
                        reproductionResult.canReproduce
                          ? "text-emerald-950"
                          : "text-rose-950"
                      }`}
                    >
                      {reproductionResult.headline}
                    </h5>
                    <p
                      className={`text-[11px] leading-relaxed ${
                        reproductionResult.canReproduce
                          ? "text-emerald-800"
                          : "text-rose-800"
                      }`}
                    >
                      {reproductionResult.explanation}
                    </p>
                    {reproductionResult.discrepancies.length > 0 && (
                      <ul className="text-[10px] font-mono text-rose-900 space-y-0.5 pt-1">
                        {reproductionResult.discrepancies.map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-[11px] font-mono text-neutral-400">
            Hash: {record.provenance_audit_hash.substring(0, 16)}...
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Close Provenance Record
          </button>
        </div>
      </motion.div>
    </div>
  );
};
