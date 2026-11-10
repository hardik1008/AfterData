/**
 * CLI Runner for Part 10 Adversarial Benchmark
 * Run via: npx tsx scripts/run_adversarial_benchmark.ts
 */
import { runAdversarialBenchmark } from "../src/lib/adversarialBenchmark";

console.log("================================================================================");
console.log("AFTERDATA — PART 10 ADVERSARIAL TEST SUITE BENCHMARK");
console.log("Benchmark Dataset: Axis Max Life Daily Performance (84 records, 22 variables)");
console.log("================================================================================\n");

const report = runAdversarialBenchmark();

console.log(`Executed: ${report.totalTests} tests`);
console.log(`Passed:   ${report.passedTests} tests`);
console.log(`Failed:   ${report.failedTests} tests`);
console.log(`Pass Rate: ${report.passRate}%\n`);

const categories = [
  "Valid business questions",
  "Irrelevant questions",
  "Gibberish and adversarial questions",
  "Unsupported questions",
] as const;

for (const cat of categories) {
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`CATEGORY: ${cat.toUpperCase()}`);
  console.log(`--------------------------------------------------------------------------------`);
  const testsInCat = report.tests.filter((t) => t.category === cat);

  for (const t of testsInCat) {
    const statusIcon = t.passedValidation ? "✓ PASS" : "✗ FAIL";
    const execPermitted = t.statisticalExecutionPermitted ? "YES (Calculations Permitted)" : "NO (Calculations Blocked)";
    console.log(`[${statusIcon}] [${t.id}] "${t.originalQuestion}"`);
    console.log(`        Classification: ${t.questionClassification}`);
    console.log(`        Execution Permitted: ${execPermitted}`);
    console.log(`        Mapped Columns: ${t.mappedColumns.length > 0 ? t.mappedColumns.join(", ") : "None"}`);
    console.log(`        Selected Methods: ${t.selectedMethods.length > 0 ? t.selectedMethods.join(", ") : "None"}`);
    if (t.rejectedMethods.length > 0) {
      console.log(`        Rejected Methods: ${t.rejectedMethods.slice(0, 2).join("; ")}`);
    }
    if (t.causalityDistinction) {
      console.log(`        Causality Distinction: ${t.causalityDistinction.explanation}`);
    }
    console.log(`        Response: ${t.finalResponse.slice(0, 100)}...`);
    console.log("");
  }
}

console.log("================================================================================");
if (report.failedTests === 0) {
  console.log("BENCHMARK RESULT: 100% PASSED (All 28 adversarial tests passed strict criteria)");
} else {
  console.error(`BENCHMARK RESULT: FAILED with ${report.failedTests} failing tests.`);
  process.exit(1);
}
console.log("================================================================================");
