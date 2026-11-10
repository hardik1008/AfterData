import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Database, Sparkles, Layers, FileSpreadsheet } from "lucide-react";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

interface UploadIngestionAnimationProps {
  progressPercent: number;
  progressStage: string;
}

export const UploadIngestionAnimation: React.FC<UploadIngestionAnimationProps> = ({
  progressPercent,
  progressStage,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const [streamedRows, setStreamedRows] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStreamedRows((prev) => prev + Math.floor(Math.random() * 85) + 35);
    }, 90);
    return () => clearInterval(interval);
  }, []);

  const stages = [
    { title: "Workbook sheets & row stream", minPct: 15 },
    { title: "Column schema & inferred types", minPct: 40 },
    { title: "Tukey outlier & missingness audit", minPct: 75 },
    { title: "Granularity & rate-pair candidates", minPct: 90 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-6 overflow-hidden relative"
    >
      {/* Background Animated Data Particle Stream (subtle and meaningful) */}
      {!reducedMotion && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden flex flex-col justify-around">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: "-10%" }}
              animate={{ x: "110%" }}
              transition={{
                duration: 2.5 + i * 0.4,
                repeat: Infinity,
                ease: "linear",
              }}
              className="font-mono text-xs text-neutral-900 whitespace-nowrap"
            >
              0x4A 1024 2048 4096 8192 16384 INFER_TYPE_CONTINUOUS TUKEY_IQR_PASS NORMAL_CDF_STABLE
            </motion.div>
          ))}
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-neutral-900 text-white flex items-center justify-center">
              <Database className="w-3 h-3" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Deterministic Profiling Pipeline
            </span>
          </div>
          <h3 className="text-base font-bold text-neutral-900">
            {progressStage || "Ingesting & Profiling Dataset..."}
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-neutral-500 self-start sm:self-auto">
          <span>Streamed ~{streamedRows.toLocaleString()} rows</span>
          <span aria-hidden="true">·</span>
          <span className="font-bold text-neutral-900">{progressPercent}%</span>
        </div>
      </div>

      {/* Progress Bar with Moving Scan Glow */}
      <div className="relative w-full bg-neutral-100 h-2 rounded-full overflow-hidden z-10">
        <motion.div
          className="bg-neutral-900 h-full rounded-full relative"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {!reducedMotion && (
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
          )}
        </motion.div>
      </div>

      {/* Staged Checkpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 relative z-10">
        {stages.map((stage, idx) => {
          const isDone = progressPercent >= stage.minPct;
          const isCurrent =
            progressPercent < stage.minPct &&
            (idx === 0 || progressPercent >= stages[idx - 1].minPct);

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                isDone
                  ? "border-neutral-200 bg-neutral-50 text-neutral-900 font-medium"
                  : isCurrent
                  ? "border-neutral-400 bg-white text-neutral-900 shadow-xs"
                  : "border-neutral-100 bg-white/40 text-neutral-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-neutral-400">0{idx + 1}</span>
                <span>{stage.title}</span>
              </div>

              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-neutral-900 shrink-0" />
              ) : isCurrent ? (
                <motion.div
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 rounded-full bg-neutral-900 shrink-0"
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-neutral-200 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
