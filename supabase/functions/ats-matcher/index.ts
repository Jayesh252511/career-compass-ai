import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_PROMPT = `You are an expert Applicant Tracking System (ATS) optimization AI. 
The user will provide you with their current Resume Data (JSON) and a Job Description. 
Your task is to analyze the resume against the job description and output a JSON object evaluating the match.

You must output a JSON object matching this exact schema, and NOTHING else:
{
  "score": <number between 0 and 100 representing the match percentage>,
  "missingKeywords": <array of strings, up to 7 most important keywords/skills missing from the resume>,
  "feedback": <string, a concise 2-3 sentence actionable feedback on how to improve the match>
}

Be strict but fair. A perfect match is rare. Only look at hard skills and core requirements.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { currentResume, jobDescription } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length === 0) {
      throw new Error("Invalid job description");
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `RESUME DATA:\n${JSON.stringify(currentResume, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}` }
        ]
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI provider error", resp.status, text);
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const payloadText = data.choices?.[0]?.message?.content ?? "{}";
    const payload = JSON.parse(payloadText);

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ats-matcher error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
