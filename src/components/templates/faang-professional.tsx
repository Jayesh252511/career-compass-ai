import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-3 mb-2">
      <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1 mb-2">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function FaangProfessional({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  
  // FAANG format usually likes skills at the top or bottom, very compact
  
  return (
    <div className="px-8 py-8 text-[12px] leading-[1.5] text-slate-800 font-sans max-w-[850px] mx-auto bg-white">
      <header className="text-center mb-4">
        <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 mb-1">{c.fullName ?? "Your Name"}</h1>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[11.5px] text-slate-600">
          {C(c.email) && <span>{c.email}</span>}
          {C(c.phone) && <span>| {c.phone}</span>}
          {C(c.location) && <span>| {c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>| {l.label}</span>)}
        </div>
      </header>

      {/* Skills often go first in FAANG for quick parsing, but we stick to traditional order if summary exists */}
      
      {C(c.summary) && (
        <Section title={labels?.summary ?? "Summary"}>
          <p className="text-justify leading-relaxed">{c.summary}</p>
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <p className="font-bold text-[13px] text-slate-900">{e.title} <span className="font-normal text-slate-600">at {e.company}</span></p>
                <p className="text-[11px] font-semibold text-slate-600">
                  {[e.start, e.end].filter(Boolean).join(" - ")}
                  {C(e.location) && <span className="font-normal"> | {e.location}</span>}
                </p>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 mt-1 marker:text-slate-400">
                {e.bullets?.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-baseline gap-2 mb-0.5">
                <p className="font-bold text-[13px] text-slate-900">{p.name}</p>
                {A(p.tech) && (
                  <p className="text-[10.5px] text-slate-500 italic">| {p.tech!.join(", ")}</p>
                )}
              </div>
              {C(p.description) && <p className="text-[11.5px] mb-1">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-disc pl-4 space-y-0.5 marker:text-slate-400">
                  {p.bullets!.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {A(c.education) && (
          <div className="md:col-span-1">
            <Section title={labels?.education ?? "Education"}>
              {c.education!.map((ed, i) => (
                <div key={i} className="mb-1">
                  <p className="font-bold text-[12.5px] text-slate-900">{ed.school}</p>
                  <p className="text-[12px]">{ed.degree}</p>
                  <p className="text-[11px] text-slate-500">
                    {[ed.start, ed.end].filter(Boolean).join(" - ")}
                  </p>
                </div>
              ))}
            </Section>
          </div>
        )}

        {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
          <div className="md:col-span-1">
            <Section title={labels?.skills ?? "Technical Skills"}>
              <div className="space-y-1">
                {A(c.skills) && (
                  <p className="text-[12px]">
                    <span className="font-bold text-slate-800">Languages & Tools: </span>
                    {c.skills!.join(", ")}
                  </p>
                )}
                {A(c.languages) && (
                  <p className="text-[12px]">
                    <span className="font-bold text-slate-800">{labels?.languages ?? "Spoken"}: </span>
                    {c.languages!.join(", ")}
                  </p>
                )}
                {A(c.certifications) && (
                  <p className="text-[12px]">
                    <span className="font-bold text-slate-800">{labels?.certifications ?? "Certs"}: </span>
                    {c.certifications!.map(cert => cert.name).join(", ")}
                  </p>
                )}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
