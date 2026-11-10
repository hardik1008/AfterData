import {
  BusinessQuestion,
  BusinessQuestionLibrary,
  DatasetProfile,
} from "../types/dataset";
import { formatColumnLabel } from "./datasetUnderstanding";

/**
 * Generates a business-first question library tailored specifically
 * to the uploaded dataset and business brief.
 *
 * Translates ordinary executive questions into statistically sound investigations
 * without forcing the user to think like a statistician.
 */
export function generateBusinessQuestionLibrary(
  dataset: DatasetProfile,
  businessBrief?: string
): BusinessQuestionLibrary {
  const colNamesLower = dataset.columns.map((c) => c.name.toLowerCase());
  const allText = `${(businessBrief || "").toLowerCase()} ${dataset.filename.toLowerCase()} ${colNamesLower.join(" ")}`;

  // 1. Check for Axis Max Life / One Day Challenge / App vs Web
  const isAxisMaxLifeOrAppLaunch =
    allText.includes("axis") ||
    allText.includes("max life") ||
    allText.includes("one day challenge") ||
    (allText.includes("app") && allText.includes("launch")) ||
    (allText.includes("app") && allText.includes("website") && allText.includes("revenue")) ||
    (allText.includes("web") && allText.includes("app"));

  if (isAxisMaxLifeOrAppLaunch) {
    return generateAxisMaxLifeQuestions(dataset);
  }

  // 2. Check for SaaS Subscription & Churn
  const isSaaS =
    allText.includes("churn") ||
    allText.includes("subscription") ||
    allText.includes("plan_tier") ||
    allText.includes("mrr") ||
    allText.includes("usage_hours");

  if (isSaaS) {
    return generateSaaSQuestions(dataset);
  }

  // 3. Check for E-Commerce / Retail
  const isEcommerce =
    allText.includes("basket") ||
    allText.includes("discount") ||
    allText.includes("order") ||
    allText.includes("cart") ||
    allText.includes("checkout");

  if (isEcommerce) {
    return generateEcommerceQuestions(dataset);
  }

  // 4. Check for B2B Sales Deals
  const isB2B =
    allText.includes("deal") ||
    allText.includes("lead_source") ||
    allText.includes("sales_cycle") ||
    allText.includes("pipeline") ||
    allText.includes("opportunity");

  if (isB2B) {
    return generateB2BQuestions(dataset);
  }

  // 5. Generic Adaptive Business Question Library
  return generateAdaptiveBusinessQuestions(dataset);
}

/**
 * Axis Max Life One Day Challenge Question Generator
 * Central problem: Did launching the mobile app increase Axis Max Life's revenue?
 */
