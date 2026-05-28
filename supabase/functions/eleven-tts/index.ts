// Streams MP3 audio from ElevenLabs Text-to-Speech (multilingual v2).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Warm, calm, premium feminine voice — "Sarah".
const DEFAULT_VOICE = "EXAVITQu4vr4xnSDxMaL";

function normalizeForSpokenTts(text: string) {
  // Keep it conversational and reduce long pauses without changing meaning.
  return text
    .replace(/\s+/g, " ")
    .replace(/\s*[\u2013\u2014-]\s*/g, ", ")
    .replace(/\.\s*\./g, ".")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { text, voiceId } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = Deno.env.get("ELEVENLABS_API_KEY");
    if (!key) throw new Error("ELEVENLABS_API_KEY missing");

    const cleaned = normalizeForSpokenTts(text);
    const trimmed = cleaned.slice(0, 1500);
    const vid = (voiceId as string) || DEFAULT_VOICE;

    const resp = await fetch(
      // optimize_streaming_latency reduces time-to-first-audio (0-4; higher is lower latency).
      `https://api.elevenlabs.io/v1/text-to-speech/${vid}/stream?output_format=mp3_44100_128&optimize_streaming_latency=4`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          model_id: "eleven_turbo_v2_5",
          // Tuned for warmer, more human, less "robotic" pacing.
          voice_settings: {
            stability: 0.32,
            similarity_boost: 0.86,
            style: 0.48,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!resp.ok || !resp.body) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: t || "tts failed" }), {
        status: resp.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
