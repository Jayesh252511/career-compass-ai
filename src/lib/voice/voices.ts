const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

// ElevenLabs voices are language-agnostic when using multilingual models.
// This map exists so you can customize voices per language if desired.
const VOICE_BY_LANGUAGE: Record<string, string> = {
  en: DEFAULT_VOICE_ID,
  hi: DEFAULT_VOICE_ID,
  mr: DEFAULT_VOICE_ID,
  ta: DEFAULT_VOICE_ID,
  te: DEFAULT_VOICE_ID,
  bn: DEFAULT_VOICE_ID,
  gu: DEFAULT_VOICE_ID,
  pa: DEFAULT_VOICE_ID,
  ml: DEFAULT_VOICE_ID,
  kn: DEFAULT_VOICE_ID,
  ur: DEFAULT_VOICE_ID,
  es: DEFAULT_VOICE_ID,
  fr: DEFAULT_VOICE_ID,
  de: DEFAULT_VOICE_ID,
  ar: DEFAULT_VOICE_ID,
  ja: DEFAULT_VOICE_ID,
  ko: DEFAULT_VOICE_ID,
};

export function getElevenLabsVoiceId(languageCode: string | undefined) {
  if (!languageCode) return DEFAULT_VOICE_ID;
  return VOICE_BY_LANGUAGE[languageCode] ?? DEFAULT_VOICE_ID;
}

