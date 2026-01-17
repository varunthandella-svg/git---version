type Props = {
  timeLeft: number;
};

export default function TimerBadge({ timeLeft }: Props) {
  const danger = timeLeft <= 15;

  return (
    <span style={{
      padding: "6px 12px",
      borderRadius: 20,
      background: danger ? "#ffe5e5" : "#eef",
      color: danger ? "#c00" : "#333",
      fontWeight: 600
    }}>
      ⏱ {timeLeft}s
    </span>
  );
}
