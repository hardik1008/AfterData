import fs from "fs";
import * as XLSX from "xlsx";

const jsonPath = "./backend/data/question_registry.json";
const questions = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

// Format columns for the 500_Questions sheet
const sheetRows = questions.map((q: any) => ({
  Question_ID: q.id,
  Question: q.question,
  Business_Context: q.business_context,
  Statistical_Concept: q.statistical_concept,
  Analytical_Intent: q.intent,
  Candidate_Outcomes: q.outcome_candidates.join(", "),
  Candidate_Predictors: q.predictor_candidates.join(", "),
  Suggested_Statistical_Test: q.suggested_test,
  Requested_Experiences: q.requested_experiences.join(", "),
}));

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(sheetRows);
XLSX.utils.book_append_sheet(workbook, worksheet, "500_Questions");

XLSX.writeFile(workbook, "./AFTERDATA_500_Question_Library_and_Engine_Spec.xlsx");
console.log("Successfully created AFTERDATA_500_Question_Library_and_Engine_Spec.xlsx with sheet '500_Questions'");
