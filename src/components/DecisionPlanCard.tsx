import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { StatisticalDecisionPlan } from "../lib/decisionEngine";

interface DecisionPlanCardProps {
  plan: StatisticalDecisionPlan;
  className?: string;
  defaultExpanded?: boolean;
}

export const DecisionPlanCard: React.FC<DecisionPlanCardProps> = ({
  plan,
  className = "",
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showRejected, setShowRejected] = useState(false);

  const getStatusBadge = () => {
    switch (plan.status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-900 text-white">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Plan Approved
          </span>
        );
      case "conditional":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Approved with Conditions
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-300">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Plan Rejected
          </span>
        );
    }
  };

  const verifiedCount = plan.assumption_checks.filter(
    (a) => a.status === "verified_from_data"
  ).length;
  const unverifiedCount = plan.assumption_checks.filter(
    (a) => a.status === "unverified"
  ).length;

  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="p-6 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Deterministic Statistical Decision Plan
            </h3>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-neutral-500">
            Audited independently across all 10 core statistical concepts without LLM intervention.
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start sm:self-auto text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
        >
          <span>{isExpanded ? "Collapse Plan" : "Inspect Plan"}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Section 1: Selected Methods Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Selected Statistical Methods ({plan.selected_methods.length})
              </span>
              <span className="text-xs font-mono text-neutral-400">
                Targeted Variables: {plan.required_columns.join(", ") || "Auto-detected"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.selected_methods.map((method) => (
                <div
                  key={method.method_id}
                  className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-neutral-400 uppercase">
                      Concept {method.concept_number}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 text-neutral-700">
                      {method.method_id}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-neutral-900">
                    {method.name}
                  </h4>

                  <p className="text-xs text-neutral-600">
                    <span className="font-medium text-neutral-700">Assigned role: </span>
                    {method.role}
                  </p>

                  {method.variables && method.variables.length > 0 && (
                    <div className="text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-100 flex items-center gap-1.5">
                      <span className="text-neutral-400">Vars:</span>
                      <span className="text-neutral-700">{method.variables.join(" · ")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Mathematical Assumption Check Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Mathematical Assumption Audit
              </span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-neutral-700">
                  <span className="font-semibold">{verifiedCount}</span> data-verified
                </span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-500">
                  <span className="font-semibold">{unverifiedCount}</span> study-design dependent
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
              {plan.assumption_checks.map((check, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">
                        {check.assumption}
                      </span>
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
                    <p className="text-neutral-500 text-[11px] leading-relaxed">
                      {check.details}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0 sm:text-right">
                    {check.source.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Execution Sequence & Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                Deterministic Execution Sequence
              </span>
              <ol className="space-y-1.5 font-mono text-xs text-neutral-700">
                {plan.execution_order.map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-neutral-400 w-4">{idx + 1}.</span>
                    <span className="font-semibold text-neutral-900">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                Sample Power &amp; Diagnostics
              </span>
              {plan.warnings.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-neutral-700">
                  {plan.warnings.map((warn, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700" />
                  <span>No sample size or missingness warnings detected.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Rejected Alternative Methods with Explicit Rationale */}
          <div className="pt-2 border-t border-neutral-100">
            <button
              onClick={() => setShowRejected(!showRejected)}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors"
            >
              <span>
                {showRejected ? "Hide" : "Inspect"}{" "}
                {plan.rejected_methods.length} Unselected / Rejected Methods
              </span>
              {showRejected ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showRejected && (
              <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                <p className="text-[11px] text-neutral-500">
                  AFTERDATA does not run unsuitable tests. Here is why alternatives were disqualified:
                </p>
                <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden bg-neutral-50/30">
                  {plan.rejected_methods.map((rej) => (
                    <div key={rej.method_id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900">
                            {rej.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            Concept {rej.concept_number}
                          </span>
                        </div>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          {rej.rejection_reason}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">
                        REJECTED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
