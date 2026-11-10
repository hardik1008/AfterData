import fs from "fs";
import path from "path";

interface QuestionEntry {
  id: string;
  question: string;
  business_context: string;
  statistical_concept: string;
  intent: string;
  required_data_types: string[];
  outcome_candidates: string[];
  predictor_candidates: string[];
  time_dimension_candidates?: string[];
  suggested_test: string;
  requested_experiences: string[];
}

const contexts = [
  "Sales & Revenue",
  "Marketing & Acquisition",
  "Customer Retention & Churn",
  "Product Usage & Engagement",
  "Pricing & Packaging",
  "E-Commerce & Merchandising",
  "Operations & Logistics",
  "Finance & Cash Flow",
  "Customer Support & Quality",
  "Workforce & Productivity",
];

const concepts = [
  "Cohort Comparison",
  "Drivers & Regression",
  "Correlation & Association",
  "Anomaly & Outlier Detection",
  "Time Series & Trends",
];

const templates = [
  // Cohort Comparisons
  {
    concept: "Cohort Comparison",
    intent: "relationship_and_comparison",
    test: "Welch Two-Sample t-test",
    types: ["continuous", "categorical"],
    exps: ["Discover", "Diagnose"],
    patterns: [
      { q: "Do customers on {tier_plan} generate significantly higher {revenue_metric} than standard customers?", out: ["revenue", "mrr", "spend"], pred: ["plan_tier", "account_type"] },
      { q: "Is there a statistically significant difference in {efficiency_metric} between {region_team}?", out: ["deal_size", "cycle_days", "output"], pred: ["region", "team", "office"] },
      { q: "Does adopting {feature_flag} correlate with lower {negative_outcome}?", out: ["churn_rate", "refunds", "tickets"], pred: ["feature_enabled", "onboarding_done"] },
      { q: "Are {demographic_segment} orders yielding higher {basket_metric} compared to other groups?", out: ["basket_value", "order_total"], pred: ["customer_segment", "age_group"] },
      { q: "Do users from {channel_source} exhibit higher {retention_metric} than organic users?", out: ["retention_days", "ltv", "sessions"], pred: ["lead_source", "campaign"] },
    ],
  },
  // Drivers & Regression
  {
    concept: "Drivers & Regression",
    intent: "driver_analysis",
    test: "OLS Linear Regression",
    types: ["continuous", "continuous"],
    exps: ["Discover", "Diagnose"],
    patterns: [
      { q: "How much does an increase in {predictor_spend} directly lift {target_volume}?", out: ["sales", "pipeline_usd", "conversions"], pred: ["marketing_spend", "ad_budget", "headcount"] },
      { q: "Does increasing {discount_rate} statistically increase {order_size} or merely erode margin?", out: ["order_total", "profit_margin", "units"], pred: ["discount_pct", "promotional_markdown"] },
      { q: "To what extent does {activity_metric} explain variance in {long_term_outcome}?", out: ["retention_score", "nps", "clv"], pred: ["weekly_logins", "support_interactions", "usage_hours"] },
      { q: "Can {pipeline_velocity} predict the final {closed_metric} with statistical confidence?", out: ["deal_value", "win_rate"], pred: ["stage_duration_days", "touchpoints_count"] },
      { q: "Does operational {response_time} drive down customer {satisfaction_metric}?", out: ["csat_score", "repeat_purchase_rate"], pred: ["resolution_hours", "first_response_min"] },
    ],
  },
  // Correlation & Association
  {
    concept: "Correlation & Association",
    intent: "relationship_and_comparison",
    test: "Pearson Correlation",
    types: ["continuous", "continuous"],
    exps: ["Discover"],
    patterns: [
      { q: "Is there a strong linear correlation between {var_a} and {var_b}?", out: ["annual_contract_value", "spend", "ltv"], pred: ["team_size", "usage_volume", "interactions"] },
      { q: "How tightly coupled is {operational_cost} with {transaction_volume}?", out: ["operating_expense", "cogs"], pred: ["shipment_count", "order_volume"] },
      { q: "Does employee {tenure_metric} positively correlate with {performance_metric}?", out: ["quota_attainment", "eval_score"], pred: ["months_tenure", "training_hours"] },
      { q: "Is customer {engagement_score} associated with higher {expansion_revenue}?", out: ["net_expansion_usd", "upsell_value"], pred: ["active_users", "feature_adoption"] },
      { q: "Do longer {session_durations} associate with higher {checkout_completion}?", out: ["conversion_probability", "cart_size"], pred: ["session_seconds", "pages_viewed"] },
    ],
  },
  // Anomaly & Outlier Detection
  {
    concept: "Anomaly & Outlier Detection",
    intent: "outlier_detection",
    test: "Z-Score / IQR Anomaly Audit",
    types: ["continuous"],
    exps: ["Diagnose"],
    patterns: [
      { q: "Are there statistically extreme outliers in {monetary_metric} that distort mean performance?", out: ["deal_size", "order_amount", "claim_value"], pred: [] },
      { q: "Which accounts demonstrate abnormal {usage_spikes} beyond 3 standard deviations?", out: ["api_calls", "storage_used", "compute_hours"], pred: ["account_id"] },
      { q: "Are there unusual spikes in {error_or_loss_metric} across specific days?", out: ["refund_volume", "failure_count", "defect_rate"], pred: ["timestamp"] },
      { q: "Which sales representatives have closing ratios that deviate abnormally from the team median?", out: ["sales_velocity_days", "discount_percentage"], pred: ["rep_id"] },
      { q: "Are there anomalous cost clusters in {expense_line} that require audit?", out: ["travel_expense", "cloud_cost", "vendor_payout"], pred: ["cost_center"] },
    ],
  },
  // Time Series & Trends
  {
    concept: "Time Series & Trends",
    intent: "trend_analysis",
    test: "OLS Linear Regression",
    types: ["temporal", "continuous"],
    exps: ["Discover", "Predict"],
    patterns: [
      { q: "Has {key_metric} exhibited a statistically verifiable upward drift over the past periods?", out: ["monthly_active_users", "mrr", "gross_margin"], pred: ["date", "month"] },
      { q: "Is there measurable seasonality in {demand_metric} across quarters?", out: ["booking_volume", "order_count", "inbound_leads"], pred: ["quarter", "season"] },
      { q: "Did the trend in {performance_indicator} change slope after the {intervention_date}?", out: ["customer_churn", "retention_rate"], pred: ["release_date", "cohort_month"] },
      { q: "Has cycle duration in {process_metric} experienced continuous compression over time?", out: ["fulfillment_hours", "lead_time_days"], pred: ["order_date"] },
      { q: "Is the weekly growth rate of {growth_metric} accelerating, plateauing, or decaying?", out: ["new_subscribers", "qualified_pipeline"], pred: ["week_number"] },
    ],
  },
];

