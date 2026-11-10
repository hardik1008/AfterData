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
  const records: Record<string, any>[] = [];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const campaigns = ["Brand Search", "Performance Digital", "Social Direct", "Remarketing", "Organic Lead"];

  // 120 consecutive calendar days: Jan 1, 2025 to Apr 30, 2025 (Prompt Section 13 Benchmark)
  // App launch date: 2 March 2025 (Day 61)
  // Source workbook contains 5,000 transaction/session records with multiple records per date
  const totalDays = 120;
  const launchDayIndex = 61; // 2025-03-02
  let globalRecordId = 10001;

  for (let day = 1; day <= totalDays; day++) {
    // Jan 1 = day 1. 2025 non-leap year: Jan 31, Feb 28, Mar 31, Apr 30
    let month = 1;
    let dayOfMonth = day;
    if (dayOfMonth > 31) {
      month = 2;
      dayOfMonth -= 31;
      if (dayOfMonth > 28) {
        month = 3;
        dayOfMonth -= 28;
        if (dayOfMonth > 31) {
          month = 4;
          dayOfMonth -= 31;
        }
      }
    }

    const dateStr = `2025-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;
    const dayOfWeek = daysOfWeek[(day - 1) % 7];
    const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";
    const isPostLaunch = day >= launchDayIndex;

    // Final day (Apr 30, day 120) has partial volume (14 records) to test incomplete period audit
    const dailyCount = day === totalDays ? 14 : (day % 3 === 0 ? 43 : (day % 2 === 0 ? 41 : 42));

    // Holiday formatting inconsistency check across records on the same date (Jan 26, Mar 14)
    const isHolidayDate = day === 26 || day === 73;

    const promoActive = (day >= 20 && day <= 25) || (day >= 85 && day <= 92) ? 1 : 0;
    const baseDailyWebSpend = isWeekend ? 18000 : 24000;
    const marketing_spend_website = Math.round(baseDailyWebSpend + Math.sin(day * 0.4) * 3000 + (promoActive ? 5000 : 0));
    const marketing_spend_app = isPostLaunch ? Math.round(14000 + Math.cos(day * 0.5) * 2500) : 0;

    for (let r = 0; r < dailyCount; r++) {
      if (records.length >= 5000) break;

      // Inconsistent holiday indicator formatting on identical date (Prompt Section 13)
      let isHolidayVal: any = 0;
      if (isHolidayDate) {
        if (r % 3 === 0) isHolidayVal = "True";
        else if (r % 2 === 0) isHolidayVal = 1;
        else isHolidayVal = 0;
      }

      // Channel allocation
      const channel = !isPostLaunch ? "website" : (r % 2 === 0 ? "app" : "website");
      const isApp = channel === "app";

      const sessionDuration = Number((isApp ? (5.2 + Math.sin(r) * 1.5) : (3.4 + Math.cos(r) * 0.9)).toFixed(1));
      const converted = (r * 17 + day * 7) % 100 < (isApp ? (isWeekend ? 24 : 21) : (isWeekend ? 19 : 17)) ? 1 : 0;
      const policyValue = converted ? Math.round((isApp ? 760 : 690) + Math.sin(r + day) * 80) : 0;

      // Daily prorated traffic metrics
      const webVisits = Math.round((isWeekend ? 14000 : 18500) / dailyCount);
      const appVisits = isPostLaunch ? Math.round((isWeekend ? 16000 : 12500) / dailyCount) : 0;

      records.push({
        transaction_id: `TXN-${globalRecordId++}`,
        date: dateStr,
        day_of_week: dayOfWeek,
        is_holiday: isHolidayVal,
        promo_active: promoActive,
        channel,
        post_launch: isPostLaunch ? 1 : 0,
        session_duration_minutes: sessionDuration,
        conversions: converted,
        policy_amount_inr: policyValue,
        website_visits: webVisits,
        app_visits: appVisits,
        total_visits: webVisits + appVisits,
        website_conversions: !isApp && converted ? 1 : 0,
        app_conversions: isApp && converted ? 1 : 0,
        total_conversions: converted,
        website_revenue: !isApp ? policyValue : 0,
        app_revenue: isApp ? policyValue : 0,
        total_revenue: policyValue,
        marketing_spend_website: Math.round(marketing_spend_website / dailyCount),
        marketing_spend_app: Math.round(marketing_spend_app / dailyCount),
        campaign_type: campaigns[(r + day) % campaigns.length],
      });
    }
  }

  // Pad to exact 5,000 records if needed
  while (records.length < 5000) {
    const copy = { ...records[records.length - 1], transaction_id: `TXN-${globalRecordId++}` };
    records.push(copy);
  }

  return records.slice(0, 5000);
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
