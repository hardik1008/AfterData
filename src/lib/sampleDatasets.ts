import { DatasetProfile } from "../types/dataset";
import { profileDataset } from "./profilingEngine";

function generateSaaSRecords(): Record<string, any>[] {
  const tiers = ["Starter", "Professional", "Enterprise"];
  const records = [];

  for (let i = 1; i <= 240; i++) {
    const tier = tiers[i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0];
    const isEnterprise = tier === "Enterprise";
    const isStarter = tier === "Starter";

    const baseSpend = isEnterprise ? 850 : isStarter ? 89 : 249;
    let monthlySpend = Math.round(baseSpend + (Math.sin(i * 13) * 0.2 + 0.9) * (isEnterprise ? 350 : 40));
    // Introduce 3 intentional outliers
    if (i === 17) monthlySpend = 4200;
    if (i === 83) monthlySpend = 3850;

    let usageHours = Math.round((isEnterprise ? 75 : isStarter ? 18 : 42) + (Math.cos(i * 7) * 0.3 + 0.8) * 12);
    // Intentionally inject a small missing value
    const supportTickets = i % 29 === 0 ? null : Math.max(0, Math.round((isStarter ? 3.8 : 1.4) + Math.sin(i * 5) * 1.5));
    const nps = Math.min(10, Math.max(1, Math.round((isEnterprise ? 8.8 : isStarter ? 6.2 : 7.6) + Math.cos(i * 9))));
    const churnProb = isStarter ? 0.28 : isEnterprise ? 0.05 : 0.14;
    const isChurned = (i * 17) % 100 < churnProb * 100;

    // Dates across 2025-2026, with an incomplete partial period in March 2026
    const monthOffset = Math.floor(i / 35); // 0 to 6 months
    const dateStr = `2025-${String(9 + (monthOffset % 4)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`;

    records.push({
      Customer_ID: `CUST-${1000 + i}`,
      Plan_Tier: i === 45 ? "starter" : tier, // subtle casing variant on 1 record to demonstrate detection
      Monthly_Spend: monthlySpend,
      Usage_Hours: usageHours,
      Support_Tickets: supportTickets,
      Net_Promoter_Score: nps,
      Status: isChurned ? "Churned" : "Active",
      Signup_Date: dateStr,
    });
  }

  // Inject 2 exact duplicate rows to test duplicate detection
  records.push({ ...records[12] });
  records.push({ ...records[48] });

  return records;
}

function generateEcommerceRecords(): Record<string, any>[] {
  const devices = ["Mobile", "Desktop", "Tablet"];
  const ageGroups = ["18-24", "25-34", "35-50", "50+"];
  const discounts = ["Discounted", "Full Price"];
  const records = [];

  for (let i = 1; i <= 220; i++) {
    const hasDiscount = i % 2 === 0;
    const discountLabel = hasDiscount ? "Discounted" : "Full Price";
    const device = devices[i % 3];
    const ageGroup = ageGroups[i % 4];

    const baseBasket = hasDiscount ? 94 : 68;
    const basketValue = Math.round(baseBasket + (Math.sin(i * 19) * 0.3 + 0.9) * 32);
    const itemsCount = Math.max(1, Math.round((hasDiscount ? 3.9 : 2.2) + Math.cos(i * 11)));
    const discountAmount = hasDiscount ? Math.round(basketValue * 0.2) : 0; // Natural numerator/denominator pair
    const repeatBuyer = (i * 23) % 100 < 45 ? "Repeat" : "First Time";

    records.push({
      Order_ID: `ORD-${5000 + i}`,
      Promotion_Type: discountLabel,
      Basket_Value_USD: basketValue,
      Discount_USD: discountAmount,
      Items_Count: itemsCount,
      Customer_Age_Group: ageGroup,
      Device_Type: device,
      Customer_Type: repeatBuyer,
    });
  }
  return records;
}

function generateB2BSalesRecords(): Record<string, any>[] {
  const sources = ["Inbound Organic", "Outbound Cold", "Partner Referral"];
  const industries = ["Fintech", "Healthcare", "Manufacturing", "Retail Tech"];
  const records = [];

  for (let i = 1; i <= 200; i++) {
    const source = sources[i % 3];
    const industry = industries[i % 4];
    const isReferral = source === "Partner Referral";

    const salesCycleDays = Math.round((isReferral ? 42 : 78) + (Math.sin(i * 11) * 0.2 + 0.9) * 22);
    const dealSizeUSD = Math.round((isReferral ? 62000 : 38000) + (Math.cos(i * 17) * 0.4 + 0.8) * 18000);
    const teamSize = Math.max(5, Math.round(45 + Math.sin(i * 7) * 30));
    const winRate = isReferral ? 0.65 : 0.32;
    const dealOutcome = (i * 29) % 100 < winRate * 100 ? "Closed Won" : "Closed Lost";

    records.push({
      Deal_ID: `DEAL-${8000 + i}`,
      Lead_Source: source,
      Industry: industry,
      Sales_Cycle_Days: salesCycleDays,
      Deal_Size_USD: dealSizeUSD,
      Team_Size: teamSize,
      Deal_Outcome: dealOutcome,
    });
  }
  return records;
}

