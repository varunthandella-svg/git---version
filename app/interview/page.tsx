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
  const [question, setQuestion] = useState("");

  // 🎤 AUDIO
  const [listening, setListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [answerText, setAnswerText] = useState("");

  const recognitionRef = useRef<any>(null);

  // 🧠 INTERVIEW STATE
  const [interviewState, setInterviewState] = useState({
    projects: [] as any[],
    currentProjectIndex: 0,
    questionCountForProject: 0,
    maxQuestionsForProject: 3,
    interviewCompleted: false,
  });

  // ⏱ TIMER — 160 seconds
  const [timeLeft, setTimeLeft] = useState(160);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 📊 EVALUATIONS
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // 🧾 FINAL REPORT
  const [finalReport, setFinalReport] = useState<any>(null);

  /* ================= UPLOAD ================= */
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

    setInterviewState({
      projects: [{ name: "Primary Project" }],
      currentProjectIndex: 0,
      questionCountForProject: 0,
      maxQuestionsForProject: 3,
      interviewCompleted: false,
    });

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
    setQuestion(data.question);
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

          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }

          if (answerText.trim()) {
            submitAnswerAndGetFollowUp();
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

  /* ================= AUDIO (ONE CLICK, CONTINUOUS) ================= */
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
      setListening(true);
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
      setListening(false);
    };

    recognition.start();
  }

  /* ================= SUBMIT ================= */
  async function submitAnswerAndGetFollowUp() {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    const res = await fetch("/api/follow-up-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, question, answer: answerText }),
    });

    const data = await res.json();

    if (data.evaluation) {
      setEvaluations((prev) => [
        ...prev,
        {
          question,
          answer: answerText,
          score: data.evaluation.score,
          reasoning: data.evaluation.reasoning,
        },
      ]);
    }

    setAnswerText("");
    setQuestion(data.nextQuestion || "");

    setInterviewState((prev) => {
      if (prev.questionCountForProject + 1 < prev.maxQuestionsForProject) {
        return {
          ...prev,
          questionCountForProject: prev.questionCountForProject + 1,
        };
      }
      return { ...prev, interviewCompleted: true };
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

      {resumeText && !question && (
        <button onClick={startInterview}>Start Interview</button>
      )}

      {question && !interviewState.interviewCompleted && (
        <>
          <InterviewHeader
            current={evaluations.length + 1}
            total={interviewState.maxQuestionsForProject}
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
              <button onClick={submitAnswerAndGetFollowUp}>
                Submit Answer
              </button>
            </div>
          )}
        </>
      )}

      {interviewState.interviewCompleted && (
        <div style={{ marginTop: 32 }}>
          <h2>Interview Completed</h2>
        </div>
      )}

      {finalReport && <ReportCard report={finalReport} />}
    </main>
  );
}
