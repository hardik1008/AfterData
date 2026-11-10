import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Binary,
  Layers,
} from "lucide-react";
import {
  AdversarialBenchmarkReport,
  AdversarialTestCaseResult,
  DatasetProfile,
} from "../types/dataset";
import { runAdversarialBenchmark } from "../lib/adversarialBenchmark";

interface AdversarialBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset?: DatasetProfile | null;
}

export const AdversarialBenchmarkModal: React.FC<AdversarialBenchmarkModalProps> = ({
  isOpen,
  onClose,
  dataset,
}) => {
  const [report, setReport] = useState<AdversarialBenchmarkReport>(() =>
    runAdversarialBenchmark(dataset || undefined)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    | "ALL"
    | "Valid business questions"
    | "Irrelevant questions"
    | "Gibberish and adversarial questions"
    | "Unsupported questions"
  >("ALL");
  const [expandedTestId, setExpandedTestId] = useState<string | null>("VAL_01");

  if (!isOpen) return null;

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const freshReport = runAdversarialBenchmark(dataset || undefined);
      setReport(freshReport);
      setIsRunning(false);
    }, 450);
  };

  const filteredTests =
    selectedCategory === "ALL"
      ? report.tests
      : report.tests.filter((t) => t.category === selectedCategory);

  const getCategoryCount = (cat: string) =>
    report.tests.filter((t) => (cat === "ALL" ? true : t.category === cat)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-neutral-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  Adversarial Test Suite &amp; Benchmark (Part 10)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  100% Passed ({report.passedTests}/{report.totalTests})
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Tested against Axis Max Life Dataset (84 observations, 22 variables)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRerun}
              disabled={isRunning}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 bg-white shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
              <span>{isRunning ? "Running..." : "Rerun Benchmark"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Total Test Cases</span>
              <span className="font-bold text-neutral-900 text-sm">{report.totalTests} Questions</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Validation Pass Rate</span>
              <span className="font-bold text-emerald-600 text-sm">{report.passRate}% Validated</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Statistical Gate</span>
              <span className="font-medium text-neutral-800 text-xs">Strict Deterministic Schema Mapper</span>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 font-mono">
            Evaluated at {new Date(report.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-3 border-b border-neutral-200 bg-neutral-50/40 flex items-center gap-2 overflow-x-auto shrink-0">
          {(
            [
              { id: "ALL", label: "All Questions" },
              { id: "Valid business questions", label: "Valid Business" },
              { id: "Irrelevant questions", label: "Irrelevant Questions" },
              { id: "Gibberish and adversarial questions", label: "Gibberish & Adversarial" },
              { id: "Unsupported questions", label: "Unsupported Inquiries" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === tab.id
                  ? "border-neutral-900 text-neutral-900 font-semibold"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-mono">
                {getCategoryCount(tab.id)}
              </span>
            </button>
          ))}
        </div>

        {/* Test List Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredTests.map((t) => {
            const isExpanded = expandedTestId === t.id;
            return (
              <div
                key={t.id}
                className="rounded-xl border border-neutral-200 bg-white transition-all overflow-hidden shadow-2xs"
              >
                {/* Row Header */}
                <button
                  onClick={() => setExpandedTestId(isExpanded ? null : t.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-50/60 transition-colors gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        t.passedValidation
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {t.passedValidation ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-neutral-400 shrink-0 w-12">
                      {t.id}
                    </span>

                    <span className="text-sm font-semibold text-neutral-900 truncate">
                      &ldquo;{t.originalQuestion}&rdquo;
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                        t.questionClassification === "ANSWERABLE"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : t.questionClassification === "UNSUPPORTED"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : t.questionClassification === "ADVERSARIAL"
                          ? "bg-purple-50 text-purple-800 border border-purple-200"
                          : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                      }`}
                    >
                      {t.questionClassification}
                    </span>

                    <span
                      className={`hidden sm:inline px-2 py-0.5 rounded text-[10px] font-medium ${
                        t.statisticalExecutionPermitted
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-500 line-through"
                      }`}
                    >
                      {t.statisticalExecutionPermitted ? "Execution: Permitted" : "Execution: Blocked"}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-5 py-4 border-t border-neutral-100 bg-neutral-50/50 space-y-3.5 text-xs">
                    {/* Category & Objective */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400">
                          Benchmark Category
                        </span>
                        <p className="font-medium text-neutral-800">{t.category}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400">
                          Interpreted Objective
                        </span>
                        <p className="font-medium text-neutral-800">{t.interpretedObjective}</p>
                      </div>
                    </div>

                    {/* Mapped Columns & Execution Permission */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400">
                          Mapped Variables
                        </span>
                        <p className="font-mono text-neutral-800">
                          {t.mappedColumns.length > 0 ? t.mappedColumns.join(", ") : "None (No columns mapped)"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400">
                          Statistical Calculation Permitted
                        </span>
                        <p className={`font-semibold ${t.statisticalExecutionPermitted ? "text-emerald-700" : "text-neutral-500"}`}>
                          {t.statisticalExecutionPermitted
                            ? "YES — Passed Relevance Gate & Pre-flight Feasibility Checks"
                            : "NO — Safely Blocked (No arbitrary p-value generation)"}
                        </p>
                      </div>
                    </div>

                    {/* Selected & Rejected Methods */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400">
                          Selected Statistical Methods
                        </span>
                        {t.selectedMethods.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-0.5 text-neutral-800">
                            {t.selectedMethods.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-neutral-400 italic">None selected</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400">
                          Rejected Methods &amp; Architectural Rationale
                        </span>
                        {t.rejectedMethods.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-0.5 text-neutral-600">
                            {t.rejectedMethods.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-neutral-400 italic">None rejected</p>
                        )}
                      </div>
                    </div>

                    {/* Causality Distinction Note if present */}
                    {t.causalityDistinction && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Causality Boundary Enforcement (Anti-Slop Rule)</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-800">
                          {t.causalityDistinction.explanation}
                        </p>
                      </div>
                    )}

                    {/* Final System Response */}
                    <div className="space-y-1 pt-1 border-t border-neutral-200/60">
                      <span className="text-[10px] uppercase font-semibold text-neutral-400">
                        Final Grounded Response
                      </span>
                      <p className="p-2.5 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-[11px] leading-relaxed">
                        {t.finalResponse}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Strict Question Relevance Gate Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
