import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-[13.5px] font-bold text-amber-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
        <span>{title}</span>
        <span className="h-[1px] flex-1 bg-amber-100"></span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function CreativeProfessional({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[12.5px] leading-[1.65] text-stone-700 font-sans max-w-[850px] mx-auto bg-[#FCFBF9]">
      <header className="mb-10 text-center">
        <h1 className="text-[34px] font-serif italic tracking-tight text-amber-950 mb-2">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="text-[15px] text-stone-500 tracking-wide uppercase font-medium mb-4">{c.headline}</p>}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11.5px] text-stone-400 font-medium tracking-wide">
          {C(c.email) && <span>{c.email}</span>}
          {C(c.phone) && <span>• {c.phone}</span>}
          {C(c.location) && <span>• {c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>• {l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <Section title={labels?.summary ?? "Profile"}>
          <p className="text-center max-w-[90%] mx-auto text-[13.5px] leading-relaxed text-stone-600 font-serif italic">{c.summary}</p>
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i} className="mb-5 last:mb-0">
              <div className="flex justify-between items-baseline mb-1">
                <p className="font-bold text-[14.5px] text-amber-950">{e.title}</p>
                <p className="text-[11.5px] font-bold text-amber-800/60 uppercase tracking-widest whitespace-nowrap">
                  {[e.start, e.end].filter(Boolean).join(" — ")}
                </p>
              </div>
              <p className="text-[13px] text-stone-500 font-medium mb-2">{e.company}{C(e.location) ? `, ${e.location}` : ""}</p>
              <ul className="list-none space-y-1.5">
                {e.bullets?.map((b, j) => (
                  <li key={j} className="relative pl-5 text-justify">
                    <span className="absolute left-1.5 top-[0.6em] w-1 h-1 bg-amber-400/50 rotate-45"></span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Selected Works"}>
          {c.projects!.map((p, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <p className="font-bold text-[14px] text-amber-950 mb-1">{p.name}</p>
              {C(p.description) && <p className="text-[13px] mb-2 font-serif italic text-stone-500">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-none space-y-1.5 mb-2">
                  {p.bullets!.map((b, j) => (
                    <li key={j} className="relative pl-5 text-justify">
                      <span className="absolute left-1.5 top-[0.6em] w-1 h-1 bg-amber-400/50 rotate-45"></span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {A(p.tech) && <p className="text-[11px] text-amber-800/60 uppercase tracking-wider font-bold mt-1">{p.tech!.join(" · ")}</p>}
            </div>
          ))}
        </Section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {A(c.education) && (
          <div className="md:col-span-1">
            <Section title={labels?.education ?? "Education"}>
              {c.education!.map((ed, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="font-bold text-[14px] text-amber-950 mb-0.5">{ed.degree}</p>
                  <p className="text-[13px] text-stone-600 mb-1">{ed.school}{C(ed.location) ? `, ${ed.location}` : ""}</p>
                  <p className="text-[11.5px] font-bold text-amber-800/60 uppercase tracking-widest mb-1">
                    {[ed.start, ed.end].filter(Boolean).join(" — ")}
                  </p>
                  {C(ed.notes) && <p className="text-[12px] font-serif italic text-stone-500">{ed.notes}</p>}
                </div>
              ))}
            </Section>
          </div>
        )}

        {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
          <div className="md:col-span-1">
            <Section title={labels?.skills ?? "Expertise"}>
              <div className="space-y-4">
                {A(c.skills) && (
                  <div>
                    <h3 className="text-[11px] font-bold text-amber-800/60 uppercase tracking-widest mb-2">Core Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {c.skills!.map((s, i) => <span key={i} className="px-3 py-1 bg-white border border-stone-200 text-stone-600 text-[11.5px] rounded-sm">{s}</span>)}
                    </div>
                  </div>
                )}
                {A(c.languages) && (
                  <div>
                    <h3 className="text-[11px] font-bold text-amber-800/60 uppercase tracking-widest mb-1">{labels?.languages ?? "Languages"}</h3>
                    <p className="text-[13px]">{c.languages!.join(", ")}</p>
                  </div>
                )}
                {A(c.certifications) && (
                  <div>
                    <h3 className="text-[11px] font-bold text-amber-800/60 uppercase tracking-widest mb-1">{labels?.certifications ?? "Certifications"}</h3>
                    <ul className="text-[12.5px] space-y-1">
                      {c.certifications!.map((cert, i) => <li key={i}>{cert.name}{cert.issuer ? ` (${cert.issuer})` : ''}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