function generateAxisMaxLifeQuestions(dataset: DatasetProfile): BusinessQuestionLibrary {
  const cols = dataset.columns.map((c) => c.name);
  const lowerMap = new Map(cols.map((c) => [c.toLowerCase(), c]));

  // Resolve best matching columns
  const revCol =
    lowerMap.get("total_revenue") ||
    lowerMap.get("revenue") ||
    lowerMap.get("total_sales") ||
    lowerMap.get("sales") ||
    dataset.columns.find((c) => c.inferredType === "continuous")?.name ||
    "Revenue";

  const appRevCol =
    lowerMap.get("app_revenue") ||
    lowerMap.get("mobile_app_revenue") ||
    lowerMap.get("app_sales") ||
    "App_Revenue";

  const webRevCol =
    lowerMap.get("web_revenue") ||
    lowerMap.get("website_revenue") ||
    lowerMap.get("website_sales") ||
    "Website_Revenue";

  const launchCol =
    lowerMap.get("launch_period") ||
    lowerMap.get("post_launch") ||
    lowerMap.get("period") ||
    lowerMap.get("app_launched") ||
    dataset.columns.find((c) => c.inferredType === "categorical" || c.inferredType === "boolean")?.name ||
    "Launch_Period";

  const dateCol = dataset.timeCoverage?.dateColumn || "Date";

  const visitsCol =
    lowerMap.get("total_visits") ||
    lowerMap.get("visits") ||
    lowerMap.get("traffic") ||
    lowerMap.get("visitors");

  const convCol =
    lowerMap.get("conversions") ||
    lowerMap.get("policies_sold") ||
    lowerMap.get("policies") ||
    lowerMap.get("orders");

  const hasLaunch = lowerMap.has(launchCol.toLowerCase());
  const hasAppRev = lowerMap.has(appRevCol.toLowerCase());
  const hasWebRev = lowerMap.has(webRevCol.toLowerCase());
  const hasVisits = Boolean(visitsCol && lowerMap.has(visitsCol.toLowerCase()));
  const hasConv = Boolean(convCol && lowerMap.has(convCol.toLowerCase()));
  const hasDates = Boolean(dataset.timeCoverage?.hasTemporalData);

  const questions: BusinessQuestion[] = [
    // Theme A: Revenue performance
    {
      id: "Q_REV_01",
      theme: "Revenue performance",
      question: "Did revenue increase after the app launched?",
      intent: "cohort_comparison",
      targetVar: revCol,
      groupVar: launchCol,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: hasLaunch ? "ready" : "partial",
      feasibilityLabel: hasLaunch ? "Ready to investigate" : "Needs launch period flag",
      explanation: "Compares average daily revenue before versus after the mobile app launch date.",
      businessValue: "Validates the primary executive success metric for the mobile initiative.",
    },
    {
      id: "Q_REV_02",
      theme: "Revenue performance",
      question: "How much did revenue change?",
      intent: "cohort_comparison",
      targetVar: revCol,
      groupVar: launchCol,
      suggestedTest: "Confidence Interval for Mean Difference",
      feasibility: hasLaunch ? "ready" : "partial",
      feasibilityLabel: hasLaunch ? "Ready to investigate" : "Needs launch period flag",
      explanation: "Calculates the exact dollar increase and percentage lift with a 95% confidence interval.",
      businessValue: "Gives leadership a statistically defensible revenue impact range.",
    },
    {
      id: "Q_REV_03",
      theme: "Revenue performance",
      question: "Which month generated the most revenue?",
      intent: "distribution_analysis",
      targetVar: revCol,
      groupVar: dateCol,
      suggestedTest: "Descriptive Statistics & Monthly Aggregations",
      feasibility: hasDates ? "ready" : "partial",
      feasibilityLabel: hasDates ? "Ready to investigate" : "Calendar dates needed",
      explanation: "Ranks monthly revenue totals to pinpoint peak financial performance.",
      businessValue: "Identifies top performing business cycles and seasonal peaks.",
    },
    {
      id: "Q_REV_04",
      theme: "Revenue performance",
      question: "Was revenue growing even before the app launched?",
      intent: "trend_analysis",
      targetVar: revCol,
      groupVar: dateCol,
      suggestedTest: "Time-Series Baseline Regression",
      feasibility: hasDates ? "ready" : "needs_data",
      feasibilityLabel: hasDates ? "Ready to investigate" : "Needs date history",
      explanation: "Audits pre-launch revenue trajectory to rule out pre-existing upward trends.",
      businessValue: "Prevents falsely crediting pre-existing momentum to the app launch.",
    },

    // Theme B: Website versus app
    {
      id: "Q_CH_01",
      theme: "Website versus app",
      question: "Which channel generated more revenue?",
      intent: "cohort_comparison",
      targetVar: hasAppRev && hasWebRev ? appRevCol : revCol,
      groupVar: hasAppRev && hasWebRev ? webRevCol : undefined,
      suggestedTest: "Paired Two-Sample Difference Test",
      feasibility: hasAppRev && hasWebRev ? "ready" : "partial",
      feasibilityLabel: hasAppRev && hasWebRev ? "Ready to investigate" : "Requires channel split columns",
      explanation: "Directly compares total and average sales volume produced by the website vs the mobile app.",
      businessValue: "Determines which digital storefront delivers the largest commercial volume.",
    },
    {
      id: "Q_CH_02",
      theme: "Website versus app",
      question: "Did website revenue fall after the app launched?",
      intent: "cohort_comparison",
      targetVar: webRevCol,
      groupVar: launchCol,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: hasWebRev && hasLaunch ? "ready" : "partial",
      feasibilityLabel: hasWebRev && hasLaunch ? "Ready to investigate" : "Needs website revenue column",
      explanation: "Tests for cannibalization by checking if website revenue dropped after the app went live.",
      businessValue: "Reveals whether app sales were truly incremental or merely cannibalized web sales.",
    },
    {
      id: "Q_CH_03",
      theme: "Website versus app",
      question: "Did app revenue add to total revenue?",
      intent: "driver_analysis",
      targetVar: revCol,
      groupVar: appRevCol,
      suggestedTest: "OLS Linear Regression & Additive Contribution Test",
      feasibility: hasAppRev ? "ready" : "partial",
      feasibilityLabel: hasAppRev ? "Ready to investigate" : "Needs app revenue column",
      explanation: "Evaluates whether app revenue expanded overall company revenue or simply substituted web purchases.",
      businessValue: "Demonstrates true net commercial expansion from the new digital asset.",
    },

    // Theme C: Customer activity and conversions
    {
      id: "Q_ACT_01",
      theme: "Customer activity and conversions",
      question: "Did more people start visiting after the app launched?",
      intent: "cohort_comparison",
      targetVar: visitsCol || "Visits",
      groupVar: launchCol,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: hasVisits && hasLaunch ? "ready" : "needs_data",
      feasibilityLabel: hasVisits && hasLaunch ? "Ready to investigate" : "Needs traffic/visit column",
      explanation: "Audits whether total digital audience traffic increased following the mobile launch.",
      missingRequirementExplanation: hasVisits ? undefined : "Requires a visits or visitor volume column in the uploaded dataset.",
      businessValue: "Checks if the app expanded top-of-funnel customer reach.",
    },
    {
      id: "Q_ACT_02",
      theme: "Customer activity and conversions",
      question: "Did more visitors purchase policies?",
      intent: "cohort_comparison",
      targetVar: convCol || "Policies_Sold",
      groupVar: launchCol,
      suggestedTest: "Two-Proportion z-Test & Rate Analysis",
      feasibility: hasConv && hasVisits ? "ready" : "needs_data",
      feasibilityLabel: hasConv && hasVisits ? "Ready to investigate" : "Needs policy purchase counts",
      explanation: "Tests if conversion rates (purchases divided by visits) improved after app availability.",
      missingRequirementExplanation: hasConv ? undefined : "Requires policy sales count and visitor counts in the uploaded file.",
      businessValue: "Distinguishes between raw audience expansion and actual conversion efficiency.",
    },
    {
      id: "Q_ACT_03",
      theme: "Customer activity and conversions",
      question: "Did people who used the app purchase higher-value policies?",
      intent: "cohort_comparison",
      targetVar: "Policy_Value",
      groupVar: "Channel",
      suggestedTest: "Independent Samples t-test",
      feasibility: "needs_data",
      feasibilityLabel: "Needs additional data",
      explanation: "Requires individual transaction-level policy values to compare basket sizes between app and web buyers.",
      missingRequirementExplanation: "The current file contains daily aggregated revenue. To test average policy ticket size, transaction-level records are needed.",
      businessValue: "Identifies if mobile app users represent a higher customer lifetime value (LTV).",
    },

    // Theme D: Consistency and growth
    {
      id: "Q_GROW_01",
      theme: "Consistency and growth",
      question: "Was the revenue increase consistent over time?",
      intent: "trend_analysis",
      targetVar: revCol,
      groupVar: dateCol,
      suggestedTest: "Linear Trend & Volatility Analysis",
      feasibility: hasDates ? "ready" : "partial",
      feasibilityLabel: hasDates ? "Ready to investigate" : "Needs date column",
      explanation: "Tests whether revenue growth remained steady week-over-week or fluctuated widely.",
      businessValue: "Verifies that financial gains were predictable and repeatable, not accidental.",
    },
    {
      id: "Q_GROW_02",
      theme: "Consistency and growth",
      question: "Was there just a big jump immediately after launch that settled down?",
      intent: "distribution_analysis",
      targetVar: revCol,
      groupVar: dateCol,
      suggestedTest: "Interrupted Time Series & Post-Launch Decay Audit",
      feasibility: hasDates && hasLaunch ? "ready" : "needs_data",
      feasibilityLabel: hasDates && hasLaunch ? "Ready to investigate" : "Needs chronological launch date",
      explanation: "Separates short-term novelty spikes from long-term sustainable run-rate improvements.",
      businessValue: "Crucial for budgeting and annual financial forecasts.",
    },
    {
      id: "Q_GROW_03",
      theme: "Consistency and growth",
      question: "Which days had unusually high or low revenue?",
      intent: "outlier_detection",
      targetVar: revCol,
      suggestedTest: "Tukey IQR & Z-score Outlier Audit",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Detects anomalous revenue outliers and investigates what caused extreme revenue spikes or drops.",
      businessValue: "Helps management understand operational anomalies and holiday effects.",
    },

    // Theme E: Business recommendations
    {
      id: "Q_REC_01",
      theme: "Business recommendations",
      question: "Which channel deserves more marketing investment?",
      intent: "driver_analysis",
      targetVar: revCol,
      groupVar: hasAppRev && hasWebRev ? appRevCol : launchCol,
      suggestedTest: "Revenue Contribution & Trend Comparison",
      feasibility: hasAppRev && hasWebRev ? "ready" : "partial",
      feasibilityLabel: hasAppRev && hasWebRev ? "Ready to investigate" : "Partial comparison available",
      explanation: "Compares trajectory and growth velocity between web and app to allocate capital effectively.",
      businessValue: "Directly informs upcoming digital marketing budget allocation.",
    },
    {
      id: "Q_REC_02",
      theme: "Business recommendations",
      question: "What additional information would help management make a better decision?",
      intent: "exploratory",
      suggestedTest: "Data Readiness & Confounding Variable Audit",
      feasibility: "needs_data",
      feasibilityLabel: "Needs additional data",
      explanation: "Identifies missing variables such as marketing ad spend, paid vs organic traffic, and customer acquisition costs.",
      missingRequirementExplanation: "Adding channel-level marketing ad spend and campaign dates will enable exact Return on Ad Spend (ROAS) and CAC calculations.",
      businessValue: "Guides the data analytics team on what datasets to connect next.",
    },
  ];

  return {
    centralBusinessProblem: "Did launching the mobile app increase Axis Max Life's revenue?",
    datasetContextSummary: `Axis Max Life digital channel evaluation (${dataset.rowCount.toLocaleString()} observations, ${dataset.columnCount} variables).`,
    themes: [
      "Revenue performance",
      "Website versus app",
      "Customer activity and conversions",
      "Consistency and growth",
      "Business recommendations",
    ],
    questions,
  };
}

