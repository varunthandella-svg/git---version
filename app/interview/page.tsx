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

const QUESTION_TIME = 160;
const TOTAL_QUESTIONS = 3;

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalReport, setFinalReport] = useState<any | null>(null);

  const interviewCompleted = evaluations.length >= TOTAL_QUESTIONS;

  /* ===================== UPLOAD ===================== */
  async function uploadResume() {
    if (!file) return;
    setLoading(true);
    setEvaluations([]);
    setFinalReport(null);
    setQuestion("");
    setAnswerText("");

    const res = await fetch("/api/upload-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, text: "resume" }),
    });

    const data = await res.json();
    setResumeText(data?.extractedText || "");
    setLoading(false);
  }

  /* ===================== START INTERVIEW ===================== */
  async function startInterview() {
    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText }),
    });

    const data = await res.json();
    setQuestion(data?.question || "");
  }

  /* ===================== TIMER ===================== */
  useEffect(() => {
    if (!question) return;

    setTimeLeft(QUESTION_TIME);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          clearInterval(timerRef.current!);
          submitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [question]);

  /* ===================== AUDIO (FIXED) ===================== */
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
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      setAnswerText((prev) =>
        prev
          ? prev + " " + event.results[0][0].transcript
          : event.results[0][0].transcript
      );
    };

    recognition.onend = () => {
      if (timeLeft > 0 && isRecording) {
        recognition.start(); // auto-restart
      }
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  }

  function stopRecording() {
    setIsRecording(false);
    recognitionRef.current?.stop();
  }

  /* ===================== SUBMIT ANSWER ===================== */
  async function submitAnswer() {
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

  /* ===================== FINAL REPORT ===================== */
  async function generateFinalReport() {
    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, evaluations }),
    });

    const data = await res.json();
    setFinalReport(data || { verdict: "N/A" });
  }

  /* ===================== UI ===================== */
  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "auto" }}>
      {!resumeText && (
        <UploadCard loading={loading} onFileSelect={setFile} onUpload={uploadResume} />
      )}

      {resumeText && !question && !interviewCompleted && (
        <button onClick={startInterview}>Start Interview</button>
      )}

      {question && !interviewCompleted && (
        <>
          <InterviewHeader current={evaluations.length + 1} total={TOTAL_QUESTIONS} />
          <TimerBadge timeLeft={timeLeft} />
          <h3>{question}</h3>

          <button onClick={startRecording} disabled={isRecording}>
            {isRecording ? "Recording..." : "Start Answer"}
          </button>

          <p>{answerText}</p>
          <button onClick={submitAnswer}>Submit Answer</button>
        </>
      )}

      {interviewCompleted && !finalReport && (
        <button onClick={generateFinalReport}>Generate Final Report</button>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
