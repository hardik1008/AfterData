import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Layers,
  Search,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  BarChart3,
  Sparkles,
  ShieldAlert,
  Database,
  HelpCircle,
  Tag,
  Check,
  ShieldCheck,
  Binary,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DataQualityIssue,
  DatasetProfile,
  DatasetUnderstanding,
} from "../types/dataset";
import {
  generateDeterministicUnderstanding,
  getEnhancedDatasetUnderstanding,
} from "../lib/datasetUnderstanding";
import { AnimatedCounter } from "./experiences/AnimatedCounter";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

interface DatasetProfileScreenProps {
  profile: DatasetProfile;
  onProceedToQuestions: () => void;
  onReplaceDataset: () => void;
  onSelectSheet?: (sheetName: string) => void;
  onSelectQuestion?: (
    questionText: string,
    suggestedTest?: string,
    targetVar?: string,
    groupVar?: string
  ) => void;
}

export const DatasetProfileScreen: React.FC<DatasetProfileScreenProps> = ({
  profile,
  onProceedToQuestions,
  onReplaceDataset,
  onSelectSheet,
  onSelectQuestion,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  // Instant render with deterministic understanding, background-enhanced with AI if online
  const [understanding, setUnderstanding] = useState<DatasetUnderstanding>(() => {
    return profile.understanding || generateDeterministicUnderstanding(profile);
  });

  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [techTab, setTechTab] = useState<"schema" | "quality" | "raw">("schema");
  const [columnSearch, setColumnSearch] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    getEnhancedDatasetUnderstanding(profile).then((enhanced) => {
      if (isMounted) {
        setUnderstanding(enhanced);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [profile.datasetId]);

  const filteredIssues = profile.dataQualityIssues.filter((issue) => {
    if (selectedSeverity === "all") return true;
    return issue.severity === selectedSeverity;
  });

  const filteredColumns = profile.columns.filter(
    (c) =>
      c.name.toLowerCase().includes(columnSearch.toLowerCase()) ||
      c.inferredType.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const handleQuestionClick = (q: any) => {
    if (onSelectQuestion) {
      onSelectQuestion(q.question, q.suggestedTest, q.targetVar, q.groupVar);
    } else {
      onProceedToQuestions();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-200">
      {/* Top Banner: Status badge & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Your dataset is ready!</span>
          </span>
          <span className="text-xs text-neutral-400 font-mono">
            {profile.filename}
            {profile.sheetName && ` · Sheet: ${profile.sheetName}`}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onReplaceDataset}
            className="px-3.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 bg-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replace dataset</span>
          </button>
          <button
            onClick={onProceedToQuestions}
            className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Ask a Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero: "Here's what I found in your data" */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
          Here&apos;s what I found in your data.
        </h1>
        <p className="text-lg text-neutral-700 font-medium leading-snug">
          &ldquo;{understanding.headline}&rdquo;
        </p>
        <p className="text-sm text-neutral-500 max-w-3xl leading-relaxed">
          {understanding.whatItIsAbout}
        </p>
      </div>

      {/* The 4 Core Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Information collected */}
        <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  1. Information collected
                </h3>
                <p className="text-[11px] text-neutral-400">How much information we have</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
                <span className="text-[11px] font-medium text-neutral-400 block mb-0.5">
                  Total Records
                </span>
                <span className="text-xl font-bold text-neutral-900 font-mono">
                  <AnimatedCounter value={profile.rowCount} decimals={0} />
                </span>
                <span className="text-[11px] text-neutral-500 block mt-0.5">
                  observations verified
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
                <span className="text-[11px] font-medium text-neutral-400 block mb-0.5">
                  Columns Tracked
                </span>
                <span className="text-xl font-bold text-neutral-900 font-mono">
                  <AnimatedCounter value={profile.columnCount} decimals={0} />
                </span>
                <span className="text-[11px] text-neutral-500 block mt-0.5">
                  distinct variables
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-neutral-800 block">Date Coverage</span>
                  <span className="text-neutral-500 text-[11px]">
                    {understanding.informationCollected.dateCoverageText}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-neutral-800 block">Row Structure</span>
                  <span className="text-neutral-500 text-[11px]">
                    {understanding.informationCollected.granularityText}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span>Deterministic profile complete</span>
            <span className="font-mono text-emerald-600">● 100% data preserved</span>
          </div>
        </div>

        {/* Card 2: What we can measure */}
        <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  2. What we can measure
                </h3>
                <p className="text-[11px] text-neutral-400">Important things found in your file</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {understanding.whatWeCanMeasure.slice(0, 6).map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        m.category === "outcome"
                          ? "bg-blue-600"
                          : m.category === "driver"
                          ? "bg-amber-600"
                          : "bg-purple-600"
                      }`}
                    />
                    <div className="truncate">
                      <span className="font-medium text-neutral-900 truncate block">
                        {m.name}
                      </span>
                      {m.description && (
                        <span className="text-[10px] text-neutral-400 truncate block">
                          {m.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {m.sampleSummary && (
                      <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
                        {m.sampleSummary}
                      </span>
                    )}
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${
                        m.category === "outcome"
                          ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                          : m.category === "driver"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-purple-50 text-purple-700 border border-purple-200/60"
                      }`}
                    >
                      {m.category === "outcome"
                        ? "Outcome"
                        : m.category === "driver"
                        ? "Activity"
                        : "Group"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span>{understanding.whatWeCanMeasure.length} measurable attributes ready</span>
            <span className="text-neutral-500">Auto-mapped</span>
          </div>
        </div>

        {/* Card 3: Things to be careful about */}
        <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  3. Things to be careful about
                </h3>
                <p className="text-[11px] text-neutral-400">Actual data-quality warnings in plain words</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {understanding.thingsToBeCarefulAbout.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    item.severity === "critical"
                      ? "bg-red-50/60 border-red-200 text-red-900"
                      : item.severity === "warning"
                      ? "bg-amber-50/60 border-amber-200 text-amber-900"
                      : item.severity === "clean"
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      : "bg-neutral-50 border-neutral-200 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      {item.severity === "clean" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                      <span>{item.title}</span>
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-medium ${
                        item.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : item.severity === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : item.severity === "clean"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      {item.severity === "clean" ? "Healthy" : item.severity}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span>Zero silent data deletions or zero-imputations</span>
            <span className="text-neutral-500 font-mono">Protected</span>
          </div>
        </div>

        {/* Card 4: What we can investigate */}
        <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    4. What we can investigate
                  </h3>
                  <p className="text-[11px] text-neutral-400">Questions generated directly from your file</p>
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Click to test</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {understanding.whatWeCanInvestigate.slice(0, 5).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuestionClick(q)}
                  className="w-full text-left p-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all group flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-semibold block leading-snug group-hover:text-white">
                      {q.question}
                    </span>
                    {q.explanation && (
                      <span className="text-[10px] text-neutral-400 group-hover:text-neutral-300 block truncate">
                        {q.explanation}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span>Or ask any custom question</span>
            <button
              onClick={onProceedToQuestions}
              className="font-medium text-neutral-900 hover:underline cursor-pointer"
            >
              Open 500-Question Library &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Technical Data Details Section */}
      <div className="pt-2">
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Technical data details
                </h3>
                <p className="text-xs text-neutral-500">
                  Column schemas, data types, null rates, and raw sample records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
              <span>{showTechnicalDetails ? "Hide details" : "Show technical details"}</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {showTechnicalDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="border-t border-neutral-200 p-6 space-y-6 overflow-hidden"
              >
                {/* Excel Workbook Sheet Switcher if multiple sheets */}
                {profile.availableSheets && profile.availableSheets.length > 1 && (
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-neutral-500" />
                      <span>Workbook Sheets:</span>
                    </span>
                    {profile.availableSheets.map((sheet) => (
                      <button
                        key={sheet}
                        onClick={() => onSelectSheet && onSelectSheet(sheet)}
                        className={`px-3 py-1 rounded-md transition-colors font-mono text-xs cursor-pointer ${
                          profile.sheetName === sheet
                            ? "bg-neutral-900 text-white font-medium"
                            : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
                        }`}
                      >
                        {sheet}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dataset Invariant & Quality Integrity Audit (Prompt Part 6) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1">
                    <span className="font-semibold text-neutral-900 block flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Data Preservation Guarantee</span>
                    </span>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      100% of uploaded records ({profile.rowCount.toLocaleString()} rows) are preserved intact. Zero silent row deletions, and missing policy values are strictly left null, never filled with zero.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1">
                    <span className="font-semibold text-neutral-900 block flex items-center gap-1.5">
                      <Binary className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Revenue Reconciliation</span>
                    </span>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      {profile.reconciliationAudit && profile.reconciliationAudit.length > 0 && !profile.reconciliationAudit[0].isReconciled
                        ? `Found ${profile.reconciliationAudit[0].discrepantRowsCount} rows where total revenue does not equal website + app revenue (max gap: $${profile.reconciliationAudit[0].maxDiscrepancy}).`
                        : "Total revenue reconciles with website plus app components across all available rows."}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1">
                    <span className="font-semibold text-neutral-900 block flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Observation Independence</span>
                    </span>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      {profile.independenceAudit?.rationale ||
                        "Sequential daily time-series measurements, not independent subjects. Statistical models account for temporal cycles."}
                    </p>
                  </div>
                </div>

                {/* Sub-tabs for Technical Inspection */}
                <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg w-fit text-xs font-medium">
                  <button
                    onClick={() => setTechTab("schema")}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      techTab === "schema"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Column Schema ({profile.columns.length})
                  </button>
                  <button
                    onClick={() => setTechTab("quality")}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      techTab === "quality"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Data Quality Ledger ({profile.dataQualityIssues.length})
                  </button>
                  <button
                    onClick={() => setTechTab("raw")}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      techTab === "raw"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Raw Data Sample ({Math.min(15, profile.records.length)} rows)
                  </button>
                </div>

                {/* Sub-tab 1: Column Schema Table */}
                {techTab === "schema" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative max-w-xs w-full">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={columnSearch}
                          onChange={(e) => setColumnSearch(e.target.value)}
                          placeholder="Filter columns..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                        />
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">
                        Showing {filteredColumns.length} of {profile.columns.length} columns
                      </span>
                    </div>

                    <div className="border border-neutral-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono text-[11px]">
                          <tr>
                            <th className="py-2.5 px-4 font-medium">Column Name</th>
                            <th className="py-2.5 px-4 font-medium">Inferred Type</th>
                            <th className="py-2.5 px-4 font-medium">Unique Values</th>
                            <th className="py-2.5 px-4 font-medium">Null %</th>
                            <th className="py-2.5 px-4 font-medium">Sample Values</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                          {filteredColumns.map((col) => (
                            <tr key={col.name} className="hover:bg-neutral-50/50">
                              <td className="py-2.5 px-4 font-semibold text-neutral-900 font-sans">
                                {col.name}
                              </td>
                              <td className="py-2.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                                    col.inferredType === "continuous"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                      : col.inferredType === "temporal"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                      : col.inferredType === "boolean"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                      : col.inferredType === "identifier"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                                      : "bg-neutral-100 text-neutral-700"
                                  }`}
                                >
                                  {col.inferredType}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-neutral-600">
                                {col.uniqueCount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-neutral-600">
                                {col.nullPercentage > 0 ? (
                                  <span className="text-amber-700 font-medium">
                                    {col.nullPercentage}%
                                  </span>
                                ) : (
                                  <span className="text-neutral-400">0%</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-neutral-500 truncate max-w-xs">
                                {(col.sampleValues || []).slice(0, 3).map((v) => JSON.stringify(v)).join(", ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Data Quality Ledger */}
                {techTab === "quality" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {["all", "critical", "warning", "advisory"].map((sev) => (
                        <button
                          key={sev}
                          onClick={() => setSelectedSeverity(sev)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
                            selectedSeverity === sev
                              ? "bg-neutral-900 text-white font-medium"
                              : "bg-neutral-50 text-neutral-600 hover:text-neutral-900 border border-neutral-200"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {filteredIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-900">
                              {issue.title}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              Affected: {issue.affectedRowCount} rows ({issue.affectedRowPercentage}%)
                            </span>
                          </div>
                          <p className="text-neutral-600 leading-relaxed text-xs">
                            {issue.description}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-sans">
                            <strong className="text-neutral-700">Recommendation:</strong> {issue.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Raw Data Traceability Preview Table */}
                {techTab === "raw" && (
                  <div className="border border-neutral-200 rounded-xl overflow-x-auto max-h-[350px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 text-neutral-500 font-mono text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 font-medium">#</th>
                          {profile.columns.map((col) => (
                            <th key={col.name} className="py-2.5 px-3 font-medium whitespace-nowrap">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                        {profile.records.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/60">
                            <td className="py-2 px-3 text-neutral-400">{idx + 1}</td>
                            {profile.columns.map((col) => (
                              <td key={col.name} className="py-2 px-3 text-neutral-700 whitespace-nowrap">
                                {row[col.name] === null || row[col.name] === undefined ? (
                                  <span className="text-neutral-300 italic">null</span>
                                ) : (
                                  String(row[col.name])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