/**
 * SaaS Subscription & Churn Question Generator
 */
function generateSaaSQuestions(dataset: DatasetProfile): BusinessQuestionLibrary {
  const continuous = dataset.columns.filter((c) => c.inferredType === "continuous").map((c) => c.name);
  const spendCol = continuous.find((c) => c.toLowerCase().includes("spend") || c.toLowerCase().includes("mrr")) || continuous[0] || "Monthly_Spend";
  const hoursCol = continuous.find((c) => c.toLowerCase().includes("hour") || c.toLowerCase().includes("usage")) || continuous[1] || "Usage_Hours";
  const ticketsCol = continuous.find((c) => c.toLowerCase().includes("ticket")) || "Support_Tickets";
  const tierCol = dataset.columns.find((c) => c.name.toLowerCase().includes("tier") || c.name.toLowerCase().includes("plan"))?.name || "Plan_Tier";
  const statusCol = dataset.columns.find((c) => c.name.toLowerCase().includes("status") || c.name.toLowerCase().includes("churn"))?.name || "Status";

  const questions: BusinessQuestion[] = [
    {
      id: "S_01",
      theme: "Customer retention & churn",
      question: "Which customers are most likely to churn?",
      intent: "cohort_comparison",
      targetVar: spendCol,
      groupVar: statusCol,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Compares usage patterns and monthly spend between churned and active customers.",
      businessValue: "Identifies early warning indicators to reduce customer churn.",
    },
    {
      id: "S_02",
      theme: "Revenue performance",
      question: "Which plan tier generates the highest average monthly spend?",
      intent: "cohort_comparison",
      targetVar: spendCol,
      groupVar: tierCol,
      suggestedTest: "One-Way ANOVA & Welch t-test",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Tests whether higher subscription tiers deliver statistically significant revenue increases.",
      businessValue: "Helps optimize pricing and packaging strategy.",
    },
    {
      id: "S_03",
      theme: "Activity and engagement",
      question: "Do customers with higher platform usage hours spend more money?",
      intent: "driver_analysis",
      targetVar: spendCol,
      groupVar: hoursCol,
      suggestedTest: "Pearson Correlation & OLS Regression",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Determines how strongly product usage drives account expansion and contract value.",
      businessValue: "Proves whether driving product adoption increases commercial revenue.",
    },
    {
      id: "S_04",
      theme: "Customer retention & churn",
      question: "Do customers with more support tickets have higher churn rates?",
      intent: "cohort_comparison",
      targetVar: ticketsCol,
      groupVar: statusCol,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Checks if high ticket volumes flag customer frustration and attrition.",
      businessValue: "Pinpoints support thresholds where proactive customer intervention is required.",
    },
    {
      id: "S_05",
      theme: "Consistency and growth",
      question: "Are there unusually extreme revenue accounts skewing our averages?",
      intent: "outlier_detection",
      targetVar: spendCol,
      suggestedTest: "Tukey IQR & Z-score Outlier Audit",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Audits for extreme outlier accounts that may distort executive financial reporting.",
      businessValue: "Ensures revenue targets reflect typical customers rather than 1-2 whale contracts.",
    },
    {
      id: "S_06",
      theme: "Business recommendations",
      question: "What is the single biggest predictor of customer churn?",
      intent: "driver_analysis",
      targetVar: spendCol,
      groupVar: statusCol,
      suggestedTest: "Multiple Linear Regression & Feature Audit",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Ranks product usage, support tickets, and spend to identify the top churn driver.",
      businessValue: "Directly instructs product and success teams where to focus retention resources.",
    },
  ];

  return {
    centralBusinessProblem: "Which factors drive customer churn and monthly subscription revenue?",
    datasetContextSummary: `SaaS subscription retention analysis (${dataset.rowCount.toLocaleString()} accounts, ${dataset.columnCount} fields).`,
    themes: [
      "Revenue performance",
      "Customer retention & churn",
      "Activity and engagement",
      "Consistency and growth",
      "Business recommendations",
    ],
    questions,
  };
}

