import { DecisionCapability, BusinessGoalCategory } from "../types/decisionOptimization";
import { DatasetProfile } from "../types/dataset";

export const CAPABILITY_CATEGORIES: { id: BusinessGoalCategory; title: string; description: string }[] = [
  {
    id: "revenue_growth",
    title: "Revenue & Growth",
    description: "Maximise gross revenue, improve sales conversion, and balance customer acquisition against retention.",
  },
  {
    id: "profit_costs",
    title: "Profitability & Costs",
    description: "Maximise contribution margins, reduce operating expenses, and identify cost-efficient operating mixes.",
  },
  {
    id: "marketing_allocation",
    title: "Marketing & Allocation",
    description: "Distribute a fixed marketing budget across channels (website, app, search, social) to maximise returns under diminishing returns.",
  },
  {
    id: "operations_resources",
    title: "Operations & Resources",
    description: "Allocate operational capacity, staff, and inventory to balance workload and minimise wastage.",
  },
  {
    id: "pricing_commercial",
    title: "Pricing & Commercial",
    description: "Explore pricing combinations, discount structures, and volume-margin trade-offs under user-calibrated demand elasticity.",
  },
  {
    id: "risk_constraints",
    title: "Risk & Constraints",
    description: "Balance expected return against operational uncertainty, respecting strict risk ceilings and minimum cash buffers.",
  },
  {
    id: "custom_problem",
    title: "Custom Business Problem",
    description: "Define your own objective function, decision variables, bounds, and business constraints from scratch.",
  },
];

