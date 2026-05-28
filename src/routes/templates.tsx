import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { TopBar } from "@/components/topbar";
import { TEMPLATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("ats");
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/templates" } });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <Steps current={2} />
        <h1 className="mt-8 font-display text-4xl tracking-tight">{t("templates.heading")}</h1>
        <p className="mt-2 text-muted-foreground">{t("templates.subheading")}</p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelected(tmpl.id)}
              className={cn(
                "group text-left rounded-3xl border bg-card p-1 transition-all overflow-hidden",
                selected === tmpl.id ? "border-primary shadow-[0_0_0_4px_oklch(0.32_0.08_268_/_0.08)]" : "border-border hover:-translate-y-0.5"
              )}
            >
              <div className="relative aspect-[3/4] rounded-2xl bg-neutral-50 overflow-hidden border border-border/60">
                <TemplateThumbnail id={tmpl.id} />
                {selected === tmpl.id && (
                  <div className="absolute top-3 right-3 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-medium">
                    {t(`templatesList.${tmpl.id}.name`, { defaultValue: tmpl.name })}
                  </p>
                  <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground">
                    {t(`templatesList.${tmpl.id}.tag`, { defaultValue: tmpl.tag })}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {t(`templatesList.${tmpl.id}.description`, { defaultValue: tmpl.description })}
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t(`templatesList.${tmpl.id}.bestFor`, { defaultValue: tmpl.bestFor })}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" asChild><Link to="/">{t("common.back")}</Link></Button>
          <Button onClick={() => navigate({ to: "/industry", search: { template: selected } })} className="h-11 rounded-full px-6">
            {t("common.continue")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const { t } = useTranslation();
  const items = [
    { n: 1, t: t("templates.stepLanguage") },
    { n: 2, t: t("templates.stepTemplate") },
    { n: 3, t: t("templates.stepField") },
  ];
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center gap-3">
          <span className={cn(
            "grid h-6 w-6 place-items-center rounded-full border text-[11px] font-medium",
            current >= it.n ? "bg-primary text-primary-foreground border-primary" : "border-border"
          )}>{it.n}</span>
          <span className={cn(current === it.n && "text-foreground font-medium")}>{it.t}</span>
          {i < items.length - 1 && <span className="h-px w-8 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function TemplateThumbnail({ id }: { id: string }) {
  // Tiny static visual previews
  const base = "absolute inset-0 p-5 text-[6px] leading-[1.4] text-neutral-700";
  if (id === "modern") {
    return (
      <div className={base}>
        <div className="grid grid-cols-[1fr_2fr] gap-3 h-full">
          <div className="bg-neutral-100 rounded-md p-2">
            <div className="h-2 w-12 bg-neutral-300 rounded" />
            <div className="mt-1 h-1.5 w-10 bg-neutral-200 rounded" />
            <div className="mt-3 space-y-1">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-1 bg-neutral-200 rounded" />)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-20 bg-neutral-300 rounded" />
            <div className="space-y-0.5">
              {Array.from({ length: 14 }).map((_, i) => <div key={i} className="h-1 bg-neutral-200 rounded" style={{ width: `${60 + (i * 7) % 35}%` }} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (id === "fresher") {
    return (
      <div className={base}>
        <div className="h-3 w-32 bg-neutral-300 rounded" />
        <div className="mt-1 h-1.5 w-20 bg-neutral-200 rounded" />
        <div className="mt-4 space-y-2">
          {["Projects", "Education", "Skills"].map((s) => (
            <div key={s}>
              <div className="h-1.5 w-14 bg-neutral-300 rounded" />
              <div className="mt-1 space-y-0.5">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-1 bg-neutral-200 rounded" style={{ width: `${70 + (i * 6) % 25}%` }} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={base}>
      <div className="border-b border-neutral-300 pb-2">
        <div className="h-3 w-32 bg-neutral-300 rounded" />
        <div className="mt-1 h-1.5 w-40 bg-neutral-200 rounded" />
      </div>
      <div className="mt-3 space-y-2">
        {["Summary", "Experience", "Education", "Skills"].map((s) => (
          <div key={s}>
            <div className="h-1.5 w-14 bg-neutral-400 rounded" />
            <div className="mt-1 space-y-0.5">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-1 bg-neutral-200 rounded" style={{ width: `${70 + (i * 6) % 25}%` }} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
