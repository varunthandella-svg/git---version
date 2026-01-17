export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111827",
        backgroundImage: "url('/images/codingninjas-logo.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "500px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      {/* Content Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          maxWidth: "900px",
          width: "100%",
          padding: "48px",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          color: "#111827",
        }}
      >
        {/* Heading */}
        <h1
          style={{
            fontSize: "42px",
            fontWeight: "700",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          User Interview
        </h1>

        {/* CTA */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <a
            href="/interview"
            style={{
              display: "inline-block",
              padding: "14px 36px",
              backgroundColor: "#f97316",
              color: "#ffffff",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "16px",
              textDecoration: "none",
            }}
          >
            Start Interview
          </a>
        </div>

        {/* Instructions */}
        <div style={{ fontSize: "16px", lineHeight: "1.8" }}>
          <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>
            ⏱ Timed Answers
          </h3>
          <p>Each question allows <b>160 seconds</b> to respond.</p>

          <h3 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>
            🎙 Voice-Based Responses
          </h3>
          <ul>
            <li>
              Read the question carefully, then click <b>Start Answer</b> to
              begin responding using your voice.
            </li>
            <li>
              If your answer is complete, click <b>Submit</b> to move to the next
              question.
            </li>
            <li>You may reattempt the answer within the given time limit.</li>
          </ul>

          <h3 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>
            ⚠ Important Instructions
          </h3>
          <ul>
            <li>
              Each answer must be completed within <b>160 seconds</b>. You must
              click <b>Start Answer</b> before speaking.
            </li>
            <li>
              Avoid long pauses while answering. Extended silence may require you
              to answer the question again.
            </li>
            <li>
              After completing all questions, click <b>Generate Report</b> to
              receive your interview feedback.
            </li>
          </ul>

          <h3 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px" }}>
            📊 Final Report
          </h3>
          <ul>
            <li>
              Overall rating: <b>Strong / Medium / Weak</b>
            </li>
            <li>Summary of performance</li>
            <li>Identified skill gaps and improvement areas</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