export const DECISION_CAPABILITIES: DecisionCapability[] = [
  // 1. Marketing Budget Channel Allocation
  {
    id: "cap_mkt_allocation",
    category: "marketing_allocation",
    categoryTitle: "Marketing & Allocation",
    title: "Multi-Channel Marketing Budget Allocation",
    problemSolved: "Distributes a fixed advertising or acquisition budget across channels (website, mobile app, search, offline) to achieve the highest possible gross revenue or conversions, accounting for diminishing marginal returns.",
    controllableVariables: ["Website marketing spend", "Mobile App marketing spend", "Direct/Search campaign spend"],
    requiredInformation: ["Total available marketing budget (₹)", "Minimum and maximum spend limits per channel", "Estimated revenue generated per unit of spend", "Diminishing returns curvature"],
    mathematicalApproach: "Constrained Concave Diminishing Returns Optimization (KKT / Lagrange Multipliers with Box Constraints)",
    solverMethod: "kkt_diminishing_returns",
    outputDescription: "Optimal rupee allocation per channel, expected revenue lift over current baseline, binding budget and capacity limits, and marginal revenue yield (shadow price) of expanding the total budget.",
    dataSuitability: "ready_with_data",
    defaultTemplate: {
      objectiveType: "maximize",
      targetMetric: "Total Revenue",
      targetUnit: "₹",
      budgetTotal: 1000000,
      variables: [
        {
          name: "website_marketing",
          label: "Website Marketing Spend",
          source: "derived_from_data",
          unit: "₹",
          currentHistoricalValue: 400000,
          userCalibratedValue: 400000,
          minBound: 150000,
          maxBound: 700000,
          expectedReturnPerUnit: 120, // sqrt coefficient
          diminishingReturns: true,
          notes: "Historical web conversion funnel and desktop acquisition campaigns.",
        },
        {
          name: "app_marketing",
          label: "Mobile App Marketing Spend",
          source: "derived_from_data",
          unit: "₹",
          currentHistoricalValue: 350000,
          userCalibratedValue: 350000,
          minBound: 150000,
          maxBound: 650000,
          expectedReturnPerUnit: 165, // higher marginal return on app
          diminishingReturns: true,
          notes: "App install ads and mobile re-engagement campaigns.",
        },
        {
          name: "search_brand_marketing",
          label: "Search & Direct Marketing",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 250000,
          userCalibratedValue: 250000,
          minBound: 100000,
          maxBound: 450000,
          expectedReturnPerUnit: 95,
          diminishingReturns: true,
          notes: "Intent-driven brand keywords and partner affiliate traffic.",
        },
      ],
      constraints: [
        {
          name: "Total Marketing Budget Cap",
          type: "budget_total",
          limitValue: 1000000,
          unit: "₹",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Total spend across all channels cannot exceed the approved quarterly marketing budget.",
        },
        {
          name: "Minimum Mobile App Presence",
          type: "min_allocation",
          limitValue: 150000,
          unit: "₹",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Strategic requirement to maintain minimum baseline traction on mobile apps.",
        },
      ],
    },
  },

  // 2. Revenue Maximisation with Capacity Bounds
  {
    id: "cap_rev_growth",
    category: "revenue_growth",
    categoryTitle: "Revenue & Growth",
    title: "Revenue Maximisation under Operational Capacity",
    problemSolved: "Finds the combination of sales effort, regional marketing, and lead acquisition that maximises top-line revenue without overwhelming operational delivery capacity.",
    controllableVariables: ["Inbound lead generation spend", "Field sales team capacity", "Partner distribution incentives"],
    requiredInformation: ["Total growth budget", "Max capacity of underwriting/fulfillment teams", "Expected revenue conversion per lead"],
    mathematicalApproach: "Bounded Linear & Concave Programming with Capacity Upper Bounds",
    solverMethod: "kkt_diminishing_returns",
    outputDescription: "Target revenue projection, optimal resource distribution, and bottleneck identification where operational limits constrain revenue growth.",
    dataSuitability: "needs_human_calibration",
    defaultTemplate: {
      objectiveType: "maximize",
      targetMetric: "Quarterly Revenue",
      targetUnit: "₹",
      budgetTotal: 1500000,
      variables: [
        {
          name: "digital_lead_gen",
          label: "Digital Lead Acquisition",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 600000,
          userCalibratedValue: 600000,
          minBound: 300000,
          maxBound: 900000,
          expectedReturnPerUnit: 140,
          diminishingReturns: true,
          notes: "Paid search and social lead forms.",
        },
        {
          name: "sales_enablement",
          label: "Sales Conversion & Closing",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 500000,
          userCalibratedValue: 500000,
          minBound: 250000,
          maxBound: 800000,
          expectedReturnPerUnit: 155,
          diminishingReturns: true,
          notes: "Closing incentives, outbound calling, and sales tools.",
        },
        {
          name: "partner_commissions",
          label: "Affiliate & Partner Network",
          source: "supplied_by_user",
          unit: "₹",
          currentHistoricalValue: 400000,
          userCalibratedValue: 400000,
          minBound: 200000,
          maxBound: 600000,
          expectedReturnPerUnit: 110,
          diminishingReturns: true,
          notes: "Third-party referral networks and broker incentives.",
        },
      ],
      constraints: [
        {
          name: "Total Growth Investment Cap",
          type: "budget_total",
          limitValue: 1500000,
          unit: "₹",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Available growth and marketing investment budget.",
        },
      ],
    },
  },

  // 3. Profit Margin Maximisation & Cost Minimisation
  {
    id: "cap_profit_margin",
    category: "profit_costs",
    categoryTitle: "Profitability & Costs",
    title: "Contribution Margin Maximisation",
    problemSolved: "Calculates the allocation of customer acquisition and service resources that delivers the highest net contribution margin (Revenue minus Cost), rather than blindly pursuing unprofitable gross volume.",
    controllableVariables: ["High-margin channel acquisition", "Low-margin volume acquisition", "Self-service automation"],
    requiredInformation: ["Average gross margin % per channel", "Variable delivery cost per acquisition", "Available investment pool"],
    mathematicalApproach: "Net Contribution Maximisation Solver: Max (Gross Margin - Direct Cost)",
    solverMethod: "bounded_linear_programming",
    outputDescription: "Profit-maximising channel mix, net margin percentage, and total profit dollars unlocked compared to volume-only targets.",
    dataSuitability: "needs_human_calibration",
    defaultTemplate: {
      objectiveType: "maximize",
      targetMetric: "Net Contribution Profit",
      targetUnit: "₹",
      budgetTotal: 800000,
      variables: [
        {
          name: "direct_channel_spend",
          label: "Direct High-Margin Channel",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 350000,
          userCalibratedValue: 350000,
          minBound: 150000,
          maxBound: 600000,
          expectedReturnPerUnit: 2.4, // Net profit multiplier per ₹ spent
          diminishingReturns: false,
          notes: "Organic, direct web, and brand mobile app traffic (85% contribution margin).",
        },
        {
          name: "aggregator_channel_spend",
          label: "Aggregator / Broker Channel",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 450000,
          userCalibratedValue: 450000,
          minBound: 150000,
          maxBound: 500000,
          expectedReturnPerUnit: 1.6, // Lower net multiplier due to broker fees
          diminishingReturns: false,
          notes: "High volume comparison portals with significant referral fees.",
        },
      ],
      constraints: [
        {
          name: "Acquisition Budget Limit",
          type: "budget_total",
          limitValue: 800000,
          unit: "₹",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Total allowable acquisition spend.",
        },
      ],
    },
  },

  // 4. Operations & Resource Allocation
  {
    id: "cap_ops_resources",
    category: "operations_resources",
    categoryTitle: "Operations & Resources",
    title: "Operational Workforce & Task Allocation",
    problemSolved: "Optimally balances labor hours or operational budget across customer onboarding, claim verification, and retention support to minimise resolution times and prevent backlog bottlenecks.",
    controllableVariables: ["Onboarding verification headcount/hours", "Customer service capacity", "Escalation resolution support"],
    requiredInformation: ["Total available operational hours/budget", "Unit processing time per case", "Target SLA completion thresholds"],
    mathematicalApproach: "Bounded Resource Allocation with Throughput Constraints",
    solverMethod: "bounded_linear_programming",
    outputDescription: "Optimal staff/budget hours per task, throughput volume, and identification of idle capacity versus process bottlenecks.",
    dataSuitability: "user_defined_only",
    defaultTemplate: {
      objectiveType: "maximize",
      targetMetric: "Completed Service Operations",
      targetUnit: "cases",
      budgetTotal: 1000, // hours
      variables: [
        {
          name: "onboarding_hours",
          label: "Customer Onboarding Hours",
          source: "supplied_by_user",
          unit: "hours",
          currentHistoricalValue: 400,
          userCalibratedValue: 400,
          minBound: 200,
          maxBound: 600,
          expectedReturnPerUnit: 3.5, // 3.5 cases completed per hour
          diminishingReturns: false,
          notes: "Initial document verification and account creation.",
        },
        {
          name: "support_resolution_hours",
          label: "Inquiry Resolution Hours",
          source: "supplied_by_user",
          unit: "hours",
          currentHistoricalValue: 350,
          userCalibratedValue: 350,
          minBound: 200,
          maxBound: 500,
          expectedReturnPerUnit: 4.2,
          diminishingReturns: false,
          notes: "Live chat and phone assistance tickets.",
        },
        {
          name: "retention_hours",
          label: "Proactive Retention Outbound",
          source: "supplied_by_user",
          unit: "hours",
          currentHistoricalValue: 250,
          userCalibratedValue: 250,
          minBound: 100,
          maxBound: 400,
          expectedReturnPerUnit: 2.1,
          diminishingReturns: false,
          notes: "Renewal reminders and churn prevention check-ins.",
        },
      ],
      constraints: [
        {
          name: "Total Operational Workforce Hours",
          type: "budget_total",
          limitValue: 1000,
          unit: "hours",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Total team bandwidth available in the operating cycle.",
        },
      ],
    },
  },

  // 5. Pricing & Commercial Decisions
  {
    id: "cap_pricing_commercial",
    category: "pricing_commercial",
    categoryTitle: "Pricing & Commercial Decisions",
    title: "Discount & Pricing Elasticity Balancing",
    problemSolved: "Determines the optimal discount or promotional incentive allocation across customer segments to maximise gross margin while hitting sales volume quotas.",
    controllableVariables: ["New user promotional discount", "Renewal customer loyalty rebate", "Annual pre-pay discount"],
    requiredInformation: ["Discount pool budget", "Estimated price elasticity (demand change per % discount)", "Baseline product prices"],
    mathematicalApproach: "Constrained Nonlinear Elasticity Optimization",
    solverMethod: "kkt_diminishing_returns",
    outputDescription: "Recommended discount rate per cohort, expected net revenue lift, and protective bounds against margin dilution.",
    dataSuitability: "needs_human_calibration",
    defaultTemplate: {
      objectiveType: "maximize",
      targetMetric: "Net Revenue after Discounts",
      targetUnit: "₹",
      budgetTotal: 500000,
      variables: [
        {
          name: "new_acquisition_discount",
          label: "New User Welcome Discount",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 250000,
          userCalibratedValue: 250000,
          minBound: 100000,
          maxBound: 400000,
          expectedReturnPerUnit: 135,
          diminishingReturns: true,
          notes: "Introductory promotional credits for first-time policyholders.",
        },
        {
          name: "renewal_loyalty_rebate",
          label: "Renewal Loyalty Discount",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 250000,
          userCalibratedValue: 250000,
          minBound: 100000,
          maxBound: 350000,
          expectedReturnPerUnit: 170, // High ROI on retention
          diminishingReturns: true,
          notes: "Retention discounts for multi-year policy continuations.",
        },
      ],
      constraints: [
        {
          name: "Discount & Incentive Budget Cap",
          type: "budget_total",
          limitValue: 500000,
          unit: "₹",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Maximum allowable price concessions and promotional vouchers.",
        },
      ],
    },
  },

  // 6. Risk & Constraints
  {
    id: "cap_risk_constraints",
    category: "risk_constraints",
    categoryTitle: "Risk & Constraints",
    title: "Risk-Capped Resource Allocation",
    problemSolved: "Finds the allocation of business investments that maximises return subject to strict variance/risk limits and guaranteed minimum reserve capital.",
    controllableVariables: ["Core low-volatility initiatives", "High-growth experimental initiatives", "Defensive reserve buffer"],
    requiredInformation: ["Total capital budget", "Maximum allowable risk volatility score", "Expected payoff per initiative"],
    mathematicalApproach: "Mean-Variance Quadratic & Bounded Optimization with Risk Ceiling",
    solverMethod: "kkt_diminishing_returns",
    outputDescription: "Risk-adjusted resource allocation, portfolio Sharpe ratio equivalent, and verification of safety buffer preservation.",
    dataSuitability: "needs_human_calibration",
    defaultTemplate: {
      objectiveType: "maximize",
      targetMetric: "Risk-Adjusted Expected Return",
      targetUnit: "₹",
      budgetTotal: 2000000,
      variables: [
        {
          name: "core_proven_initiatives",
          label: "Core Proven Channels (Low Risk)",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 1200000,
          userCalibratedValue: 1200000,
          minBound: 800000,
          maxBound: 1600000,
          expectedReturnPerUnit: 115,
          diminishingReturns: true,
          notes: "Established distribution partners with steady predictable conversion rates.",
        },
        {
          name: "experimental_growth",
          label: "Experimental Channels (Higher Volatility)",
          source: "estimated_by_user",
          unit: "₹",
          currentHistoricalValue: 500000,
          userCalibratedValue: 500000,
          minBound: 150000,
          maxBound: 800000,
          expectedReturnPerUnit: 180, // high return potential but volatile
          diminishingReturns: true,
          notes: "New influencer campaigns and experimental digital channels.",
        },
        {
          name: "defensive_reserve",
          label: "Defensive Liquidity Buffer",
          source: "supplied_by_user",
          unit: "₹",
          currentHistoricalValue: 300000,
          userCalibratedValue: 300000,
          minBound: 200000,
          maxBound: 600000,
          expectedReturnPerUnit: 30, // low nominal yield, pure safety
          diminishingReturns: false,
          notes: "Reserve funds held against unexpected macro fluctuations.",
        },
      ],
      constraints: [
        {
          name: "Total Capital Allocation Limit",
          type: "budget_total",
          limitValue: 2000000,
          unit: "₹",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Total allocated budget across initiatives.",
        },
        {
          name: "Minimum Safety Buffer",
          type: "min_allocation",
          limitValue: 200000,
          unit: "₹",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Mandatory liquidity reserve that cannot be deployed to risk assets.",
        },
      ],
    },
  },

  // 7. Custom Business Problem
  {
    id: "cap_custom_problem",
    category: "custom_problem",
    categoryTitle: "Custom Business Problem",
    title: "User-Defined Mathematical Optimization",
    problemSolved: "Allows you to formulate any business decision problem: specify your exact objective (maximise or minimise), define your controllable decision variables, set your own min/max bounds, and specify budget or operational constraints.",
    controllableVariables: ["Decision Variable 1", "Decision Variable 2"],
    requiredInformation: ["Objective definition", "Variables and units", "Expected return or marginal effect", "Constraints and budget"],
    mathematicalApproach: "Generalized Constrained Optimization (Simplex / KKT Solver)",
    solverMethod: "kkt_diminishing_returns",
    outputDescription: "Optimal combination of custom decision variables, expected objective outcome, and binding constraint analysis.",
    dataSuitability: "user_defined_only",
    defaultTemplate: {
      objectiveType: "maximize",
      targetMetric: "Custom Objective",
      targetUnit: "pts",
      budgetTotal: 100,
      variables: [
        {
          name: "decision_variable_a",
          label: "Decision Variable A",
          source: "supplied_by_user",
          unit: "units",
          currentHistoricalValue: 50,
          userCalibratedValue: 50,
          minBound: 10,
          maxBound: 80,
          expectedReturnPerUnit: 2.5,
          diminishingReturns: true,
          notes: "Primary operational control lever.",
        },
        {
          name: "decision_variable_b",
          label: "Decision Variable B",
          source: "supplied_by_user",
          unit: "units",
          currentHistoricalValue: 50,
          userCalibratedValue: 50,
          minBound: 10,
          maxBound: 80,
          expectedReturnPerUnit: 3.2,
          diminishingReturns: true,
          notes: "Secondary operational control lever.",
        },
      ],
      constraints: [
        {
          name: "Total Resource Capacity",
          type: "budget_total",
          limitValue: 100,
          unit: "units",
          source: "supplied_by_user",
          isHardConstraint: true,
          description: "Maximum combined allocation allowed across variables.",
        },
      ],
    },
  },
];

