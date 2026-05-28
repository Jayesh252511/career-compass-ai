import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 mb-2">
      <h2 className="text-[13px] font-bold uppercase tracking-wider border-b-2 border-neutral-800 pb-1 mb-3 text-neutral-900">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function GlobalStandard({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[12.5px] leading-[1.6] text-neutral-900 font-serif max-w-[850px] mx-auto bg-white">
      <header className="text-center mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-neutral-900 mb-1">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="text-[14px] text-neutral-700 font-medium mb-2">{c.headline}</p>}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-neutral-600 font-sans">
          {C(c.email) && <span>{c.email}</span>}
          {C(c.phone) && <span>• {c.phone}</span>}
          {C(c.location) && <span>• {c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>• {l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <Section title={labels?.summary ?? "Summary"}>
          <p className="text-justify">{c.summary}</p>
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Professional Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <p className="font-bold text-[13px]">{e.title} <span className="font-normal italic">at {e.company}</span></p>
                <p className="text-[11.5px] font-sans whitespace-nowrap">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </p>
              </div>
              {C(e.location) && <p className="text-[11px] font-sans text-neutral-600 mb-1">{e.location}</p>}
              <ul className="list-disc pl-5 space-y-1 mt-1 marker:text-neutral-500">
                {e.bullets?.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <p className="font-bold text-[13px]">{ed.degree} <span className="font-normal italic">from {ed.school}</span></p>
                <p className="text-[11.5px] font-sans whitespace-nowrap">
                  {[ed.start, ed.end].filter(Boolean).join(" – ")}
                </p>
              </div>
              {C(ed.location) && <p className="text-[11px] font-sans text-neutral-600">{ed.location}</p>}
              {C(ed.notes) && <p className="text-[11.5px] mt-1">{ed.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i}>
              <p className="font-bold text-[13px] mb-1">{p.name}</p>
              {C(p.description) && <p className="text-[12.5px] mb-1">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-disc pl-5 space-y-1 mt-1 marker:text-neutral-500">
                  {p.bullets!.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
                </ul>
              )}
              {A(p.tech) && (
                <p className="text-[11px] font-sans text-neutral-600 mt-1">
                  <span className="font-semibold">Tech:</span> {p.tech!.join(", ")}
                </p>
              )}
            </div>
          ))}
        </Section>
      )}

      {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
        <Section title={labels?.skills ?? "Additional Information"}>
          <div className="space-y-2">
            {A(c.skills) && (
              <p className="text-[12.5px]">
                <span className="font-bold text-[12px] uppercase tracking-wider mr-2">Skills:</span>
                {c.skills!.join(", ")}
              </p>
            )}
            {A(c.languages) && (
              <p className="text-[12.5px]">
                <span className="font-bold text-[12px] uppercase tracking-wider mr-2">{labels?.languages ?? "Languages"}:</span>
                {c.languages!.join(", ")}
              </p>
            )}
            {A(c.certifications) && (
              <p className="text-[12.5px]">
                <span className="font-bold text-[12px] uppercase tracking-wider mr-2">{labels?.certifications ?? "Certifications"}:</span>
                {c.certifications!.map(cert => `${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}`).join(", ")}
              </p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
