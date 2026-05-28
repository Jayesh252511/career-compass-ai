import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest border-b-[1.5px] border-slate-800 pb-1 mb-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function ModernCorporate({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[12px] leading-[1.6] text-slate-800 font-serif max-w-[850px] mx-auto bg-white">
      <header className="mb-6 flex flex-col items-center border-b-[1.5px] border-slate-800 pb-4">
        <h1 className="text-[32px] font-bold tracking-tight text-slate-900 mb-1">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="text-[14px] text-slate-600 font-semibold mb-2">{c.headline}</p>}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 font-sans tracking-wide">
          {C(c.email) && <span>{c.email}</span>}
          {C(c.phone) && <span>| {c.phone}</span>}
          {C(c.location) && <span>| {c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>| {l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <Section title={labels?.summary ?? "Professional Summary"}>
          <p className="text-justify leading-relaxed">{c.summary}</p>
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Professional Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="font-bold text-[13.5px] text-slate-900">{e.company}</p>
                {C(e.location) && <p className="text-[11.5px] font-sans text-slate-600">{e.location}</p>}
              </div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="italic text-[12.5px] text-slate-800">{e.title}</p>
                <p className="text-[11.5px] font-sans font-medium">
                  {[e.start, e.end].filter(Boolean).join(" - ")}
                </p>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 mt-1 marker:text-slate-500">
                {e.bullets?.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="font-bold text-[13.5px] text-slate-900">{ed.school}</p>
                {C(ed.location) && <p className="text-[11.5px] font-sans text-slate-600">{ed.location}</p>}
              </div>
              <div className="flex justify-between items-baseline">
                <p className="italic text-[12.5px] text-slate-800">{ed.degree}</p>
                <p className="text-[11.5px] font-sans font-medium">
                  {[ed.start, ed.end].filter(Boolean).join(" - ")}
                </p>
              </div>
              {C(ed.notes) && <p className="text-[11.5px] mt-1">{ed.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Projects & Leadership"}>
          {c.projects!.map((p, i) => (
            <div key={i} className="mb-2">
              <p className="font-bold text-[13px] text-slate-900 mb-0.5">{p.name}</p>
              {C(p.description) && <p className="text-[12px] italic mb-1">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-disc pl-5 space-y-0.5 marker:text-slate-500">
                  {p.bullets!.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
        <Section title={labels?.skills ?? "Additional Information"}>
          <div className="space-y-1.5 font-sans text-[11.5px]">
            {A(c.skills) && (
              <p>
                <span className="font-bold text-slate-900">Skills: </span>
                {c.skills!.join(", ")}
              </p>
            )}
            {A(c.languages) && (
              <p>
                <span className="font-bold text-slate-900">{labels?.languages ?? "Languages"}: </span>
                {c.languages!.join(", ")}
              </p>
            )}
            {A(c.certifications) && (
              <p>
                <span className="font-bold text-slate-900">{labels?.certifications ?? "Certifications"}: </span>
                {c.certifications!.map(cert => `${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}`).join(", ")}
              </p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
