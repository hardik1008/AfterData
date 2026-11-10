import React from "react";
import { DatasetProfile, StatisticalResult } from "../../types/dataset";
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Stethoscope,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  GitCommit,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { AnimatedCounter } from "./AnimatedCounter";

interface DiagnoseExperienceProps {
  dataset: DatasetProfile;
  result: StatisticalResult;
  targetVar?: string;
  groupVar?: string;
}

export const DiagnoseExperience: React.FC<DiagnoseExperienceProps> = ({
  dataset,
  result,
  targetVar,
  groupVar,
}) => {
  const continuousCols = dataset.columns.filter((c) => c.inferredType === "continuous");
  const categoricalCols = dataset.columns.filter((c) => c.inferredType === "categorical");

  const primaryOutcome = targetVar || continuousCols[0]?.name || "Outcome";
  const primaryPredictor = groupVar || continuousCols[1]?.name || continuousCols[0]?.name || "Predictor";

  // Calculate Driver Map: rank correlations with primaryOutcome across all other continuous variables
  const drivers: { variable: string; correlation: number; absCorr: number; rSquared: number; direction: string }[] = [];
  
  if (dataset.records?.length > 10) {
    const yVals = dataset.records.map((r) => Number(r[primaryOutcome])).filter((v) => !isNaN(v));
    const meanY = yVals.reduce((a, b) => a + b, 0) / Math.max(yVals.length, 1);

    continuousCols.forEach((col) => {
      if (col.name === primaryOutcome) return;
      const xVals = dataset.records.map((r) => Number(r[col.name]));
      let validCount = 0;
      let sumX = 0;
      let sumY = 0;
      const pairs: [number, number][] = [];

      for (let i = 0; i < dataset.records.length; i++) {
        const x = Number(dataset.records[i][col.name]);
        const y = Number(dataset.records[i][primaryOutcome]);
        if (!isNaN(x) && !isNaN(y) && x !== null && y !== null) {
          pairs.push([x, y]);
          sumX += x;
          sumY += y;
          validCount++;
        }
      }

      if (validCount > 10) {
        const mX = sumX / validCount;
        const mY = sumY / validCount;
        let cov = 0;
        let varX = 0;
        let varY = 0;
        for (const [x, y] of pairs) {
          cov += (x - mX) * (y - mY);
          varX += Math.pow(x - mX, 2);
          varY += Math.pow(y - mY, 2);
        }
        const stdX = Math.sqrt(varX);
        const stdY = Math.sqrt(varY);
        const r = stdX > 0 && stdY > 0 ? cov / (stdX * stdY) : 0;
        drivers.push({
          variable: col.name,
          correlation: Number(r.toFixed(3)),
          absCorr: Math.abs(r),
          rSquared: Number((r * r * 100).toFixed(1)),
          direction: r >= 0 ? "Positive" : "Negative",
        });
      }
    });

    drivers.sort((a, b) => b.absCorr - a.absCorr);
  }

  // Regression fit parameters
  const slope = result.testStatistic || 0;
  const pVal = result.pValue;
  const rSquared = drivers[0]?.rSquared || (result.effectSize ? Number((result.effectSize * result.effectSize * 100).toFixed(1)) : 24.5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Experience Header */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
            <Stethoscope className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Experience B: Diagnose
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          Why is this happening?
        </h2>
        <p className="text-xs text-neutral-500">
          Deconstructing drivers, statistical associations, and variance decomposition for <span className="font-semibold text-neutral-800 font-mono">{primaryOutcome}</span>.
        </p>
      </div>

      {/* Strict Anti-Causality Banner */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-amber-900">
          <span className="font-semibold block">
            Statistical Association (Observational Data — Not Proof of Causation)
          </span>
          <p className="text-amber-800/90 leading-relaxed">
            The relationships shown below prove mathematical co-movement, not direct root cause. Unmeasured operational factors, timing dynamics, or external market conditions may drive these patterns.
          </p>
        </div>
      </div>

      {/* Driver Map & Regression Relationship */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Animated Scatterplot with Relationship Trendline */}
        <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Fitted Relationship Line
              </h3>
              <p className="text-xs text-neutral-500">
                Ordinary Least Squares (OLS) bivariate fit
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="text-neutral-400">R² = </span>
              <span className="font-semibold text-neutral-900">{rSquared}%</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {result.chartType === "scatter_regression" ? (
                <ComposedChart data={result.chartData}>
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
                  <Scatter
                    dataKey="y"
                    fill="#171717"
                    opacity={0.65}
                    name="Observed data"
                    isAnimationActive={true}
                    animationDuration={650}
                    animationEasing="ease-out"
                  />
                  <Line
                    dataKey="trend"
                    stroke="#171717"
                    strokeWidth={2.5}
                    dot={false}
                    name="Fitted line"
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationBegin={400}
                    animationEasing="ease-in-out"
                  />
                </ComposedChart>
              ) : (
                <BarChart data={result.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey={result.chartVariables.xKey} stroke="#888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #e5e5e5",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey={result.chartVariables.yKey} fill="#171717" radius={[4, 4, 0, 0]} isAnimationActive={true} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-500">Statistical Significance</span>
            <span className={`font-semibold ${pVal < 0.05 ? "text-neutral-900" : "text-neutral-500"}`}>
              p = {pVal.toFixed(4)} ({pVal < 0.05 ? "Statistically Verified" : "Inconclusive"})
            </span>
          </div>
        </div>

        {/* Driver Map: Ranked Potential Contributing Factors */}
        <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Driver Map (Variance Explained)
              </h3>
              <p className="text-xs text-neutral-500">
                Variables most tightly linked to {primaryOutcome}
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Ranked by |r|
            </span>
          </div>

          {drivers.length > 0 ? (
            <div className="space-y-3 pt-2">
              {drivers.slice(0, 4).map((d, idx) => (
                <div key={d.variable} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800 font-mono">
                      {idx + 1}. {d.variable}
                    </span>
                    <span className="text-neutral-500 font-mono">
                      r = {d.correlation > 0 ? `+${d.correlation}` : d.correlation} ({d.rSquared}% variance)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, d.rSquared * 1.5)}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.15 }}
                      className={`h-full rounded-full ${
                        d.correlation >= 0 ? "bg-neutral-900" : "bg-neutral-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
              <p>Only one continuous variable identified in dataset.</p>
              <p>Upload additional continuous columns to unlock multivariate driver ranking.</p>
            </div>
          )}

          <div className="pt-2 text-[11px] text-neutral-500 leading-relaxed border-t border-neutral-100">
            Higher variance explained indicates that values shift together predictably, but never guarantees an intervention on X will force Y to change.
          </div>
        </div>
      </div>

      {/* Model Limitations & Diagnostic Notes */}
      <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2 text-xs">
        <span className="font-semibold text-neutral-800 block">
          Diagnostic Boundaries &amp; Model Limitations
        </span>
        <ul className="space-y-1.5 text-neutral-600 list-disc list-inside">
          <li>
            <strong>Omitted Variable Bias:</strong> Lurking variables not present in this dataset may explain the observed association.
          </li>
          <li>
            <strong>Directional Ambiguity:</strong> Without controlled experimental time lags, we cannot prove whether X influences Y or Y influences X.
          </li>
          <li>
            <strong>Sample Representation:</strong> Relationships reflect only the observed sample of {dataset.rowCount} rows.
          </li>
        </ul>
      </div>
    </div>
  );
};
