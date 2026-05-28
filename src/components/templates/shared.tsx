import { useTranslation } from "react-i18next";
import type { ResumeContent } from "@/lib/constants";

export const C = (s?: string) => s && s.trim().length > 0;
export const A = <T,>(a?: T[]) => Array.isArray(a) && a.length > 0;

export function Empty() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center p-12 text-center">
      <div className="max-w-xs">
        <div className="mx-auto h-14 w-14 rounded-full bg-accent grid place-items-center text-primary font-serif text-3xl">Z</div>
        <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
          {t("builder.emptyResumeState")}
        </p>
      </div>
    </div>
  );
}

export function isEmpty(c: ResumeContent) {
  return !C(c.fullName) && !A(c.experience) && !A(c.education) && !A(c.projects) && !A(c.skills) && !C(c.summary);
}
