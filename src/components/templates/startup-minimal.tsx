import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 flex flex-col md:flex-row gap-4 md:gap-8">
      <div className="md:w-1/4 shrink-0">
        <h2 className="text-[12px] font-bold text-neutral-900 uppercase tracking-[0.1em] mb-2 md:mb-0">
          {title}
        </h2>
      </div>
      <div className="md:w-3/4 space-y-4">{children}</div>
    </section>
  );
}

export function StartupMinimal({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-12 py-12 text-[12.5px] leading-[1.6] text-neutral-700 font-sans max-w-[850px] mx-auto bg-white">
      <header className="mb-10 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-baseline">
        <div className="md:w-1/4 shrink-0">
          <h1 className="text-[28px] font-extrabold tracking-tight text-neutral-900 leading-none">
            {c.fullName?.split(" ").map((n, i) => i === 0 ? <span key={i}>{n} </span> : <span key={i} className="text-neutral-400">{n} </span>) ?? "Your Name"}
          </h1>
        </div>
        <div className="md:w-3/4 flex flex-col gap-2">
          {C(c.headline) && <p className="text-[16px] text-neutral-900 font-medium">{c.headline}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-neutral-500 font-mono">
            {C(c.email) && <span>{c.email}</span>}
            {C(c.phone) && <span>{c.phone}</span>}
            {C(c.location) && <span>{c.location}</span>}
            {A(c.links) && c.links!.map((l, i) => <span key={i}>{l.label}</span>)}
          </div>
        </div>
      </header>

      {C(c.summary) && (
        <Section title={labels?.summary ?? "Profile"}>
          <p className="text-justify leading-relaxed">{c.summary}</p>
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <p className="font-bold text-[14px] text-neutral-900">{e.title}</p>
                <p className="text-[11.5px] font-mono text-neutral-400 uppercase">
                  {[e.start, e.end].filter(Boolean).join(" — ")}
                </p>
              </div>
              <p className="text-[13px] text-neutral-900 font-medium mb-2">{e.company}{C(e.location) ? `, ${e.location}` : ""}</p>
              <ul className="list-none space-y-1 mt-1">
                {e.bullets?.map((b, j) => (
                  <li key={j} className="relative pl-3 text-justify">
                    <span className="absolute left-0 top-[0.6em] w-1 h-1 bg-neutral-900"></span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i}>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="font-bold text-[14px] text-neutral-900">{p.name}</p>
                {A(p.tech) && <p className="text-[11px] font-mono text-neutral-400">[{p.tech!.join(", ")}]</p>}
              </div>
              {C(p.description) && <p className="text-[13px] mb-2">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-none space-y-1 mt-1">
                  {p.bullets!.map((b, j) => (
                    <li key={j} className="relative pl-3 text-justify">
                      <span className="absolute left-0 top-[0.6em] w-1 h-1 bg-neutral-900"></span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <p className="font-bold text-[14px] text-neutral-900">{ed.degree}</p>
                <p className="text-[11.5px] font-mono text-neutral-400 uppercase">
                  {[ed.start, ed.end].filter(Boolean).join(" — ")}
                </p>
              </div>
              <p className="text-[13px] text-neutral-900 font-medium">{ed.school}{C(ed.location) ? `, ${ed.location}` : ""}</p>
              {C(ed.notes) && <p className="text-[12.5px] mt-1">{ed.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
        <Section title={labels?.skills ?? "Skills"}>
          <div className="space-y-3">
            {A(c.skills) && (
              <div>
                <p className="font-bold text-[12px] text-neutral-900 uppercase tracking-wider mb-1">Capabilities</p>
                <p>{c.skills!.join(", ")}</p>
              </div>
            )}
            <div className="flex gap-10">
              {A(c.languages) && (
                <div>
                  <p className="font-bold text-[12px] text-neutral-900 uppercase tracking-wider mb-1">{labels?.languages ?? "Languages"}</p>
                  <p>{c.languages!.join(", ")}</p>
                </div>
              )}
              {A(c.certifications) && (
                <div>
                  <p className="font-bold text-[12px] text-neutral-900 uppercase tracking-wider mb-1">{labels?.certifications ?? "Certifications"}</p>
                  <p>{c.certifications!.map(cert => cert.name).join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
