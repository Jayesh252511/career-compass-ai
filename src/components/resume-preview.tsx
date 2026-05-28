import { useEffect } from "react";
import { toast } from "sonner";
import type { ResumeContent, TemplateType } from "@/lib/constants";
import type { ResumeSectionLabels } from "@/lib/resume/section-labels";
import { useTranslation } from "react-i18next";

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

  return (
    <div 
      className={`relative h-full w-full ${!isPremium ? "select-none" : ""}`}
      onContextMenu={(e) => { if (!isPremium) { e.preventDefault(); toast.error("Right-click is disabled for free resumes. Upgrade to Premium to unlock!"); } }}
      onCopy={(e) => { if (!isPremium) { e.preventDefault(); } }}
    >
      {template === "modern" ? (
        <ModernTemplate c={content} labels={labels} />
      ) : template === "fresher" ? (
        <FresherTemplate c={content} labels={labels} />
      ) : template === "executive" ? (
        <ExecutiveTemplate c={content} labels={labels} />
      ) : template === "corporate" ? (
        <CorporateTemplate c={content} labels={labels} />
      ) : (
        <AtsTemplate c={content} labels={labels} />
      )}
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

const C = (s?: string) => s && s.trim().length > 0;
const A = <T,>(a?: T[]) => Array.isArray(a) && a.length > 0;

function Empty() {
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

function isEmpty(c: ResumeContent) {
  return !C(c.fullName) && !A(c.experience) && !A(c.education) && !A(c.projects) && !A(c.skills) && !C(c.summary);
}

/* ---------------- ATS Professional ---------------- */
function AtsTemplate({ c, labels }: { c: ResumeContent; labels?: ResumeSectionLabels }) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[13px] leading-[1.55] text-neutral-900 font-sans">
      <header className="border-b border-neutral-300 pb-4">
        <h1 className="text-[26px] font-semibold tracking-tight">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="mt-1 text-[13px] text-neutral-700">{c.headline}</p>}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-neutral-600">
          {C(c.email) && <span>{c.email}</span>}
          {C(c.phone) && <span>· {c.phone}</span>}
          {C(c.location) && <span>· {c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>· {l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <Section title={labels?.summary ?? "Summary"}>
          <p>{c.summary}</p>
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between gap-4">
                <p className="font-semibold">{e.title} · <span className="font-normal">{e.company}</span></p>
                <p className="text-[11.5px] text-neutral-600 whitespace-nowrap">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </p>
              </div>
              {C(e.location) && <p className="text-[11.5px] text-neutral-600">{e.location}</p>}
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <div className="flex justify-between gap-4">
                <p className="font-semibold">{ed.degree} · <span className="font-normal">{ed.school}</span></p>
                <p className="text-[11.5px] text-neutral-600 whitespace-nowrap">
                  {[ed.start, ed.end].filter(Boolean).join(" – ")}
                </p>
              </div>
              {C(ed.notes) && <p className="text-[12px] text-neutral-700">{ed.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="font-semibold">{p.name}{p.tech && p.tech.length > 0 && <span className="font-normal text-neutral-700"> · {p.tech.join(", ")}</span>}</p>
              {C(p.description) && <p>{p.description}</p>}
              {A(p.bullets) && <ul className="list-disc pl-5">{p.bullets!.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </Section>
      )}

      {A(c.skills) && (
        <Section title={labels?.skills ?? "Skills"}><p>{c.skills!.join(" · ")}</p></Section>
      )}

      {A(c.certifications) && (
        <Section title={labels?.certifications ?? "Certifications"}>
          {c.certifications!.map((cert, i) => (
            <p key={i}>{cert.name}{cert.issuer && ` — ${cert.issuer}`}{cert.year && ` (${cert.year})`}</p>
          ))}
        </Section>
      )}

      {A(c.languages) && <Section title={labels?.languages ?? "Languages"}><p>{c.languages!.join(" · ")}</p></Section>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 mb-1.5">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

/* ---------------- Modern Minimal ---------------- */
function ModernTemplate({ c, labels }: { c: ResumeContent; labels?: ResumeSectionLabels }) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="grid grid-cols-[1fr_2fr] text-[12.5px] text-neutral-900 font-sans min-h-full">
      <aside className="bg-neutral-50 p-8 border-r border-neutral-200">
        <h1 className="font-display text-[22px] font-semibold leading-tight">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="mt-1 text-[12px] text-neutral-600">{c.headline}</p>}
        <div className="mt-5 space-y-1 text-[11.5px] text-neutral-700">
          {C(c.email) && <p>{c.email}</p>}
          {C(c.phone) && <p>{c.phone}</p>}
          {C(c.location) && <p>{c.location}</p>}
          {A(c.links) && c.links!.map((l, i) => <p key={i}>{l.label}</p>)}
        </div>
        {A(c.skills) && (
          <Block title={labels?.skills ?? "Skills"}>
            <ul className="space-y-0.5">{c.skills!.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </Block>
        )}
        {A(c.languages) && (
          <Block title={labels?.languages ?? "Languages"}><p>{c.languages!.join(", ")}</p></Block>
        )}
        {A(c.certifications) && (
          <Block title={labels?.certifications ?? "Certifications"}>
            {c.certifications!.map((cert, i) => (
              <p key={i}>{cert.name}{cert.year && ` · ${cert.year}`}</p>
            ))}
          </Block>
        )}
      </aside>
      <main className="p-8">
        {C(c.summary) && <ModBlock title={labels?.profile ?? "Profile"}><p className="leading-relaxed">{c.summary}</p></ModBlock>}
        {A(c.experience) && (
          <ModBlock title={labels?.experience ?? "Experience"}>
            {c.experience!.map((e, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="font-semibold">{e.title}</p>
                <p className="text-[11.5px] text-neutral-600">{e.company}{e.location && ` · ${e.location}`} · {[e.start, e.end].filter(Boolean).join(" – ")}</p>
                <ul className="mt-1 list-disc pl-5 space-y-0.5">
                  {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </ModBlock>
        )}
        {A(c.projects) && (
          <ModBlock title={labels?.projects ?? "Projects"}>
            {c.projects!.map((p, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <p className="font-semibold">{p.name}</p>
                {C(p.description) && <p>{p.description}</p>}
                {A(p.bullets) && <ul className="list-disc pl-5">{p.bullets!.map((b, j) => <li key={j}>{b}</li>)}</ul>}
                {A(p.tech) && <p className="text-[11px] text-neutral-600 mt-0.5">{p.tech!.join(" · ")}</p>}
              </div>
            ))}
          </ModBlock>
        )}
        {A(c.education) && (
          <ModBlock title={labels?.education ?? "Education"}>
            {c.education!.map((ed, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <p className="font-semibold">{ed.degree}</p>
                <p className="text-[11.5px] text-neutral-600">{ed.school} · {[ed.start, ed.end].filter(Boolean).join(" – ")}</p>
                {C(ed.notes) && <p>{ed.notes}</p>}
              </div>
            ))}
          </ModBlock>
        )}
      </main>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-1.5">{title}</h3>
      <div className="text-[12px]">{children}</div>
    </div>
  );
}
function ModBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h2 className="font-display text-[14px] font-semibold mb-1.5">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

/* ---------------- Fresher Smart ---------------- */
function FresherTemplate({ c, labels }: { c: ResumeContent; labels?: ResumeSectionLabels }) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[13px] leading-[1.55] text-neutral-900 font-sans">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="mt-1 text-neutral-700">{c.headline}</p>}
        <div className="mt-2 flex flex-wrap gap-x-3 text-[11.5px] text-neutral-600">
          {C(c.email) && <span>{c.email}</span>}
          {C(c.phone) && <span>· {c.phone}</span>}
          {C(c.location) && <span>· {c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>· {l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && <Section title={labels?.about ?? "About"}><p>{c.summary}</p></Section>}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="font-semibold">{p.name}</p>
              {C(p.description) && <p>{p.description}</p>}
              {A(p.bullets) && <ul className="list-disc pl-5 mt-0.5">{p.bullets!.map((b, j) => <li key={j}>{b}</li>)}</ul>}
              {A(p.tech) && <p className="text-[11.5px] text-neutral-600 mt-0.5">{p.tech!.join(" · ")}</p>}
            </div>
          ))}
        </Section>
      )}

      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <div className="flex justify-between">
                <p className="font-semibold">{ed.degree} · <span className="font-normal">{ed.school}</span></p>
                <p className="text-[11.5px] text-neutral-600">{[ed.start, ed.end].filter(Boolean).join(" – ")}</p>
              </div>
              {C(ed.notes) && <p>{ed.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between gap-4">
                <p className="font-semibold">{e.title} · <span className="font-normal">{e.company}</span></p>
                <p className="text-[11.5px] text-neutral-600 whitespace-nowrap">{[e.start, e.end].filter(Boolean).join(" – ")}</p>
              </div>
              <ul className="mt-1 list-disc pl-5">{e.bullets?.map((b, j) => <li key={j}>{b}</li>)}</ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.skills) && <Section title={labels?.skills ?? "Skills"}><p>{c.skills!.join(" · ")}</p></Section>}
      {A(c.certifications) && (
        <Section title={labels?.certifications ?? "Certifications"}>
          {c.certifications!.map((cert, i) => <p key={i}>{cert.name}{cert.issuer && ` — ${cert.issuer}`}{cert.year && ` (${cert.year})`}</p>)}
        </Section>
      )}
      {A(c.languages) && <Section title={labels?.languages ?? "Languages"}><p>{c.languages!.join(" · ")}</p></Section>}
    </div>
  );
}

/* ---------------- Executive Leader ---------------- */
function ExecutiveTemplate({ c, labels }: { c: ResumeContent; labels?: ResumeSectionLabels }) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-12 py-12 text-[12px] leading-[1.6] text-neutral-900 bg-white min-h-full">
      <header className="text-center mb-6">
        <h1 className="font-serif text-[32px] uppercase tracking-widest text-neutral-950 mb-2">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="font-serif italic text-[14px] text-neutral-700 mb-2">{c.headline}</p>}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-sans text-neutral-600 uppercase tracking-wider">
          {C(c.location) && <span>{c.location}</span>}
          {C(c.phone) && <span>• {c.phone}</span>}
          {C(c.email) && <span>• {c.email}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>• {l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <ExecSection title={labels?.summary ?? "Executive Summary"}>
          <p className="text-justify font-serif text-[13px] leading-relaxed text-neutral-800">{c.summary}</p>
        </ExecSection>
      )}

      {A(c.experience) && (
        <ExecSection title={labels?.experience ?? "Professional Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-sans font-bold text-[13px] text-neutral-900">{e.company}</h3>
                <span className="font-sans text-[11px] font-semibold text-neutral-600 uppercase tracking-wide">
                  {C(e.location) ? `${e.location} | ` : ""}{[e.start, e.end].filter(Boolean).join(" – ")}
                </span>
              </div>
              <p className="font-serif italic text-[12.5px] text-neutral-800 mb-2">{e.title}</p>
              <ul className="list-disc pl-5 space-y-1 font-serif text-[12.5px] text-neutral-800">
                {e.bullets?.map((b, j) => <li key={j} className="pl-1">{b}</li>)}
              </ul>
            </div>
          ))}
        </ExecSection>
      )}

      {A(c.education) && (
        <ExecSection title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-sans font-bold text-[13px] text-neutral-900">{ed.school}</h3>
                <span className="font-sans text-[11px] font-semibold text-neutral-600 uppercase tracking-wide">
                  {[ed.start, ed.end].filter(Boolean).join(" – ")}
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-0.5">
                <p className="font-serif italic text-[12.5px] text-neutral-800">{ed.degree}</p>
                {C(ed.location) && <span className="font-serif text-[11.5px] text-neutral-500">{ed.location}</span>}
              </div>
              {C(ed.notes) && <p className="font-serif text-[12px] text-neutral-700 mt-1">{ed.notes}</p>}
            </div>
          ))}
        </ExecSection>
      )}

      {A(c.projects) && (
        <ExecSection title={labels?.projects ?? "Key Initiatives & Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-sans font-bold text-[13px] text-neutral-900">{p.name}</h3>
              </div>
              {C(p.description) && <p className="font-serif italic text-[12px] text-neutral-800 mb-1">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-disc pl-5 space-y-1 font-serif text-[12.5px] text-neutral-800">
                  {p.bullets!.map((b, j) => <li key={j} className="pl-1">{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </ExecSection>
      )}

      <div className="grid grid-cols-2 gap-8">
        {A(c.skills) && (
          <ExecSection title={labels?.skills ?? "Core Competencies"}>
            <p className="font-sans text-[12px] leading-relaxed text-neutral-800">
              {c.skills!.join(" • ")}
            </p>
          </ExecSection>
        )}
        
        {(A(c.certifications) || A(c.languages)) && (
          <div className="space-y-4 mt-1">
            {A(c.certifications) && (
              <div>
                <h2 className="font-sans text-[11px] font-bold uppercase tracking-widest text-neutral-900 border-b-[1.5px] border-neutral-900 pb-1 mb-2">
                  {labels?.certifications ?? "Certifications"}
                </h2>
                {c.certifications!.map((cert, i) => (
                  <p key={i} className="font-serif text-[12px] text-neutral-800">
                    {cert.name}{cert.issuer && ` — ${cert.issuer}`}{cert.year && ` (${cert.year})`}
                  </p>
                ))}
              </div>
            )}
            {A(c.languages) && (
              <div>
                <h2 className="font-sans text-[11px] font-bold uppercase tracking-widest text-neutral-900 border-b-[1.5px] border-neutral-900 pb-1 mb-2">
                  {labels?.languages ?? "Languages"}
                </h2>
                <p className="font-serif text-[12px] text-neutral-800">{c.languages!.join(" • ")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExecSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-sans text-[13px] font-bold uppercase tracking-widest text-neutral-900 border-b-[1.5px] border-neutral-900 pb-1.5 mb-3">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

/* ---------------- Corporate Classic ---------------- */
function CorporateTemplate({ c, labels }: { c: ResumeContent; labels?: ResumeSectionLabels }) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[11.5px] leading-[1.4] text-black font-serif bg-white min-h-full">
      <header className="text-center mb-4 border-b border-black pb-2">
        <h1 className="text-[24px] font-bold font-serif mb-1 uppercase">{c.fullName ?? "Your Name"}</h1>
        <div className="flex flex-wrap justify-center gap-x-2 text-[11px] text-black font-sans">
          {C(c.location) && <span>{c.location}</span>}
          {C(c.phone) && <span>| {c.phone}</span>}
          {C(c.email) && <span>| {c.email}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>| {l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <CorpSection title={labels?.summary ?? "Professional Summary"}>
          <p className="mb-1">{c.summary}</p>
        </CorpSection>
      )}

      {A(c.education) && (
        <CorpSection title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">{ed.school}</span>
                <span className="font-sans text-[10.5px]">{[ed.start, ed.end].filter(Boolean).join(" – ")}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="italic">{ed.degree}</span>
                <span className="font-sans text-[10.5px]">{ed.location}</span>
              </div>
              {C(ed.notes) && <p className="mt-0.5">{ed.notes}</p>}
            </div>
          ))}
        </CorpSection>
      )}

      {A(c.experience) && (
        <CorpSection title={labels?.experience ?? "Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">{e.company}</span>
                <span className="font-sans text-[10.5px]">{[e.start, e.end].filter(Boolean).join(" – ")}</span>
              </div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="italic">{e.title}</span>
                <span className="font-sans text-[10.5px]">{e.location}</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {e.bullets?.map((b, j) => <li key={j} className="pl-1">{b}</li>)}
              </ul>
            </div>
          ))}
        </CorpSection>
      )}

      {A(c.projects) && (
        <CorpSection title={labels?.projects ?? "Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="font-bold">{p.name}</span>
                {A(p.tech) && <span className="font-sans italic text-[10px] text-neutral-700">{p.tech!.join(", ")}</span>}
              </div>
              {C(p.description) && <p className="italic mb-0.5">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-disc pl-4 space-y-0.5">
                  {p.bullets!.map((b, j) => <li key={j} className="pl-1">{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </CorpSection>
      )}

      {(A(c.skills) || A(c.certifications) || A(c.languages)) && (
        <CorpSection title={labels?.skills ?? "Skills & Interests"}>
          {A(c.skills) && (
            <div className="mb-1">
              <span className="font-bold">{labels?.skills ?? "Skills"}: </span>
              <span>{c.skills!.join(", ")}</span>
            </div>
          )}
          {A(c.certifications) && (
            <div className="mb-1">
              <span className="font-bold">{labels?.certifications ?? "Certifications"}: </span>
              <span>{c.certifications!.map(c => c.name).join(", ")}</span>
            </div>
          )}
          {A(c.languages) && (
            <div>
              <span className="font-bold">{labels?.languages ?? "Languages"}: </span>
              <span>{c.languages!.join(", ")}</span>
            </div>
          )}
        </CorpSection>
      )}
    </div>
  );
}

function CorpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h2 className="font-sans text-[12px] font-bold uppercase border-b border-black pb-0.5 mb-2">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
