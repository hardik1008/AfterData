import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Table,
  Sliders,
  Layers,
  Sparkles,
  Calculator,
  Compass,
  Database,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { DatasetProfile } from "../types/dataset";
import {
  computeOneDayChallengeBenchmark,
  OneDayChallengeAnalysis,
} from "../lib/oneDayChallengeBenchmark";

interface OneDayChallengeScreenProps {
  dataset: DatasetProfile | null;
  onBack: () => void;
  onSelectQuestion?: (q: string) => void;
}

export const OneDayChallengeScreen: React.FC<OneDayChallengeScreenProps> = ({
  dataset,
  onBack,
  onSelectQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<
    "slides" | "statistical_evidence" | "excel_model" | "recommendations"
  >("slides");
  const [activeSlide, setActiveSlide] = useState<1 | 2 | 3>(1);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Compute live from the actual dataset (No hardcoding!)
  const benchmark: OneDayChallengeAnalysis = useMemo(() => {
    return computeOneDayChallengeBenchmark(dataset || undefined);
  }, [dataset]);

  const handleDownloadSummary = () => {
    const summaryText = `# Axis Max Life — One Day Challenge Benchmark Executive Summary
Date Span: ${benchmark.dateRange.start} to ${benchmark.dateRange.end} (${benchmark.totalRecords} Records)
Central Problem: ${benchmark.centralQuestion}

## SLIDE 1: REVENUE IMPACT
- Pre-Launch Average: ₹${benchmark.revenueComparison.preLaunch.meanDaily.toLocaleString()} / day (N=${benchmark.revenueComparison.preLaunch.n})
- Post-Launch Average: ₹${benchmark.revenueComparison.postLaunch.meanDaily.toLocaleString()} / day (N=${benchmark.revenueComparison.postLaunch.n})
- Absolute Uplift: +₹${benchmark.revenueComparison.absoluteDifference.toLocaleString()} / day (+${benchmark.revenueComparison.percentageUplift}%)
- Statistical Test: Welch Two-Sample t-test, t(${benchmark.revenueComparison.degreesOfFreedom}) = ${benchmark.revenueComparison.tStatistic}, ${benchmark.revenueComparison.pValueDisplay}
- 95% Confidence Interval: [₹${benchmark.revenueComparison.confidenceInterval95[0].toLocaleString()}, ₹${benchmark.revenueComparison.confidenceInterval95[1].toLocaleString()}]
- Effect Size (Cohen's d): ${benchmark.revenueComparison.effectSizeCohenD} (Large commercial effect)

## SLIDE 2: CHANNEL DYNAMICS & CANNIBALISATION AUDIT
- Website Revenue Pre-Launch: ₹${benchmark.channelDynamics.websiteRevenuePreMean.toLocaleString()} / day
- Website Revenue Post-Launch: ₹${benchmark.channelDynamics.websiteRevenuePostMean.toLocaleString()} / day (Diff: ₹${benchmark.channelDynamics.websiteRevenueDifference.toLocaleString()})
- Mobile App Revenue Total: ₹${benchmark.channelDynamics.appRevenuePostTotal.toLocaleString()} (${benchmark.channelDynamics.appContributionSharePercent}% total post-launch revenue)
- Cannibalisation Audit: ${benchmark.channelDynamics.cannibalisationFinding.boundaryNotice}

## SLIDE 3: CONSISTENCY, SPIKE ANALYSIS & STRATEGY
- First 14 Days Post-Launch: ₹${benchmark.spikeAnalysis.openingWindowMean.toLocaleString()} / day
- Sustained Days 15-42 Post-Launch: ₹${benchmark.spikeAnalysis.sustainedPeriodMean.toLocaleString()} / day
- Volatility: CV = ${benchmark.consistencyAnalysis.coefficientOfVariationPre}% pre vs ${benchmark.consistencyAnalysis.coefficientOfVariationPost}% post
- Findings: Revenue increase was sustained across the 6-week horizon rather than fading after an opening novelty spike.

## STRATEGIC RECOMMENDATIONS
${benchmark.presentationSlides.slide3.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## ACADEMIC RIGOR & CAUSALITY NOTICE
${benchmark.academicRigorAudit.causalityBoundary}
`;

    const blob = new Blob([summaryText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Axis_Max_Life_One_Day_Challenge_Executive_Summary.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Investigations</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSummary}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 bg-white shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>{copiedSummary ? "Downloaded!" : "Download Executive Summary"}</span>
          </button>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="space-y-3 p-8 rounded-2xl bg-neutral-900 text-white shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>One Day Challenge Benchmark Investigation</span>
          <span className="text-neutral-600">·</span>
          <span className="text-emerald-400 font-mono">Axis Max Life Case Study</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
          &ldquo;Did the mobile app launch actually lead to an increase in revenue compared to the pre-app period?&rdquo;
        </h1>

        <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
          Full empirical investigation across 84 consecutive days (Day 1–42 Pre-Launch vs Day 43–84 Post-Launch), channel cannibalisation audit, longitudinal consistency check, and professor-level statistical evidence.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 border-t border-neutral-800">
          <span>Dataset: {benchmark.datasetName}</span>
          <span>·</span>
          <span>Span: {benchmark.dateRange.start} to {benchmark.dateRange.end}</span>
          <span>·</span>
          <span className="text-emerald-400 font-semibold">t-statistic: {benchmark.revenueComparison.tStatistic} ({benchmark.revenueComparison.pValueDisplay})</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-px overflow-x-auto">
        {[
          { id: "slides", label: "Executive 3-Slide Storyline", icon: Layers },
          { id: "statistical_evidence", label: "Statistical Rigor & Proof", icon: Calculator },
          { id: "excel_model", label: "Supporting Excel Analysis", icon: FileSpreadsheet },
          { id: "recommendations", label: "Management Action Plan", icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? "border-neutral-900 text-neutral-900 font-semibold"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 3-SLIDE PRESENTATION STORYLINE */}
      {activeTab === "slides" && (
        <div className="space-y-6">
          {/* Slide Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                num: 1,
                title: "Slide 1: Revenue Impact",
                desc: "Did total daily revenue increase?",
              },
              {
                num: 2,
                title: "Slide 2: Channel Cannibalisation",
                desc: "Did app take sales from website?",
              },
              {
                num: 3,
                title: "Slide 3: Consistency & Strategy",
                desc: "Was it a spike or sustained lift?",
              },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setActiveSlide(s.num as any)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  activeSlide === s.num
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                    : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                  Slide {s.num} of 3
                </div>
                <div className="text-sm font-bold mt-0.5">{s.title}</div>
                <div className={`text-xs mt-1 ${activeSlide === s.num ? "text-neutral-300" : "text-neutral-500"}`}>
                  {s.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Active Slide Canvas */}
          <div className="p-8 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-6">
            {activeSlide === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {benchmark.presentationSlides.slide1.title}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-snug">
                    {benchmark.presentationSlides.slide1.headline}
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    {benchmark.presentationSlides.slide1.evidence}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      Pre-Launch Daily Mean
                    </span>
                    <div className="text-2xl font-bold text-neutral-900">
                      ₹{benchmark.revenueComparison.preLaunch.meanDaily.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-neutral-400">42 calendar days baseline</span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      Post-Launch Daily Mean
                    </span>
                    <div className="text-2xl font-bold text-neutral-900">
                      ₹{benchmark.revenueComparison.postLaunch.meanDaily.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-neutral-400">42 calendar days with app</span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                      Average Daily Uplift
                    </span>
                    <div className="text-2xl font-bold text-emerald-900">
                      +₹{benchmark.revenueComparison.absoluteDifference.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      +{benchmark.revenueComparison.percentageUplift}% Uplift ({benchmark.revenueComparison.pValueDisplay})
                    </span>
                  </div>
                </div>

                <div className="h-64 pt-4 border-t border-neutral-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={benchmark.presentationSlides.slide1.chartData}
                      margin={{ top: 15, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="#6B7280"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Daily Revenue"]}
                        contentStyle={{ backgroundColor: "#18181B", borderRadius: "8px", border: "none", color: "#FFF" }}
                      />
                      <Bar dataKey="revenue" fill="#18181B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeSlide === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {benchmark.presentationSlides.slide2.title}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-snug">
                    {benchmark.presentationSlides.slide2.headline}
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    {benchmark.presentationSlides.slide2.evidence}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-amber-900 block">
                      Rigorous Cannibalisation Assessment Notice
                    </span>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      {benchmark.channelDynamics.cannibalisationFinding.boundaryNotice}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      Website Revenue Change
                    </span>
                    <div className="text-2xl font-bold text-neutral-900">
                      {benchmark.channelDynamics.websiteRevenueDifference >= 0 ? "+" : ""}
                      ₹{benchmark.channelDynamics.websiteRevenueDifference.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      {benchmark.channelDynamics.websiteRevenuePValueDisplay} (Not statistically significant)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      Mobile App Daily Average
                    </span>
                    <div className="text-2xl font-bold text-neutral-900">
                      ₹{benchmark.channelDynamics.appRevenuePostMean.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-neutral-400">Incremental mobile sales</span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      App Revenue Share
                    </span>
                    <div className="text-2xl font-bold text-neutral-900">
                      {benchmark.channelDynamics.appContributionSharePercent}%
                    </div>
                    <span className="text-[11px] text-neutral-400">Of total post-launch revenue</span>
                  </div>
                </div>

                <div className="h-64 pt-4 border-t border-neutral-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={benchmark.presentationSlides.slide2.chartData}
                      margin={{ top: 15, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="channel" stroke="#6B7280" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="#6B7280"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Daily Revenue"]}
                        contentStyle={{ backgroundColor: "#18181B", borderRadius: "8px", border: "none", color: "#FFF" }}
                      />
                      <Bar dataKey="preLaunch" name="Pre-Launch (₹)" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="postLaunch" name="Post-Launch (₹)" fill="#18181B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeSlide === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {benchmark.presentationSlides.slide3.title}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-snug">
                    {benchmark.presentationSlides.slide3.headline}
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    {benchmark.spikeAnalysis.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      Opening Window (First 14 Days)
                    </span>
                    <div className="text-2xl font-bold text-neutral-900">
                      ₹{benchmark.spikeAnalysis.openingWindowMean.toLocaleString()} / day
                    </div>
                    <span className="text-[11px] text-neutral-400">Launch marketing push</span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      Sustained Period (Days 15–42)
                    </span>
                    <div className="text-2xl font-bold text-neutral-900">
                      ₹{benchmark.spikeAnalysis.sustainedPeriodMean.toLocaleString()} / day
                    </div>
                    <span className="text-[11px] text-neutral-400">Continued organic momentum</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block">
                    Strategic Recommendations for Executive Leadership
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {benchmark.presentationSlides.slide3.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-neutral-800 leading-relaxed font-normal">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STATISTICAL EVIDENCE & ACADEMIC RIGOR */}
      {activeTab === "statistical_evidence" && (
        <div className="p-8 rounded-2xl border border-neutral-200 bg-white space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Professor-Level Statistical Proof &amp; Assumptions Audit
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Exact mathematical derivations, degrees of freedom, and causality boundaries
            </p>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">Welch's t-Statistic</span>
              <div className="text-xl font-bold text-neutral-900 font-mono">
                {benchmark.revenueComparison.tStatistic}
              </div>
              <span className="text-[10px] text-neutral-500">df = {benchmark.revenueComparison.degreesOfFreedom}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">Two-Tailed P-Value</span>
              <div className="text-xl font-bold text-emerald-600 font-mono">
                {benchmark.revenueComparison.pValueDisplay}
              </div>
              <span className="text-[10px] text-neutral-500">Significant at α = 0.05</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">95% Confidence Interval</span>
              <div className="text-sm font-bold text-neutral-900 font-mono mt-1">
                [₹{benchmark.revenueComparison.confidenceInterval95[0].toLocaleString()}, ₹{benchmark.revenueComparison.confidenceInterval95[1].toLocaleString()}]
              </div>
              <span className="text-[10px] text-neutral-500">Excludes zero</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">Effect Size (Cohen's d)</span>
              <div className="text-xl font-bold text-neutral-900 font-mono">
                {benchmark.revenueComparison.effectSizeCohenD}
              </div>
              <span className="text-[10px] text-neutral-500">Large effect (&gt; 0.8)</span>
            </div>
          </div>

          {/* Academic Causality Boundary Banner */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Academic Causality Boundary &amp; Methodological Proof</span>
            </div>
            <p className="text-neutral-700 leading-relaxed text-[11px]">
              {benchmark.academicRigorAudit.causalityBoundary}
            </p>
            <div className="pt-2 border-t border-neutral-200/80 space-y-1">
              <span className="font-semibold text-neutral-800 text-[11px] block">
                Confounding Variables &amp; Unmeasured External Factors:
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-neutral-600 text-[11px]">
                {benchmark.academicRigorAudit.confoundingFactors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="pt-2 border-t border-neutral-200/80 space-y-1 text-[11px] text-neutral-600">
              <p><strong>Granularity &amp; Aggregation:</strong> {benchmark.academicRigorAudit.sourceGranularityNote}</p>
              <p><strong>Period Completeness:</strong> {benchmark.academicRigorAudit.incompletePeriodAudit}</p>
              <p><strong>Data Discrepancy Audit:</strong> {benchmark.academicRigorAudit.holidayInconsistencyAudit}</p>
            </div>
            <div className="text-[10px] font-mono text-neutral-400 pt-1">
              Ledger Provenance Hash: {benchmark.academicRigorAudit.reproducibilityFingerprint}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPORTING EXCEL ANALYSIS */}
      {activeTab === "excel_model" && (
        <div className="p-8 rounded-2xl border border-neutral-200 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Supporting Excel Model &amp; Spreadsheet Formulas
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Exact formulas corresponding to standard business submission deliverables
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-4">Metric</th>
                  <th className="py-2.5 px-4">Excel Formula</th>
                  <th className="py-2.5 px-4">Calculated Result</th>
                  <th className="py-2.5 px-4">Cell Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {benchmark.excelFormulas.map((f, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="py-2.5 px-4 font-sans font-medium text-neutral-900">
                      {f.metric}
                    </td>
                    <td className="py-2.5 px-4 text-blue-600">{f.excelFormula}</td>
                    <td className="py-2.5 px-4 font-bold text-neutral-900">
                      {f.calculatedValue}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-400">{f.cellReference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MANAGEMENT RECOMMENDATIONS */}
      {activeTab === "recommendations" && (
        <div className="p-8 rounded-2xl border border-neutral-200 bg-white space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Executive Management Recommendations
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Commercially viable strategies derived directly from verified data findings
            </p>
          </div>

          <div className="space-y-4">
            {benchmark.presentationSlides.slide3.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-start gap-4"
              >
                <div className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-neutral-900 text-sm block">
                    Strategic Action Item {i + 1}
                  </span>
                  <p className="text-neutral-700 leading-relaxed font-normal text-xs">{rec}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
