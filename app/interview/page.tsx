"use client";

import { useState, useRef, useEffect } from "react";

import UploadCard from "@/app/components/UploadCard";
import InterviewHeader from "@/app/components/InterviewHeader";
import TimerBadge from "@/app/components/TimerBadge";
import ReportCard from "@/app/components/ReportCard";

type Evaluation = {
  question: string;
  answer: string;
};

export default function InterviewPage() {
  /* ================= BASIC STATE ================= */
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [projects, setProjects] = useState<any[]>([]);

  const [question, setQuestion] = useState("");
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  /* ================= AUDIO ================= */
  const [isRecording, setIsRecording] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const recognitionRef = useRef<any>(null);

  /* ================= TIMER (160s) ================= */
  const [timeLeft, setTimeLeft] = useState(160);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= EVALUATION ================= */
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);

  /* ================= DERIVED ================= */
  const maxQuestions = projects.length <= 1 ? 3 : 5;
  const interviewCompleted = askedQuestions.length >= maxQuestions;

  /* ================= PDF + RESUME UPLOAD ================= */
  async function uploadResume() {
    if (!file) return;

    setLoading(true);
    setResumeText("");
    setProjects([]);
    setQuestion("");
    setAskedQuestions([]);
    setAnswerText("");
    setEvaluations([]);
    setFinalReport(null);

    // PDF READ
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
      text += content.items.map((i: any) => i.str).join(" ") + "\n";
    }

    // Upload Resume
    const res = await fetch("/api/upload-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, text }),
    });

    const data = await res.json();
    setResumeText(data.extractedText || "");

    // Extract Projects
    const projectRes = await fetch("/api/extract-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText: data.extractedText }),
    });

    const projectData = await projectRes.json();
    setProjects(projectData.projects || []);

    setLoading(false);
  }

  /* ================= START INTERVIEW ================= */
  async function startInterview() {
    if (!resumeText) return;

    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        projects,
        askedQuestions,
      }),
    });

    const data = await res.json();

    setQuestion(data.question);
    setAskedQuestions((prev) => [...prev, data.question]);
  }

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!question) return;

    setTimeLeft(160);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;

          if (recognitionRef.current) recognitionRef.current.stop();

          if (answerText.trim()) {
            submitAnswer();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question]);

  /* ================= AUDIO ================= */
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

  /* ================= SUBMIT ANSWER ================= */
  async function submitAnswer() {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    setEvaluations((prev) => [
      ...prev,
      { question, answer: answerText },
    ]);

    setAnswerText("");

    if (askedQuestions.length >= maxQuestions) return;

    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        projects,
        askedQuestions,
        lastAnswer: answerText,
      }),
    });

    const data = await res.json();

    setQuestion(data.question);
    setAskedQuestions((prev) => [...prev, data.question]);
  }

  /* ================= FINAL REPORT ================= */
  async function generateFinalReport() {
    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluations }),
    });

    const data = await res.json();
    setFinalReport(data);
  }

  /* ================= UI ================= */
  return (
    <main style={{ maxWidth: 900, margin: "auto", padding: 32 }}>
      {!resumeText && (
        <UploadCard
          loading={loading}
          onFileSelect={setFile}
          onUpload={uploadResume}
        />
      )}

      {resumeText && !question && (
        <button onClick={startInterview}>Start Interview</button>
      )}

      {question && !interviewCompleted && (
        <>
          <InterviewHeader
            current={askedQuestions.length}
            total={maxQuestions}
          />

          <TimerBadge timeLeft={timeLeft} />

          <h3 style={{ marginTop: 20 }}>{question}</h3>

          <button
            onClick={startRecording}
            disabled={isRecording || timeLeft === 0}
          >
            {isRecording ? "Recording..." : "Start Answering"}
          </button>

          {answerText && (
            <div style={{ marginTop: 16 }}>
              <p>{answerText}</p>
              <button onClick={submitAnswer}>Submit Answer</button>
            </div>
          )}
        </>
      )}

      {interviewCompleted && !finalReport && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <h2>Your interview has been completed</h2>
          <button onClick={generateFinalReport}>
            Generate Final Report
          </button>
        </div>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
