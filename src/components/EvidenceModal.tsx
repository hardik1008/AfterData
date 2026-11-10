import React from "react";
import { X, CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet, Binary } from "lucide-react";
import { StatisticalResult } from "../types/dataset";
import { motion } from "motion/react";

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: StatisticalResult;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neutral-800" />
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Mathematical Evidence &amp; Verification Trail
              </h2>
              <p className="text-xs text-neutral-500">
                Step-by-step deterministic audit proving statistical reproducibility
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-600">
          {/* Mathematical Engine Core Badge */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-neutral-800" />
              <span className="font-semibold text-neutral-900">Python Mathematical Core Active</span>
              <span className="text-[11px] text-neutral-500 font-mono">/backend/modules/</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-white">
              Zero-LLM Math
            </span>
          </div>

          {/* Key Parameters Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-neutral-400 block mb-0.5">Test Statistic</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {result.testStatistic}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-neutral-400 block mb-0.5">Two-tailed p-value</span>
              <span
                className={`font-semibold tabular-nums ${
                  result.isSignificant ? "text-neutral-900" : "text-neutral-500"
                }`}
              >
                {result.pValueDisplay || (result.pValue < 0.001 ? "< 0.001" : result.pValue.toFixed(3))}
              </span>
              {result.pValue < 0.001 && (
                <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono">
                  raw: {result.rawPValue !== undefined ? result.rawPValue : result.pValue}
                </span>
              )}
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-neutral-400 block mb-0.5">Sample Size (N)</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {result.sampleSize}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-neutral-400 block mb-0.5">Effect Size</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {result.effectSize !== undefined ? result.effectSize : "N/A"}
              </span>
            </div>
          </div>

          {/* Sequential Evidence Trail Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Sequential Verification Proof
            </h4>
            <div className="space-y-3 font-mono">
              {result.evidenceSteps.map((step, idx) => (
                <motion.div
                  key={step.stepNumber}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                  className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-800">
                      Phase 0{step.stepNumber}: {step.title}
                    </span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                      {step.phase}
                    </span>
                  </div>

                  {step.formula && (
                    <div className="text-[11px] text-neutral-700 bg-white p-2 rounded border border-neutral-200 font-mono">
                      {step.formula}
                    </div>
                  )}

                  <p className="text-[11px] text-neutral-600 font-sans">
                    {step.computation}
                  </p>

                  <div className="pt-1 text-[11px] font-semibold text-neutral-900">
                    Result: {step.result}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Validation Checks */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Validation Engine Pre-Flight Checks
            </h4>
            <div className="space-y-2">
              {result.validationChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-neutral-200 flex items-start gap-3 bg-white"
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-neutral-900 text-xs">
                      {check.checkName}
                    </h5>
                    <p className="text-xs text-neutral-500">{check.details}</p>
                    {check.recommendation && (
                      <p className="text-xs text-amber-700 font-medium pt-0.5">
                        Recommendation: {check.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
