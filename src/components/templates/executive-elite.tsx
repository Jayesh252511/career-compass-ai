import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-[14px] font-bold tracking-[0.15em] uppercase text-neutral-900 whitespace-nowrap">
          {title}
        </h2>
        <div className="h-[1px] w-full bg-neutral-200"></div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export function ExecutiveElite({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-12 py-12 text-[13px] leading-[1.7] text-neutral-800 font-serif max-w-[850px] mx-auto bg-white">
      <header className="mb-10">
        <h1 className="text-[36px] font-bold tracking-tight text-neutral-900 mb-2 leading-none">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="text-[16px] text-neutral-500 font-medium mb-4 tracking-wide">{c.headline}</p>}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-neutral-500 font-sans tracking-wide uppercase">
          {C(c.email) && <span>{c.email}</span>}
          {C(c.phone) && <span>{c.phone}</span>}
          {C(c.location) && <span>{c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>{l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <Section title={labels?.summary ?? "Executive Summary"}>
          <p className="text-justify text-[13.5px] leading-[1.8]">{c.summary}</p>
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Professional Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-[15px] text-neutral-900">{e.title}</h3>
                  <p className="text-[14px] text-neutral-600 font-medium mt-0.5">{e.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-sans text-neutral-500 font-medium uppercase tracking-wider">
                    {[e.start, e.end].filter(Boolean).join(" — ")}
                  </p>
                  {C(e.location) && <p className="text-[11.5px] font-sans text-neutral-400 mt-0.5">{e.location}</p>}
                </div>
              </div>
              <ul className="list-none space-y-2 mt-3">
                {e.bullets?.map((b, j) => (
                  <li key={j} className="relative pl-4 text-justify">
                    <span className="absolute left-0 top-[0.4em] w-1 h-1 bg-neutral-300 rounded-full"></span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i} className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-[14px] text-neutral-900">{ed.degree}</h3>
                <p className="text-[13.5px] text-neutral-600 mt-0.5">{ed.school}</p>
                {C(ed.notes) && <p className="text-[12.5px] text-neutral-500 mt-1 italic">{ed.notes}</p>}
              </div>
              <div className="text-right">
                <p className="text-[12px] font-sans text-neutral-500 font-medium uppercase tracking-wider">
                  {[ed.start, ed.end].filter(Boolean).join(" — ")}
                </p>
                {C(ed.location) && <p className="text-[11.5px] font-sans text-neutral-400 mt-0.5">{ed.location}</p>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* For executives, projects and skills are usually less prominent, but we still support them */}
      {A(c.projects) && (
        <Section title={labels?.projects ?? "Key Initiatives"}>
          {c.projects!.map((p, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <h3 className="font-bold text-[14px] text-neutral-900 mb-1">{p.name}</h3>
              {C(p.description) && <p className="text-[13px] mb-2">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-none space-y-1 mt-1">
                  {p.bullets!.map((b, j) => (
                    <li key={j} className="relative pl-4 text-justify">
                      <span className="absolute left-0 top-[0.4em] w-1 h-1 bg-neutral-300 rounded-full"></span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
        <Section title={labels?.skills ?? "Core Competencies"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {A(c.skills) && (
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest text-neutral-400 mb-2">Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {c.skills!.map((s, i) => <span key={i} className="px-3 py-1 bg-neutral-50 text-neutral-700 text-[12px] border border-neutral-100">{s}</span>)}
                </div>
              </div>
            )}
            <div className="space-y-4">
              {A(c.languages) && (
                <div>
                  <h4 className="text-[11px] font-sans uppercase tracking-widest text-neutral-400 mb-2">{labels?.languages ?? "Languages"}</h4>
                  <p className="text-[13px]">{c.languages!.join(", ")}</p>
                </div>
              )}
              {A(c.certifications) && (
                <div>
                  <h4 className="text-[11px] font-sans uppercase tracking-widest text-neutral-400 mb-2">{labels?.certifications ?? "Certifications"}</h4>
                  <p className="text-[13px]">
                    {c.certifications!.map(cert => `${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}`).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
