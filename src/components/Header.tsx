import React from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { DatasetProfile } from "../types/dataset";

interface HeaderProps {
  currentScreen: "landing" | "upload" | "question" | "discovery" | "investigation" | "one_day_challenge";
  onNavigate: (screen: "landing" | "upload" | "question" | "discovery" | "investigation" | "one_day_challenge") => void;
  dataset: DatasetProfile | null;
  onReset: () => void;
  aiStatus?: {
    isAvailable: boolean;
    model: string;
    engine: string;
    capabilities: string[];
    notice?: string;
  } | null;
  onOpenBenchmark?: () => void;
  onOpenOneDayChallenge?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  dataset,
  onReset,
  aiStatus,
  onOpenBenchmark,
  onOpenOneDayChallenge,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark in single-element text with AI engine indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate("landing")}
            className="text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <span>AFTERDATA</span>
          </button>
          {aiStatus !== undefined && (
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                aiStatus?.isAvailable
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
              title={
                aiStatus?.isAvailable
                  ? "Gemini 3.8 Flash natural language synthesis + Deterministic statistical engine"
                  : aiStatus?.notice || "Deterministic calculation engine active (AI text offline)"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  aiStatus?.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>
                {aiStatus?.isAvailable ? "AI-Native (Gemini 3.8)" : "Deterministic (AI Offline)"}
              </span>
            </div>
          )}
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          <button
            onClick={() => onNavigate("landing")}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentScreen === "landing" ? "text-neutral-900 font-semibold" : "hover:text-neutral-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate("upload")}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              currentScreen === "upload" ? "text-neutral-900 font-semibold" : "hover:text-neutral-900"
            }`}
          >
            <span>Dataset</span>
            {dataset && (
              <span className="text-xs text-neutral-400 font-mono">
                ({dataset.rowCount} rows)
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (dataset) onNavigate("question");
              else onNavigate("upload");
            }}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentScreen === "question" || currentScreen === "investigation"
                ? "text-neutral-900 font-semibold"
                : "hover:text-neutral-900"
            }`}
          >
            Investigations
          </button>
          <button
            onClick={() => onNavigate("one_day_challenge")}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              currentScreen === "one_day_challenge"
                ? "text-neutral-900 font-semibold"
                : "hover:text-neutral-900"
            }`}
          >
            <span>One Day Challenge</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-100 text-neutral-700">Benchmark</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate("one_day_challenge")}
            title="Open Axis Max Life One Day Challenge 3-Slide Benchmark"
            className="hidden lg:flex px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors items-center gap-1.5 bg-neutral-50/70 hover:bg-neutral-100 cursor-pointer"
          >
            <span className="font-semibold text-neutral-900">One Day Challenge</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">Slide Deck</span>
          </button>

          {onOpenBenchmark && (
            <button
              onClick={onOpenBenchmark}
              title="Run Part 10 Adversarial Benchmark Suite (28 questions)"
              className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 bg-neutral-50/70 hover:bg-neutral-100 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Adversarial</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">28/28</span>
            </button>
          )}

          {dataset ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                title="Replace dataset"
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Replace Dataset</span>
              </button>
              <button
                onClick={() => onNavigate("question")}
                className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Ask a Question
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate("upload")}
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Start Investigating
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
