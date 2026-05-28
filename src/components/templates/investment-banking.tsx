import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-2">
      <h2 className="text-[12.5px] font-bold text-black uppercase border-b border-black pb-[2px] mb-1.5">
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

export function InvestmentBanking({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-10 py-10 text-[11px] leading-[1.3] text-black font-serif max-w-[850px] mx-auto bg-white">
      <header className="text-center mb-3">
        <h1 className="text-[22px] font-bold text-black mb-1 leading-none uppercase tracking-wide">{c.fullName ?? "Your Name"}</h1>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[11px]">
          {C(c.location) && <span>{c.location}</span>}
          {C(c.location) && (C(c.phone) || C(c.email)) && <span>|</span>}
          {C(c.phone) && <span>{c.phone}</span>}
          {C(c.phone) && C(c.email) && <span>|</span>}
          {C(c.email) && <span>{c.email}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>| {l.label}</span>)}
        </div>
      </header>

      {/* In Investment Banking resumes, Education almost always comes first if Junior, Experience first if Senior. 
          We'll stick to standard order unless we parse logic, but let's keep Education first as it's standard IB format */}
          
      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline">
                <p className="font-bold">{ed.school}</p>
                <p>{C(ed.location) ? ed.location : ""}</p>
              </div>
              <div className="flex justify-between items-baseline">
                <p className="italic">{ed.degree}</p>
                <p>{[ed.start, ed.end].filter(Boolean).join(" – ")}</p>
              </div>
              {C(ed.notes) && <p className="mt-0.5">{ed.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline">
                <p className="font-bold">{e.company}</p>
                <p>{C(e.location) ? e.location : ""}</p>
              </div>
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="italic">{e.title}</p>
                <p>{[e.start, e.end].filter(Boolean).join(" – ")}</p>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 marker:text-black">
                {e.bullets?.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Leadership & Projects"}>
          {c.projects!.map((p, i) => (
            <div key={i}>
              <p className="font-bold">{p.name}</p>
              {C(p.description) && <p className="italic mb-0.5">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-disc pl-5 space-y-0.5 marker:text-black">
                  {p.bullets!.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
        <Section title={labels?.skills ?? "Skills, Activities & Interests"}>
          <div className="space-y-0.5">
            {A(c.languages) && (
              <p>
                <span className="font-bold">{labels?.languages ?? "Languages"}: </span>
                {c.languages!.join(", ")}
              </p>
            )}
            {A(c.skills) && (
              <p>
                <span className="font-bold">Skills: </span>
                {c.skills!.join(", ")}
              </p>
            )}
            {A(c.certifications) && (
              <p>
                <span className="font-bold">{labels?.certifications ?? "Certifications"}: </span>
                {c.certifications!.map(cert => cert.name).join(", ")}
              </p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
