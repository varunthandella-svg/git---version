type InterviewSession = {
  questions: string[];
  askedQuestions: string[];
};

let session: InterviewSession | null = null;

/* ================= INITIALIZE SESSION ================= */
export function initInterviewSession(questions: string[]) {
  session = {
    questions,
    askedQuestions: [],
  };
}

/* ================= GET NEXT QUESTION ================= */
export function getNextQuestion(): string | null {
  // ✅ HARD GUARD (THIS FIXES YOUR ERROR)
  if (!session) {
    return null;
  }

  const remaining = session.questions.filter(
    (q) => !session!.askedQuestions.includes(q)
  );

  if (remaining.length === 0) return null;

  const next = remaining[0];
  session.askedQuestions.push(next);

  return next;
}

/* ================= RESET SESSION ================= */
export function resetInterviewSession() {
  session = null;
}
