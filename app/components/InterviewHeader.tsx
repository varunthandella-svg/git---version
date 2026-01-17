type Props = {
  current: number;
  total: number;
};

export default function InterviewHeader({ current, total }: Props) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 16
    }}>
      <h3>Project Viva Interview</h3>
      <span style={{ fontWeight: 600 }}>
        Question {current} / {total}
      </span>
    </div>
  );
}
