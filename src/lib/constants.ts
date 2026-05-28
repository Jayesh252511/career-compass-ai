export type Language = {
  code: string;
  name: string;
  native: string;
  flag: string;
  sample: string; // sample first AI question in this language
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧", sample: "What's your full name?" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", sample: "Aapka naam kya hai?" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳", sample: "Tumche naav kay aahe?" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳", sample: "Unga peyar enna?" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳", sample: "Mee peru emiti?" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩", sample: "Apnar naam ki?" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳", sample: "Tamaru naam shu chhe?" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳", sample: "Tuhada naam ki hai?" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳", sample: "Ningalude peru enthaanu?" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳", sample: "Nimma hesaru enu?" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰", sample: "Aap ka naam kya hai?" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸", sample: "¿Cómo te llamas?" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷", sample: "Quel est votre nom ?" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪", sample: "Wie heißen Sie?" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", sample: "ما اسمك؟" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵", sample: "お名前は何ですか？" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷", sample: "이름이 무엇입니까?" },
];

export type Template = {
  id: "ats" | "modern" | "fresher";
  name: string;
  description: string;
  tag: string;
  bestFor: string;
};

export const TEMPLATES: Template[] = [
  {
    id: "ats",
    name: "ATS Professional",
    description: "Single column. Recruiter-ready. Parses cleanly through every applicant tracking system.",
    tag: "100% ATS",
    bestFor: "Corporate · Banking · Consulting",
  },
  {
    id: "modern",
    name: "Modern Minimal",
    description: "A quiet two-column layout with premium typography. Calm hierarchy, no decoration.",
    tag: "ATS Friendly",
    bestFor: "Startups · Product · Design",
  },
  {
    id: "fresher",
    name: "Fresher Smart",
    description: "Project-first layout designed for students and early-career applicants.",
    tag: "ATS Friendly",
    bestFor: "Students · Interns · New grads",
  },
];

export type Industry = {
  id: string;
  name: string;
  emoji: string;
  hint: string;
};

export const INDUSTRIES: Industry[] = [
  { id: "software", name: "Software Developer", emoji: "⌘", hint: "Engineering, programming, systems" },
  { id: "design", name: "Designer", emoji: "◐", hint: "UI, UX, product, visual" },
  { id: "doctor", name: "Doctor", emoji: "✚", hint: "Medical, clinical, healthcare" },
  { id: "teacher", name: "Teacher", emoji: "✎", hint: "Education, academic, training" },
  { id: "marketing", name: "Marketing", emoji: "✦", hint: "Growth, brand, content" },
  { id: "sales", name: "Sales", emoji: "↗", hint: "B2B, B2C, account management" },
  { id: "photographer", name: "Photographer", emoji: "◉", hint: "Creative, visual storytelling" },
  { id: "student", name: "Student", emoji: "✿", hint: "College, university, fresher" },
  { id: "freelancer", name: "Freelancer", emoji: "◆", hint: "Independent, contract work" },
  { id: "business", name: "Business", emoji: "△", hint: "Operations, strategy, leadership" },
  { id: "finance", name: "Finance", emoji: "$", hint: "Banking, analysis, accounting" },
  { id: "engineer", name: "Engineer", emoji: "⚙", hint: "Civil, mechanical, electrical" },
  { id: "custom", name: "Custom Industry...", emoji: "✧", hint: "Type your own custom industry" },
];

export type ResumeContent = {
  fullName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: { label: string; url: string }[];
  summary?: string;
  experience?: {
    title: string;
    company: string;
    location?: string;
    start?: string;
    end?: string;
    bullets: string[];
  }[];
  education?: {
    degree: string;
    school: string;
    location?: string;
    start?: string;
    end?: string;
    notes?: string;
  }[];
  projects?: {
    name: string;
    description?: string;
    bullets?: string[];
    tech?: string[];
  }[];
  skills?: string[];
  certifications?: { name: string; issuer?: string; year?: string }[];
  languages?: string[];
};

export const SECTION_WEIGHTS: Record<keyof ResumeContent, number> = {
  fullName: 10,
  headline: 5,
  email: 5,
  phone: 5,
  location: 5,
  links: 5,
  summary: 15,
  experience: 20,
  education: 10,
  projects: 10,
  skills: 8,
  certifications: 1,
  languages: 1,
};

export function computeProgress(c: ResumeContent): number {
  let total = 0;
  let earned = 0;
  for (const [key, weight] of Object.entries(SECTION_WEIGHTS) as [keyof ResumeContent, number][]) {
    total += weight;
    const v = c[key];
    if (Array.isArray(v) ? v.length > 0 : Boolean(v)) earned += weight;
  }
  return Math.round((earned / total) * 100);
}
