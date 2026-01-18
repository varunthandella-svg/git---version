type ReportProps = {
  report: {
    verdict: "Strong" | "Medium" | "Weak";
    summary: string;
    strengths: string[];
    improvements: string[];
  };
};

export default function ReportCard({ report }: ReportProps) {
  const verdictClass =
    report.verdict === "Strong"
      ? "badge-success"
      : report.verdict === "Medium"
      ? "badge-warning"
      : "badge-danger";

  return (
    <div className="card" style={{ marginTop: 32 }}>
      <h2 style={{ marginBottom: 12 }}>Interview Report</h2>

      <span className={`badge ${verdictClass}`}>
        Overall Rating: {report.verdict}
      </span>

      <p style={{ marginTop: 16 }} className="muted">
        {report.summary}
      </p>

      <div style={{ marginTop: 24 }}>
        <h3>Strengths</h3>
        <ul>
          {report.strengths.map((s, i) => (
            <li key={i}>✔ {s}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Areas for Improvement</h3>
        <ul>
          {report.improvements.map((s, i) => (
            <li key={i}>• {s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
