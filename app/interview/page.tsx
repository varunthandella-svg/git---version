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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [question, setQuestion] = useState<string | null>(null);

  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [timeLeft, setTimeLeft] = useState(160);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);

  /* ================= PDF EXTRACTION ================= */
  async function extractPdfText(file: File): Promise<string> {
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
    return text;
  }

  /* ================= UPLOAD + AUTO START ================= */
  async function uploadResume() {
    if (!file) return;

    setLoading(true);
    setQuestion(null);
    setAnswerText("");
    setEvaluations([]);
    setFinalReport(null);

    const extractedText = await extractPdfText(file);
    setResumeText(extractedText);

    // 🔥 AUTO START INTERVIEW HERE
    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText: extractedText }),
    });

    if (!res.ok) {
      alert("Error starting interview.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setQuestion(data.question);
    setLoading(false);
  }

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!question) return;

    setTimeLeft(160);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          recognitionRef.current?.stop();
          submitAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => timerRef.current && clearInterval(timerRef.current);
  }, [question]);

  /* ================= AUDIO ================= */
  function startRecording() {
    if (isRecording) return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
      setAnswerText("");
    };

    recognition.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) {
        t += e.results[i][0].transcript + " ";
      }
      setAnswerText(t.trim());
    };

    recognition.onend = () => setIsRecording(false);
    recognition.start();
  }

  /* ================= SUBMIT ================= */
  async function submitAnswer() {
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    const res = await fetch("/api/follow-up-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, question, answer: answerText }),
    });

    const data = await res.json();

    if (data.nextQuestion) {
      setQuestion(data.nextQuestion);
      setAnswerText("");
    } else {
      setQuestion(null);
    }
  }

  /* ================= REPORT ================= */
  async function generateFinalReport() {
    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, evaluations }),
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

      {question && (
        <>
          <InterviewHeader current={evaluations.length + 1} total={5} />
          <TimerBadge timeLeft={timeLeft} />
          <h3 style={{ marginTop: 20 }}>{question}</h3>

          <button onClick={startRecording} disabled={isRecording}>
            {isRecording ? "Recording..." : "Start Answering"}
          </button>

          {answerText && (
            <div style={{ marginTop: 12 }}>
              <p>{answerText}</p>
              <button onClick={submitAnswer}>Submit Answer</button>
            </div>
          )}
        </>
      )}

      {!question && resumeText && !finalReport && (
        <button onClick={generateFinalReport}>Generate Final Report</button>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
