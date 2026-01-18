"use client";

import { useEffect, useRef, useState } from "react";

import UploadCard from "@/app/components/UploadCard";
import InterviewHeader from "@/app/components/InterviewHeader";
import TimerBadge from "@/app/components/TimerBadge";
import ReportCard from "@/app/components/ReportCard";

type Project = {
  name: string;
  tech?: string[];
  description?: string;
};

type Evaluation = {
  question: string;
  answer: string;
  score: "Strong" | "Medium" | "Weak";
  reasoning: string;
  projectName?: string;
};

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);

  const [question, setQuestion] = useState("");
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const recognitionRef = useRef<any>(null);

  // Timer (160s)
  const [timeLeft, setTimeLeft] = useState(160);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Flow limits
  const [maxQuestionsPerProject, setMaxQuestionsPerProject] = useState(3);
  const [questionCountForProject, setQuestionCountForProject] = useState(0);

  // Network guards
  const [nextLoading, setNextLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Results
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);

  const interviewCompleted =
    projects.length > 0 &&
    currentProjectIndex >= projects.length &&
    question === "" &&
    evaluations.length > 0;

  /* ================= PDF TEXT EXTRACTION ================= */
  async function extractPdfText(file: File): Promise<string> {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    const workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((x: any) => x.str).join(" ") + "\n";
    }
    return text;
  }

  /* ================= UPLOAD ================= */
  async function uploadResume() {
    if (!file) return;

    setLoading(true);

    // Reset everything
    setResumeText("");
    setProjects([]);
    setCurrentProjectIndex(0);
    setQuestion("");
    setAskedQuestions([]);
    setAnswerText("");
    setEvaluations([]);
    setFinalReport(null);
    setQuestionCountForProject(0);
    setMaxQuestionsPerProject(3);

    // Extract text
    const rawText = await extractPdfText(file);

    // Store text in backend (your existing route)
    const res = await fetch("/api/upload-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, text: rawText }),
    });

    const data = await res.json();
    const extracted = data.extractedText || "";
    setResumeText(extracted);

    // Extract projects (your existing route)
    const projRes = await fetch("/api/extract-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText: extracted }),
    });

    const projData = await projRes.json();
    const extractedProjects: Project[] = (projData.projects || []).filter(
      (p: any) => p?.name
    );

    // Fallback if extractor returns nothing
    const finalProjects =
      extractedProjects.length > 0 ? extractedProjects : [{ name: "Primary Project" }];

    setProjects(finalProjects);

    // Rule: 1 project => 3 Q, >1 => 2 per project
    setMaxQuestionsPerProject(finalProjects.length === 1 ? 3 : 2);

    setLoading(false);
  }

  /* ================= START / GET FIRST QUESTION ================= */
  async function startInterview() {
    if (!resumeText) return;
    if (projects.length === 0) return;

    setNextLoading(true);

    const project = projects[0];

    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        project,
        askedQuestions: [],
      }),
    });

    const data = await res.json();

    const q = (data.question || "").trim();
    setQuestion(q);
    setAskedQuestions(q ? [q] : []);

    setCurrentProjectIndex(0);
    setQuestionCountForProject(0);

    setNextLoading(false);
  }

  /* ================= TIMER (per question) ================= */
  useEffect(() => {
    if (!question) return;

    setTimeLeft(160);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;

          // stop mic
          if (recognitionRef.current) recognitionRef.current.stop();

          // auto submit if something exists
          if (answerText.trim()) {
            submitAnswerAndNext();
          } else {
            // If no answer, still move next (optional)
            submitAnswerAndNext();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // intentionally NOT depending on answerText (avoid restarting timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  /* ================= AUDIO (continuous) ================= */
  function startRecording() {
    if (isRecording) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setAnswerText("");
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }
      setAnswerText(transcript.trim());
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  }

  /* ================= SUBMIT + NEXT ================= */
  async function submitAnswerAndNext() {
    if (nextLoading) return; // prevent double submit
    setNextLoading(true);

    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    const project = projects[currentProjectIndex] || { name: "Primary Project" };

    const res = await fetch("/api/follow-up-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        project,
        question,
        answer: answerText || "",
        askedQuestions,
        questionCountForProject,
        maxQuestionsPerProject,
      }),
    });

    const data = await res.json();

    // Save evaluation
    if (data?.evaluation) {
      setEvaluations((prev) => [
        ...prev,
        {
          question,
          answer: answerText || "",
          score: data.evaluation.score,
          reasoning: data.evaluation.reasoning,
          projectName: project.name,
        },
      ]);
    }

    const nextQuestion = (data?.nextQuestion || "").trim();

    // Reset answer area
    setAnswerText("");

    // Move flow based on server decision
    if (nextQuestion) {
      setQuestion(nextQuestion);
      setAskedQuestions((prev) => [...prev, nextQuestion]);

      // increment per-project question count locally
      setQuestionCountForProject((prev) => prev + 1);
    } else {
      // Move to next project OR end interview
      const nextProjectIndex = currentProjectIndex + 1;

      if (nextProjectIndex < projects.length) {
        setCurrentProjectIndex(nextProjectIndex);
        setQuestionCountForProject(0);

        // Ask first question for next project
        const nextProj = projects[nextProjectIndex];

        const qRes = await fetch("/api/ask-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText,
            project: nextProj,
            askedQuestions,
          }),
        });

        const qData = await qRes.json();
        const q = (qData?.question || "").trim();
        setQuestion(q);
        if (q) setAskedQuestions((prev) => [...prev, q]);
      } else {
        // End interview
        setCurrentProjectIndex(projects.length);
        setQuestion("");
      }
    }

    setNextLoading(false);
  }

  /* ================= GENERATE REPORT ================= */
  async function generateFinalReport() {
    if (reportLoading) return;
    setReportLoading(true);

    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluations }),
    });

    const data = await res.json();
    setFinalReport(data);

    setReportLoading(false);
  }

  /* ================= UI ================= */
  return (
    <main style={{ maxWidth: 900, margin: "auto", padding: 32 }}>
      {!resumeText && (
        <UploadCard loading={loading} onFileSelect={setFile} onUpload={uploadResume} />
      )}

      {resumeText && !question && projects.length > 0 && !finalReport && (
        <div style={{ marginTop: 16 }}>
          <button onClick={startInterview} disabled={nextLoading}>
            {nextLoading ? "Starting..." : "Start Interview"}
          </button>
        </div>
      )}

      {question && (
        <>
          <InterviewHeader
            current={evaluations.length + 1}
            total={projects.length === 1 ? 3 : projects.length * 2}
          />

          <TimerBadge timeLeft={timeLeft} />

          <h3 style={{ marginTop: 20 }}>{question}</h3>

          <button onClick={startRecording} disabled={isRecording || timeLeft === 0}>
            {isRecording ? "Recording..." : "Start Answering"}
          </button>

          <div style={{ marginTop: 16 }}>
            <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
              <b>Your Answer (live):</b>
              <p style={{ marginTop: 8 }}>{answerText || "..."}</p>
            </div>

            <button
              onClick={submitAnswerAndNext}
              disabled={nextLoading}
              style={{ marginTop: 12 }}
            >
              {nextLoading ? "Submitting..." : "Submit Answer"}
            </button>
          </div>
        </>
      )}

      {interviewCompleted && !finalReport && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <h2>Your interview has been completed</h2>
          <p style={{ marginTop: 8, color: "#555" }}>
            Click below to generate your feedback report.
          </p>

          <button onClick={generateFinalReport} disabled={reportLoading}>
            {reportLoading ? "Generating Report..." : "Generate Final Report"}
          </button>
        </div>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
