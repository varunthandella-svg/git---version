"use client";

import { useState, useRef, useEffect } from "react";

type Evaluation = {
  question: string;
  answer: string;
  score: "Strong" | "Medium" | "Weak";
  reasoning: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [question, setQuestion] = useState("");

  // 🎤 AUDIO
  const [listening, setListening] = useState(false);
  const [answerText, setAnswerText] = useState("");

  // 🧠 INTERVIEW STATE
  const [interviewState, setInterviewState] = useState({
    projects: [] as any[],
    currentProjectIndex: 0,
    questionCountForProject: 0,
    maxQuestionsForProject: 2,
    interviewCompleted: false,
  });

  // ⏱ TIMER
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 📊 EVALUATIONS
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // 🧾 FINAL REPORT
  const [finalReport, setFinalReport] = useState<any>(null);

  /* ================= SCORING MAP ================= */
  function mapScore(score: "Strong" | "Medium" | "Weak") {
    if (score === "Strong") return 4;
    if (score === "Medium") return 2;
    return 0;
  }

  /* ================= PDF EXTRACTION ================= */
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
    setResumeText(data.extractedText || "");

    const projects = [{ name: "Primary Project" }];
    const maxQ = projects.length === 1 ? 3 : 2;

    setInterviewState({
      projects,
      currentProjectIndex: 0,
      questionCountForProject: 0,
      maxQuestionsForProject: maxQ,
      interviewCompleted: false,
    });

    setLoading(false);
  }

  /* ================= START INTERVIEW ================= */
  async function startInterview() {
    const currentProject =
      interviewState.projects[interviewState.currentProjectIndex];

    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, project: currentProject }),
    });

    const data = await res.json();
    setQuestion(data.question);
  }

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!question) return;

    setTimeLeft(120);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setListening(false);
          if (answerText) submitAnswerAndGetFollowUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question]);

  /* ================= INTERVIEW FLOW ================= */
  function moveToNextStep() {
    setInterviewState((prev) => {
      if (prev.questionCountForProject + 1 < prev.maxQuestionsForProject) {
        return { ...prev, questionCountForProject: prev.questionCountForProject + 1 };
      }

      if (prev.currentProjectIndex + 1 < prev.projects.length) {
        return {
          ...prev,
          currentProjectIndex: prev.currentProjectIndex + 1,
          questionCountForProject: 0,
        };
      }

      return { ...prev, interviewCompleted: true };
    });
  }

  /* ================= AUDIO ================= */
  function startRecording() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setListening(true);
      setAnswerText("");
    };

    recognition.onresult = (event: any) => {
      setAnswerText(event.results[0][0].transcript);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
  }

  /* ================= FOLLOW-UP + SCORING ================= */
  async function submitAnswerAndGetFollowUp() {
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

    setQuestion(data.nextQuestion || "");
    setAnswerText("");
    moveToNextStep();
  }

  /* ================= FINAL REPORT ================= */
  async function generateFinalReport() {
    const total = evaluations.length;
    const score = evaluations.reduce((s, e) => s + mapScore(e.score), 0);
    const maxScore = total * 4;
    const percentage = Math.round((score / maxScore) * 100);

    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, evaluations }),
    });

    const data = await res.json();

    setFinalReport({
      ...data,
      metrics: { total, score, maxScore, percentage },
    });
  }

  /* ================= UI ================= */
  return (
    <main style={{ padding: 40, maxWidth: 900 }}>
      <h2>AI Project Viva Interview</h2>

      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <br /><br />

      <button onClick={uploadResume} disabled={loading}>
        {loading ? "Processing..." : "Upload Resume"}
      </button>

      {resumeText && <button onClick={startInterview} style={{ marginTop: 20 }}>Start Interview</button>}

      {question && !interviewState.interviewCompleted && (
        <div style={{ marginTop: 30 }}>
          <h3>{question}</h3>
          <p><b>Time Left:</b> {timeLeft}s</p>

          <button onClick={startRecording} disabled={listening || timeLeft === 0}>
            {listening ? "Listening..." : "Start Answering"}
          </button>

          {answerText && (
            <div>
              <p>{answerText}</p>
              <button onClick={submitAnswerAndGetFollowUp}>Submit Answer</button>
            </div>
          )}
        </div>
      )}

      {interviewState.interviewCompleted && (
        <div style={{ marginTop: 40 }}>
          <h2>Interview Completed</h2>
          <button onClick={generateFinalReport}>Generate Final Report</button>
        </div>
      )}

      {finalReport && (
        <div style={{ marginTop: 30, background: "#f7f7f7", padding: 20 }}>
          <h3>Final Interview Report</h3>

          <p><b>Verdict:</b> {finalReport.verdict}</p>
          <p><b>Summary:</b> {finalReport.summary}</p>

          <h4>Score</h4>
          <p>
            {finalReport.metrics.score} / {finalReport.metrics.maxScore} (
            {finalReport.metrics.percentage}%)
          </p>

          <h4>Strengths</h4>
          <ul>
            {finalReport.projectBreakdown.strengths.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Gaps</h4>
          <ul>
            {finalReport.projectBreakdown.gaps.map((g: string, i: number) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
