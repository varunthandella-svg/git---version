"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div className="card" style={{ maxWidth: 720, textAlign: "center" }}>
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>
          AI Project Viva Interview
        </h1>

        <p className="muted" style={{ fontSize: 16, marginBottom: 28 }}>
          Practice real project-based interviews with AI.  
          Get instant feedback. Improve confidence.
        </p>

        <Link href="/interview">
          <button style={{ fontSize: 16, padding: "12px 28px" }}>
            Start Interview
          </button>
        </Link>

        <div style={{ marginTop: 32, textAlign: "left" }}>
          <h3 style={{ marginBottom: 8 }}>How it works</h3>
          <ul className="muted">
            <li>Upload your resume</li>
            <li>Answer project-based AI questions</li>
            <li>Get a detailed interview report</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
