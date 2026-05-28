import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const search = z.object({ next: z.string().optional() }).optional();

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = Route.useSearch();
  const next = params?.next ?? "/dashboard";
  const { t } = useTranslation();

  useEffect(() => { if (user) navigate({ to: next }); }, [user, next, navigate]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
      }
      navigate({ to: next });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + next },
    });
    if (error) {
      toast.error(t("auth.continueWithGoogle") + " failed");
      setBusy(false);
      return;
    }
    // OAuth flow redirects away; if it doesn't, we just stop showing busy.
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10 bg-secondary/60 border-r border-border">
        <Link to="/"><Logo /></Link>
        <div className="max-w-md">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("authLeft.tagline")}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">
            {t("authLeft.quote")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("authLeft.attribution")}</p>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} resume-zen Ai</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden block mb-8"><Logo /></Link>
          <h1 className="font-display text-3xl tracking-tight">{mode === "signin" ? t("auth.welcomeBack") : t("auth.createAccount")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.subtitleSignIn") : t("auth.subtitleSignUp")}
          </p>

          <Button onClick={google} disabled={busy} variant="outline" className="mt-8 w-full h-11 rounded-full">
            <GoogleIcon className="mr-2 h-4 w-4" /> {t("auth.continueWithGoogle")}
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />{t("auth.or")}<div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 rounded-xl" placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 rounded-xl" placeholder={t("auth.passwordHint")} />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-11 rounded-full">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? t("common.signIn") : t("auth.createAnAccount")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.newHere") : t("auth.alreadyHave")}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-foreground underline-offset-4 hover:underline">
              {mode === "signin" ? t("auth.createAnAccount") : t("common.signIn")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}
