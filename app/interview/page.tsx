"use client";

import { useEffect, useRef, useState } from "react";
import UploadCard from "@/app/components/UploadCard";
import InterviewHeader from "@/app/components/InterviewHeader";
import TimerBadge from "@/app/components/TimerBadge";
import ReportCard from "@/app/components/ReportCard";

type Evaluation = {
  question: string;
  answer: string;
  feedback: string;
};

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [timeLeft, setTimeLeft] = useState(160);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  /* ================= PDF UPLOAD ================= */
  async function uploadResume() {
    if (!file) return;
    setLoading(true);

    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((i: any) => i.str).join(" ") + "\n";
    }

    setResumeText(text);
    setLoading(false);
  }

  /* ================= START INTERVIEW ================= */
  async function startInterview() {
    try {
      const res = await fetch("/api/ai-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      const data = await res.json();

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        alert("Failed to load interview questions");
        return;
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setEvaluations([]);
      setFinalReport(null);
    } catch {
      alert("Error starting interview.");
    }
  }

  /* ================= TIMER ================= */
  useEffect(() => {
    if (currentIndex === -1) return;

    setTimeLeft(160);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          stopRecording();
          submitAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex]);

  /* ================= MIC ================= */
  function startRecording() {
    if (isRecording) return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setAnswerText("");
    };

    recognition.onresult = (e: any) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript + " ";
      }
      setAnswerText(transcript.trim());
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
  }

  function stopRecording() {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  }

  /* ================= SUBMIT ANSWER ================= */
  async function submitAnswer() {
    stopRecording();
    if (!answerText.trim()) return;

    setEvaluations((prev) => [
      ...prev,
      {
        question: questions[currentIndex],
        answer: answerText,
        feedback: "Evaluated based on your explanation and clarity.",
      },
    ]);

    setAnswerText("");

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(-2); // interview completed
    }
  }

  /* ================= FINAL REPORT ================= */
  async function generateFinalReport() {
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
        <UploadCard
          loading={loading}
          onFileSelect={setFile}
          onUpload={uploadResume}
        />
      )}

      {resumeText && currentIndex === -1 && (
        <button onClick={startInterview}>Start Interview</button>
      )}

      {currentIndex >= 0 && (
        <>
          <InterviewHeader
            current={currentIndex + 1}
            total={questions.length}
          />
          <TimerBadge timeLeft={timeLeft} />
          <h3 style={{ marginTop: 20 }}>{questions[currentIndex]}</h3>

          <button onClick={startRecording} disabled={isRecording}>
            {isRecording ? "Recording..." : "Start Answer"}
          </button>

          {answerText && (
            <div style={{ marginTop: 16 }}>
              <p>{answerText}</p>
              <button onClick={submitAnswer}>Submit Answer</button>
            </div>
          )}
        </>
      )}

      {currentIndex === -2 && !finalReport && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <h2>Your interview has been completed</h2>
          <button onClick={generateFinalReport}>
            {reportLoading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
