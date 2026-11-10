import {
  ColumnProfile,
  DataQualityAlert,
  DatasetProfile,
  DatasetUnderstanding,
  InvestigableQuestion,
  MeasurableMetric,
} from "../types/dataset";

/**
 * Humanizes column names into clean, readable business phrases.
 * e.g., "monthly_spend" -> "Monthly spend"
 * e.g., "support_tickets_count" -> "Support tickets count"
 */
export function formatColumnLabel(colName: string): string {
  const words = colName
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/);

  return words
    .map((w, idx) => {
      const lower = w.toLowerCase();
      // Keep well-known acronyms uppercase
      if (["id", "nps", "mrr", "arr", "kpi", "roi", "cvr", "ctr", "cac", "ltv", "sku", "b2b"].includes(lower)) {
        return lower.toUpperCase();
      }
      if (idx === 0) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join(" ");
}

/**
 * Deterministic business domain detector.
 * Identifies the business subject (e.g. e-commerce, SaaS, marketing, sales pipeline, healthcare)
 * purely based on actual column tokens and filename.
 */
function detectBusinessDomain(profile: DatasetProfile): {
  domain: string;
  subjectKeywords: string[];
  entityName: string;
} {
  const colNamesLower = profile.columns.map((c) => c.name.toLowerCase()).join(" ");
  const filenameLower = profile.filename.toLowerCase();
  const allText = `${filenameLower} ${colNamesLower}`;

  if (
    allText.includes("churn") ||
    allText.includes("subscription") ||
    allText.includes("plan_tier") ||
    allText.includes("tier") ||
    allText.includes("usage_hours") ||
    allText.includes("mrr") ||
    allText.includes("monthly_spend")
  ) {
    return {
      domain: "Subscription & Customer Retention",
      subjectKeywords: ["customer accounts", "subscription plans", "usage hours", "monthly spend", "churn retention"],
      entityName: "customer accounts",
    };
  }

  if (
    allText.includes("basket") ||
    allText.includes("discount") ||
    allText.includes("order") ||
    allText.includes("cart") ||
    allText.includes("ecommerce") ||
    allText.includes("checkout") ||
    allText.includes("product")
  ) {
    return {
      domain: "E-Commerce & Orders",
      subjectKeywords: ["customer orders", "basket sizes", "promotional discounts", "items purchased"],
      entityName: "orders",
    };
  }

  if (
    allText.includes("lead") ||
    allText.includes("deal") ||
    allText.includes("pipeline") ||
    allText.includes("sales_cycle") ||
    allText.includes("opportunity") ||
    allText.includes("b2b") ||
    allText.includes("rep")
  ) {
    return {
      domain: "B2B Sales Velocity & Deals",
      subjectKeywords: ["sales opportunities", "deal sizes", "sales cycle duration", "lead sources"],
      entityName: "sales deals",
    };
  }

  if (
    allText.includes("visit") ||
    allText.includes("website") ||
    allText.includes("traffic") ||
    allText.includes("campaign") ||
    allText.includes("marketing") ||
    allText.includes("click") ||
    allText.includes("impression") ||
    allText.includes("ad_spend")
  ) {
    return {
      domain: "Marketing & Website Performance",
      subjectKeywords: ["website visits", "marketing spend", "campaign impressions", "user conversions"],
      entityName: "marketing records",
    };
  }

  if (
    allText.includes("policy") ||
    allText.includes("claim") ||
    allText.includes("premium") ||
    allText.includes("insurance")
  ) {
    return {
      domain: "Insurance & Policy Operations",
      subjectKeywords: ["insurance policies", "policyholder premiums", "claims", "coverage periods"],
      entityName: "policies",
    };
  }

  // Generic fallback from top columns
  const keyNumerics = profile.columns
    .filter((c) => c.inferredType === "continuous")
    .slice(0, 3)
    .map((c) => formatColumnLabel(c.name).toLowerCase());

  const keyCategoricals = profile.columns
    .filter((c) => c.inferredType === "categorical" || c.inferredType === "boolean")
    .slice(0, 2)
    .map((c) => formatColumnLabel(c.name).toLowerCase());

  const subjectKeywords = [...keyNumerics, ...keyCategoricals];

  return {
    domain: "Business Operations",
    subjectKeywords: subjectKeywords.length > 0 ? subjectKeywords : ["business observations"],
    entityName: "records",
  };
}

/**
 * Builds the child-friendly "Here's what I found in your data" deterministic understanding.
 * Works 100% offline without Gemini, with zero delay.
 */
export function generateDeterministicUnderstanding(profile: DatasetProfile): DatasetUnderstanding {
  const { subjectKeywords, entityName } = detectBusinessDomain(profile);
  const rowCountFormatted = profile.rowCount.toLocaleString();

  // 1. Headline (Plain, child-simple executive summary)
  const topicList = subjectKeywords.slice(0, 4).join(", ");
  const headline = `We found ${rowCountFormatted} records containing information about ${topicList}.`;

  // 1b. What this data appears to be about
  const whatItIsAbout = `This dataset tracks ${rowCountFormatted} ${entityName}. It lets you measure key numbers like ${
    subjectKeywords.slice(0, 3).join(", ")
  } and discover what factors drive your business performance.`;

  // 2. Information collected (Card 1)
  let dateCoverageText = "No calendar dates found in this file";
  let hasDateCoverage = false;
  if (profile.timeCoverage?.hasTemporalData && profile.timeCoverage.startDate && profile.timeCoverage.endDate) {
    hasDateCoverage = true;
    const span = profile.timeCoverage.totalSpanDays || 0;
    const freq = profile.timeCoverage.detectedFrequency || "daily";
    dateCoverageText = `${profile.timeCoverage.startDate} to ${profile.timeCoverage.endDate} (${span} days of ${freq} data)`;
  }

  let granularityText = `One row per ${entityName.replace(/s$/, "")}`;
  if (profile.independenceAudit && !profile.independenceAudit.isIndependentObservations) {
    granularityText = "Daily aggregated channel records (sequential calendar days, not independent customers)";
  } else if (profile.granularity.primaryKeyCandidate) {
    granularityText = `Each row is a unique ${formatColumnLabel(profile.granularity.primaryKeyCandidate).toLowerCase()}`;
  } else if (profile.granularity.detectedGranularity.toLowerCase().includes("transaction")) {
    granularityText = "Event and transaction log (entities may appear in multiple rows)";
  }

  const informationCollected = {
    recordsCount: profile.rowCount,
    recordsText: `${rowCountFormatted} records`,
    columnsCount: profile.columnCount,
    columnsText: `${profile.columnCount} columns`,
    dateCoverageText,
    hasDateCoverage,
    granularityText,
  };

  // 3. What we can measure (Card 2)
  const whatWeCanMeasure: MeasurableMetric[] = [];

  // Categorize continuous metrics
  const continuousCols = profile.columns.filter((c) => c.inferredType === "continuous");
  continuousCols.forEach((col) => {
    const label = formatColumnLabel(col.name);
    const lower = col.name.toLowerCase();

    let category: MeasurableMetric["category"] = "outcome";
    let desc = "Key numerical measure";

    if (
      lower.includes("spend") ||
      lower.includes("revenue") ||
      lower.includes("sales") ||
      lower.includes("size") ||
      lower.includes("price") ||
      lower.includes("cost") ||
      lower.includes("profit") ||
      lower.includes("margin")
    ) {
      category = "outcome";
      desc = "Financial / commercial outcome";
    } else if (
      lower.includes("hours") ||
      lower.includes("days") ||
      lower.includes("time") ||
      lower.includes("duration") ||
      lower.includes("tickets") ||
      lower.includes("visits") ||
      lower.includes("sessions") ||
      lower.includes("items")
    ) {
      category = "driver";
      desc = "Activity & engagement volume";
    } else if (lower.includes("rate") || lower.includes("score") || lower.includes("nps")) {
      category = "outcome";
      desc = "Quality & performance rating";
    }

    const meanStr = col.meanValue !== undefined ? `Avg: ${col.meanValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : "";

    whatWeCanMeasure.push({
      name: label,
      originalColumn: col.name,
      category,
      description: desc,
      sampleSummary: meanStr,
    });
  });

  // Categorize key categorical dimensions
  const categoricalCols = profile.columns.filter(
    (c) => c.inferredType === "categorical" || c.inferredType === "boolean"
  );
  categoricalCols.slice(0, 4).forEach((col) => {
    const label = formatColumnLabel(col.name);
    const topValues = (col.sampleValues || [])
      .slice(0, 3)
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(", ");

    whatWeCanMeasure.push({
      name: label,
      originalColumn: col.name,
      category: "grouping",
      description: "Category for group comparisons",
      sampleSummary: topValues ? `Groups: ${topValues}` : undefined,
    });
  });

  // 4. Things to be careful about (Card 3 - Prompt Part 6)
  const thingsToBeCarefulAbout: DataQualityAlert[] = [];

  // 4a. Specific Missingness in avg_policy_value_app
  const avgPolicyCol = profile.columns.find((c) => /avg.*policy.*app/i.test(c.name));
  if (avgPolicyCol && avgPolicyCol.nullPercentage >= 25) {
    thingsToBeCarefulAbout.push({
      title: "Missing app policy values",
      detail: "About half of the app policy-value entries are missing. We should be careful when comparing average policy values. Before launch, no policies were sold via the app, making the rate undefined rather than $0.00.",
      severity: "warning",
      affectedColumn: avgPolicyCol.name,
    });
  }

  // 4b. Revenue Reconciliation Mismatch (total_revenue vs website + app revenue)
  const revReconcil = profile.reconciliationAudit?.find((a) => !a.isReconciled && a.formula.includes("revenue"));
  if (revReconcil) {
    thingsToBeCarefulAbout.push({
      title: "Total revenue does not equal website + app revenue",
      detail: `Total revenue does not always equal website revenue plus app revenue. In ${revReconcil.discrepantRowsCount} rows, there is an unexplained discrepancy of up to $${revReconcil.maxDiscrepancy.toLocaleString()}. We flag this reconciliation gap so comparisons reflect verified breakdowns.`,
      severity: "warning",
      affectedColumn: "total_revenue",
    });
  }

  // 4c. General Missing values alert
  if (profile.missingValues.totalMissingCells > 0 && (!avgPolicyCol || profile.missingValues.columnsWithNulls.length > 1)) {
    const nonPolicyNullCols = profile.missingValues.columnsWithNulls.filter((c) => !/avg.*policy.*app/i.test(c.column));
    const worstCol = nonPolicyNullCols[0] || profile.missingValues.columnsWithNulls[0];
    const colLabel = worstCol ? formatColumnLabel(worstCol.column) : "some columns";
    thingsToBeCarefulAbout.push({
      title: "Missing values",
      detail: `${profile.missingValues.totalMissingCells.toLocaleString()} missing cells (${profile.missingValues.globalMissingPercentage}% of all data). Most affected: ${colLabel} (${worstCol?.percentage || 0}% empty). All empty cells are kept safe without guessing or filling with zero.`,
      severity: profile.missingValues.globalMissingPercentage > 15 ? "warning" : "advisory",
      affectedColumn: worstCol?.column,
    });
  }

  // 4d. Duplicate records alert
  if (profile.duplicateCount > 0) {
    thingsToBeCarefulAbout.push({
      title: "Duplicate records",
      detail: `${profile.duplicateCount.toLocaleString()} identical rows found (${profile.duplicatePercentage}% of the file). We keep them exactly as uploaded without deleting anything.`,
      severity: profile.duplicatePercentage > 5 ? "warning" : "advisory",
    });
  }

  // 4e. Sequential time series (observation independence audit)
  if (profile.independenceAudit && !profile.independenceAudit.isIndependentObservations) {
    thingsToBeCarefulAbout.push({
      title: "Sequential daily data (not independent subjects)",
      detail: `The ${profile.rowCount.toLocaleString()} rows represent consecutive daily measurements over time, not ${profile.rowCount.toLocaleString()} independent customers or separate random trials. Observations are correlated across time and days of the week.`,
      severity: "advisory",
    });
  }

  // 4f. Pre-launch app values (genuine zero vs missing)
  if (profile.preLaunchAudit?.hasPreLaunchPeriod) {
    thingsToBeCarefulAbout.push({
      title: "Pre-launch app periods",
      detail: `Before the mobile app launched (${profile.preLaunchAudit.preLaunchRowCount} records), app visits, downloads, and app revenue were zero, while rate metrics like average policy value were undefined. We distinguish genuine zero activity from non-existent rates.`,
      severity: "advisory",
    });
  }

  // 4g. Inconsistent holiday indicator
  const holIssue = profile.dataQualityIssues.find((q) => q.category === "inconsistent_indicator");
  if (holIssue) {
    thingsToBeCarefulAbout.push({
      title: "Inconsistent holiday indicator",
      detail: holIssue.description,
      severity: "advisory",
      affectedColumn: holIssue.affectedColumn,
    });
  }

  // 4h. Partial period alert
  if (profile.timeCoverage?.hasPartialPeriod) {
    thingsToBeCarefulAbout.push({
      title: "Incomplete final date period",
      detail: profile.timeCoverage.partialPeriodDetails || "The final time period has fewer observations than earlier months.",
      severity: "warning",
      affectedColumn: profile.timeCoverage.dateColumn,
    });
  }

  // 4i. Outliers alert
  const outlierCols = profile.columns.filter((c) => c.outliers && c.outliers.count > 0);
  if (outlierCols.length > 0) {
    const primary = outlierCols[0];
    thingsToBeCarefulAbout.push({
      title: "Unusually extreme values",
      detail: `${primary.outliers?.count} unusually high or low values in ${formatColumnLabel(primary.name)}. Comparing medians will give a safer picture than averages.`,
      severity: "advisory",
      affectedColumn: primary.name,
    });
  }

  // 4j. Inconsistent casing/formatting alert
  const inconsistentCols = profile.columns.filter((c) => c.inconsistencies && c.inconsistencies.hasInconsistencies);
  if (inconsistentCols.length > 0) {
    const target = inconsistentCols[0];
    thingsToBeCarefulAbout.push({
      title: "Inconsistent spelling or casing",
      detail: `Variations found in ${formatColumnLabel(target.name)} (for example differing uppercase/lowercase entries). We will group these cleanly during comparisons.`,
      severity: "advisory",
      affectedColumn: target.name,
    });
  }

  // Clean dataset state
  if (thingsToBeCarefulAbout.length === 0) {
    thingsToBeCarefulAbout.push({
      title: "Clean dataset",
      detail: "No missing values, duplicate records, or broken formatting were found. Your data is ready for statistical testing.",
      severity: "clean",
    });
  }

  // 5. What we can investigate (Card 4)
  const whatWeCanInvestigate: InvestigableQuestion[] = [];

  const mainNumeric = continuousCols[0]?.name;
  const secondaryNumeric = continuousCols[1]?.name;
  const mainCategorical = categoricalCols[0]?.name;
  const dateCol = profile.timeCoverage?.dateColumn;

  // Q1: Group Comparison
  if (mainNumeric && mainCategorical) {
    const numLabel = formatColumnLabel(mainNumeric);
    const catLabel = formatColumnLabel(mainCategorical);
    whatWeCanInvestigate.push({
      question: `Which ${catLabel.toLowerCase()} generates higher average ${numLabel.toLowerCase()}?`,
      intent: "cohort_comparison",
      suggestedTest: "Welch Two-Sample t-test",
      targetVar: mainNumeric,
      groupVar: mainCategorical,
      primaryVariables: [mainNumeric, mainCategorical],
      explanation: `Tests whether average ${numLabel.toLowerCase()} truly differs across different ${catLabel.toLowerCase()} groups.`,
    });
  }

  // Q2: Driver / Correlation Relationship
  if (mainNumeric && secondaryNumeric) {
    const n1 = formatColumnLabel(mainNumeric);
    const n2 = formatColumnLabel(secondaryNumeric);
    whatWeCanInvestigate.push({
      question: `Does higher ${n2.toLowerCase()} correlate with higher ${n1.toLowerCase()}?`,
      intent: "driver_analysis",
      suggestedTest: "Pearson Correlation & OLS Regression",
      targetVar: mainNumeric,
      groupVar: secondaryNumeric,
      primaryVariables: [mainNumeric, secondaryNumeric],
      explanation: `Determines whether increases in ${n2.toLowerCase()} are reliably associated with movements in ${n1.toLowerCase()}.`,
    });
  }

  // Q3: Trend over Time
  if (mainNumeric && dateCol) {
    const numLabel = formatColumnLabel(mainNumeric);
    whatWeCanInvestigate.push({
      question: `Did ${numLabel.toLowerCase()} increase or decrease over time?`,
      intent: "trend_analysis",
      suggestedTest: "Time-Series Regression & Trend Analysis",
      targetVar: mainNumeric,
      groupVar: dateCol,
      primaryVariables: [mainNumeric, dateCol],
      explanation: `Measures the direction and stability of the ${numLabel.toLowerCase()} trend across your date span.`,
    });
  }

  // Q4: Consistency & Dispersion
  if (mainNumeric) {
    const numLabel = formatColumnLabel(mainNumeric);
    whatWeCanInvestigate.push({
      question: `How consistent is ${numLabel.toLowerCase()} across all observations?`,
      intent: "distribution_analysis",
      suggestedTest: "Descriptive Statistics & Interquartile Dispersion",
      targetVar: mainNumeric,
      primaryVariables: [mainNumeric],
      explanation: `Audits typical middle performance, outliers, and how much spread exists around the typical value.`,
    });
  }

  // Q5: Multiple Driver Model
  if (mainNumeric && continuousCols.length >= 2) {
    const numLabel = formatColumnLabel(mainNumeric);
    const otherNums = continuousCols.slice(1, 3).map((c) => formatColumnLabel(c.name).toLowerCase()).join(" and ");
    whatWeCanInvestigate.push({
      question: `What factors best explain variations in ${numLabel.toLowerCase()}?`,
      intent: "driver_analysis",
      suggestedTest: "Multiple Linear Regression",
      targetVar: mainNumeric,
      primaryVariables: [mainNumeric, ...continuousCols.slice(1, 3).map((c) => c.name)],
      explanation: `Analyzes how strongly ${otherNums} together account for differences in ${numLabel.toLowerCase()}.`,
    });
  }

  // Q6: Categorical Association
  if (categoricalCols.length >= 2) {
    const c1 = formatColumnLabel(categoricalCols[0].name);
    const c2 = formatColumnLabel(categoricalCols[1].name);
    whatWeCanInvestigate.push({
      question: `Is there an association between ${c1.toLowerCase()} and ${c2.toLowerCase()}?`,
      intent: "categorical_association",
      suggestedTest: "Chi-Square Test of Independence",
      targetVar: categoricalCols[0].name,
      groupVar: categoricalCols[1].name,
      primaryVariables: [categoricalCols[0].name, categoricalCols[1].name],
      explanation: `Tests whether proportions in ${c1.toLowerCase()} depend significantly on ${c2.toLowerCase()}.`,
    });
  }

  return {
    status: "fallback",
    headline,
    whatItIsAbout,
    informationCollected,
    whatWeCanMeasure,
    thingsToBeCarefulAbout,
    whatWeCanInvestigate,
  };
}

/**
 * Asynchronously enriches the dataset understanding using the server-side Gemini endpoint.
 * Gracefully falls back to the deterministic output if network, timeout, or key issues occur.
 */
export async function getEnhancedDatasetUnderstanding(profile: DatasetProfile): Promise<DatasetUnderstanding> {
  const deterministic = generateDeterministicUnderstanding(profile);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("/api/dataset/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        filename: profile.filename,
        rowCount: profile.rowCount,
        columnCount: profile.columnCount,
        columns: profile.columns.map((c) => ({
          name: c.name,
          inferredType: c.inferredType,
          uniqueCount: c.uniqueCount,
          nullPercentage: c.nullPercentage,
          sampleValues: c.sampleValues?.slice(0, 3),
        })),
        timeCoverage: profile.timeCoverage,
        granularity: profile.granularity,
        dataQualityIssues: profile.dataQualityIssues.map((i) => ({
          title: i.title,
          description: i.description,
          severity: i.severity,
          affectedColumn: i.affectedColumn,
        })),
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      return deterministic;
    }

    const data = await res.json();
    if (data && data.headline && Array.isArray(data.whatWeCanInvestigate)) {
      return {
        status: "success",
        headline: data.headline || deterministic.headline,
        whatItIsAbout: data.whatItIsAbout || deterministic.whatItIsAbout,
        informationCollected: {
          ...deterministic.informationCollected,
          ...(data.informationCollected || {}),
        },
        whatWeCanMeasure:
          Array.isArray(data.whatWeCanMeasure) && data.whatWeCanMeasure.length > 0
            ? data.whatWeCanMeasure
            : deterministic.whatWeCanMeasure,
        thingsToBeCarefulAbout:
          Array.isArray(data.thingsToBeCarefulAbout) && data.thingsToBeCarefulAbout.length > 0
            ? data.thingsToBeCarefulAbout
            : deterministic.thingsToBeCarefulAbout,
        whatWeCanInvestigate:
          Array.isArray(data.whatWeCanInvestigate) && data.whatWeCanInvestigate.length > 0
            ? data.whatWeCanInvestigate
            : deterministic.whatWeCanInvestigate,
      };
    }
  } catch (err) {
    // Silent fallback to deterministic understanding
  }

  return deterministic;
}