/**
 * E-Commerce & Retail Question Generator
 */
function generateEcommerceQuestions(dataset: DatasetProfile): BusinessQuestionLibrary {
  const continuous = dataset.columns.filter((c) => c.inferredType === "continuous").map((c) => c.name);
  const basketCol = continuous.find((c) => c.toLowerCase().includes("basket") || c.toLowerCase().includes("size") || c.toLowerCase().includes("spend")) || continuous[0] || "Basket_Size";
  const itemsCol = continuous.find((c) => c.toLowerCase().includes("item")) || continuous[1] || "Items_Count";
  const discountCol = dataset.columns.find((c) => c.name.toLowerCase().includes("discount"))?.name || "Discount_Status";
  const deviceCol = dataset.columns.find((c) => c.name.toLowerCase().includes("device"))?.name || "Device";

  const questions: BusinessQuestion[] = [
    {
      id: "E_01",
      theme: "Promotional effectiveness",
      question: "Do discount campaigns generate statistically higher basket sizes?",
      intent: "cohort_comparison",
      targetVar: basketCol,
      groupVar: discountCol,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Tests whether customers using discounts spend significantly more than full-price shoppers.",
      businessValue: "Determines whether price promotions pay for themselves in higher order volumes.",
    },
    {
      id: "E_02",
      theme: "Device and channel performance",
      question: "Which device generates larger average order values?",
      intent: "cohort_comparison",
      targetVar: basketCol,
      groupVar: deviceCol,
      suggestedTest: "One-Way ANOVA & Welch t-test",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Compares average order values across Mobile, Desktop, and Tablet shoppers.",
      businessValue: "Informs checkout UX investment and mobile app priorities.",
    },
    {
      id: "E_03",
      theme: "Purchasing behavior",
      question: "Does purchasing more items correlate with higher total basket spend?",
      intent: "driver_analysis",
      targetVar: basketCol,
      groupVar: itemsCol,
      suggestedTest: "Pearson Correlation & OLS Regression",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Evaluates the linear relationship between quantity of items and total cart revenue.",
      businessValue: "Checks whether cross-sell recommendations effectively lift order totals.",
    },
    {
      id: "E_04",
      theme: "Business recommendations",
      question: "Should the company increase or scale back discount promotions?",
      intent: "driver_analysis",
      targetVar: basketCol,
      groupVar: discountCol,
      suggestedTest: "Linear Regression & Elasticity Audit",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Audits whether the margin giveback from discounts is outweighed by volume gains.",
      businessValue: "Guides marketing promotional calendar and margin protection.",
    },
  ];

  return {
    centralBusinessProblem: "Do promotional discounts increase customer basket sizes and sales volume?",
    datasetContextSummary: `E-Commerce order analysis (${dataset.rowCount.toLocaleString()} orders, ${dataset.columnCount} fields).`,
    themes: [
      "Promotional effectiveness",
      "Device and channel performance",
      "Purchasing behavior",
      "Business recommendations",
    ],
    questions,
  };
}

