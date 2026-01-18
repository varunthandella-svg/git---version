"use client";

import { useState, useRef, useEffect } from "react";
import UploadCard from "@/app/components/UploadCard";
import ReportCard from "@/app/components/ReportCard";

const QUESTIONS = [
  "Explain one project you worked on and your exact contribution.",
  "What was the biggest technical challenge in this project?",
  "If you had to improve this project today, what would you change?",
];

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [answerText, setAnswerText] = useState("");
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);

  // 🎤 AUDIO
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  // ⏱ TIMER
  const [timeLeft, setTimeLeft] = useState(160);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= UPLOAD ================= */
  async function uploadResume() {
    if (!file) return;
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

    setResumeText(text);
    setLoading(false);
  }

  /* ================= START ================= */
  function startInterview() {
    if (!resumeText || resumeText.length < 50) {
      alert("Resume not processed properly. Please re-upload.");
      return;
    }
    setCurrentIndex(0);
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

  /* ================= SUBMIT ================= */
  function submitAnswer() {
    stopRecording();
    if (!answerText.trim()) return;

    setEvaluations((prev) => [
      ...prev,
      {
        question: QUESTIONS[currentIndex],
        answer: answerText,
      },
    ]);

    setAnswerText("");

    if (currentIndex + 1 < QUESTIONS.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(-2); // completed
    }
  }

  /* ================= REPORT ================= */
  function generateFinalReport() {
    setFinalReport({
      summary:
        "Candidate explained projects clearly with reasonable technical understanding.",
      strengths: [
        "Good project ownership",
        "Clear explanation",
        "Logical thinking",
      ],
      improvements: [
        "More depth in optimization",
        "Clearer architectural reasoning",
      ],
    });
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
          <h3>{QUESTIONS[currentIndex]}</h3>
          <p>Time left: {timeLeft}s</p>

          <button onClick={startRecording} disabled={isRecording}>
            {isRecording ? "Recording..." : "Start Answering"}
          </button>

          {answerText && (
            <>
              <p>{answerText}</p>
              <button onClick={submitAnswer}>Submit</button>
            </>
          )}
        </>
      )}

      {currentIndex === -2 && !finalReport && (
        <div style={{ marginTop: 32 }}>
          <h2>Your interview has been completed</h2>
          <button onClick={generateFinalReport}>Generate Final Report</button>
        </div>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
