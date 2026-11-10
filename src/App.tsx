import React, { useState } from "react";
import { Header } from "./components/Header";
import { LandingScreen } from "./components/LandingScreen";
import { UploadScreen } from "./components/UploadScreen";
import { QuestionScreen } from "./components/QuestionScreen";
import { CapabilityDiscoveryScreen } from "./components/CapabilityDiscoveryScreen";
import { InvestigationScreen } from "./components/InvestigationScreen";
import { ArchitectureModal } from "./components/ArchitectureModal";
import { AdversarialBenchmarkModal } from "./components/AdversarialBenchmarkModal";
import { OneDayChallengeScreen } from "./components/OneDayChallengeScreen";
import {
  CapabilityDiscoveryResult,
  DatasetProfile,
  DiscoveredInvestigation,
} from "./types/dataset";
import { Sparkles } from "lucide-react";

type ScreenState = "landing" | "upload" | "question" | "discovery" | "investigation" | "one_day_challenge";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("landing");
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isAdversarialBenchmarkOpen, setIsAdversarialBenchmarkOpen] = useState(false);

  // Active question state
  const [activeQuestion, setActiveQuestion] = useState<{
    text: string;
    test?: string;
    targetVar?: string;
    groupVar?: string;
  } | null>(null);

  // Capability Discovery state
  const [discoveryResult, setDiscoveryResult] = useState<CapabilityDiscoveryResult | null>(null);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);

  // Multi-Turn Contextual Investigation History (Part 9 AI-Native Context)
  const [investigationHistory, setInvestigationHistory] = useState<
    Array<{
      question: string;
      oneLineAnswer?: string;
      testUsed?: string;
      targetVar?: string;
      groupVar?: string;
      pValue?: number;
      effectSize?: number | null;
      timestamp: string;
    }>
  >([]);

  // AI Engine Status (Transparency & Degradation Handling)
  const [aiStatus, setAiStatus] = useState<{
    isAvailable: boolean;
    model: string;
    engine: string;
    capabilities: string[];
    notice?: string;
  } | null>(null);

  React.useEffect(() => {
    fetch("/api/ai-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAiStatus(data);
      })
      .catch(() => {
        setAiStatus({
          isAvailable: false,
          model: "none",
          engine: "Deterministic Statistical Engine",
          capabilities: ["Deterministic Math", "Strict Data Validation", "Provenance Ledger"],
          notice: "Gemini AI offline. Deterministic statistical engine fully active.",
        });
      });
  }, []);

  const handleStart = () => {
    setCurrentScreen("upload");
  };

  const handleDatasetParsed = (newProfile: DatasetProfile, file?: File) => {
    setProfile(newProfile);
    if (file) setRawFile(file);
    setCurrentScreen("upload"); // Shows the rich Dataset Profile Screen
  };

  // Triggered when user selects a question to investigate
  const handleSelectQuestion = async (
    questionText: string,
    suggestedTest?: string,
    targetVar?: string,
    groupVar?: string
  ) => {
    setActiveQuestion({
      text: questionText,
      test: suggestedTest,
      targetVar,
      groupVar,
    });

    if (!profile) return;

    setIsLoadingDiscovery(true);
    setCurrentScreen("discovery");

    try {
      const res = await fetch("/api/relevance-and-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          conversationHistory: investigationHistory,
          dataset: {
            filename: profile.filename,
            rowCount: profile.rowCount,
            columns: profile.columns,
            granularity: profile.granularity,
            dataQualityIssues: profile.dataQualityIssues,
          },
        }),
      });

      const data = await res.json();
      setDiscoveryResult(data);
    } catch (err) {
      console.error("Relevance and discovery error:", err);
    } finally {
      setIsLoadingDiscovery(false);
    }
  };

  // Triggered when user picks an ambiguous clarification option
  const handleSelectClarification = (clarifiedQuestion: string) => {
    handleSelectQuestion(clarifiedQuestion);
  };

  // Triggered from CapabilityDiscoveryScreen to run selected investigations
  const handleProceedToExecution = (selectedList: DiscoveredInvestigation[]) => {
    if (selectedList.length === 0) return;
    const primary = selectedList[0];
    setActiveQuestion({
      text: primary.title,
      test: primary.candidateMethods[0] || "Welch Two-Sample t-test",
      targetVar: primary.requiredVariables[0],
      groupVar: primary.requiredVariables[1],
    });
    setCurrentScreen("investigation");
  };

  const handleInvestigationCompleted = (item: {
    question: string;
    oneLineAnswer?: string;
    testUsed?: string;
    targetVar?: string;
    groupVar?: string;
    pValue?: number;
    effectSize?: number | null;
    timestamp: string;
  }) => {
    setInvestigationHistory((prev) => {
      const filtered = prev.filter((h) => h.question !== item.question);
      return [...filtered, item].slice(-8);
    });
  };

  const handleReset = () => {
    setProfile(null);
    setRawFile(null);
    setActiveQuestion(null);
    setDiscoveryResult(null);
    setInvestigationHistory([]);
    setCurrentScreen("upload");
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white flex flex-col font-sans">
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        dataset={profile}
        onReset={handleReset}
        aiStatus={aiStatus}
        onOpenBenchmark={() => setIsAdversarialBenchmarkOpen(true)}
        onOpenOneDayChallenge={() => setCurrentScreen("one_day_challenge")}
      />

      <main className="flex-1">
        {currentScreen === "landing" && (
          <LandingScreen
            onStart={handleStart}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
            onOpenBenchmark={() => setIsAdversarialBenchmarkOpen(true)}
            onOpenOneDayChallenge={() => setCurrentScreen("one_day_challenge")}
          />
        )}

        {currentScreen === "upload" && (
          <UploadScreen
            currentProfile={profile}
            onDatasetParsed={handleDatasetParsed}
            onProceedToQuestions={() => setCurrentScreen("question")}
            onReplaceDataset={handleReset}
            rawUploadedFile={rawFile}
            onSelectQuestion={handleSelectQuestion}
          />
        )}

        {currentScreen === "question" && profile && (
          <QuestionScreen
            dataset={profile}
            onSelectQuestion={handleSelectQuestion}
            onBackToUpload={() => setCurrentScreen("upload")}
            onOpenOneDayChallenge={() => setCurrentScreen("one_day_challenge")}
          />
        )}

        {currentScreen === "discovery" && profile && (
          isLoadingDiscovery ? (
            <div className="max-w-3xl mx-auto px-6 py-24 text-center space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-700 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Evaluating Question Relevance &amp; Discovering Capabilities...
                </h3>
                <p className="text-xs text-neutral-500">
                  Auditing variable availability, sample power, and mapping eligible investigation pathways
                </p>
              </div>
            </div>
          ) : discoveryResult ? (
            <CapabilityDiscoveryScreen
              discoveryResult={discoveryResult}
              dataset={profile}
              onProceedToExecution={handleProceedToExecution}
              onBackToEditQuestion={() => setCurrentScreen("question")}
              onSelectClarificationQuestion={handleSelectClarification}
            />
          ) : null
        )}

        {currentScreen === "investigation" && profile && activeQuestion && (
          <InvestigationScreen
            dataset={profile}
            question={activeQuestion.text}
            suggestedTest={activeQuestion.test}
            targetVar={activeQuestion.targetVar}
            groupVar={activeQuestion.groupVar}
            investigationHistory={investigationHistory}
            onInvestigationCompleted={handleInvestigationCompleted}
            aiStatus={aiStatus}
            onBackToQuestions={() => setCurrentScreen("question")}
            onResetDataset={handleReset}
            onSelectFollowUpQuestion={handleSelectQuestion}
          />
        )}

        {currentScreen === "one_day_challenge" && (
          <OneDayChallengeScreen
            dataset={profile}
            onBack={() => {
              if (profile) setCurrentScreen("question");
              else setCurrentScreen("landing");
            }}
            onSelectQuestion={handleSelectQuestion}
          />
        )}
      </main>

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <AdversarialBenchmarkModal
        isOpen={isAdversarialBenchmarkOpen}
        onClose={() => setIsAdversarialBenchmarkOpen(false)}
        dataset={profile}
      />
    </div>
  );
}
