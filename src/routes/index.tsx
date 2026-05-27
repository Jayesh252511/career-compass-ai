import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LANGUAGES } from "@/lib/constants";
import { Logo } from "@/components/logo";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, FileCheck2, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linnea — Build a world-class English resume in your own language" },
      { name: "description", content: "Chat in Hindi, Tamil, Spanish or 14 other languages. Linnea quietly turns it into an ATS-ready English resume." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    // pre-pick saved language
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("linnea_lang");
      if (saved) setPicked(saved);
    }
  }, []);

  const onStart = () => {
    if (picked) window.localStorage.setItem("linnea_lang", picked);
    if (loading) return;
    if (!user) navigate({ to: "/auth", search: { next: "/templates" } });
    else navigate({ to: "/templates" });
  };

  return (
    <div className="min-h-screen">
      <TopBar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-60 pointer-events-none" />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Now in 17 languages
          </div>
          <h1 className="mt-6 font-display text-[44px] leading-[1.05] sm:text-6xl md:text-7xl font-medium tracking-[-0.03em] text-foreground">
            Your resume,
            <br />
            <span className="font-serif italic font-normal text-primary">written by conversation.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Chat with Linnea in your own language. She quietly turns every answer into a recruiter-ready English resume that any ATS can read.
          </p>

          <div className="mt-10 mx-auto max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Choose your language</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {LANGUAGES.slice(0, 12).map((l) => (
                <button
                  key={l.code}
                  onClick={() => setPicked(l.code)}
                  className={cn(
                    "group flex flex-col items-center gap-1 rounded-2xl border bg-card px-2 py-3 transition-all",
                    picked === l.code
                      ? "border-primary shadow-[0_0_0_4px_oklch(0.32_0.08_268_/_0.08)]"
                      : "border-border hover:border-foreground/20 hover:-translate-y-0.5"
                  )}
                >
                  <span className="text-xl leading-none">{l.flag}</span>
                  <span className="text-[12px] font-medium leading-tight">{l.native}</span>
                </button>
              ))}
            </div>
            <details className="mt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">+ 5 more languages</summary>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {LANGUAGES.slice(12).map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setPicked(l.code)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl border bg-card px-2 py-3 transition-all",
                      picked === l.code ? "border-primary" : "border-border hover:border-foreground/20"
                    )}
                  >
                    <span className="text-xl">{l.flag}</span>
                    <span className="text-[12px]">{l.native}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={onStart}
              disabled={!picked}
              className="h-12 rounded-full px-7 text-[15px]"
            >
              {picked ? `Continue in ${LANGUAGES.find(l => l.code === picked)?.native}` : "Pick a language to begin"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">Free to try · No credit card</p>
          </div>
        </div>
      </section>

      {/* Three quiet feature cards */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<MessagesSquare className="h-4 w-4" />}
            title="Conversational, not a form"
            body="One question at a time. Answer naturally, the way you'd talk to a friend. No empty fields to stare at."
          />
          <FeatureCard
            icon={<Sparkles className="h-4 w-4" />}
            title="Native in, polished English out"
            body="Tell Linnea ‘maine ek game banayi’ — she writes ‘Designed an interactive game focused on user engagement.’"
          />
          <FeatureCard
            icon={<FileCheck2 className="h-4 w-4" />}
            title="ATS-ready, every time"
            body="Three templates, each tested against real applicant tracking systems. Clean. Parsable. Quiet."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/60 border-y border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground text-center">How it works</p>
          <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl tracking-tight">Four quiet steps to a great resume.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4 text-center">
            {[
              { n: "01", t: "Pick your language", d: "17 to choose from. We meet you where you are." },
              { n: "02", t: "Pick a template", d: "Three honest layouts. All ATS-ready." },
              { n: "03", t: "Tell us your field", d: "Linnea tunes her questions to your industry." },
              { n: "04", t: "Just chat", d: "Watch your resume write itself, in real time." },
            ].map((s) => (
              <div key={s.n}>
                <p className="font-serif italic text-2xl text-primary">{s.n}</p>
                <p className="mt-2 font-medium">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 flex items-center justify-between text-xs text-muted-foreground">
        <Logo />
        <p>© {new Date().getFullYear()} Linnea. Built with care.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-7 transition hover:-translate-y-0.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">{icon}</div>
      <p className="mt-5 font-medium">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
