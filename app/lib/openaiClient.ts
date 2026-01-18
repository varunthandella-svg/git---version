type InterviewSession = {
  projects: { name: string }[];
  questions: string[];
  askedQuestions: string[];
};

let session: InterviewSession | null = null;

export function initSession(projects: { name: string }[]) {
  session = {
    projects,
    questions: [],
    askedQuestions: [],
  };
}

export function setQuestions(questions: string[]) {
  if (!session) return;
  session.questions = questions;
}

export function getNextQuestion(): string | null {
  if (!session) return null;

  const remaining = session.questions.filter(
    (q) => !session!.askedQuestions.includes(q)
  );

  if (remaining.length === 0) return null;

  const next = remaining[0];
  session.askedQuestions.push(next);
  return next;
}

export function resetSession() {
  session = null;
}

export function getSession() {
  return session;
}
