type Props = {
  report: any;
};

export default function ReportCard({ report }: Props) {
  if (!report) return null;

  const strengths = report?.projectBreakdown?.strengths || [];
  const gaps = report?.projectBreakdown?.gaps || [];

  return (
    <div style={{ marginTop: 32, background: "#f7f7f7", padding: 20 }}>
      <h3>Final Interview Report</h3>

      <p><b>Verdict:</b> {report.verdict || "N/A"}</p>
      <p><b>Summary:</b> {report.summary || "No summary generated."}</p>

      {report.metrics && (
        <>
          <h4>Score</h4>
          <p>
            {report.metrics.score} / {report.metrics.maxScore} (
            {report.metrics.percentage}%)
          </p>
        </>
      )}

      <h4>Strengths</h4>
      {strengths.length === 0 ? (
        <p>No strong areas identified.</p>
      ) : (
        <ul>
          {strengths.map((s: string, i: number) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}

      <h4>Improvement Areas</h4>
      {gaps.length === 0 ? (
        <p>No major gaps identified.</p>
      ) : (
        <ul>
          {gaps.map((g: string, i: number) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