// Fill variants to generate 500 distinct, realistic, high-value business questions
const questions: QuestionEntry[] = [];
let idCounter = 1;

for (const ctx of contexts) {
  for (const tmpl of templates) {
    for (const pat of tmpl.patterns) {
      // Create 2 variations per pattern to reach 10 contexts * 5 concepts * 5 patterns * 2 variants = 500 questions!
      for (let v = 1; v <= 2; v++) {
        let qText = pat.q;
        // Specialize based on context
        if (ctx.includes("Sales")) {
          qText = qText
            .replace("{tier_plan}", v === 1 ? "Enterprise Tier" : "Outbound Accounts")
            .replace("{revenue_metric}", v === 1 ? "Deal Size (USD)" : "Annual Contract Value")
            .replace("{region_team}", v === 1 ? "Territory North vs Territory South" : "Direct Sales vs Channel Partners")
            .replace("{efficiency_metric}", v === 1 ? "Sales Cycle Velocity" : "Win Rate")
            .replace("{feature_flag}", v === 1 ? "Executive Sponsorship" : "Product Demo Stage")
            .replace("{negative_outcome}", v === 1 ? "Deal Slippage" : "Discount Concession")
            .replace("{demographic_segment}", v === 1 ? "Strategic Enterprise" : "Mid-Market")
            .replace("{basket_metric}", "Total Pipeline Value")
            .replace("{channel_source}", v === 1 ? "Partner Referrals" : "Targeted Outbound")
            .replace("{retention_metric}", "Account Expansion Rate")
            .replace("{predictor_spend}", "Sales Training Hours")
            .replace("{target_volume}", "Quota Attainment")
            .replace("{discount_rate}", "Discount Concession")
            .replace("{order_size}", "Contract Duration")
            .replace("{activity_metric}", "Discovery Calls Count")
            .replace("{long_term_outcome}", "Close Rate")
            .replace("{pipeline_velocity}", "Stage 2 Duration")
            .replace("{closed_metric}", "Closed Revenue")
            .replace("{response_time}", "Inbound Follow-up Minutes")
            .replace("{satisfaction_metric}", "Prospect Conversion")
            .replace("{var_a}", "Deal Size")
            .replace("{var_b}", "Sales Cycle Days")
            .replace("{operational_cost}", "Cost of Acquisition")
            .replace("{transaction_volume}", "Closed Won Deals")
            .replace("{tenure_metric}", "Account Executive Tenure")
            .replace("{performance_metric}", "Revenue Closed")
            .replace("{engagement_score}", "Buyer Engagement Score")
            .replace("{expansion_revenue}", "Upsell Deal Value")
            .replace("{session_durations}", "Meeting Durations")
            .replace("{checkout_completion}", "Proposal Signoff")
            .replace("{monetary_metric}", "Deal Size (USD)")
            .replace("{usage_spikes}", "Discounting Deviations")
            .replace("{error_or_loss_metric}", "Lost Deal Disqualifications")
            .replace("{expense_line}", "Commission Payouts")
            .replace("{key_metric}", "Average Selling Price")
            .replace("{demand_metric}", "Monthly Bookings Volume")
            .replace("{performance_indicator}", "Win Rate Percentage")
            .replace("{intervention_date}", "Q3 Pricing Restructure")
            .replace("{process_metric}", "Lead-to-Opportunity Days")
            .replace("{growth_metric}", "New Opportunity Pipeline");
        } else if (ctx.includes("Marketing")) {
          qText = qText
            .replace("{tier_plan}", v === 1 ? "Paid Search Traffic" : "Influencer Campaign Leads")
            .replace("{revenue_metric}", "Customer Lifetime Value")
            .replace("{region_team}", "Campaign Channel A vs Channel B")
            .replace("{efficiency_metric}", "Customer Acquisition Cost (CAC)")
            .replace("{feature_flag}", "Interactive Landing Page")
            .replace("{negative_outcome}", "Bounce Rate")
            .replace("{demographic_segment}", "B2B Tech Cohorts")
            .replace("{basket_metric}", "First Order Value")
            .replace("{channel_source}", "Organic Search")
            .replace("{retention_metric}", "90-Day Retention")
            .replace("{predictor_spend}", "Ad Spend per Channel")
            .replace("{target_volume}", "MQL Inbound Volume")
            .replace("{discount_rate}", "Coupon Value")
            .replace("{order_size}", "Trial-to-Paid Conversion")
            .replace("{activity_metric}", "Ad Impressions Frequency")
            .replace("{long_term_outcome}", "Brand Recall & CTR")
            .replace("{pipeline_velocity}", "Click-to-Signup Speed")
            .replace("{closed_metric}", "Final Revenue per Lead")
            .replace("{response_time}", "Email Retargeting Delay")
            .replace("{satisfaction_metric}", "Open Rate")
            .replace("{var_a}", "Marketing Spend")
            .replace("{var_b}", "Attributed Revenue")
            .replace("{operational_cost}", "Ad Placement Expense")
            .replace("{transaction_volume}", "Click Volume")
            .replace("{tenure_metric}", "Audience Dwell Time")
            .replace("{performance_metric}", "Conversion Score")
            .replace("{engagement_score}", "Newsletter Read Time")
            .replace("{expansion_revenue}", "Multi-Touch Sales Value")
            .replace("{session_durations}", "Landing Page Dwell Seconds")
            .replace("{checkout_completion}", "Lead Form Submission")
            .replace("{monetary_metric}", "Cost per Acquisition")
            .replace("{usage_spikes}", "Click Fraud Outliers")
            .replace("{error_or_loss_metric}", "Ad Spend Overruns")
            .replace("{expense_line}", "Agency Retainer Fees")
            .replace("{key_metric}", "Return on Ad Spend (ROAS)")
            .replace("{demand_metric}", "Inbound Organic Traffic")
            .replace("{performance_indicator}", "Click-Through Rate (CTR)")
            .replace("{intervention_date}", "Brand Redesign Launch")
            .replace("{process_metric}", "Visitor-to-MQL Time")
            .replace("{growth_metric}", "Monthly Leads Volume");
        } else if (ctx.includes("Retention")) {
          qText = qText
            .replace("{tier_plan}", "Annual Contract Accounts")
            .replace("{revenue_metric}", "Net Revenue Retention (NRR)")
            .replace("{region_team}", "Enterprise CSM Cohort vs SMB Cohort")
            .replace("{efficiency_metric}", "Average Account Lifespan")
            .replace("{feature_flag}", "Single Sign-On (SSO)")
            .replace("{negative_outcome}", "30-Day Churn Rate")
            .replace("{demographic_segment}", "Multi-Seat Workspaces")
            .replace("{basket_metric}", "Annual Renewal Value")
            .replace("{channel_source}", "Customer Referral Leads")
            .replace("{retention_metric}", "12-Month Logo Retention")
            .replace("{predictor_spend}", "Dedicated Customer Success Hours")
            .replace("{target_volume}", "Account Health Score")
            .replace("{discount_rate}", "Renewal Discount")
            .replace("{order_size}", "License Seat Expansion")
            .replace("{activity_metric}", "Weekly Active Usage Days")
            .replace("{long_term_outcome}", "Renewal Likelihood")
            .replace("{pipeline_velocity}", "Onboarding Completion Velocity")
            .replace("{closed_metric}", "Renewal Dollar Retention")
            .replace("{response_time}", "Support Ticket First Response Time")
            .replace("{satisfaction_metric}", "Net Promoter Score")
            .replace("{var_a}", "Product Usage Hours")
            .replace("{var_b}", "Customer Churn Risk")
            .replace("{operational_cost}", "Retention Support Costs")
            .replace("{transaction_volume}", "Active Subscribers")
            .replace("{tenure_metric}", "Subscription Age in Months")
            .replace("{performance_metric}", "Expansion ARR")
            .replace("{engagement_score}", "Feature Adoption Depth")
            .replace("{expansion_revenue}", "Contract Expansion Value")
            .replace("{session_durations}", "Daily Active App Minutes")
            .replace("{checkout_completion}", "Contract Renewal Execution")
            .replace("{monetary_metric}", "Customer Lifetime Value (LTV)")
            .replace("{usage_spikes}", "Usage Dropoff Outliers")
            .replace("{error_or_loss_metric}", "Cancellation Events")
            .replace("{expense_line}", "Retention Concession Credits")
            .replace("{key_metric}", "Gross Retention Rate")
            .replace("{demand_metric}", "Monthly Churn Probability")
            .replace("{performance_indicator}", "Account Health Score Average")
            .replace("{intervention_date}", "Automated Onboarding Rollout")
            .replace("{process_metric}", "Time to Value (TTV)")
            .replace("{growth_metric}", "Net Expansion ARR");
        } else {
          // General business replacements
          qText = qText
            .replace("{tier_plan}", v === 1 ? "Premium Segment" : "Standard Segment")
            .replace("{revenue_metric}", v === 1 ? "Gross Operating Revenue" : "Average Order Value")
            .replace("{region_team}", v === 1 ? "Domestic vs International Units" : "Branch Alpha vs Branch Beta")
            .replace("{efficiency_metric}", v === 1 ? "Process Throughput Rate" : "Operating Margin")
            .replace("{feature_flag}", v === 1 ? "Automated Workflow Tooling" : "Digital Payment Gateway")
            .replace("{negative_outcome}", v === 1 ? "Transaction Error Rate" : "Customer Refund Rate")
            .replace("{demographic_segment}", v === 1 ? "High-Frequency Buyers" : "First-Time Cohort")
            .replace("{basket_metric}", v === 1 ? "Cart Basket Size" : "Total Transaction Value")
            .replace("{channel_source}", v === 1 ? "Direct Inbound" : "Affiliate Network")
            .replace("{retention_metric}", v === 1 ? "Repeat Purchase Rate" : "User Retention Duration")
            .replace("{predictor_spend}", v === 1 ? "Operational Capex" : "R&D Expenditure")
            .replace("{target_volume}", v === 1 ? "Unit Output" : "Productivity Score")
            .replace("{discount_rate}", v === 1 ? "Discount Concession" : "Promotional Markdown")
            .replace("{order_size}", v === 1 ? "Order Basket Volume" : "Deal Size")
            .replace("{activity_metric}", v === 1 ? "Weekly Logins" : "System Activity Rate")
            .replace("{long_term_outcome}", v === 1 ? "Customer Lifetime Value" : "Annual Account Spend")
            .replace("{pipeline_velocity}", v === 1 ? "Fulfillment Speed" : "Queue Clearance Days")
            .replace("{closed_metric}", v === 1 ? "Total Closed Volume" : "Completed Transactions")
            .replace("{response_time}", v === 1 ? "Service Response Latency" : "Queue Waiting Time")
            .replace("{satisfaction_metric}", v === 1 ? "Customer CSAT Score" : "Net Satisfaction")
            .replace("{var_a}", v === 1 ? "Marketing Expenditure" : "Staffing Headcount")
            .replace("{var_b}", v === 1 ? "Quarterly Sales" : "Output Productivity")
            .replace("{operational_cost}", v === 1 ? "Logistics Overhead" : "Facility Energy Cost")
            .replace("{transaction_volume}", v === 1 ? "Total Shipment Volume" : "Processing Output")
            .replace("{tenure_metric}", v === 1 ? "Tenure in Months" : "Experience Level")
            .replace("{performance_metric}", v === 1 ? "Productivity Score" : "Annual Output")
            .replace("{engagement_score}", v === 1 ? "User Engagement Score" : "Platform Usage Index")
            .replace("{expansion_revenue}", v === 1 ? "Account Expansion Revenue" : "Cross-Sell Value")
            .replace("{session_durations}", v === 1 ? "Session Duration" : "Application Dwell Time")
            .replace("{checkout_completion}", v === 1 ? "Checkout Completion Rate" : "Transaction Settlement")
            .replace("{monetary_metric}", v === 1 ? "Transaction Unit Cost" : "Order Value (USD)")
            .replace("{usage_spikes}", v === 1 ? "Transaction Velocity Spikes" : "Unusual Latency Spikes")
            .replace("{error_or_loss_metric}", v === 1 ? "Refund / Return Incidents" : "Processing Faults")
            .replace("{expense_line}", v === 1 ? "Vendor Contract Outlays" : "Third-Party Logistics")
            .replace("{key_metric}", v === 1 ? "Gross Margin Rate" : "Operating Margin")
            .replace("{demand_metric}", v === 1 ? "Weekly Order Demand" : "Service Inflow Volume")
            .replace("{performance_indicator}", v === 1 ? "Overall Equipment Efficiency (OEE)" : "Service SLA Adherence")
            .replace("{intervention_date}", v === 1 ? "System Upgrade Launch" : "Policy Revision Date")
            .replace("{process_metric}", v === 1 ? "Order-to-Fulfillment Hours" : "Invoice Clearance Days")
            .replace("{growth_metric}", v === 1 ? "Monthly Active Units" : "Quarterly Organic Growth");
        }

        const qId = `Q_${String(idCounter++).padStart(3, "0")}`;
        questions.push({
          id: qId,
          question: qText,
          business_context: ctx,
          statistical_concept: tmpl.concept,
          intent: tmpl.intent,
          required_data_types: tmpl.types,
          outcome_candidates: pat.out,
          predictor_candidates: pat.pred,
          time_dimension_candidates: tmpl.concept === "Time Series & Trends" ? ["date", "month", "timestamp"] : [],
          suggested_test: tmpl.test,
          requested_experiences: tmpl.exps,
        });
      }
    }
  }
}

// Ensure exactly 500 questions
const finalQuestions = questions.slice(0, 500);

const outputDir = path.resolve("./backend/data");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, "question_registry.json"),
  JSON.stringify(finalQuestions, null, 2)
);

console.log(`Successfully generated structured backend registry with ${finalQuestions.length} questions in backend/data/question_registry.json`);
