"use client";

import { useEffect, useRef, useState } from "react";
import UploadCard from "@/app/components/UploadCard";
import InterviewHeader from "@/app/components/InterviewHeader";
import TimerBadge from "@/app/components/TimerBadge";
import ReportCard from "@/app/components/ReportCard";

type Evaluation = {
  question: string;
  answer: string;
  score?: string;
  reasoning?: string;
};

const TOTAL_QUESTIONS = 3;
const ANSWER_TIME = 160;

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);

  const [question, setQuestion] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);

  /* ================= PDF UPLOAD ================= */
  async function uploadResume() {
    if (!file) return;

    setLoading(true);
    setResumeText("");
    setQuestion("");
    setEvaluations([]);
    setFinalReport(null);
    setInterviewStarted(false);
    setCurrentIndex(0);

    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

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
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setResumeText(data.extractedText || "");
    setLoading(false);
  }

  /* ================= START INTERVIEW ================= */
  async function startInterview() {
    if (interviewStarted) return;

    setInterviewStarted(true);
    setCurrentIndex(0);

    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        questionIndex: 0,
      }),
    });

    const data = await res.json();
    setQuestion(data.question || "");
  }

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!question) return;

    setTimeLeft(ANSWER_TIME);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;

          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }

          if (answerText.trim()) {
            submitAnswer();
          }
          return 0;
        }
        return t - 1;
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

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

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
    if (!question) return;

    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    await fetch("/api/follow-up-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        question,
        answer: answerText,
      }),
    });

    setEvaluations((prev) => [
      ...prev,
      { question, answer: answerText },
    ]);

    setAnswerText("");

    const nextIndex = currentIndex + 1;

    if (nextIndex < TOTAL_QUESTIONS) {
      setCurrentIndex(nextIndex);

      const res = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          questionIndex: nextIndex,
        }),
      });

      const data = await res.json();
      setQuestion(data.question || "");
    } else {
      setQuestion("");
    }
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

      {resumeText && !interviewStarted && (
        <button onClick={startInterview}>Start Interview</button>
      )}

      {question && (
        <>
          <InterviewHeader
            current={currentIndex + 1}
            total={TOTAL_QUESTIONS}
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

      {!question && interviewStarted && evaluations.length === TOTAL_QUESTIONS && (
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
