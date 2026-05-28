// Conversational AI resume builder. Accepts conversation history + current resume +
// language + industry. Returns a single AI reply and a structured patch to merge into the resume.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi", mr: "Marathi", ta: "Tamil", te: "Telugu",
  bn: "Bengali", gu: "Gujarati", pa: "Punjabi", ml: "Malayalam", kn: "Kannada",
  ur: "Urdu", es: "Spanish", fr: "French", de: "German", ar: "Arabic",
  ja: "Japanese", ko: "Korean",
};

function buildSystemPrompt(language: string, industry: string | undefined, currentResume: unknown) {
  const langName = LANG_NAMES[language] ?? "English";
  return `You are Linnea, a warm, expert career coach who builds world-class English resumes by talking with people in their own language. The user is SPEAKING out loud — your reply will be read aloud back to them by a text-to-speech voice. Write for the ear, not the eye.

CORE RULES
- Ask ONE concise question at a time. Never bundle multiple questions.
- Speak to the user in ${langName}. For Indian languages, prefer natural Roman/Latin transliteration ("Aapka naam kya hai?") — it sounds better via TTS and matches how people text. Keep replies SHORT (under 25 words). No emojis. No exclamation marks. No markdown, lists, or symbols — plain spoken sentences only.
- The user may CODE-SWITCH (mix two languages in one sentence, e.g. Hindi + English). Understand it naturally and reply in their primary language ${langName} without correcting them.
- Inside the resume_patch, ALL written content MUST be polished, professional ENGLISH suitable for an ATS-screened recruiter — even when the user replies in another language or mixes languages. Convert informal phrases into strong, quantified, action-verb bullets. Example: user says "Maine ek app banayi thi game khelne ke liye" → bullet "Developed an interactive gaming application focused on user engagement and gameplay experience."
- Never invent facts. If you don't have enough detail, ask for it.
- Target field: ${industry ?? "general professional"}. Tailor questions and skill suggestions for this field.
- Order: name → contact (email, phone, location) → headline → professional summary → most recent experience (with 2-4 strong bullets each) → education → projects (for students/freshers prioritize this) → skills → certifications → languages.
- When a section is already filled in CURRENT RESUME, do not re-ask; move forward.
- When the user gives a vague answer, gently ask one follow-up to get specifics (dates, metrics, scope).
- If the user signals they are done or want to finish, say a brief closing line and set patch to {} .

CURRENT RESUME (JSON):
${JSON.stringify(currentResume ?? {}, null, 2)}

YOU MUST CALL the update_resume function exactly once per turn.`;
}

const TOOL = {
  type: "function",
  function: {
    name: "update_resume",
    description: "Reply to the user and patch the resume with any new information extracted from the latest user message.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        message: { type: "string", description: "Your reply to the user in their chosen language. One question or one short acknowledgement." },
        resume_patch: {
          type: "object",
          description: "Partial resume to merge. Only include fields with NEW information from this turn. All text MUST be polished English. Arrays REPLACE the existing array entirely — include all prior items plus new ones.",
          additionalProperties: false,
          properties: {
            fullName: { type: "string" },
            headline: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            summary: { type: "string" },
            links: { type: "array", items: { type: "object", additionalProperties: false, properties: { label: { type: "string" }, url: { type: "string" } }, required: ["label", "url"] } },
            experience: { type: "array", items: { type: "object", additionalProperties: false, properties: {
              title: { type: "string" }, company: { type: "string" }, location: { type: "string" },
              start: { type: "string" }, end: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
            }, required: ["title", "company", "bullets"] } },
            education: { type: "array", items: { type: "object", additionalProperties: false, properties: {
              degree: { type: "string" }, school: { type: "string" }, location: { type: "string" },
              start: { type: "string" }, end: { type: "string" }, notes: { type: "string" },
            }, required: ["degree", "school"] } },
            projects: { type: "array", items: { type: "object", additionalProperties: false, properties: {
              name: { type: "string" }, description: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
              tech: { type: "array", items: { type: "string" } },
            }, required: ["name"] } },
            skills: { type: "array", items: { type: "string" } },
            certifications: { type: "array", items: { type: "object", additionalProperties: false, properties: {
              name: { type: "string" }, issuer: { type: "string" }, year: { type: "string" },
            }, required: ["name"] } },
            languages: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["message", "resume_patch"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, language, industry, currentResume } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const chatMessages: Msg[] = [
      { role: "system", content: buildSystemPrompt(language ?? "en", industry, currentResume) },
      ...(messages ?? []),
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "update_resume" } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    let payload: { message: string; resume_patch: Record<string, unknown> } = { message: "", resume_patch: {} };
    if (call?.function?.arguments) {
      try { payload = JSON.parse(call.function.arguments); } catch (e) {
        console.error("Could not parse tool args:", e);
      }
    } else {
      payload.message = data.choices?.[0]?.message?.content ?? "Could you tell me a bit more?";
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resume-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
