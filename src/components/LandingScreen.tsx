import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface LandingScreenProps {
  onStart: () => void;
  onOpenArchitecture: () => void;
  onOpenBenchmark?: () => void;
  onOpenOneDayChallenge?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStart,
  onOpenArchitecture,
  onOpenBenchmark,
  onOpenOneDayChallenge,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-10 md:py-14">
      <div className="max-w-4xl mx-auto px-6 w-full space-y-12 md:space-y-14 my-auto">
        {/* Hero Section */}
        <div className="text-center space-y-6 pt-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-neutral-500"
          >
            <span>AFTERDATA</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-neutral-400 font-normal">Statistical Business Investigation</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 max-w-3xl mx-auto leading-[1.12]"
            style={{ textWrap: "balance" }}
          >
            Your data has answers. <br className="hidden sm:inline" />
            Let&apos;s find them.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto font-normal leading-relaxed"
          >
            Upload your business data. Ask a question. Discover what the numbers are telling you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 group"
            >
              <span>Start investigating</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={onOpenArchitecture}
              className="w-full sm:w-auto px-5 py-3.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors border border-neutral-200 cursor-pointer"
            >
              How it works &amp; architecture
            </button>
            {onOpenOneDayChallenge && (
              <button
                onClick={onOpenOneDayChallenge}
                className="w-full sm:w-auto px-5 py-3.5 text-sm font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors border border-neutral-300 flex items-center justify-center gap-2 cursor-pointer font-semibold"
              >
                <span>One Day Challenge</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-white font-bold">3 Slides</span>
              </button>
            )}
            {onOpenBenchmark && (
              <button
                onClick={onOpenBenchmark}
                className="w-full sm:w-auto px-5 py-3.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors border border-neutral-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Adversarial Suite (28/28)</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* Core Philosophy Section: The 6-Step Engine */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="p-8 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-6"
        >
          <div className="max-w-md">
            <h2 className="text-base font-semibold text-neutral-900">
              The AFTERDATA Methodology
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Not a dashboard. Not a hallucinating chatbot. A mathematically verified business investigation pipeline.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
            {[
              {
                num: "01",
                verb: "LLM understands",
                desc: "Translates conversational questions into testable statistical hypotheses.",
              },
              {
                num: "02",
                verb: "Deterministic engine decides",
                desc: "Selects the exact appropriate test without model drift or guesswork.",
              },
              {
                num: "03",
                verb: "Python calculates",
                desc: "Executes verified mathematical computations, p-values, and effect sizes.",
              },
              {
                num: "04",
                verb: "Validation engine verifies",
                desc: "Audits sample sizes, variance assumptions, and confounding risks.",
              },
              {
                num: "05",
                verb: "LLM explains",
                desc: "Translates numbers into language a 10-year-old can instantly understand.",
              },
              {
                num: "06",
                verb: "Evidence trail proves",
                desc: "Shows formulas, intermediate steps, and mathematical audit proofs.",
              },
            ].map((step) => (
              <div key={step.num} className="space-y-1">
                <span className="font-mono text-xs font-semibold text-neutral-400">
                  {step.num}
                </span>
                <h4 className="text-xs font-semibold text-neutral-900">
                  {step.verb}
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-neutral-400 max-w-4xl mx-auto px-6 w-full flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 pt-6">
        <span>AFTERDATA &copy; 2026 · Your data. Your questions. Clear answers.</span>
        <button
          onClick={onOpenArchitecture}
          className="hover:text-neutral-700 transition-colors mt-2 sm:mt-0"
        >
          FastAPI &amp; Statistical Specifications
        </button>
      </footer>
    </div>
  );
};
