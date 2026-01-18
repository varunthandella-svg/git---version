type ReportProps = {
  report: {
    overallSummary?: string;
    strengths?: string[];
    improvements?: string[];
  };
};

export default function ReportCard({ report }: ReportProps) {
  if (!report) return null;

  return (
    <div
      style={{
        marginTop: 40,
        padding: 24,
        borderRadius: 12,
        background: "#0f172a",
        color: "#e5e7eb",
      }}
    >
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>
        Interview Feedback Report
      </h2>

      <p style={{ marginBottom: 20, color: "#cbd5f5" }}>
        {report.overallSummary || "Summary not available."}
      </p>

      <h3>Strengths</h3>
      <ul>
        {(report.strengths || []).length === 0 && (
          <li>No strengths identified.</li>
        )}
        {(report.strengths || []).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h3 style={{ marginTop: 16 }}>Areas for Improvement</h3>
      <ul>
        {(report.improvements || []).length === 0 && (
          <li>No improvement areas identified.</li>
        )}
        {(report.improvements || []).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