/**
 * Intelligently matches a user's natural-language goal (e.g. "I want to distribute my ₹10 lakh marketing budget")
 * and uploaded dataset metadata to the most suitable mathematical capability.
 */
export function matchCapabilityFromGoal(
  userGoal: string,
  dataset?: DatasetProfile
): DecisionCapability {
  const goalLower = userGoal.toLowerCase().trim();

  // If user explicitly asks for profit or costs
  if (goalLower.includes("profit") || goalLower.includes("margin") || goalLower.includes("cost") || goalLower.includes("operating cost")) {
    return DECISION_CAPABILITIES.find((c) => c.id === "cap_profit_margin") || DECISION_CAPABILITIES[0];
  }

  // If user asks about operations, staff, delivery, inventory, workload
  if (goalLower.includes("operation") || goalLower.includes("workforce") || goalLower.includes("staff") || goalLower.includes("capacity") || goalLower.includes("delivery") || goalLower.includes("inventory")) {
    return DECISION_CAPABILITIES.find((c) => c.id === "cap_ops_resources") || DECISION_CAPABILITIES[0];
  }

  // If user asks about pricing, discount, price elasticity
  if (goalLower.includes("pricing") || goalLower.includes("discount") || goalLower.includes("price") || goalLower.includes("rebate")) {
    return DECISION_CAPABILITIES.find((c) => c.id === "cap_pricing_commercial") || DECISION_CAPABILITIES[0];
  }

  // If user asks about risk, volatility, buffer, downside
  if (goalLower.includes("risk") || goalLower.includes("volatility") || goalLower.includes("uncertainty") || goalLower.includes("buffer")) {
    return DECISION_CAPABILITIES.find((c) => c.id === "cap_risk_constraints") || DECISION_CAPABILITIES[0];
  }

  // If user asks for custom or specific variables
  if (goalLower.includes("custom") || goalLower.includes("my own") || goalLower.includes("define my own")) {
    return DECISION_CAPABILITIES.find((c) => c.id === "cap_custom_problem") || DECISION_CAPABILITIES[0];
  }

  // If dataset has marketing/spend columns or question mentions marketing/channel/budget/website/app
  const hasMarketingCols = dataset?.columns.some((c) => /spend|market|ad|cost/i.test(c.name));
  const hasAppWebCols = dataset?.columns.some((c) => /app|website|web/i.test(c.name));

  if (
    goalLower.includes("marketing") ||
    goalLower.includes("budget") ||
    goalLower.includes("channel") ||
    goalLower.includes("website") ||
    goalLower.includes("app") ||
    (hasMarketingCols && hasAppWebCols)
  ) {
    return DECISION_CAPABILITIES.find((c) => c.id === "cap_mkt_allocation") || DECISION_CAPABILITIES[0];
  }

  // Default to Revenue Maximisation
  return DECISION_CAPABILITIES.find((c) => c.id === "cap_rev_growth") || DECISION_CAPABILITIES[0];
}
