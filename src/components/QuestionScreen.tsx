import React, { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  BookOpen,
  Edit3,
  BarChart3,
  X,
  Target,
  Briefcase,
  Layers,
  Info,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react";
import {
  BusinessQuestion,
  BusinessQuestionLibrary,
  DatasetProfile,
  QuestionLibraryItem,
  StructuredQuestionInterpretation,
} from "../types/dataset";
import {
  generateBusinessQuestionLibrary,
  getEnhancedBusinessQuestionLibrary,
} from "../lib/businessQuestionEngine";
import { WhatElseModal } from "./WhatElseModal";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

interface QuestionScreenProps {
  dataset: DatasetProfile;
  onSelectQuestion: (
    questionText: string,
    suggestedTest?: string,
    targetVar?: string,
    groupVar?: string
  ) => void;
  onBackToUpload: () => void;
  onOpenOneDayChallenge?: () => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  dataset,
  onSelectQuestion,
  onBackToUpload,
  onOpenOneDayChallenge,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  // 1. Business-First Question Library State (Instant deterministic render + background AI enrichment)
  const [businessLibrary, setBusinessLibrary] = useState<BusinessQuestionLibrary>(() => {
    return generateBusinessQuestionLibrary(dataset);
  });
  const [selectedTheme, setSelectedTheme] = useState<string>("All Themes");
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [customQuestionInput, setCustomQuestionInput] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretation, setInterpretation] = useState<StructuredQuestionInterpretation | null>(null);
  const [isWhatElseOpen, setIsWhatElseOpen] = useState(false);

  // Missing Data Notice Modal State
  const [missingDataQuestion, setMissingDataQuestion] = useState<BusinessQuestion | null>(null);

  // 2. Expandable Internal 500-Question Academic Reference State (default collapsed)
  const [showAcademic500, setShowAcademic500] = useState(false);
  const [academicQuestions, setAcademicQuestions] = useState<QuestionLibraryItem[]>([]);
  const [academicSearch, setAcademicSearch] = useState("");
  const [selectedContext, setSelectedContext] = useState<string>("All Contexts");
  const [selectedConcept, setSelectedConcept] = useState<string>("All Concepts");
  const [availableContexts, setAvailableContexts] = useState<string[]>([]);
  const [availableConcepts, setAvailableConcepts] = useState<string[]>([]);
  const [total500Count, setTotal500Count] = useState<number>(500);
  const [isLoadingAcademic, setIsLoadingAcademic] = useState(false);

  // Load business-first questions enriched via server-side Gemini if online
  useEffect(() => {
    let isCurrent = true;
    getEnhancedBusinessQuestionLibrary(dataset).then((enhanced) => {
      if (isCurrent && enhanced) {
        setBusinessLibrary(enhanced);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [dataset.datasetId]);

  // Load Academic 500-Question Library metadata when expanded
  useEffect(() => {
    if (showAcademic500 && availableContexts.length === 0) {
      fetch("/api/questions/metadata")
        .then((r) => r.json())
        .then((data) => {
          if (data.business_contexts) setAvailableContexts(data.business_contexts);
          if (data.statistical_concepts) setAvailableConcepts(data.statistical_concepts);
          if (data.total_count) setTotal500Count(data.total_count);
        })
        .catch(() => {});
    }
  }, [showAcademic500, availableContexts.length]);

  // Fetch Academic 500 Questions on filter change
  useEffect(() => {
    if (!showAcademic500) return;
    let isCurrent = true;
    setIsLoadingAcademic(true);

    const params = new URLSearchParams();
    if (academicSearch.trim()) params.set("search", academicSearch.trim());
    if (selectedContext !== "All Contexts") params.set("context", selectedContext);
    if (selectedConcept !== "All Concepts") params.set("concept", selectedConcept);
    params.set("limit", "50");

    fetch(`/api/questions?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (isCurrent && data.questions) {
          setAcademicQuestions(data.questions);
          setIsLoadingAcademic(false);
        }
      })
      .catch(() => {
        if (isCurrent) setIsLoadingAcademic(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [showAcademic500, academicSearch, selectedContext, selectedConcept]);

  // Interpret natural-language question
  const handleInterpret = async (questionText: string) => {
    if (!questionText.trim()) return;
    setIsInterpreting(true);
    setInterpretation(null);

    try {
      const res = await fetch("/api/question-interpreter/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          datasetColumns: dataset.columns.map((c) => ({
            name: c.name,
            inferredType: c.inferredType,
          })),
          rowCount: dataset.rowCount,
          dataset: {
            filename: dataset.filename,
            rowCount: dataset.rowCount,
            columns: dataset.columns,
            granularity: dataset.granularity,
            timeCoverage: dataset.timeCoverage,
          },
          businessBrief: businessLibrary.centralBusinessProblem,
        }),
      });

      const data = await res.json();
      if (data.success && data.interpretation) {
        setInterpretation(data.interpretation);
      }
    } catch (err) {
      console.error("Interpreter error:", err);
    } finally {
      setIsInterpreting(false);
    }
  };

  // Filter Business Questions
  const filteredBusinessQuestions = businessLibrary.questions.filter((q) => {
    const matchesTheme = selectedTheme === "All Themes" || q.theme === selectedTheme;
    const matchesSearch =
      !businessSearchQuery.trim() ||
      q.question.toLowerCase().includes(businessSearchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(businessSearchQuery.toLowerCase()) ||
      (q.businessValue && q.businessValue.toLowerCase().includes(businessSearchQuery.toLowerCase()));

    return matchesTheme && matchesSearch;
  });

  const handleSelectBusinessQuestion = (q: BusinessQuestion) => {
    if (q.feasibility === "needs_data") {
      setMissingDataQuestion(q);
      return;
    }
    onSelectQuestion(q.question, q.suggestedTest, q.targetVar, q.groupVar);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Return to Dataset Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <span className="font-semibold text-neutral-900">{dataset.filename}</span>
          <span aria-hidden="true">·</span>
          <span>{dataset.rowCount.toLocaleString()} observations</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 font-medium">Business-First Question Library</span>
        </div>

        <button
          onClick={onBackToUpload}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>&larr; Back to dataset overview</span>
        </button>
      </div>

      {/* Central Business Problem Card */}
      <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white tracking-wide uppercase font-mono text-[10px]">
              Central Business Objective
            </span>
            <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
              Executive Brief Alignment
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsWhatElseOpen(true)}
              className="text-xs font-semibold text-neutral-800 hover:text-neutral-900 flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg border border-neutral-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
              <span>What else can AFTERDATA investigate?</span>
            </button>
            {onOpenOneDayChallenge && (
              <button
                onClick={onOpenOneDayChallenge}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                <span>View 3-Slide Challenge Benchmark &rarr;</span>
              </button>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-tight">
          &ldquo;{businessLibrary.centralBusinessProblem}&rdquo;
        </h1>

        <p className="text-xs text-neutral-500 leading-relaxed max-w-3xl">
          {businessLibrary.datasetContextSummary} We translated this business objective into {businessLibrary.questions.length} plain-language questions across {businessLibrary.themes.length} key decision themes.
        </p>
      </div>

      {/* Natural Language Question Input (Unified Quick-Ask Bar) */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
            <span>Ask your own business question in plain English</span>
          </label>
          <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
            Translates to statistical method automatically
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={customQuestionInput}
              onChange={(e) => setCustomQuestionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customQuestionInput.trim()) {
                  handleInterpret(customQuestionInput);
                }
              }}
              placeholder="e.g. Did website revenue fall after the app launched? Or: Which plan tier generates the highest spend?"
              className="w-full px-4 py-3 text-xs sm:text-sm bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 transition-colors shadow-2xs"
            />
            {customQuestionInput && (
              <button
                onClick={() => {
                  setCustomQuestionInput("");
                  setInterpretation(null);
                }}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleInterpret(customQuestionInput)}
            disabled={!customQuestionInput.trim() || isInterpreting}
            className="px-5 py-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
          >
            {isInterpreting ? (
              <span>Translating...</span>
            ) : (
              <>
                <span>Analyze Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Live Interpretation Preview */}
        <AnimatePresence>
          {interpretation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className={`mt-3 p-5 rounded-xl border ${
                interpretation.isValid
                  ? "border-neutral-200 bg-white"
                  : "border-neutral-300 bg-neutral-50/90"
              } space-y-4 text-xs shadow-xs`}
            >
              {interpretation.isValid ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-neutral-900 block">
                          Question Interpretation Ready
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {interpretation.headline}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onSelectQuestion(
                          customQuestionInput,
                          interpretation.candidate_test || interpretation.requested_experiences?.[0] || "Welch Two-Sample t-test",
                          interpretation.outcome_candidates?.[0],
                          interpretation.predictor_candidates?.[0]
                        )
                      }
                      className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    >
                      <span>Start This Investigation</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                      <span className="text-neutral-400 block mb-0.5">Objective</span>
                      <span className="text-neutral-900 font-sans font-medium line-clamp-2">
                        {interpretation.business_objective}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                      <span className="text-neutral-400 block mb-0.5">Primary Target</span>
                      <span className="text-neutral-900 font-semibold">
                        {interpretation.outcome_candidates?.[0] || "Auto-detected"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                      <span className="text-neutral-400 block mb-0.5">Comparing By</span>
                      <span className="text-neutral-900 font-semibold">
                        {interpretation.predictor_candidates?.[0] || "Baseline"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* STRICT REJECTION CARD: Polite, honest, and helpful */
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {interpretation.decision === "AMBIGUOUS" ? (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4 text-neutral-700" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4 text-neutral-700" />
                      </div>
                    )}

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 font-semibold">
                          Relevance Gate · {String(interpretation.decision).replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {interpretation.headline}
                      </h3>
                      <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                        {interpretation.politeResponse}
                      </p>
                    </div>
                  </div>

                  {/* Clarification Chips */}
                  {interpretation.clarificationOptions && interpretation.clarificationOptions.length > 0 && (
                    <div className="pt-3 border-t border-neutral-200/60 space-y-2">
                      <span className="text-[11px] font-semibold text-neutral-600 block">
                        Select a specific measurable dimension to investigate:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {interpretation.clarificationOptions.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCustomQuestionInput(opt);
                              handleInterpret(opt);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-all text-left flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{opt}</span>
                            <ArrowRight className="w-3 h-3 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Alternatives */}
                  {interpretation.suggestedAlternatives && interpretation.suggestedAlternatives.length > 0 && (
                    <div className="pt-3 border-t border-neutral-200/60 space-y-2">
                      <span className="text-[11px] font-semibold text-neutral-600 block">
                        Or explore questions answerable from your uploaded data:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {interpretation.suggestedAlternatives.map((alt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCustomQuestionInput(alt);
                              handleInterpret(alt);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-neutral-800 text-xs font-medium transition-all text-left flex items-center gap-1.5 cursor-pointer group"
                          >
                            <span>{alt}</span>
                            <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-white transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Business-First Question Browser */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Curated Business Questions ({filteredBusinessQuestions.length})
            </h2>
            <p className="text-xs text-neutral-500">
              Questions that a founder, manager, or analyst would naturally ask about this data.
            </p>
          </div>

          {/* Search inside curated questions */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={businessSearchQuery}
              onChange={(e) => setBusinessSearchQuery(e.target.value)}
              placeholder="Filter by question..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
            />
          </div>
        </div>

        {/* Theme Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => setSelectedTheme("All Themes")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer font-medium ${
              selectedTheme === "All Themes"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
            }`}
          >
            All Themes ({businessLibrary.questions.length})
          </button>
          {businessLibrary.themes.map((theme) => {
            const count = businessLibrary.questions.filter((q) => q.theme === theme).length;
            return (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer font-medium whitespace-nowrap ${
                  selectedTheme === theme
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                }`}
              >
                {theme} ({count})
              </button>
            );
          })}
        </div>

        {/* Curated Business Questions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBusinessQuestions.map((q) => (
            <div
              key={q.id}
              onClick={() => handleSelectBusinessQuestion(q)}
              className="p-5 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                    {q.theme}
                  </span>

                  {/* Feasibility Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                      q.feasibility === "ready"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                        : q.feasibility === "partial"
                        ? "bg-blue-50 text-blue-800 border border-blue-200/60"
                        : "bg-amber-50 text-amber-800 border border-amber-200/60"
                    }`}
                  >
                    {q.feasibility === "ready" ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    ) : q.feasibility === "partial" ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    )}
                    <span>{q.feasibilityLabel}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 leading-snug group-hover:text-black">
                  {q.question}
                </h3>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  {q.explanation}
                </p>

                {q.businessValue && (
                  <p className="text-[11px] text-neutral-400 italic">
                    Why it matters: {q.businessValue}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-400 font-mono">
                  Method: {q.suggestedTest}
                </span>

                <span className="font-semibold text-neutral-900 group-hover:underline flex items-center gap-1">
                  {q.feasibility === "needs_data" ? (
                    <span className="text-amber-800">Review missing data &rarr;</span>
                  ) : (
                    <span>Investigate &rarr;</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Data Guidance Modal */}
      <AnimatePresence>
        {missingDataQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Additional Data Needed
                  </h3>
                </div>
                <button
                  onClick={() => setMissingDataQuestion(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-neutral-900">
                  &ldquo;{missingDataQuestion.question}&rdquo;
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {missingDataQuestion.missingRequirementExplanation ||
                    "This question is strategically important, but cannot be calculated strictly using the columns in your current uploaded file."}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs space-y-1 font-sans">
                <span className="font-semibold block">What data would make this answerable:</span>
                <span className="text-[11px] block text-amber-800">
                  Customer-level policy ticket values, marketing ad spend by channel, or conversion event logs.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setMissingDataQuestion(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const fallbackQ = businessLibrary.questions.find((q) => q.feasibility === "ready");
                    setMissingDataQuestion(null);
                    if (fallbackQ) {
                      handleSelectBusinessQuestion(fallbackQ);
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer"
                >
                  Investigate Closest Available Metric
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Internal Reference Accordion: 500-Question Academic & Statistical Spec */}
      <div className="pt-4 border-t border-neutral-200">
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowAcademic500(!showAcademic500)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Academic &amp; Statistical Template Library (500 Questions)
                </h3>
                <p className="text-xs text-neutral-500">
                  Internal reference catalog categorized by 10 business contexts and statistical concepts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
              <span>{showAcademic500 ? "Hide template library" : "Explore 500 reference templates"}</span>
              {showAcademic500 ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {showAcademic500 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="border-t border-neutral-200 p-6 space-y-6 overflow-hidden"
              >
                {/* Search & Filter Toolbar for 500 Questions */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={academicSearch}
                        onChange={(e) => setAcademicSearch(e.target.value)}
                        placeholder="Search 500 academic templates by keyword or concept..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={selectedContext}
                        onChange={(e) => setSelectedContext(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-700 font-medium"
                      >
                        <option value="All Contexts">All 10 Contexts</option>
                        {availableContexts.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedConcept}
                        onChange={(e) => setSelectedConcept(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-700 font-medium"
                      >
                        <option value="All Concepts">All Concepts</option>
                        {availableConcepts.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 500 Question List */}
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {isLoadingAcademic ? (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      Loading academic reference templates...
                    </div>
                  ) : academicQuestions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      No matching questions found in 500-question catalog.
                    </div>
                  ) : (
                    academicQuestions.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-400 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                            <span>{item.id}</span>
                            <span>·</span>
                            <span className="text-neutral-700 font-semibold">
                              {item.business_context}
                            </span>
                            <span>·</span>
                            <span>{item.statistical_concept}</span>
                          </div>
                          <h4 className="font-semibold text-neutral-900 truncate">
                            {item.question}
                          </h4>
                        </div>

                        <button
                          onClick={() =>
                            onSelectQuestion(
                              item.question,
                              item.suggested_test,
                              item.outcome_candidates[0],
                              item.predictor_candidates[0]
                            )
                          }
                          className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shrink-0 cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Persistent "What else can AFTERDATA investigate?" Modal */}
      <WhatElseModal
        isOpen={isWhatElseOpen}
        onClose={() => setIsWhatElseOpen(false)}
        dataset={dataset}
        onSelectInvestigation={onSelectQuestion}
      />
    </div>
  );
};
