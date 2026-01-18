let questions: string[] = [];
let currentIndex = 0;

export function setQuestions(qs: string[]) {
  questions = qs;
  currentIndex = 0;
}

export function getNextQuestion(): string | null {
  if (currentIndex >= questions.length) return null;
  return questions[currentIndex++];
}
