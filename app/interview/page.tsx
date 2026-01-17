"use client";

import { useState, useRef, useEffect } from "react";

import UploadCard from "@/app/components/UploadCard";
import InterviewHeader from "@/app/components/InterviewHeader";
import TimerBadge from "@/app/components/TimerBadge";
import ReportCard from "@/app/components/ReportCard";

type Evaluation = {
  question: string;
  answer: string;
  score: "Strong" | "Medium" | "Weak";
  reasoning: string;
};

export default function InterviewPage() {
  const QUESTION_TIME = 160;
  const MAX_QUESTIONS = 3;

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [question, setQuestion] = useState("");

  const [listening, setListening] = useState(false);
  const [answerText, setAnswerText] = useState("");

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);

  const isInterviewFinished = evaluations.length >= MAX_QUESTIONS;

  /* ================= PDF ================= */
  async function extractPdfText(file: File): Promise<string> {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text;
  }

  /* ================= UPLOAD ================= */
  async function uploadResume() {
    if (!file) return;

    setLoading(true);
    setResumeText("");
    setQuestion("");
    setAnswerText("");
    setEvaluations([]);
    setFinalReport(null);

    const text = await extractPdfText(file);

    const res = await fetch("/api/upload-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, text }),
    });

    const data = await res.json();
    setResumeText(data?.extractedText || "");
    setLoading(false);
  }

  /* ================= START INTERVIEW ================= */
  async function startInterview() {
    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText }),
    });

    const data = await res.json();
    setQuestion(data?.question || "");
  }

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!question) return;

    setTimeLeft(QUESTION_TIME);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          submitAnswerAndGetFollowUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question]);

  /* ================= AUDIO (FIXED) ================= */
  function startRecording() {
    if (listening) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      setAnswerText((prev) =>
        prev
          ? prev + " " + event.results[0][0].transcript
          : event.results[0][0].transcript
      );
    };

    recognition.onend = () => {
      if (timeLeft > 0 && listening) {
        recognition.start(); // 🔁 auto-restart
      }
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function stopRecording() {
    setListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
  }

  /* ================= SUBMIT ================= */
  async function submitAnswerAndGetFollowUp() {
    stopRecording();
    if (!answerText) return;

    const res = await fetch("/api/follow-up-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, question, answer: answerText }),
    });

    const data = await res.json();

    if (data?.evaluation) {
      setEvaluations((prev) => [...prev, data.evaluation]);
    }

    setAnswerText("");
    setQuestion(data?.nextQuestion || "");
  }

  /* ================= FINAL REPORT ================= */
  async function generateFinalReport() {
    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, evaluations }),
    });

    const data = await res.json();
    setFinalReport(data || {});
  }

  /* ================= UI ================= */
  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "auto" }}>
      {!resumeText && (
        <UploadCard
          loading={loading}
          onFileSelect={setFile}
          onUpload={uploadResume}
        />
      )}

      {resumeText && !question && !isInterviewFinished && (
        <button onClick={startInterview}>Start Interview</button>
      )}

      {question && !isInterviewFinished && (
        <>
          <InterviewHeader
            current={evaluations.length + 1}
            total={MAX_QUESTIONS}
          />
          <TimerBadge timeLeft={timeLeft} />
          <h3>{question}</h3>

          <button onClick={startRecording} disabled={listening}>
            {listening ? "Recording..." : "Start Answer"}
          </button>

          <p style={{ marginTop: 10 }}>{answerText}</p>

          <button onClick={submitAnswerAndGetFollowUp}>
            Submit Answer
          </button>
        </>
      )}

      {isInterviewFinished && !finalReport && (
        <button onClick={generateFinalReport}>
          Generate Final Report
        </button>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
