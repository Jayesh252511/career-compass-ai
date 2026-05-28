import { useEffect } from "react";
import { toast } from "sonner";
import type { ResumeContent, TemplateType } from "@/lib/constants";
import type { ResumeSectionLabels } from "@/lib/resume/section-labels";
import { TEMPLATE_COMPONENTS } from "./templates";
import { isEmpty } from "./templates/shared";

type Props = {
  content: ResumeContent;
  template: TemplateType;
  labels?: ResumeSectionLabels;
  isPremium?: boolean;
  userEmail?: string;
};

function maskEmail(email?: string) {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  const masked = name.length > 2 ? name.substring(0, 2) + "***" : name + "***";
  return `${masked}@${domain}`;
}

export function ResumePreview({ content, template, labels, isPremium = false, userEmail }: Props) {
  const hasContent = !isEmpty(content);

  useEffect(() => {
    if (isPremium) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c";
      if (isCopy) {
        e.preventDefault();
        toast.error("Copying text is locked for free resumes. Upgrade to Premium to copy text or download clean PDFs!", {
          id: "copy-lock-toast",
          duration: 4000,
        });
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dragstart", handleDragStart);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("dragstart", handleDragStart);
    };
  }, [isPremium]);

  const TemplateComponent = TEMPLATE_COMPONENTS[template] || TEMPLATE_COMPONENTS["global-standard"];

  return (
    <div 
      className={`relative h-full w-full ${!isPremium ? "select-none" : ""}`}
      onContextMenu={(e) => { if (!isPremium) { e.preventDefault(); toast.error("Right-click is disabled for free resumes. Upgrade to Premium to unlock!"); } }}
      onCopy={(e) => { if (!isPremium) { e.preventDefault(); } }}
    >
      <TemplateComponent c={content} labels={labels} />

      {!isPremium && hasContent && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10 grid grid-cols-3 grid-rows-10 gap-x-4 gap-y-12 p-6 opacity-[0.07] rotate-[-28deg] scale-150 print:opacity-[0.08] print:scale-150">
          {Array.from({ length: 30 }).map((_, idx) => (
            <div key={idx} className="text-[10px] font-sans font-extrabold tracking-[0.2em] text-neutral-800 uppercase whitespace-nowrap select-none text-center">
              Made with resume-zen Ai {userEmail ? `· ${maskEmail(userEmail)}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