/**
 * B2B Sales Deals Question Generator
 */
function generateB2BQuestions(dataset: DatasetProfile): BusinessQuestionLibrary {
  const continuous = dataset.columns.filter((c) => c.inferredType === "continuous").map((c) => c.name);
  const dealCol = continuous.find((c) => c.toLowerCase().includes("deal") || c.toLowerCase().includes("size")) || continuous[0] || "Deal_Size";
  const cycleCol = continuous.find((c) => c.toLowerCase().includes("cycle") || c.toLowerCase().includes("day")) || continuous[1] || "Sales_Cycle_Days";
  const sourceCol = dataset.columns.find((c) => c.name.toLowerCase().includes("source") || c.name.toLowerCase().includes("lead"))?.name || "Lead_Source";
  const statusCol = dataset.columns.find((c) => c.name.toLowerCase().includes("win") || c.name.toLowerCase().includes("status"))?.name || "Win_Status";

  const questions: BusinessQuestion[] = [
    {
      id: "B_01",
      theme: "Lead generation & channels",
      question: "Which lead source generates the highest average deal size?",
      intent: "cohort_comparison",
      targetVar: dealCol,
      groupVar: sourceCol,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Compares contract value across Inbound, Outbound, and Referral channels.",
      businessValue: "Identifies the highest ROI channel for business development.",
    },
    {
      id: "B_02",
      theme: "Sales cycle velocity",
      question: "Do shorter sales cycles have higher deal win rates?",
      intent: "cohort_comparison",
      targetVar: cycleCol,
      groupVar: statusCol,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Analyzes whether deals that close quickly are more likely to result in a win.",
      businessValue: "Helps sales leadership set qualification rules and deal velocity KPIs.",
    },
    {
      id: "B_03",
      theme: "Deal size & contract value",
      question: "What is the typical spread and median contract value?",
      intent: "distribution_analysis",
      targetVar: dealCol,
      suggestedTest: "Descriptive Statistics & Interquartile Spread",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Audits typical contract size while filtering out extreme enterprise outliers.",
      businessValue: "Provides a realistic baseline for sales quotas and territory planning.",
    },
    {
      id: "B_04",
      theme: "Business recommendations",
      question: "Which customer lead source should the sales team prioritize?",
      intent: "driver_analysis",
      targetVar: dealCol,
      groupVar: sourceCol,
      suggestedTest: "ANOVA & Channel Lift Analysis",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: "Ranks lead sources by win rate and revenue to guide sales rep staffing.",
      businessValue: "Directly drives pipeline acceleration and quota attainment.",
    },
  ];

  return {
    centralBusinessProblem: "Which lead channels shorten sales cycles and maximize deal close rates?",
    datasetContextSummary: `B2B sales opportunity analysis (${dataset.rowCount.toLocaleString()} deals, ${dataset.columnCount} fields).`,
    themes: [
      "Lead generation & channels",
      "Sales cycle velocity",
      "Deal size & contract value",
      "Business recommendations",
    ],
    questions,
  };
}

