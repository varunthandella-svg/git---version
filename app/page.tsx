export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: `
          linear-gradient(
            rgba(0,0,0,0.8),
            rgba(0,0,0,0.8)
          ),
          url('/images/codingninjas-logo.png')
        `,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "600px",
        color: "white",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Heading */}
        <h1 style={{ fontSize: "44px", marginBottom: "12px" }}>
          User Interview
        </h1>

        {/* CTA */}
        <a
          href="/interview"
          style={{
            display: "inline-block",
            marginTop: "24px",
            marginBottom: "40px",
            padding: "14px 32px",
            backgroundColor: "#f97316",
            color: "white",
            borderRadius: "8px",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          Start Interview
        </a>

        {/* Content */}
        <div style={{ textAlign: "left", fontSize: "16px", lineHeight: "1.7" }}>
          <h3>Timed Answers</h3>
          <p>Each question allows <b>160 seconds</b> to respond.</p>

          <h3>Voice-Based Responses</h3>
          <ul>
            <li>Read the question carefully, then click <b>Start Answer</b> to begin responding using your voice.</li>
            <li>If you feel your answer is complete, click <b>Submit</b> to move to the next question.</li>
            <li>You may reattempt the answer within the given time limit.</li>
          </ul>

          <h3>Important Instructions</h3>
          <ul>
            <li>Each answer must be completed within <b>160 seconds</b>. You must click <b>Start Answer</b> before speaking.</li>
            <li>Avoid long pauses while answering. Extended silence may require you to answer the question again.</li>
            <li>After completing all questions, click <b>Generate Report</b> to receive your interview feedback.</li>
          </ul>

          <h3>Final Report</h3>
          <ul>
            <li>Overall rating: <b>Strong / Medium / Weak</b></li>
            <li>Summary of performance</li>
            <li>Identified skill gaps and improvement areas</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
