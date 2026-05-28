import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2, MoreVertical, Copy, Trash2, ExternalLink } from "lucide-react";
import { TEMPLATES, INDUSTRIES, LANGUAGES } from "@/lib/constants";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

type Resume = {
  id: string;
  title: string;
  template: string;
  industry: string | null;
  language: string;
  progress: number;
  updated_at: string;
};

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

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
      .select("id, title, template, industry, language, progress, updated_at")
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
          <Button onClick={create} className="h-11 rounded-full px-5">
            <Plus className="mr-1.5 h-4 w-4" /> {t("dashboard.newResume")}
          </Button>
        </div>

        <div className="mt-10">
          {items === null ? (
            <div className="grid place-items-center py-24"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState onCreate={create} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => {
                const tmpl = t(`templatesList.${r.template}.name`, { defaultValue: r.template });
                const ind = r.industry ? t(`industries.${r.industry}.name`, { defaultValue: r.industry }) : undefined;
                const lang = LANGUAGES.find(l => l.code === r.language);
                return (
                  <div key={r.id} className="group rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5">
                    <div className="flex items-start justify-between">
                      <Link to="/builder/$id" params={{ id: r.id }} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.title}</p>
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
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{t("dashboard.complete", { pct: r.progress })}</span>
                        <span>{lang?.flag} {lang?.native}</span>
                      </div>
                      <Progress value={r.progress} className="mt-1.5 h-1" />
                    </div>
                    <p className="mt-4 text-[11px] text-muted-foreground">
                      {t("dashboard.editedAgo", { time: formatDistanceToNow(new Date(r.updated_at)) })}
                    </p>
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
      <Button onClick={onCreate} className="mt-6 h-11 rounded-full px-6"><Plus className="mr-1.5 h-4 w-4" /> {t("dashboard.createResume")}</Button>
    </div>
  );
}
