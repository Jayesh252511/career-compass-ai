import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LANGUAGES } from "@/lib/constants";
import { Logo } from "@/components/logo";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { TrustedMarquee } from "@/components/trusted-marquee";
import { TemplateCarousel } from "@/components/template-carousel";
import { FaqSection } from "@/components/faq-section";
import { ArrowRight, Sparkles, FileCheck2, MessagesSquare, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "resume-zen Ai — Build a world-class English resume in your own language" },
      { name: "description", content: "Chat in Hindi, Tamil, Spanish or 14 other languages. resume-zen Ai quietly turns it into an ATS-ready English resume." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string | null>("en");
  const { t, i18n } = useTranslation();
  const didInit = useRef(false);

  // On first mount (page load / refresh), reset to English once.
  // Using an empty dep array so this never re-runs after a language click.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setPicked("en");
    i18n.changeLanguage("en");
    window.localStorage.setItem("linnea_lang", "en");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickLanguage = (code: string) => {
    setPicked(code);
    i18n.changeLanguage(code);
    window.localStorage.setItem("linnea_lang", code);
  };

  const onStart = () => {
    if (picked) {
      window.localStorage.setItem("linnea_lang", picked);
      i18n.changeLanguage(picked);
    }
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
            {t("landing.badge")}
          </div>
          <h1 className="mt-6 font-display text-[44px] leading-[1.05] sm:text-6xl md:text-7xl font-medium tracking-[-0.03em] text-foreground">
            {t("landing.title1")}
            <br />
            <span className="font-serif italic font-normal text-primary">{t("landing.title2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {t("landing.subtitle")}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={onStart}
              className="h-14 rounded-full px-10 text-[17px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all hover:scale-105"
            >
              Start Building Your Resume <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">{t("landing.freeToTry")} • No credit card required</p>
          </div>

          <div className="mt-20 mx-auto max-w-5xl">
            <BeforeAfterSlider />
          </div>
        </div>
      </section>

      <TrustedMarquee />

      {/* Three quiet feature cards */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<MessagesSquare className="h-4 w-4" />}
            title={t("landing.features.conversationalTitle")}
            body={t("landing.features.conversationalBody")}
          />
          <FeatureCard
            icon={<Sparkles className="h-4 w-4" />}
            title={t("landing.features.nativeInTitle")}
            body={t("landing.features.nativeInBody")}
          />
          <FeatureCard
            icon={<FileCheck2 className="h-4 w-4" />}
            title={t("landing.features.atsReadyTitle")}
            body={t("landing.features.atsReadyBody")}
          />
        </div>
      </section>

      <TemplateCarousel />

      {/* How it works */}
      <section className="bg-secondary/60 border-y border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground text-center">{t("landing.howItWorksTitle")}</p>
          <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl tracking-tight">{t("landing.howItWorksHeading")}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4 text-center">
            {[
              { n: "01", t: t("landing.steps.step1Title"), d: t("landing.steps.step1Desc") },
              { n: "02", t: t("landing.steps.step2Title"), d: t("landing.steps.step2Desc") },
              { n: "03", t: t("landing.steps.step3Title"), d: t("landing.steps.step3Desc") },
              { n: "04", t: t("landing.steps.step4Title"), d: t("landing.steps.step4Desc") },
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

      <FaqSection />

      <footer className="mx-auto max-w-6xl px-6 py-10 flex items-center justify-between text-xs text-muted-foreground">
        <Logo />
        <p>{t("landing.footer", { year: new Date().getFullYear() })}</p>
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
