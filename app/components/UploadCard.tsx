"use client";

type Props = {
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  loading: boolean;
};

export default function UploadCard({ onFileSelect, onUpload, loading }: Props) {
  return (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: 12,
      padding: 24,
      background: "#fff",
      maxWidth: 500
    }}>
      <h3>Upload your Resume</h3>
      <p style={{ color: "#666" }}>
        PDF only • Project-based Viva • 120s per question
      </p>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onFileSelect(e.target.files[0]);
          }
        }}
      />

      <br /><br />

      <button onClick={onUpload} disabled={loading}>
        {loading ? "Processing…" : "Start Interview"}
      </button>
    </div>
  );
}
