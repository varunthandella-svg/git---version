async function startInterview() {
  if (!resumeText || resumeText.trim().length < 50) {
    alert("Resume not processed yet. Please re-upload.");
    return;
  }

  try {
    const res = await fetch("/api/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "ask-question failed");
    }

    const data = await res.json();
    setQuestion(data.question);
  } catch (err) {
    console.error("Start interview error:", err);
    alert("Error starting interview. Please retry.");
  }
}
