import type { ResumeContent } from "@/lib/constants";
import type { ResumeSectionLabels } from "@/lib/resume/section-labels";
import { useTranslation } from "react-i18next";

type Props = {
  content: ResumeContent;
  template: "ats" | "modern" | "fresher";
  labels?: ResumeSectionLabels;
};

export function ResumePreview({ content, template, labels }: Props) {
  if (template === "modern") return <ModernTemplate c={content} labels={labels} />;
  if (template === "fresher") return <FresherTemplate c={content} labels={labels} />;
  return <AtsTemplate c={content} labels={labels} />;
}

const C = (s?: string) => s && s.trim().length > 0;
const A = <T,>(a?: T[]) => Array.isArray(a) && a.length > 0;

function Empty() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center p-12 text-center">
      <div className="max-w-xs">
        <div className="mx-auto h-14 w-14 rounded-full bg-accent grid place-items-center text-primary font-serif text-3xl">L</div>
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
