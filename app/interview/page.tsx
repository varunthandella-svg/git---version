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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiBusy, setApiBusy] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [question, setQuestion] = useState("");

  // 🎤 AUDIO
  const [isRecording, setIsRecording] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const recognitionRef = useRef<any>(null);

  // ⏱ TIMER (160s)
  const [timeLeft, setTimeLeft] = useState(160);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 📊 INTERVIEW DATA
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const maxQuestions = 3;

  // 🧾 REPORT
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const interviewCompleted = evaluations.length === maxQuestions;

  /* ================= UPLOAD ================= */
  async function uploadResume() {
    if (!file || apiBusy) return;
    setApiBusy(true);
    setLoading(true);

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
      body: JSON.stringify({ filename: file.name, text }),
    });

    const data = await res.json();
    setResumeText(data.extractedText || "");

    setLoading(false);
    setApiBusy(false);
  }

  /* ================= START INTERVIEW ================= */
  async function startInterview() {
    if (apiBusy) return;
    setApiBusy(true);

    try {
      const res = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      const data = await res.json();
      setQuestion(data.question);
    } catch {
      alert("Error starting interview");
    } finally {
      setApiBusy(false);
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
          recognitionRef.current?.stop();
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

  /* ================= AUDIO ================= */
  function startRecording() {
    if (isRecording) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

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

    recognition.onend = () => setIsRecording(false);
    recognition.start();
  }

  /* ================= SUBMIT ================= */
  async function submitAnswer() {
    if (apiBusy) return;
    setApiBusy(true);

    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    setEvaluations((prev) => [
      ...prev,
      { question, answer: answerText },
    ]);

    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText }),
    });

    const data = await res.json();
    setQuestion(data.question || "");
    setAnswerText("");

    setApiBusy(false);
  }

  /* ================= REPORT ================= */
  async function generateFinalReport() {
    setReportLoading(true);

    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluations }),
    });

    const data = await res.json();
    setFinalReport(data.report);
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

      {resumeText && !question && evaluations.length === 0 && (
        <button onClick={startInterview} disabled={apiBusy}>
          Start Interview
        </button>
      )}

      {question && !interviewCompleted && (
        <>
          <InterviewHeader
            current={evaluations.length + 1}
            total={maxQuestions}
          />
          <TimerBadge timeLeft={timeLeft} />
          <h3>{question}</h3>

          <button
            onClick={startRecording}
            disabled={isRecording || timeLeft === 0}
          >
            {isRecording ? "Recording..." : "Start Answering"}
          </button>

          {answerText && (
            <>
              <p>{answerText}</p>
              <button onClick={submitAnswer}>Submit Answer</button>
            </>
          )}
        </>
      )}

      {interviewCompleted && !finalReport && (
        <div style={{ textAlign: "center" }}>
          <h2>Your interview has been completed</h2>
          <button onClick={generateFinalReport} disabled={reportLoading}>
            {reportLoading ? "Generating report..." : "Generate Final Report"}
          </button>
        </div>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
