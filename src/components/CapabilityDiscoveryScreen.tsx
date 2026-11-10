import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  Sparkles,
  SlidersHorizontal,
  Info,
  Layers,
  RotateCcw,
} from "lucide-react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import {
  CapabilityDiscoveryResult,
  DatasetProfile,
  DiscoveredInvestigation,
} from "../types/dataset";

interface CapabilityDiscoveryScreenProps {
  discoveryResult: CapabilityDiscoveryResult;
  dataset: DatasetProfile;
  onProceedToExecution: (selectedInvestigations: DiscoveredInvestigation[]) => void;
  onBackToEditQuestion: () => void;
  onSelectClarificationQuestion?: (newQuestion: string) => void;
}

export const CapabilityDiscoveryScreen: React.FC<CapabilityDiscoveryScreenProps> = ({
  discoveryResult,
  dataset,
  onProceedToExecution,
  onBackToEditQuestion,
  onSelectClarificationQuestion,
}) => {
  const { relevance, investigations, originalQuestion } = discoveryResult;
  const reducedMotion = usePrefersReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.08,
        delayChildren: reducedMotion ? 0 : 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.4, ease: "easeOut" as const },
    },
  };

  // Selected investigation IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const recommended = investigations
      .filter((i) => i.isRecommended && i.isSelectable)
      .map((i) => i.id);
    return new Set(recommended.length > 0 ? recommended : [investigations[0]?.id].filter(Boolean));
  });

  const toggleSelection = (id: string, isSelectable: boolean) => {
    if (!isSelectable) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAllRecommended = () => {
    const recommended = investigations
      .filter((i) => i.isRecommended && i.isSelectable)
      .map((i) => i.id);
    setSelectedIds(new Set(recommended));
  };

  const selectedList = investigations.filter((i) => selectedIds.has(i.id));

  // --- GATE FAILURE VIEW (IRRELEVANT, AMBIGUOUS, INSUFFICIENT_EVIDENCE) ---
  if (!relevance.isPass) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-200">
        <button
          onClick={onBackToEditQuestion}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to questions</span>
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span>Question Relevance Gate</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-neutral-700">
              {relevance.classification.replace("_", " ")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-snug">
            &ldquo;{originalQuestion}&rdquo;
          </h1>
        </div>

        {/* Gate Honesty Card */}
        <div className="p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            {relevance.classification === "IRRELEVANT" ? (
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-800">
                <AlertCircle className="w-5 h-5 text-neutral-700" />
              </div>
            ) : relevance.classification === "AMBIGUOUS" ? (
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-800">
                <HelpCircle className="w-5 h-5 text-neutral-700" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}

            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-neutral-900">
                {relevance.headline}
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed font-sans">
                {relevance.explanation}
              </p>
            </div>
          </div>

          {/* Ambiguous Clarification Options */}
          {relevance.classification === "AMBIGUOUS" && relevance.clarificationOptions && (
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                Choose a specific metric to clarify your investigation:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {relevance.clarificationOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectClarificationQuestion && onSelectClarificationQuestion(opt)}
                    className="p-3 text-left rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-400 transition-all text-xs font-medium text-neutral-800 flex items-center justify-between group"
                  >
                    <span>{opt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Alternative Questions */}
          {relevance.suggestedAlternatives && relevance.suggestedAlternatives.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                Explore questions that this dataset can investigate:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {relevance.suggestedAlternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectClarificationQuestion && onSelectClarificationQuestion(alt)}
                    className="p-3 text-left rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-900 hover:text-white transition-all text-xs font-medium text-neutral-800 flex items-center justify-between group"
                  >
                    <span>{alt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-neutral-400 font-mono">
              AFTERDATA never forces an ungrounded analysis
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onBackToEditQuestion}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Edit Your Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- CAPABILITY DISCOVERY VIEW (PASS) ---
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToEditQuestion}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Edit question</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span>{dataset.filename}</span>
          <span aria-hidden="true">·</span>
          <span>N = {dataset.rowCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <span>Question Feasibility Verified</span>
          <span aria-hidden="true">·</span>
          <span className="text-neutral-800 font-semibold">{relevance.classification}</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Here&apos;s what I can investigate.
        </h1>
        <p className="text-sm text-neutral-500">
          Based on your question &ldquo;{originalQuestion}&rdquo; and the fields available in your data, I&apos;ve mapped these investigation pathways.
        </p>
      </div>

      {/* Partially Answerable Notice if applicable */}
      {relevance.classification === "PARTIALLY_ANSWERABLE" && (
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex items-start gap-3">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-neutral-900">Partial Answerability Notice:</span>
            <p>{relevance.explanation}</p>
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-900 font-mono">
            {selectedIds.size} of {investigations.length} selected
          </span>
          <span aria-hidden="true" className="text-neutral-300">·</span>
          <button
            onClick={handleSelectAllRecommended}
            className="text-neutral-600 hover:text-neutral-900 underline font-medium"
          >
            Select All Recommended ({discoveryResult.recommendedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onProceedToExecution(selectedList)}
            disabled={selectedList.length === 0}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <span>Start with recommended plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Capability Discovery Cards with Staggered Entrance Animation */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {investigations.map((inv) => {
          const isSelected = selectedIds.has(inv.id);
          const isApproved = inv.deterministicApproval?.isApproved !== false;
          const isSupported = inv.dataSupportStatus === "Supported by data";
          const isPartial = inv.dataSupportStatus === "Partially supported";

          return (
            <motion.div
              key={inv.id}
              variants={cardVariants}
              onClick={() => toggleSelection(inv.id, inv.isSelectable)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer bg-white relative ${
                isSelected
                  ? "border-neutral-900 shadow-sm ring-1 ring-neutral-900/10"
                  : "border-neutral-200 hover:border-neutral-400"
              } ${!inv.isSelectable ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                  {/* Top metadata tags & Deterministic Engine Approval Badge */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 font-mono">
                    <span className="font-semibold text-neutral-900 font-sans">
                      {inv.experienceCategory}
                    </span>
                    <span aria-hidden="true">·</span>

                    {/* Deterministic Engine Approval Stamp */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved by Deterministic Engine</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>Feasibility Flag</span>
                        </>
                      )}
                    </span>

                    {inv.isRecommended && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-neutral-900 font-semibold font-sans">
                          Recommended
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-neutral-900 leading-snug">
                    {inv.title}
                  </h3>

                  {/* 1. What it means in simple language */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono block">
                      What it means in simple language:
                    </span>
                    <p className="text-sm text-neutral-800 leading-relaxed font-normal">
                      {inv.simpleExplanation}
                    </p>
                  </div>

                  {/* 2. Why it might be useful */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono block">
                      Why it might be useful:
                    </span>
                    <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                      {inv.whyUseful}
                    </p>
                  </div>

                  {/* 3. Whether the data supports it */}
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                        Whether the data supports it:
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border font-sans ${
                          isSupported
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : isPartial
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-red-50 text-red-800 border-red-200"
                        }`}
                      >
                        {inv.dataSupportStatus || inv.availability}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      {inv.dataSupportReason ||
                        inv.deterministicApproval?.reason ||
                        "All required columns are present in the dataset."}
                    </p>
                  </div>

                  {/* 4. What additional information might be needed */}
                  <div className="p-3 rounded-xl bg-neutral-50/50 border border-neutral-100 text-xs text-neutral-600 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-neutral-700 font-mono text-[11px] uppercase tracking-wider block">
                        What additional information might be needed:
                      </span>
                      <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                        {inv.additionalInformationNeeded ||
                          "None — all required data is already present in your uploaded dataset."}
                      </p>
                    </div>
                  </div>

                  {/* Verified variables & Statistical method */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 font-mono pt-1 border-t border-neutral-100">
                    <span>
                      Required Fields:{" "}
                      <strong className="text-neutral-900 font-mono">
                        {inv.requiredVariables.join(", ")}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Method:{" "}
                      <strong className="text-neutral-900 font-mono">
                        {inv.candidateMethods.join(", ")}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Checkbox Selector */}
                <div className="shrink-0 pt-1">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-neutral-900 border-neutral-900 text-white"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Bottom Sticky Action Bar */}
      <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBackToEditQuestion}
          className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Return to edit question
        </button>

        <button
          onClick={() => onProceedToExecution(selectedList)}
          disabled={selectedList.length === 0}
          className="w-full sm:w-auto px-7 py-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Run Selected Investigations ({selectedList.length})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
