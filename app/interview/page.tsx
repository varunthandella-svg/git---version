"use client";

import { useState, useRef, useEffect } from "react";

import UploadCard from "@/app/components/UploadCard";
import InterviewHeader from "@/app/components/InterviewHeader";
import TimerBadge from "@/app/components/TimerBadge";
import ReportCard from "@/app/components/ReportCard";

type Evaluation = {
  question: string;
  answer: string;
  reasoning: string;
};

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [question, setQuestion] = useState("");

  // 🎤 AUDIO
  const [isRecording, setIsRecording] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const recognitionRef = useRef<any>(null);

  // ⏱ TIMER (160 sec)
  const [timeLeft, setTimeLeft] = useState(160);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 📊 ANSWER EVALUATIONS
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // 🧾 FINAL REPORT
  const [finalReport, setFinalReport] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const MAX_QUESTIONS = 3;

  const interviewCompleted = evaluations.length >= MAX_QUESTIONS;

  /* ================= PDF UPLOAD ================= */
  async function uploadResume() {
    if (!file) return;

    setLoading(true);
    setResumeText("");
    setQuestion("");
    setAnswerText("");
    setEvaluations([]);
    setFinalReport(null);

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

    const res = await fetch("/api/upload-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, text }),
    });

    const data = await res.json();
    setResumeText(data.extractedText || "");
    setLoading(false);
  }

  /* ================= START INTERVIEW (FIXED) ================= */
  async function startInterview() {
    try {
      const res = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          project: { name: "Primary Project" }, // ✅ REQUIRED SHAPE
        }),
      });

      const data = await res.json();

      if (!data?.question) {
        alert("Failed to start interview.");
        return;
      }

      setQuestion(data.question);
    } catch (err) {
      console.error(err);
      alert("Error starting interview.");
    }
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

          if (answerText.trim()) submitAnswer();

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question]);

  /* ================= AUDIO (CONTINUOUS) ================= */
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

    const res = await fetch("/api/follow-up-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        question,
        answer: answerText,
      }),
    });

    const data = await res.json();

    if (data.evaluation) {
      setEvaluations((prev) => [
        ...prev,
        {
          question,
          answer: answerText,
          reasoning: data.evaluation.reasoning,
        },
      ]);
    }

    setAnswerText("");
    setQuestion(data.nextQuestion || "");
  }

  /* ================= FINAL REPORT ================= */
  async function generateFinalReport() {
    setGeneratingReport(true);

    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluations }),
    });

    const data = await res.json();
    setFinalReport(data);
    setGeneratingReport(false);
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

      {resumeText && !question && !interviewCompleted && (
        <button onClick={startInterview}>Start Interview</button>
      )}

      {question && !interviewCompleted && (
        <>
          <InterviewHeader
            current={evaluations.length + 1}
            total={MAX_QUESTIONS}
          />

          <TimerBadge timeLeft={timeLeft} />

          <h3 style={{ marginTop: 20 }}>{question}</h3>

          <button onClick={startRecording} disabled={isRecording}>
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
          <p>Click below to generate your interview feedback.</p>

          <button onClick={generateFinalReport} disabled={generatingReport}>
            {generatingReport ? "Generating report..." : "Generate Report"}
          </button>
        </div>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
