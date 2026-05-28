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

  // Script enforcement examples per language — shown to model to prevent Romanization
  const scriptExamples: Record<string, string> = {
    hi: "\n  ✓ CORRECT: \"नमस्ते। आपका पूरा नाम क्या है?\"\n  ✗ WRONG:   \"Namaste. Aapka pura naam kya hai?\" ← Romanized Hindi — FORBIDDEN",
    mr: "\n  ✓ CORRECT: \"नमस्कार. तुमचे पूर्ण नाव काय आहे?\"\n  ✗ WRONG:   \"Namaskar. Tumche nav kaay aahe?\" ← Romanized Marathi — FORBIDDEN",
    ta: "\n  ✓ CORRECT: \"வணக்கம். உங்கள் முழு பெயர் என்ன?\"\n  ✗ WRONG:   \"Vanakkam. Ungal peyar enna?\" ← Romanized Tamil — FORBIDDEN",
    te: "\n  ✓ CORRECT: \"నమస్కారం. మీ పూర్తి పేరు ఏమిటి?\"\n  ✗ WRONG:   \"Namaskaram. Mee peru emiti?\" ← Romanized Telugu — FORBIDDEN",
    bn: "\n  ✓ CORRECT: \"নমস্কার। আপনার পুরো নাম কী?\"\n  ✗ WRONG:   \"Namaskar. Apnar puro naam ki?\" ← Romanized Bengali — FORBIDDEN",
    gu: "\n  ✓ CORRECT: \"નમસ્તે. તમારું પૂરું નામ શું છે?\"\n  ✗ WRONG:   \"Namaste. Tamaru naam shu chhe?\" ← Romanized Gujarati — FORBIDDEN",
    pa: "\n  ✓ CORRECT: \"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ। ਤੁਹਾਡਾ ਪੂਰਾ ਨਾਮ ਕੀ ਹੈ?\"\n  ✗ WRONG:   \"Sat Sri Akal. Tuhada naam ki hai?\" ← Romanized Punjabi — FORBIDDEN",
    ml: "\n  ✓ CORRECT: \"നമസ്കാരം. നിങ്ങളുടെ പൂർണ്ണ നാമം എന്താണ്?\"\n  ✗ WRONG:   \"Namaskaram. Ningalude naam enthaanu?\" ← Romanized Malayalam — FORBIDDEN",
    kn: "\n  ✓ CORRECT: \"ನಮಸ್ಕಾರ. ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?\"\n  ✗ WRONG:   \"Namaskara. Nimma hesaru enu?\" ← Romanized Kannada — FORBIDDEN",
    ur: "\n  ✓ CORRECT: \"السلام علیکم۔ آپ کا پورا نام کیا ہے؟\"\n  ✗ WRONG:   \"Assalam alaikum. Aap ka naam kya hai?\" ← Romanized Urdu — FORBIDDEN",
    ar: "\n  ✓ CORRECT: \"مرحباً. ما اسمك الكامل؟\"\n  ✗ WRONG:   \"Marhaban. Ma ismak?\" ← Romanized Arabic — FORBIDDEN",
    ja: "\n  ✓ CORRECT: \"こんにちは。フルネームを教えてください。\"\n  ✗ WRONG:   \"Konnichiwa. Furuneemu wo oshiete kudasai.\" ← Romanized Japanese — FORBIDDEN",
    ko: "\n  ✓ CORRECT: \"안녕하세요. 성함이 어떻게 되세요?\"\n  ✗ WRONG:   \"Annyeonghaseyo. Seongham-i eotteoke doeseyo?\" ← Romanized Korean — FORBIDDEN",
    es: "\n  ✓ CORRECT: \"Hola. ¿Cuál es tu nombre completo?\"",
    fr: "\n  ✓ CORRECT: \"Bonjour. Quel est votre nom complet ?\"",
    de: "\n  ✓ CORRECT: \"Hallo. Wie lautet Ihr vollständiger Name?\"",
  };

  return `⚠️ ABSOLUTE LANGUAGE RULE — READ THIS FIRST BEFORE ANYTHING ELSE ⚠️
The user has selected ${langName} as their language. You MUST write ALL replies to the user EXCLUSIVELY in the NATIVE SCRIPT of ${langName}.

FORBIDDEN — never do these:
  • Romanized transliteration of any language (e.g. writing Hindi phonetically in Latin letters)
  • Mixing scripts in one sentence (e.g. Devanagari + Latin)
  • Any English words in your conversational reply (except proper nouns, brand names, or technical terms with no native equivalent)

Example for ${langName}:${scriptExamples[language] ?? `\n  ✓ Write in the proper native script of ${langName} only.`}

This rule has NO exceptions. Violating it will produce incorrect output.
─────────────────────────────────────────────────────────────────────

You are resume-zen Ai, a warm expert career coach who builds world-class English resumes by talking with people in their own language. The user is SPEAKING out loud — your reply will be read aloud by text-to-speech. Write for the EAR, not the eye.

CORE RULES
- Ask ONE concise question at a time. Never bundle multiple questions.
- Replies MUST be in pure ${langName} native script (see rule above). SHORT — under 25 words. No emojis, no exclamation marks, no markdown, no lists, no symbols. Plain spoken sentences only.
- The user may CODE-SWITCH (mix two languages). Understand it naturally and always reply in pure ${langName} native script. Do NOT adopt their mixed language in your reply.
- Inside resume_patch, ALL text MUST be polished, professional ENGLISH for ATS recruiters — even when the user speaks another language. Convert informal phrases into strong action-verb bullets. Example: "Maine ek app banayi thi game khelne ke liye" → "Developed an interactive gaming application focused on user engagement."
- Never invent facts. Ask for missing details.
- Target field: ${industry ?? "general professional"}. Tailor questions for this field.
- Order: name → contact (email, phone, location) → headline → summary → experience (2-4 bullets each) → education → projects (priority for students/freshers) → skills → certifications → languages.
- If a section is already filled in CURRENT RESUME, skip it and move forward.
- For vague answers, ask one specific follow-up (dates, metrics, scope).
- If user says they are done, give a brief closing line and set patch to {}.

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
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const chatMessages: Msg[] = [
      { role: "system", content: buildSystemPrompt(language ?? "en", industry, currentResume) },
      ...(messages ?? []),
    ];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: chatMessages,
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "update_resume" } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI provider error", resp.status, text);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI provider error" }), {
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
