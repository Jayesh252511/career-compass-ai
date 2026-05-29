import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, MoreVertical, Copy, Trash2, ExternalLink } from "lucide-react";
import { TEMPLATES, LANGUAGES } from "@/lib/constants";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ProgressRing } from "@/components/progress-ring";
import { useTranslation } from "react-i18next";

type Resume = {
  id: string;
  title: string;
  template: string;
  industry: string | null;
  language: string;
  progress: number;
  updated_at: string;
  content: any;
};

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

// Template accent colors for the mini thumbnail
const TEMPLATE_COLORS: Record<string, string> = {
  "faang-professional": "#6366f1",
  "modern-corporate": "#0ea5e9",
  "startup-minimal": "#10b981",
  "executive-elite": "#1e293b",
  "fresher-smart": "#f59e0b",
  "creative-professional": "#ec4899",
  "academic-research": "#64748b",
  "investment-banking": "#1e3a5f",
  "product-designer": "#a855f7",
  "global-standard": "#334155",
};

function MiniResumeThumbnail({ resume }: { resume: Resume }) {
  const content = resume.content || {};
  const accent = TEMPLATE_COLORS[resume.template] || "#6366f1";
  const name = content.fullName || "Your Name";
  const headline = content.headline || "";
  const hasExp = Array.isArray(content.experience) && content.experience.length > 0;
  const hasEdu = Array.isArray(content.education) && content.education.length > 0;
  const hasSkills = Array.isArray(content.skills) && content.skills.length > 0;

  return (
    <div className="w-full aspect-[1/1.35] rounded-xl bg-white border border-border/60 overflow-hidden relative group-hover:shadow-md transition-shadow p-2.5 flex flex-col gap-1.5" style={{ fontSize: "5px" }}>
      {/* Accent strip */}
      <div className="h-1 rounded-full w-full" style={{ backgroundColor: accent }} />
      
      {/* Name */}
      <p className="font-bold truncate leading-none" style={{ fontSize: "7px", color: accent }}>{name}</p>
      
      {/* Headline */}
      {headline && (
        <p className="truncate text-neutral-500 leading-none" style={{ fontSize: "4.5px" }}>{headline}</p>
      )}

      {/* Divider */}
      <div className="h-px bg-neutral-200 w-full" />

      {/* Fake content blocks */}
      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
        {hasExp && (
          <div className="space-y-0.5">
            <div className="h-0.5 w-8 rounded bg-neutral-300" />
            {(content.experience as any[]).slice(0, 2).map((_: any, i: number) => (
              <div key={i} className="space-y-[1px]">
                <div className="h-[2px] w-12 rounded bg-neutral-200" />
                <div className="h-[1.5px] w-16 rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        )}
        {hasEdu && (
          <div className="space-y-0.5">
            <div className="h-0.5 w-6 rounded bg-neutral-300" />
            <div className="h-[2px] w-10 rounded bg-neutral-200" />
          </div>
        )}
        {hasSkills && (
          <div className="flex flex-wrap gap-[2px]">
            {(content.skills as string[]).slice(0, 5).map((_: string, i: number) => (
              <div key={i} className="h-[3px] rounded-sm bg-neutral-200" style={{ width: `${10 + Math.random() * 12}px` }} />
            ))}
          </div>
        )}
        {/* Fill remaining space with skeleton lines */}
        {!hasExp && !hasEdu && !hasSkills && (
          <div className="space-y-1">
            <div className="h-[2px] w-full rounded bg-neutral-100" />
            <div className="h-[2px] w-3/4 rounded bg-neutral-100" />
            <div className="h-[2px] w-5/6 rounded bg-neutral-100" />
            <div className="h-[2px] w-2/3 rounded bg-neutral-100" />
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Resume[] | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/dashboard" } });
  }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("resumes")
      .select("id, title, template, industry, language, progress, updated_at, content")
      .order("updated_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setItems((data ?? []) as Resume[]);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const create = () => navigate({ to: "/templates" });

  const duplicate = async (r: Resume) => {
    if (!user) return;
    setBusy(true);
    const { data: src } = await supabase.from("resumes").select("content").eq("id", r.id).single();
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id, title: r.title + t("dashboard.copySuffix"), template: r.template,
        industry: r.industry, language: r.language, content: src?.content ?? {}, progress: r.progress,
      })
      .select("id").single();
    setBusy(false);
    if (error || !data) { toast.error(error?.message ?? t("dashboard.failed")); return; }
    toast.success(t("dashboard.duplicated"));
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("dashboard.deleteConfirm"))) return;
    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("dashboard.deleted"));
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("dashboard.workspace")}</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight">{t("dashboard.resumes")}</h1>
          </div>
          <Button onClick={create} data-tour="tour-create-new" className="h-11 rounded-full px-5">
            <Plus className="mr-1.5 h-4 w-4" /> {t("dashboard.newResume")}
          </Button>
        </div>

        <div className="mt-10">
          {items === null ? (
            <div className="grid place-items-center py-24"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState onCreate={create} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => {
                const tmpl = t(`templatesList.${r.template}.name`, { defaultValue: r.template });
                const ind = r.industry ? t(`industries.${r.industry}.name`, { defaultValue: r.industry }) : undefined;
                const lang = LANGUAGES.find(l => l.code === r.language);
                return (
                  <div key={r.id} className="group rounded-3xl border border-border bg-card p-4 transition hover:-translate-y-1 hover:shadow-lg">
                    {/* Mini thumbnail */}
                    <Link to="/builder/$id" params={{ id: r.id }} className="block mb-3">
                      <MiniResumeThumbnail resume={r} />
                    </Link>

                    <div className="flex items-start justify-between gap-2">
                      <Link to="/builder/$id" params={{ id: r.id }} className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Progress Ring instead of FileText icon */}
                        <ProgressRing value={r.progress} size={44} strokeWidth={3.5} />
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">{r.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{tmpl}{ind && ` · ${ind}`}</p>
                        </div>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 transition rounded-md p-1 hover:bg-accent"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link to="/builder/$id" params={{ id: r.id }}><ExternalLink className="mr-2 h-4 w-4" />{t("dashboard.open")}</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicate(r)} disabled={busy}><Copy className="mr-2 h-4 w-4" />{t("dashboard.duplicate")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => remove(r.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />{t("dashboard.delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{lang?.flag} {lang?.native}</span>
                      <span>{t("dashboard.editedAgo", { time: formatDistanceToNow(new Date(r.updated_at)) })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/40 p-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary font-serif text-2xl">L</div>
      <h2 className="mt-6 font-display text-2xl">{t("dashboard.emptyTitle")}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{t("dashboard.emptyBody")}</p>
      <Button onClick={onCreate} data-tour="tour-create-new" className="mt-6 h-11 rounded-full px-6"><Plus className="mr-1.5 h-4 w-4" /> {t("dashboard.createResume")}</Button>
    </div>
  );
}
