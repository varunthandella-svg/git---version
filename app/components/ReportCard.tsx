export default function ReportCard({ report }: { report: any }) {
  return (
    <div style={{
      marginTop: 32,
      padding: 24,
      background: "#f9fafb",
      borderRadius: 12
    }}>
      <h3>Final Interview Report</h3>

      <p><b>Verdict:</b> {report.verdict}</p>
      <p>{report.summary}</p>

      <h4>Score</h4>
      <p>
        {report.metrics.score} / {report.metrics.maxScore}
        ({report.metrics.percentage}%)
      </p>

      <h4>Strengths</h4>
      <ul>
        {report.projectBreakdown.strengths.map((s: string, i: number) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h4>Gaps</h4>
      <ul>
        {report.projectBreakdown.gaps.map((g: string, i: number) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
