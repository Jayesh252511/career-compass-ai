import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Headphones, Sun, Moon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/lib/constants";
import { i18n, setStoredLanguage } from "@/i18n";
import { useTheme } from "@/hooks/use-theme";

export function TopBar({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolved, toggle } = useTheme();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  const currentLang = i18n.language || "en";
  const langMeta = LANGUAGES.find((l) => l.code === currentLang);
  const setLang = (code: string) => {
    i18n.changeLanguage(code);
    setStoredLanguage(code);
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
        <Link to="/"><Logo /></Link>
        <div className="flex items-center gap-2">
          {rightSlot}
          {/* Dark/Light toggle */}
          <button
            onClick={toggle}
            className="h-9 w-9 grid place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
            aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 px-3 rounded-full border border-border bg-background text-xs text-muted-foreground hover:text-foreground">
                {langMeta?.flag} {langMeta?.native ?? "English"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-[320px] overflow-auto">
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                {t("templates.stepLanguage")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGES.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}>
                  <span className="mr-2">{l.flag}</span>
                  <span className="flex-1">{l.native}</span>
                  {currentLang === l.code && <span className="text-[10px] text-muted-foreground">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground text-sm font-medium">
                  {(user.email?.[0] ?? "U").toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs text-muted-foreground">{t("nav.signedInAs")}</p>
                  <p className="text-sm truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard"><UserIcon className="mr-2 h-4 w-4" /> {t("common.dashboard")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="md:hidden cursor-pointer"
                  onClick={() => window.dispatchEvent(new Event("open-support"))}
                >
                  <Headphones className="mr-2 h-4 w-4" /> Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link to="/auth">{t("common.signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