/**
 * Generic Adaptive Business Question Generator for any arbitrary CSV/Excel file
 */
function generateAdaptiveBusinessQuestions(dataset: DatasetProfile): BusinessQuestionLibrary {
  const continuous = dataset.columns.filter((c) => c.inferredType === "continuous").map((c) => c.name);
  const categoricals = dataset.columns.filter((c) => c.inferredType === "categorical" || c.inferredType === "boolean").map((c) => c.name);
  const dateCol = dataset.timeCoverage?.dateColumn;

  const target = continuous[0] || "Value";
  const targetLabel = formatColumnLabel(target);

  const secondary = continuous[1];
  const secLabel = secondary ? formatColumnLabel(secondary) : "";

  const group = categoricals[0] || "Category";
  const groupLabel = formatColumnLabel(group);

  const questions: BusinessQuestion[] = [];

  // Theme: Core performance
  questions.push({
    id: "GEN_01",
    theme: "Performance & results",
    question: `What is the typical average and spread of ${targetLabel.toLowerCase()}?`,
    intent: "distribution_analysis",
    targetVar: target,
    suggestedTest: "Descriptive Statistics & Interquartile Dispersion",
    feasibility: "ready",
    feasibilityLabel: "Ready to investigate",
    explanation: `Calculates baseline numbers, median values, and overall variability in ${targetLabel.toLowerCase()}.`,
    businessValue: "Establishes a solid baseline for all business planning.",
  });

  // Theme: Group comparisons
  if (categoricals.length > 0 && continuous.length > 0) {
    questions.push({
      id: "GEN_02",
      theme: "Group comparisons",
      question: `Does ${targetLabel.toLowerCase()} differ significantly across ${groupLabel.toLowerCase()} groups?`,
      intent: "cohort_comparison",
      targetVar: target,
      groupVar: group,
      suggestedTest: "Welch Two-Sample t-test",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: `Tests if performance in ${targetLabel.toLowerCase()} varies meaningfully depending on ${groupLabel.toLowerCase()}.`,
      businessValue: "Reveals which segments are outperforming or lagging behind.",
    });
  }

  // Theme: Driver analysis
  if (continuous.length >= 2) {
    questions.push({
      id: "GEN_03",
      theme: "Drivers & relationships",
      question: `Is there a reliable relationship between ${secLabel.toLowerCase()} and ${targetLabel.toLowerCase()}?`,
      intent: "driver_analysis",
      targetVar: target,
      groupVar: secondary,
      suggestedTest: "Pearson Correlation & OLS Regression",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: `Checks if increases in ${secLabel.toLowerCase()} systematically move ${targetLabel.toLowerCase()} in a predictable direction.`,
      businessValue: "Determines whether managing one metric helps influence the other.",
    });
  }

  // Theme: Trends over time
  if (dateCol && continuous.length > 0) {
    questions.push({
      id: "GEN_04",
      theme: "Consistency and trends",
      question: `Did ${targetLabel.toLowerCase()} improve, decline, or stay flat over time?`,
      intent: "trend_analysis",
      targetVar: target,
      groupVar: dateCol,
      suggestedTest: "Time-Series Regression & Trend Analysis",
      feasibility: "ready",
      feasibilityLabel: "Ready to investigate",
      explanation: `Calculates the growth rate and stability of ${targetLabel.toLowerCase()} across your calendar dates.`,
      businessValue: "Tests whether business trajectory is headed in the right direction.",
    });
  }

  // Theme: Outliers
  questions.push({
    id: "GEN_05",
    theme: "Consistency and trends",
    question: `Were there any unusually extreme outlier observations in ${targetLabel.toLowerCase()}?`,
    intent: "outlier_detection",
    targetVar: target,
    suggestedTest: "Tukey IQR & Z-score Outlier Audit",
    feasibility: "ready",
    feasibilityLabel: "Ready to investigate",
    explanation: `Identifies extreme records that may distort reporting averages or signal operational exceptions.`,
    businessValue: "Separates genuine repeatable patterns from rare anomalies.",
  });

  // Theme: Recommendations
  questions.push({
    id: "GEN_06",
    theme: "Business recommendations",
    question: `What primary factors best explain changes in ${targetLabel.toLowerCase()}?`,
    intent: "driver_analysis",
    targetVar: target,
    suggestedTest: "Multiple Linear Regression",
    feasibility: "ready",
    feasibilityLabel: "Ready to investigate",
    explanation: `Ranks all available metrics to pinpoint which variables exert the strongest influence.`,
    businessValue: "Tells management exactly what operational levers to pull next.",
  });

  return {
    centralBusinessProblem: `How does ${targetLabel.toLowerCase()} perform and what factors explain its variation?`,
    datasetContextSummary: `Operational dataset investigation (${dataset.rowCount.toLocaleString()} records, ${dataset.columnCount} fields).`,
    themes: [
      "Performance & results",
      "Group comparisons",
      "Drivers & relationships",
      "Consistency and trends",
      "Business recommendations",
    ],
    questions,
  };
}

