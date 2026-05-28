import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type ResumeContent = Record<string, unknown>;

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  gu: "Gujarati",
  pa: "Punjabi",
  ml: "Malayalam",
  kn: "Kannada",
  ur: "Urdu",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  ja: "Japanese",
  ko: "Korean",
};

function systemPrompt(targetLanguage: string) {
  const langName = LANG_NAMES[targetLanguage] ?? "English";
  return `You translate resume JSON content into ${langName}.

Rules:
- Input and output are JSON objects with the SAME SHAPE.
- Translate ALL human-readable text fields and bullet strings.
- Do NOT translate: emails, phone numbers, URLs, dates, company names, product names, proper nouns when unsure.
- Keep a professional, ATS-friendly tone. No emojis. No markdown.
- Keep bullets concise. Avoid unnatural literal translations; prefer natural wording for ${langName}.
- Return JSON only.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { content, targetLanguage } = await req.json();
    if (!content || typeof content !== "object") {
      return new Response(JSON.stringify({ error: "content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang = (targetLanguage as string) || "en";
    if (lang === "en") {
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt(lang) },
          {
            role: "user",
            content: JSON.stringify({ content }, null, 2),
          },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("resume-export provider error", resp.status, text);
      return new Response(JSON.stringify({ error: "export translation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    let parsed: { content?: ResumeContent } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("resume-export parse error", e, raw);
    }

    const out = parsed?.content && typeof parsed.content === "object" ? parsed.content : null;
    if (!out) {
      return new Response(JSON.stringify({ error: "bad translation output" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resume-export error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

