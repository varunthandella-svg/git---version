import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          AI Project Viva Interview
        </h1>

        <p className="mt-6 text-lg text-slate-300 max-w-2xl">
          Upload your resume. Answer project-based questions via voice.
          Get an AI-generated evaluation and final interview report.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/interview"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium hover:bg-indigo-500 transition"
          >
            Start Interview
          </Link>

          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-base font-medium hover:bg-white/10 transition"
          >
            How it works
          </a>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-slate-950 border-t border-white/10"
      >
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-semibold">1. Upload Resume</h3>
            <p className="mt-3 text-slate-400">
              AI reads your resume and identifies your key projects.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">2. Voice Interview</h3>
            <p className="mt-3 text-slate-400">
              Answer time-bound project questions using voice only.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">3. AI Evaluation</h3>
            <p className="mt-3 text-slate-400">
              Get structured feedback, scoring, strengths, and gaps.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} AI Project Viva
      </footer>
    </main>
  );
}
