import type { TemplateProps } from "./index";
import { C, A, Empty, isEmpty } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-[14px] font-bold text-slate-900 border-b-2 border-slate-200 pb-1 mb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AcademicResearch({ c, labels }: TemplateProps) {
  if (isEmpty(c)) return <Empty />;
  return (
    <div className="px-12 py-12 text-[12px] leading-[1.6] text-slate-800 font-serif max-w-[850px] mx-auto bg-white">
      <header className="mb-8 flex flex-col items-center">
        <h1 className="text-[28px] font-bold text-slate-900 mb-1">{c.fullName ?? "Your Name"}</h1>
        {C(c.headline) && <p className="text-[14px] text-slate-600 mb-2">{c.headline}</p>}
        <div className="flex flex-wrap justify-center gap-4 text-[11.5px] text-slate-600">
          {C(c.email) && <span>{c.email}</span>}
          {C(c.phone) && <span>{c.phone}</span>}
          {C(c.location) && <span>{c.location}</span>}
          {A(c.links) && c.links!.map((l, i) => <span key={i}>{l.label}</span>)}
        </div>
      </header>

      {C(c.summary) && (
        <Section title={labels?.summary ?? "Profile"}>
          <p className="text-justify">{c.summary}</p>
        </Section>
      )}

      {/* Academics usually put Education first */}
      {A(c.education) && (
        <Section title={labels?.education ?? "Education"}>
          {c.education!.map((ed, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="font-bold text-[13px] text-slate-900">{ed.degree}</p>
                <p className="text-[11.5px] font-medium whitespace-nowrap">
                  {[ed.start, ed.end].filter(Boolean).join(" – ")}
                </p>
              </div>
              <p className="text-[12.5px] text-slate-700">{ed.school}{C(ed.location) ? `, ${ed.location}` : ""}</p>
              {C(ed.notes) && <p className="text-[11.5px] mt-1 text-justify">{ed.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {A(c.experience) && (
        <Section title={labels?.experience ?? "Academic & Professional Experience"}>
          {c.experience!.map((e, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="font-bold text-[13px] text-slate-900">{e.title}</p>
                <p className="text-[11.5px] font-medium whitespace-nowrap">
                  {[e.start, e.end].filter(Boolean).join(" – ")}
                </p>
              </div>
              <p className="text-[12.5px] text-slate-700 mb-1.5">{e.company}{C(e.location) ? `, ${e.location}` : ""}</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-slate-400">
                {e.bullets?.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {A(c.projects) && (
        <Section title={labels?.projects ?? "Research & Publications"}>
          {c.projects!.map((p, i) => (
            <div key={i}>
              <p className="font-bold text-[13px] text-slate-900">{p.name}</p>
              {C(p.description) && <p className="text-[12.5px] mb-1 italic">{p.description}</p>}
              {A(p.bullets) && (
                <ul className="list-disc pl-5 space-y-1 marker:text-slate-400">
                  {p.bullets!.map((b, j) => <li key={j} className="pl-1 text-justify">{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {(A(c.skills) || A(c.languages) || A(c.certifications)) && (
        <Section title={labels?.skills ?? "Additional Information"}>
          <div className="space-y-2">
            {A(c.skills) && (
              <p>
                <span className="font-bold text-slate-900">Technical Expertise: </span>
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
                {c.certifications!.map(cert => cert.name).join(", ")}
              </p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
