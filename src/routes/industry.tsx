import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/topbar";
import { Steps } from "@/routes/templates";
import { INDUSTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/industry")({
  validateSearch: z.object({ template: z.string().default("ats") }),
  component: IndustryPage,
});

function IndustryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { template } = Route.useSearch();
  const [selected, setSelected] = useState<string>("software");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/templates" } });
  }, [user, loading, navigate]);

  const start = async () => {
    if (!user) return;
    setBusy(true);
    const language = (typeof window !== "undefined" && window.localStorage.getItem("linnea_lang")) || "en";
    const { data, error } = await supabase
      .from("resumes")
      .insert({ user_id: user.id, template, industry: selected, language, title: "Untitled Resume" })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) { toast.error(error?.message ?? "Could not create resume"); return; }
    navigate({ to: "/builder/$id", params: { id: data.id } });
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <Steps current={3} />
        <h1 className="mt-8 font-display text-4xl tracking-tight">Which field are you applying for?</h1>
        <p className="mt-2 text-muted-foreground">Linnea will tailor her questions, skill suggestions and tone for this field.</p>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {INDUSTRIES.map((it) => (
            <button
              key={it.id}
              onClick={() => setSelected(it.id)}
              className={cn(
                "text-left rounded-2xl border bg-card p-5 transition-all",
                selected === it.id
                  ? "border-primary shadow-[0_0_0_4px_oklch(0.32_0.08_268_/_0.08)]"
                  : "border-border hover:-translate-y-0.5"
              )}
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground font-serif text-lg">{it.emoji}</div>
              <p className="mt-4 font-medium">{it.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{it.hint}</p>
            </button>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" asChild><Link to="/templates">Back</Link></Button>
          <Button onClick={start} disabled={busy} className="h-11 rounded-full px-6">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start writing <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
