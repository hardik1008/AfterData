import React, { useState } from "react";
import { DatasetProfile, StatisticalResult } from "../../types/dataset";
import {
  evaluateDynamicExperiences,
  ExperienceType,
  DynamicExperiencesPlan,
} from "../../lib/experienceSelector";
import { StatisticalDecisionPlan } from "../../lib/decisionEngine";
import { DiscoverExperience } from "./DiscoverExperience";
import { DiagnoseExperience } from "./DiagnoseExperience";
import { ExperimentExperience } from "./ExperimentExperience";
import { LearnExperience } from "./LearnExperience";
import { ForecastExperience } from "./ForecastExperience";
import { DecideExperience } from "./DecideExperience";
import { OptimiseExperience } from "./OptimiseExperience";
import {
  Compass,
  Stethoscope,
  Sliders,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Target,
  Sparkles,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DynamicExperienceContainerProps {
  question: string;
  dataset: DatasetProfile;
  result: StatisticalResult;
  decisionPlan?: StatisticalDecisionPlan | null;
  targetVar?: string;
  groupVar?: string;
}

export const DynamicExperienceContainer: React.FC<DynamicExperienceContainerProps> = ({
  question,
  dataset,
  result,
  decisionPlan,
  targetVar,
  groupVar,
}) => {
  const plan: DynamicExperiencesPlan = evaluateDynamicExperiences(
    question,
    dataset,
    result,
    decisionPlan,
    targetVar,
    groupVar
  );

  const [activeTab, setActiveTab] = useState<ExperienceType>(plan.primaryExperience);

  const iconMap = {
    Compass: Compass,
    Stethoscope: Stethoscope,
    Sliders: Sliders,
    BookOpen: BookOpen,
    TrendingUp: TrendingUp,
    Lightbulb: Lightbulb,
    Target: Target,
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Experience Selection Navigation Bar */}
      <div className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
              Dynamic Experiences ({plan.eligibleExperiences.length} of 7 active)
            </span>
            <p className="text-xs text-neutral-500">
              Only showing experiences mathematically defensible for your question &amp; dataset
            </p>
          </div>

          {/* Experience Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100/80 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
            {plan.eligibleExperiences.map((exp) => {
              const IconComponent = iconMap[exp.iconName];
              const isActive = activeTab === exp.type;

              return (
                <button
                  key={exp.type}
                  onClick={() => setActiveTab(exp.type)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-white text-neutral-900 shadow-xs font-semibold"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50"
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? "text-neutral-900" : "text-neutral-500"}`} />
                  <span>{exp.title}</span>
                  {exp.isPrimary && (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" title="Primary recommended experience" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selection Logic Explanation Bar */}
        <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2 text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{plan.selectionSummary}</span>
          </div>
          <span className="font-mono text-neutral-400 shrink-0">
            Current: {plan.allEvaluations[activeTab]?.tagline}
          </span>
        </div>
      </div>

      {/* Active Experience Render */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "discover" && (
            <DiscoverExperience
              dataset={dataset}
              result={result}
              targetVar={targetVar}
              groupVar={groupVar}
            />
          )}

          {activeTab === "diagnose" && (
            <DiagnoseExperience
              dataset={dataset}
              result={result}
              targetVar={targetVar}
              groupVar={groupVar}
            />
          )}

          {activeTab === "experiment" && (
            <ExperimentExperience
              dataset={dataset}
              result={result}
              targetVar={targetVar}
              groupVar={groupVar}
            />
          )}

          {activeTab === "learn" && (
            <LearnExperience
              dataset={dataset}
              result={result}
              targetVar={targetVar}
              groupVar={groupVar}
            />
          )}

          {activeTab === "forecast" && (
            <ForecastExperience
              dataset={dataset}
              result={result}
              targetVar={targetVar}
            />
          )}

          {activeTab === "decide" && (
            <DecideExperience
              dataset={dataset}
              result={result}
              targetVar={targetVar}
              groupVar={groupVar}
            />
          )}

          {activeTab === "optimise" && (
            <OptimiseExperience
              dataset={dataset}
              targetOutcome={targetVar}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