/**
 * Asynchronously enriches the business-first question library via server-side Gemini.
 * Falls back seamlessly to the deterministic business question library if offline or delayed.
 */
export async function getEnhancedBusinessQuestionLibrary(
  dataset: DatasetProfile,
  businessBrief?: string
): Promise<BusinessQuestionLibrary> {
  const deterministic = generateBusinessQuestionLibrary(dataset, businessBrief);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("/api/questions/business-first", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        filename: dataset.filename,
        rowCount: dataset.rowCount,
        businessBrief: businessBrief || deterministic.centralBusinessProblem,
        columns: dataset.columns.map((c) => ({
          name: c.name,
          inferredType: c.inferredType,
          uniqueCount: c.uniqueCount,
          sampleValues: c.sampleValues?.slice(0, 3),
        })),
        timeCoverage: dataset.timeCoverage,
        granularity: dataset.granularity,
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      return deterministic;
    }

    const data = await res.json();
    if (data && Array.isArray(data.questions) && data.questions.length >= 6) {
      return {
        centralBusinessProblem: data.centralBusinessProblem || deterministic.centralBusinessProblem,
        datasetContextSummary: data.datasetContextSummary || deterministic.datasetContextSummary,
        themes: Array.isArray(data.themes) && data.themes.length > 0 ? data.themes : deterministic.themes,
        questions: data.questions,
      };
    }
  } catch (err) {
    // Silent fallback to deterministic business question library
  }

  return deterministic;
}