function generateAxisMaxLifeRecords(): Record<string, any>[] {
  const records = [];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const campaigns = ["Brand Search", "Performance Digital", "Social Direct", "Remarketing"];

  // 84 consecutive calendar days: Jan 1, 2024 to Mar 24, 2024 (12 full weeks)
  // Day 1 to 42: Pre-launch
  // Day 43 to 84: Post-launch
  for (let i = 1; i <= 84; i++) {
    const isPostLaunch = i >= 43;
    const dayOfWeek = daysOfWeek[(i - 1) % 7];
    const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";

    // Date string YYYY-MM-DD
    const d = new Date(2024, 0, i);
    const dateStr = d.toISOString().split("T")[0];

    // Holiday flag with subtle formatting inconsistency (Prompt Part 6: day 15 has "True", day 40 has "1")
    let isHoliday: any = (i === 1 || i === 26 || i === 68) ? 1 : 0;
    if (i === 15) isHoliday = "True";
    if (i === 40) isHoliday = "1";

    const promoActive = (i >= 20 && i <= 25) || (i >= 60 && i <= 66) ? 1 : 0;
    const campaign = campaigns[i % campaigns.length];

    // Website activity
    const webVisitsBase = isWeekend ? 14000 : 18500;
    const website_visits = Math.round(webVisitsBase + Math.sin(i * 0.4) * 2200 + (promoActive ? 2500 : 0));
    const webConvRate = isWeekend ? 0.021 : 0.019;
    const website_conversions = Math.round(website_visits * webConvRate);
    const webAvgPolicy = 680 + Math.round(Math.cos(i * 0.3) * 45);
    const website_revenue = Math.round(website_conversions * webAvgPolicy);
    const avg_policy_value_website = Number((website_revenue / website_conversions).toFixed(1));

    // App activity (0 volume during pre-launch, active post-launch)
    let app_visits = 0;
    let app_conversions = 0;
    let app_revenue = 0;
    let avg_policy_value_app: number | null = null; // Strictly null pre-launch (Prompt Part 6: ~50% missing, never fill with 0)
    let app_downloads = 0;
    let active_app_users = 0;
    let app_session_duration_avg: number | null = null;
    let app_crashes = 0;
    let marketing_spend_app = 0;

    if (isPostLaunch) {
      const daysSinceLaunch = i - 42;
      const rampFactor = Math.min(1.0, 0.4 + daysSinceLaunch * 0.02);
      app_downloads = Math.round((350 + Math.sin(i * 0.8) * 90) * rampFactor);
      active_app_users = Math.round(1800 + daysSinceLaunch * 95 + Math.cos(i * 0.5) * 250);
      app_visits = Math.round(active_app_users * (isWeekend ? 1.4 : 1.15));
      const appConvRate = 0.024 + (promoActive ? 0.005 : 0);
      app_conversions = Math.round(app_visits * appConvRate);
      const appAvgPolicy = 740 + Math.round(Math.sin(i * 0.5) * 35);
      app_revenue = Math.round(app_conversions * appAvgPolicy);
      avg_policy_value_app = Number((app_revenue / app_conversions).toFixed(1));
      app_session_duration_avg = Number((5.4 + Math.sin(i * 0.6) * 0.8).toFixed(2));
      app_crashes = Math.max(0, Math.round(4 + Math.cos(i * 0.9) * 3));
      marketing_spend_app = Math.round(14000 + Math.sin(i * 0.5) * 3000);
    }

    const total_visits = website_visits + app_visits;
    const total_conversions = website_conversions + app_conversions;

    // Total revenue reconciliation: Prompt Part 6: Validate whether total_revenue actually equals website + app revenue
    // On 6 specific days, total_revenue includes offline agent / partner policies ($850 to $2,100 discrepancy)
    let offlineDiscrepancy = 0;
    if (i === 18 || i === 34 || i === 47 || i === 59 || i === 71 || i === 82) {
      offlineDiscrepancy = 850 + (i * 25);
    }
    const total_revenue = website_revenue + app_revenue + offlineDiscrepancy;

    const marketing_spend_website = Math.round(22000 + (promoActive ? 6000 : 0) + Math.cos(i * 0.4) * 2500);

    records.push({
      date: dateStr,
      day_of_week: dayOfWeek,
      is_holiday: isHoliday,
      promo_active: promoActive,
      website_visits,
      app_visits,
      total_visits,
      website_conversions,
      app_conversions,
      total_conversions,
      website_revenue,
      app_revenue,
      total_revenue,
      avg_policy_value_website,
      avg_policy_value_app,
      app_downloads,
      active_app_users,
      app_session_duration_avg,
      app_crashes,
      marketing_spend_website,
      marketing_spend_app,
      campaign_type: campaign,
    });
  }

  return records;
}

export function getSampleDataset(type: "axis" | "saas" | "ecommerce" | "b2b"): DatasetProfile {
  let filename = "";
  let records: Record<string, any>[] = [];
  let availableSheets: string[] = [];

  if (type === "axis") {
    filename = "axis_max_life_app_launch_eval_2024.csv";
    records = generateAxisMaxLifeRecords();
    availableSheets = ["Daily_Performance", "Channel_Summary"];
  } else if (type === "saas") {
    filename = "saas_subscription_churn_2026.csv";
    records = generateSaaSRecords();
    availableSheets = ["Subscriptions_Main", "Churn_Events_Q1"];
  } else if (type === "ecommerce") {
    filename = "ecommerce_basket_promotions_2026.xlsx";
    records = generateEcommerceRecords();
    availableSheets = ["Orders", "Promotions_Lookup"];
  } else {
    filename = "b2b_sales_velocity_pipeline.csv";
    records = generateB2BSalesRecords();
    availableSheets = ["Deals_Pipeline"];
  }

  return profileDataset(records, {
    datasetId: `sample_${type}`,
    filename,
    fileSize: records.length * 110,
    sheetName: availableSheets[0],
    availableSheets,
  });
}
