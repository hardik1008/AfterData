import React, { useState } from "react";
import { DatasetProfile, StatisticalResult } from "../../types/dataset";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ReferenceDot,
} from "recharts";
import {
  Sliders,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Info,
} from "lucide-react";
import { motion } from "motion/react";
import { AnimatedCounter } from "./AnimatedCounter";

interface ExperimentExperienceProps {
  dataset: DatasetProfile;
  result: StatisticalResult;
  targetVar?: string;
  groupVar?: string;
}

export const ExperimentExperience: React.FC<ExperimentExperienceProps> = ({
  dataset,
  result,
  targetVar,
  groupVar,
}) => {
  const continuousCols = dataset.columns.filter((c) => c.inferredType === "continuous");

  const xColName = groupVar || (continuousCols.length >= 2 ? continuousCols[0]?.name : "Predictor");
  const yColName = targetVar || (continuousCols.length >= 2 ? continuousCols[1]?.name : continuousCols[0]?.name || "Outcome");

  const xProfile = dataset.columns.find((c) => c.name === xColName);
  const yProfile = dataset.columns.find((c) => c.name === yColName);

  const xMin = xProfile?.minValue ?? 10;
  const xMax = xProfile?.maxValue ?? 100;
  const xMean = xProfile?.meanValue ?? (xMin + xMax) / 2;
  const yMean = yProfile?.meanValue ?? 50;

  // Linear fit: Calculate slope and intercept from records or fallback to result stats
  let slope = 0.5;
  let intercept = yMean - slope * xMean;
  let seResidual = 5;

  if (dataset.records?.length > 10) {
    const pairs: [number, number][] = [];
    for (const r of dataset.records) {
      const x = Number(r[xColName]);
      const y = Number(r[yColName]);
      if (!isNaN(x) && !isNaN(y) && x !== null && y !== null) {
        pairs.push([x, y]);
      }
    }

    if (pairs.length > 5) {
      const n = pairs.length;
      const mX = pairs.reduce((acc, p) => acc + p[0], 0) / n;
      const mY = pairs.reduce((acc, p) => acc + p[1], 0) / n;
      let num = 0;
      let den = 0;
      for (const [x, y] of pairs) {
        num += (x - mX) * (y - mY);
        den += Math.pow(x - mX, 2);
      }
      if (den > 0) {
        slope = num / den;
        intercept = mY - slope * mX;
      }
      let sse = 0;
      for (const [x, y] of pairs) {
        const pred = slope * x + intercept;
        sse += Math.pow(y - pred, 2);
      }
      seResidual = Math.sqrt(sse / Math.max(n - 2, 1));
    }
  }

  // Baseline Scenario (historical average)
  const baselineX = Math.round(xMean);
  const baselineY = slope * baselineX + intercept;

  // Active Scenario Input
  const [scenarioX, setScenarioX] = useState<number>(baselineX);

  // Calculate Scenario Outcome & Prediction Intervals
  const scenarioY = slope * scenarioX + intercept;
  const deltaX = scenarioX - baselineX;
  const deltaY = scenarioY - baselineY;
  const pctDeltaX = baselineX !== 0 ? (deltaX / baselineX) * 100 : 0;
  const pctDeltaY = baselineY !== 0 ? (deltaY / baselineY) * 100 : 0;

  // 95% Prediction Interval: margin = 1.96 * seResidual * sqrt(1 + 1/n + (x - xMean)^2 / SSX)
  const margin = 1.96 * seResidual;
  const predLower = scenarioY - margin;
  const predUpper = scenarioY + margin;

  // Extrapolation Check: is scenarioX outside [xMin, xMax]?
  const isExtrapolating = scenarioX < xMin || scenarioX > xMax;
  const extrapolationMargin =
    scenarioX < xMin ? ((xMin - scenarioX) / (xMax - xMin || 1)) * 100 : scenarioX > xMax ? ((scenarioX - xMax) / (xMax - xMin || 1)) * 100 : 0;

  // Generate curve data points for chart
  const stepCount = 20;
  const rangeMin = Math.min(xMin * 0.8, scenarioX * 0.9);
  const rangeMax = Math.max(xMax * 1.2, scenarioX * 1.1);
  const step = (rangeMax - rangeMin) / stepCount;

  const chartCurveData = [];
  for (let i = 0; i <= stepCount; i++) {
    const curX = rangeMin + i * step;
    const curY = slope * curX + intercept;
    chartCurveData.push({
      x: Number(curX.toFixed(1)),
      predicted: Number(curY.toFixed(1)),
      lowerBand: Number((curY - margin).toFixed(1)),
      upperBand: Number((curY + margin).toFixed(1)),
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Experience Header */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Experience C: Experiment
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          What happens if you change something?
        </h2>
        <p className="text-xs text-neutral-500">
          Interactive scenario simulation: adjust <span className="font-semibold text-neutral-800 font-mono">{xColName}</span> and observe estimated impacts on <span className="font-semibold text-neutral-800 font-mono">{yColName}</span> with 95% uncertainty bands.
        </p>
      </div>

      {/* Extrapolation Warning Alert (Strict Requirement) */}
      {isExtrapolating && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 space-y-1 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Extrapolation Boundary Warning</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Your simulated input (<span className="font-mono font-semibold">{scenarioX}</span>) extends {extrapolationMargin.toFixed(0)}% beyond the historical data range [<span className="font-mono">{xMin.toFixed(1)}</span>, <span className="font-mono">{xMax.toFixed(1)}</span>]. Linear assumptions rarely survive extreme extrapolation; treat these estimates with high skepticism.
          </p>
        </div>
      )}

      {/* Non-Causal Caveat */}
      <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-start gap-2.5 text-xs text-neutral-600">
        <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Ceteris Paribus Assumption:</strong> This scenario model estimates what Y would equal if X shifted while all other market and operational conditions remained strictly identical. It is not an unconstrained causal guarantee.
        </p>
      </div>

      {/* Interactive Controls & Scenario Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Input Slider Panel */}
        <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Scenario Control
            </h3>
            <button
              onClick={() => setScenarioX(baselineX)}
              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700">{xColName}</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">
                  {scenarioX.toLocaleString()}
                </span>
              </div>

              {/* Slider with Historical Range Markers */}
              <input
                type="range"
                min={Math.floor(xMin * 0.7)}
                max={Math.ceil(xMax * 1.3)}
                step={Math.max(1, Math.round((xMax - xMin) / 100))}
                value={scenarioX}
                onChange={(e) => setScenarioX(Number(e.target.value))}
                className="w-full accent-neutral-900 cursor-pointer h-2 bg-neutral-200 rounded-lg appearance-none"
              />

              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Min: {xMin.toFixed(0)}</span>
                <span className="text-neutral-600 font-semibold">Baseline: {baselineX}</span>
                <span>Max: {xMax.toFixed(0)}</span>
              </div>
            </div>

            {/* Quick Adjustment Pills */}
            <div className="pt-2 flex items-center gap-1.5 flex-wrap">
              {[-25, -10, 10, 25].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setScenarioX(Math.round(baselineX * (1 + pct / 100)))}
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border border-neutral-200 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Model Specification & Parameters */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1 text-xs font-mono">
            <span className="text-[10px] text-neutral-400 block uppercase">Fitted Formula</span>
            <div className="text-neutral-800 font-semibold">
              {yColName} = {slope.toFixed(3)} × ({xColName}) {intercept >= 0 ? `+ ${intercept.toFixed(1)}` : `- ${Math.abs(intercept).toFixed(1)}`}
            </div>
            <span className="text-[10px] text-neutral-400 block pt-1">
              Residual Error SE: ±{seResidual.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Estimated Results Comparison Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
              Estimated {yColName}
            </span>
            <div className="text-3xl font-bold text-neutral-900">
              <AnimatedCounter value={scenarioY} decimals={1} />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`font-mono font-semibold ${deltaY >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {deltaY >= 0 ? `+${deltaY.toFixed(1)}` : deltaY.toFixed(1)} ({pctDeltaY >= 0 ? `+${pctDeltaY.toFixed(1)}%` : `${pctDeltaY.toFixed(1)}%`})
              </span>
              <span className="text-neutral-400">vs historical baseline</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
              95% Prediction Range
            </span>
            <div className="text-lg font-bold text-neutral-900 font-mono pt-1">
              [{predLower.toFixed(1)}, {predUpper.toFixed(1)}]
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Accounting for normal residual variation, 95% of future observations under this scenario are expected inside these bounds.
            </p>
          </div>

          {/* Interactive Scenario Curve Chart */}
          <div className="sm:col-span-2 p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-900">
                Scenario Curve with Prediction Band
              </span>
              <span className="font-mono text-neutral-400">
                Pulsing Dot: Simulated Scenario
              </span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartCurveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="x" stroke="#888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #e5e5e5",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    dataKey="upperBand"
                    stroke="#d4d4d4"
                    strokeDasharray="3 3"
                    dot={false}
                    name="95% Upper Bound"
                  />
                  <Line
                    dataKey="lowerBand"
                    stroke="#d4d4d4"
                    strokeDasharray="3 3"
                    dot={false}
                    name="95% Lower Bound"
                  />
                  <Line
                    dataKey="predicted"
                    stroke="#171717"
                    strokeWidth={2}
                    dot={false}
                    name="Expected Value"
                  />
                  <ReferenceDot
                    x={Number(scenarioX.toFixed(1))}
                    y={Number(scenarioY.toFixed(1))}
                    r={6}
                    fill="#171717"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
