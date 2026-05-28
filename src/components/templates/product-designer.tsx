import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-[14px] font-bold text-zinc-900 tracking-tight mb-4">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function ProductDesigner({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[12.5px] leading-[1.65] text-zinc-600 font-sans max-w-[850px] mx-auto bg-white flex flex-col md:flex-row gap-8">
      
      {/* Left Column (30%) - Safe two column where left is contact and skills */}
      <div className="md:w-[30%] shrink-0 flex flex-col gap-8">
        <header className="mb-2">
          <h1 className="text-[32px] font-bold tracking-tighter text-zinc-900 leading-[1.1] mb-2">{c.fullName ?? "Your Name"}</h1>
          {C(c.headline) && <p className="text-[14px] text-zinc-500 font-medium leading-snug">{c.headline}</p>}
        </header>

        <div className="space-y-2 text-[11.5px] text-zinc-500">
          <h3 className="font-bold text-zinc-900 text-[12px] uppercase tracking-widest mb-2">Contact</h3>
          {C(c.email) && <p className="break-words">{c.email}</p>}
          {C(c.phone) && <p>{c.phone}</p>}
          {C(c.location) && <p>{c.location}</p>}
          {A(c.links) && c.links!.map((l, i) => <p key={i} className="break-words">{l.label}</p>)}
        </div>

        {A(c.skills) && (
          <div>
            <h3 className="font-bold text-zinc-900 text-[12px] uppercase tracking-widest mb-3">Expertise</h3>
            <div className="flex flex-col gap-1.5 text-[12px]">
              {c.skills!.map((s, i) => <span key={i}>{s}</span>)}
            </div>
          </div>
        )}

        {(A(c.languages) || A(c.certifications)) && (
          <div className="space-y-6">
            {A(c.languages) && (
              <div>
                <h3 className="font-bold text-zinc-900 text-[12px] uppercase tracking-widest mb-2">{labels?.languages ?? "Languages"}</h3>
                <div className="flex flex-col gap-1 text-[12px]">
                  {c.languages!.map((l, i) => <span key={i}>{l}</span>)}
                </div>
              </div>
            )}
            {A(c.certifications) && (
              <div>
                <h3 className="font-bold text-zinc-900 text-[12px] uppercase tracking-widest mb-2">{labels?.certifications ?? "Certifications"}</h3>
                <div className="flex flex-col gap-2 text-[11.5px] leading-snug">
                  {c.certifications!.map((cert, i) => <span key={i}>{cert.name}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column (70%) */}
      <div className="md:w-[70%]">
        {C(c.summary) && (
          <Section title={labels?.summary ?? "Profile"}>
            <p className="text-justify text-[13.5px] leading-relaxed text-zinc-700">{c.summary}</p>
          </Section>
        )}

        {A(c.experience) && (
          <Section title={labels?.experience ?? "Experience"}>
            {c.experience!.map((e, i) => (
              <div key={i} className="mb-5 last:mb-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className="font-bold text-[14px] text-zinc-900">{e.title}</p>
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide whitespace-nowrap ml-4">
                    {[e.start, e.end].filter(Boolean).join(" – ")}
                  </p>
                </div>
                <p className="text-[13px] text-zinc-700 mb-2">{e.company}{C(e.location) ? ` · ${e.location}` : ""}</p>
                <ul className="list-none space-y-1.5">
                  {e.bullets?.map((b, j) => (
                    <li key={j} className="relative pl-3 text-justify text-[12.5px]">
                      <span className="absolute left-0 top-[0.6em] w-1 h-1 bg-zinc-400 rounded-full"></span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {A(c.projects) && (
          <Section title={labels?.projects ?? "Selected Projects"}>
            {c.projects!.map((p, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <p className="font-bold text-[13px] text-zinc-900 mb-0.5">{p.name}</p>
                {C(p.description) && <p className="text-[12.5px] mb-2">{p.description}</p>}
                {A(p.bullets) && (
                  <ul className="list-none space-y-1.5 mb-2">
                    {p.bullets!.map((b, j) => (
                      <li key={j} className="relative pl-3 text-justify text-[12px]">
                        <span className="absolute left-0 top-[0.6em] w-1 h-1 bg-zinc-400 rounded-full"></span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {A(p.tech) && <p className="text-[11px] text-zinc-400 font-medium">Tools: {p.tech!.join(", ")}</p>}
              </div>
            ))}
          </Section>
        )}

        {A(c.education) && (
          <Section title={labels?.education ?? "Education"}>
            {c.education!.map((ed, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className="font-bold text-[13px] text-zinc-900">{ed.school}</p>
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide ml-4">
                    {[ed.start, ed.end].filter(Boolean).join(" – ")}
                  </p>
                </div>
                <p className="text-[12.5px] text-zinc-700">{ed.degree}{C(ed.location) ? ` · ${ed.location}` : ""}</p>
                {C(ed.notes) && <p className="text-[12px] mt-1">{ed.notes}</p>}
              </div>
            ))}
          </Section>
        )}
      </div>
      
    </div>
  );
}
