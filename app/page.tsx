export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white hero-background">
      <div className="hero-content mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AI Project Viva Interview
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          Upload a resume and run a timed viva-style interview with follow-up
          questions and a final report.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/interview"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-200"
          >
            Start Interview
          </a>

          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-base font-semibold">Timed Answers</h3>
            <p className="mt-2 text-sm text-slate-300">
              120 seconds per question with auto-submit support.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-base font-semibold">Follow-up Logic</h3>
            <p className="mt-2 text-sm text-slate-300">
              Cross-questions based on your response where needed.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-base font-semibold">Final Report</h3>
            <p className="mt-2 text-sm text-slate-300">
              Strong/Medium/Weak scoring with a summary and gaps.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
