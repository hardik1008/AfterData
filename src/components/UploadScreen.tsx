import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DatasetProfile } from "../types/dataset";
import { parseFileWithProfiling } from "../lib/parser";
import { getSampleDataset } from "../lib/sampleDatasets";
import { DatasetProfileScreen } from "./DatasetProfileScreen";
import { UploadIngestionAnimation } from "./UploadIngestionAnimation";

interface UploadScreenProps {
  currentProfile: DatasetProfile | null;
  onDatasetParsed: (profile: DatasetProfile, rawFile?: File) => void;
  onProceedToQuestions: () => void;
  onReplaceDataset: () => void;
  rawUploadedFile?: File | null;
  onSelectQuestion?: (
    questionText: string,
    suggestedTest?: string,
    targetVar?: string,
    groupVar?: string
  ) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  currentProfile,
  onDatasetParsed,
  onProceedToQuestions,
  onReplaceDataset,
  rawUploadedFile,
  onSelectQuestion,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setProgressPercent(15);
    setProgressStage("Reading file stream and identifying worksheets...");

    setTimeout(async () => {
      setProgressPercent(40);
      setProgressStage("Inferring column data types and temporal ranges...");

      setTimeout(async () => {
        setProgressPercent(75);
        setProgressStage("Auditing duplicates, Tukey outliers, missing rates & granularity...");

        const result = await parseFileWithProfiling(file);

        setTimeout(() => {
          setIsProcessing(false);
          if (result.success && result.profile) {
            setProgressPercent(100);
            onDatasetParsed(result.profile, file);
          } else {
            setErrorMessage(result.error || "Failed to process the uploaded file.");
          }
        }, 300);
      }, 250);
    }, 200);
  };

  const handleSelectSheet = async (sheetName: string) => {
    if (rawUploadedFile) {
      setIsProcessing(true);
      setProgressStage(`Switching to worksheet "${sheetName}" and profiling...`);
      const result = await parseFileWithProfiling(rawUploadedFile, sheetName);
      setIsProcessing(false);
      if (result.success && result.profile) {
        onDatasetParsed(result.profile, rawUploadedFile);
      }
    } else if (currentProfile?.datasetId.startsWith("sample_")) {
      // Sample dataset sheet switch simulation
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        const updated = {
          ...currentProfile,
          sheetName,
        };
        onDatasetParsed(updated);
      }, 200);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  // If a profile exists, show the full Dataset Profile Screen
  if (currentProfile) {
    return (
      <DatasetProfileScreen
        profile={currentProfile}
        onProceedToQuestions={onProceedToQuestions}
        onReplaceDataset={onReplaceDataset}
        onSelectSheet={handleSelectSheet}
        onSelectQuestion={onSelectQuestion}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-200">
      {/* Header Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Upload your dataset
        </h1>
        <p className="text-sm text-neutral-500">
          Upload an Excel (.xlsx, .xls) or CSV file. The deterministic profiling engine will audit data types, outliers, missingness, granularity, and rate pairs without modifying your data.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-neutral-900 bg-neutral-50 scale-[0.99]"
              : "border-neutral-300 hover:border-neutral-400 bg-white"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-700">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-900">
                Drop your CSV or Excel file here, or click to browse
              </p>
              <p className="text-xs text-neutral-500">
                Supports .csv, .xlsx, and .xls files up to 50MB
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-400 font-mono">
              <span>All worksheets detected</span>
              <span aria-hidden="true">·</span>
              <span>Zero data mutation</span>
              <span aria-hidden="true">·</span>
              <span>Deterministic profiling</span>
            </div>
          </div>
        </div>

        {/* Quick-load sample data banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs gap-3">
          <span className="text-neutral-600">
            Need to test right away without an uploaded file?
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onDatasetParsed(getSampleDataset("axis"))}
              className="px-2.5 py-1 font-semibold bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Load Axis Max Life
            </button>
            <button
              onClick={() => onDatasetParsed(getSampleDataset("saas"))}
              className="px-2.5 py-1 font-medium bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Load SaaS Data
            </button>
            <button
              onClick={() => onDatasetParsed(getSampleDataset("ecommerce"))}
              className="px-2.5 py-1 font-medium bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Load E-Commerce
            </button>
            <button
              onClick={() => onDatasetParsed(getSampleDataset("b2b"))}
              className="px-2.5 py-1 font-medium bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Load B2B Sales
            </button>
          </div>
        </div>
      </div>

      {/* Progress Animation State */}
      <AnimatePresence>
        {isProcessing && (
          <UploadIngestionAnimation
            progressPercent={progressPercent}
            progressStage={progressStage}
          />
        )}
      </AnimatePresence>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
