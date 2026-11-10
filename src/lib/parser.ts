import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DatasetProfile } from "../types/dataset";
import { profileDataset } from "./profilingEngine";

export interface ParseResult {
  success: boolean;
  profile?: DatasetProfile;
  error?: string;
  allSheets?: { name: string; records: Record<string, any>[] }[];
}

export async function parseFileWithProfiling(
  file: File,
  targetSheetName?: string
): Promise<ParseResult> {
  const filename = file.name;
  const fileSize = file.size;

  // Max 50MB
  if (fileSize > 50 * 1024 * 1024) {
    return {
      success: false,
      error: "File exceeds the 50MB limit. Please upload a smaller dataset.",
    };
  }

  const isCSV = filename.toLowerCase().endsWith(".csv");
  const isExcel =
    filename.toLowerCase().endsWith(".xlsx") || filename.toLowerCase().endsWith(".xls");

  if (!isCSV && !isExcel) {
    return {
      success: false,
      error: "Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file.",
    };
  }

  try {
    let records: Record<string, any>[] = [];
    let availableSheets: string[] = [];
    let selectedSheetName: string | undefined = undefined;

    if (isCSV) {
      const text = await file.text();
      const parseOutput = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: "greedy",
      });

      if (parseOutput.errors && parseOutput.errors.length > 0 && parseOutput.data.length === 0) {
        return {
          success: false,
          error: `CSV parsing failed: ${parseOutput.errors[0].message}`,
        };
      }

      records = parseOutput.data as Record<string, any>[];
      availableSheets = ["CSV Data"];
      selectedSheetName = "CSV Data";
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      availableSheets = workbook.SheetNames || [];

      if (availableSheets.length === 0) {
        return { success: false, error: "The Excel file contains no readable worksheets." };
      }

      selectedSheetName =
        targetSheetName && availableSheets.includes(targetSheetName)
          ? targetSheetName
          : availableSheets[0];

      const sheet = workbook.Sheets[selectedSheetName];
      records = XLSX.utils.sheet_to_json(sheet, { defval: null });
    }

    if (!records || records.length === 0) {
      return { success: false, error: "The selected worksheet contains no data rows." };
    }

    const rawKeys = Object.keys(records[0] || {}).filter(
      (k) => k && !k.startsWith("__EMPTY") && k.trim().length > 0
    );

    if (rawKeys.length < 2) {
      return {
        success: false,
        error: "Dataset must contain at least 2 distinct columns for statistical profiling and investigation.",
      };
    }

    // Run deterministic profiling engine
    const profile = profileDataset(records, {
      filename,
      fileSize,
      sheetName: selectedSheetName,
      availableSheets,
    });

    return {
      success: true,
      profile,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to read dataset: ${err.message || "Unknown file read error"}`,
    };
  }
}

// Function to re-parse a specific sheet from an existing workbook File
export async function parseExcelSheet(file: File, sheetName: string): Promise<ParseResult> {
  return parseFileWithProfiling(file, sheetName);
}
