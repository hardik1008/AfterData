import React, { useState } from "react";
import { DatasetProfile, StatisticalResult } from "../../types/dataset";
import { AnimatedCounter } from "./AnimatedCounter";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  Compass,
  TrendingUp,
  BarChart3,
  Layers,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

interface DiscoverExperienceProps {
  dataset: DatasetProfile;
  result: StatisticalResult;
  targetVar?: string;
  groupVar?: string;
}

export const DiscoverExperience: React.FC<DiscoverExperienceProps> = ({
  dataset,
  result,
  targetVar,
  groupVar,
}) => {
  const continuousCols = dataset.columns.filter((c) => c.inferredType === "continuous");
  const categoricalCols = dataset.columns.filter((c) => c.inferredType === "categorical");

  const activeMetric =
    targetVar && continuousCols.some((c) => c.name === targetVar)
      ? targetVar
      : continuousCols[0]?.name || "Value";

  const metricProfile = dataset.columns.find((c) => c.name === activeMetric);

  const meanVal = metricProfile?.meanValue ?? 0;
  const medianVal = metricProfile?.medianValue ?? meanVal;
  const stdVal = metricProfile?.stdValue ?? 0;
  const minVal = metricProfile?.minValue ?? 0;
  const maxVal = metricProfile?.maxValue ?? 0;
  const iqrVal = metricProfile?.iqr ?? Math.max(1, (maxVal - minVal) / 2);
  const outlierCount = metricProfile?.outliers?.count ?? 0;

  // Cohort comparison if categorical group available
  const activeGroup =
    groupVar && categoricalCols.some((c) => c.name === groupVar)
      ? groupVar
      : categoricalCols[0]?.name;

  // Compute cohort distribution from records
  const cohortsData: { name: string; average: number; count: number; median: number }[] = [];
  if (activeGroup && dataset.records?.length > 0) {
    const map = new Map<string, number[]>();
    for (const r of dataset.records) {
      const g = String(r[activeGroup] ?? "").trim();
      const val = Number(r[activeMetric]);
      if (g && !isNaN(val) && val !== null) {
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push(val);
      }
    }

    map.forEach((vals, name) => {
      vals.sort((a, b) => a - b);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const med = vals[Math.floor(vals.length / 2)] || avg;
      cohortsData.push({
        name,
        average: Number(avg.toFixed(2)),
        median: Number(med.toFixed(2)),
        count: vals.length,
      });
    });
    cohortsData.sort((a, b) => b.average - a.average);
  }

  // Distribution bins (Histogram simulation)
  const numBins = 7;
  const binWidth = maxVal > minVal ? (maxVal - minVal) / numBins : 1;
  const distributionBins: { range: string; count: number; min: number; max: number }[] = [];
  for (let i = 0; i < numBins; i++) {
    const bMin = minVal + i * binWidth;
    const bMax = bMin + binWidth;
    const count = dataset.records.filter((r) => {
      const v = Number(r[activeMetric]);
      return !isNaN(v) && v >= bMin && (i === numBins - 1 ? v <= bMax : v < bMax);
    }).length;
    distributionBins.push({
      range: `${bMin.toFixed(0)}-${bMax.toFixed(0)}`,
      count,
      min: bMin,
      max: bMax,
    });
  }

  // Time trend if available
  const dist = dataset.timeCoverage?.periodVolumeDistribution;
  const timeData = (dataset.timeCoverage?.hasTemporalData && dist)
    ? dist.map((p) => ({
        period: p.period,
        volume: p.count,
      }))
    : [];

  const [activeTab, setActiveTab] = useState<"cohorts" | "distribution" | "trend">("cohorts");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Experience Header Banner */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Experience A: Discover
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            What is happening in your business?
          </h2>
          <p className="text-xs text-neutral-500">
            Verified descriptive profiles, distribution variance, and cohort benchmarks for <span className="font-semibold text-neutral-800 font-mono">{activeMetric}</span>.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("cohorts")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "cohorts"
                ? "bg-white text-neutral-900 shadow-xs font-semibold"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Cohorts
          </button>
          <button
            onClick={() => setActiveTab("distribution")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "distribution"
                ? "bg-white text-neutral-900 shadow-xs font-semibold"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Distribution
          </button>
          {timeData.length > 0 && (
            <button
              onClick={() => setActiveTab("trend")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "trend"
                  ? "bg-white text-neutral-900 shadow-xs font-semibold"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Timeline
            </button>
          )}
        </div>
      </div>

      {/* Animated Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="p-5 rounded-xl border border-neutral-200 bg-white shadow-xs space-y-1.5"
        >
          <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">
            Mean (Average)
          </span>
          <div className="text-2xl font-bold text-neutral-900">
            <AnimatedCounter value={meanVal} decimals={meanVal > 100 ? 1 : 2} />
          </div>
          <span className="text-[10px] text-neutral-500 block">
            Baseline expected value
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-5 rounded-xl border border-neutral-200 bg-white shadow-xs space-y-1.5"
        >
          <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">
            Median (Midpoint)
          </span>
          <div className="text-2xl font-bold text-neutral-900">
            <AnimatedCounter value={medianVal} decimals={medianVal > 100 ? 1 : 2} />
          </div>
          <span className="text-[10px] text-neutral-500 block">
            Robust 50th percentile
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="p-5 rounded-xl border border-neutral-200 bg-white shadow-xs space-y-1.5"
        >
          <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">
            Std. Deviation
          </span>
          <div className="text-2xl font-bold text-neutral-900">
            <AnimatedCounter value={stdVal} decimals={stdVal > 100 ? 1 : 2} />
          </div>
          <span className="text-[10px] text-neutral-500 block">
            Dispersion around mean
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-5 rounded-xl border border-neutral-200 bg-white shadow-xs space-y-1.5"
        >
          <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">
            Unusual Observations
          </span>
          <div className="text-2xl font-bold text-neutral-900">
            <AnimatedCounter value={outlierCount} decimals={0} />
          </div>
          <span className="text-[10px] text-neutral-500 block">
            Points outside IQR fences
          </span>
        </motion.div>
      </div>

      {/* Primary Chart View: Drawing Itself with Smooth Animation */}
      <div className="p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              {activeTab === "cohorts"
                ? `Cohort Comparisons on ${activeMetric}`
                : activeTab === "distribution"
                ? `Empirical Distribution Breakdown (${numBins} bins)`
                : `Observed Longitudinal Timeline`}
            </h3>
            <p className="text-xs text-neutral-500">
              {activeTab === "cohorts"
                ? `Comparing averages across segmented ${activeGroup || "subgroups"}`
                : activeTab === "distribution"
                ? `Histogram showing observation volume across value intervals`
                : `Period-by-period record volume`}
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            N = {dataset.rowCount}
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "cohorts" ? (
              <BarChart data={cohortsData.length > 0 ? cohortsData : result.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e5e5e5",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="average"
                  fill="#171717"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={900}
                >
                  {(cohortsData.length > 0 ? cohortsData : result.chartData).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#171717" : "#525252"}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : activeTab === "distribution" ? (
              <BarChart data={distributionBins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="range" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e5e5e5",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#262626"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={900}
                />
              </BarChart>
            ) : (
              <AreaChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e5e5e5",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#171717"
                  fill="#e5e5e5"
                  strokeWidth={2}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Discovery Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1">
          <span className="font-semibold text-neutral-800 block">Typical Range (IQR)</span>
          <p className="text-neutral-600 leading-relaxed">
            The middle 50% of your data spans from {(medianVal - iqrVal / 2).toFixed(1)} to {(medianVal + iqrVal / 2).toFixed(1)}.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1">
          <span className="font-semibold text-neutral-800 block">Outlier Impact</span>
          <p className="text-neutral-600 leading-relaxed">
            {outlierCount > 0
              ? `${outlierCount} observations fall well beyond normal distribution bounds, pulling the average.`
              : "No extreme distribution outliers detected; observations stay tightly clustered."}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1">
          <span className="font-semibold text-neutral-800 block">Top Group Advantage</span>
          <p className="text-neutral-600 leading-relaxed">
            {cohortsData.length >= 2
              ? `"${cohortsData[0].name}" outperforms "${cohortsData[cohortsData.length - 1].name}" by ${(cohortsData[0].average - cohortsData[cohortsData.length - 1].average).toFixed(1)} units.`
              : "Single cohort examined; group comparisons will appear when categorical dimensions exist."}
          </p>
        </div>
      </div>
    </div>
  );
};
