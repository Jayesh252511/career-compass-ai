import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="text-[14px] font-bold text-sky-900 uppercase tracking-widest border-b-[2px] border-sky-100 pb-1 mb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FresherSmart({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[12.5px] leading-[1.6] text-slate-700 font-sans max-w-[850px] mx-auto bg-white">
      <header className="mb-6">
        <h1 className="text-[32px] font-extrabold tracking-tight text-sky-950 mb-1">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="text-[15px] text-sky-800 font-semibold mb-3">{c.headline}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-slate-500 font-medium">
          {C(c.email) && <span className="flex items-center gap-1">{c.email}</span>}
          {C(c.phone) && <span className="flex items-center gap-1">| {c.phone}</span>}
          {C(c.location) && <span className="flex items-center gap-1">| {c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i} className="flex items-center gap-1">| {l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <Section title={labels?.summary ?? "About Me"}>
          <p className="text-justify leading-relaxed">{c.summary}</p>
        </Section>
      )}

      {/* Freshers: Education First */}
      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="font-bold text-[14px] text-slate-900">{ed.degree}</p>
                <p className="text-[12px] font-semibold text-sky-800 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded">
                  {[ed.start, ed.end].filter(Boolean).join(" – ")}
                </p>
              </div>
              <p className="text-[13px] text-slate-700 font-medium">{ed.school}{C(ed.location) ? `, ${ed.location}` : ""}</p>
              {C(ed.notes) && <p className="text-[12.5px] mt-1.5 text-slate-600">{ed.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Freshers: Projects Second */}
      {A(c.projects) && (
        <Section title={labels?.projects ?? "Key Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i}>
              <div className="flex items-baseline gap-3 mb-1">
                <p className="font-bold text-[14px] text-slate-900">{p.name}</p>
                {A(p.tech) && <p className="text-[11.5px] font-medium text-sky-700">{p.tech!.join(" · ")}</p>}
              </div>
              {C(p.description) && <p className="text-[13px] mb-2">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-none space-y-1 mt-1">
                  {p.bullets!.map((b, j) => (
                    <li key={j} className="relative pl-4 text-justify">
                      <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 bg-sky-200 rounded-full"></span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Freshers: Experience Third (usually internships) */}
      {A(c.experience) && (
        <Section title={labels?.experience ?? "Internships & Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="font-bold text-[14px] text-slate-900">{e.title}</p>
                <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </p>
              </div>
              <p className="text-[13px] text-slate-700 font-medium mb-1.5">{e.company}{C(e.location) ? ` · ${e.location}` : ""}</p>
              <ul className="list-none space-y-1">
                {e.bullets?.map((b, j) => (
                  <li key={j} className="relative pl-4 text-justify">
                    <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 bg-sky-200 rounded-full"></span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
        <Section title={labels?.skills ?? "Skills & Certifications"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {A(c.skills) && (
              <div>
                <p className="font-bold text-[12px] text-slate-900 uppercase tracking-wider mb-2">Technical Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.skills!.map((s, i) => <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11.5px] font-medium rounded-md">{s}</span>)}
                </div>
              </div>
            )}
            <div className="space-y-4">
              {A(c.certifications) && (
                <div>
                  <p className="font-bold text-[12px] text-slate-900 uppercase tracking-wider mb-1">{labels?.certifications ?? "Certifications"}</p>
                  <ul className="space-y-1 text-[12.5px]">
                    {c.certifications!.map((cert, i) => <li key={i}>• {cert.name}{cert.issuer ? ` (${cert.issuer})` : ''}</li>)}
                  </ul>
                </div>
              )}
              {A(c.languages) && (
                <div>
                  <p className="font-bold text-[12px] text-slate-900 uppercase tracking-wider mb-1">{labels?.languages ?? "Languages"}</p>
                  <p className="text-[12.5px]">{c.languages!.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
