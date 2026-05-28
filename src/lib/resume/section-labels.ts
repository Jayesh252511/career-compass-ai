export type ResumeSectionLabels = {
  summary: string;
  experience: string;
  education: string;
  projects: string;
  skills: string;
  certifications: string;
  languages: string;
  about: string;
  profile: string;
};

const EN: ResumeSectionLabels = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  about: "About",
  profile: "Profile",
};

const HI: ResumeSectionLabels = {
  summary: "सारांश",
  experience: "अनुभव",
  education: "शिक्षा",
  projects: "प्रोजेक्ट्स",
  skills: "کौशल",
  certifications: "प्रमाणपत्र",
  languages: "भाषाएँ",
  about: "परिचय",
  profile: "प्रोफ़ाइल",
};

const MR: ResumeSectionLabels = {
  summary: "सारांश",
  experience: "अनुभव",
  education: "शिक्षण",
  projects: "प्रकल्प (प्रोजेक्ट्स)",
  skills: "कौशल्ये",
  certifications: "प्रमाणपत्रे",
  languages: "भाषा",
  about: "परिचय",
  profile: "प्रोफाइल",
};

const TA: ResumeSectionLabels = {
  summary: "சுருக்கம்",
  experience: "அனுபவம்",
  education: "கல்வி",
  projects: "திட்டங்கள் (புராஜெக்ட்ஸ்)",
  skills: "திறன்கள்",
  certifications: "சான்றிதழ்கள்",
  languages: "மொழிகள்",
  about: "சுயவிவரம்",
  profile: "விவரக்குறிப்பு",
};

const TE: ResumeSectionLabels = {
  summary: "సారాంశం",
  experience: "అనుభవం",
  education: "విద్య",
  projects: "ప్రాజెక్టులు",
  skills: "నైపుణ్యాలు",
  certifications: "ధృవీకరణ పత్రాలు",
  languages: "భాషలు",
  about: "పరిచయం",
  profile: "ప్రొఫైల్",
};

const BN: ResumeSectionLabels = {
  summary: "সারসংক্ষেপ",
  experience: "অভিজ্ঞতা",
  education: "শিক্ষা",
  projects: "প্রকল্পসমূহ",
  skills: "দক্ষতা",
  certifications: "সার্টিফিকেশন",
  languages: "ভাষাসমূহ",
  about: "পরিচিতি",
  profile: "প্রোফাইল",
};

const GU: ResumeSectionLabels = {
  summary: "સારાંશ",
  experience: "અનુભવ",
  education: "શિક્ષણ",
  projects: "પ્રોજેક્ટ્સ",
  skills: "કૌશલ્યો",
  certifications: "પ્રમાણપત્રો",
  languages: "ભાષાઓ",
  about: "પરિચય",
  profile: "પ્રોફાઇલ",
};

const PA: ResumeSectionLabels = {
  summary: "ਸੰਖੇਪ",
  experience: "ਤਜਰਬਾ",
  education: "ਸਿੱਖਿਆ",
  projects: "ਪ੍ਰੋਜੈਕਟ",
  skills: "ਹੁਨਰ",
  certifications: "ਸਰਟੀਫਿਕੇਟ",
  languages: "ਭਾਸ਼ਾਵਾਂ",
  about: "ਪਰਿਚਯ",
  profile: "ਪ੍ਰੋਫਾਈਲ",
};

const ML: ResumeSectionLabels = {
  summary: "സംഗ്രഹം",
  experience: "പ്രവൃത്തിപരിചയം",
  education: "വിദ്യാഭ്യാസം",
  projects: "പ്രോജക്റ്റുകൾ",
  skills: "നൈപുണ്യങ്ങൾ",
  certifications: "സർട്ടിഫിക്കറ്റുകൾ",
  languages: "ഭാഷകൾ",
  about: "വിവരണം",
  profile: "പ്രൊഫൈൽ",
};

const KN: ResumeSectionLabels = {
  summary: "ಸಾರಾಂಶ",
  experience: "ಅನುಭವ",
  education: "ಶಿಕ್ಷಣ",
  projects: "ಯೋಜನೆಗಳು (ಪ್ರಾಜೆಕ್ಟ್ಸ್)",
  skills: "ಕೌಶಲ್ಯಗಳು",
  certifications: "ಪ್ರಮಾಣಪತ್ರಗಳು",
  languages: "ಭಾಷೆಗಳು",
  about: "ಪರಿಚಯ",
  profile: "ಪ್ರೊಫೈಲ್",
};

const UR: ResumeSectionLabels = {
  summary: "خلاصہ",
  experience: "تجربہ",
  education: "تعلیم",
  projects: "پروجیکٹس",
  skills: "مہارتیں",
  certifications: "سرٹیفیکیشنز",
  languages: "زبانیں",
  about: "تعارف",
  profile: "پروفائل",
};

const ES: ResumeSectionLabels = {
  summary: "Resumen",
  experience: "Experiencia",
  education: "Educación",
  projects: "Proyectos",
  skills: "Habilidades",
  certifications: "Certificaciones",
  languages: "Idiomas",
  about: "Sobre mí",
  profile: "Perfil",
};

const FR: ResumeSectionLabels = {
  summary: "Résumé",
  experience: "Expérience",
  education: "Éducation",
  projects: "Projets",
  skills: "Compétences",
  certifications: "Certifications",
  languages: "Langues",
  about: "À propos",
  profile: "Profil",
};

const DE: ResumeSectionLabels = {
  summary: "Zusammenfassung",
  experience: "Berufserfahrung",
  education: "Ausbildung",
  projects: "Projekte",
  skills: "Fähigkeiten",
  certifications: "Zertifikate",
  languages: "Sprachen",
  about: "Über mich",
  profile: "Profil",
};

const AR: ResumeSectionLabels = {
  summary: "ملخص مهني",
  experience: "الخبرات المهنية",
  education: "التعليم",
  projects: "المشاريع",
  skills: "المهارات",
  certifications: "الشهادات المهنية",
  languages: "اللغات",
  about: "نبذة عني",
  profile: "الملف الشخصي",
};

const JA: ResumeSectionLabels = {
  summary: "概要",
  experience: "職歴",
  education: "学歴",
  projects: "プロジェクト",
  skills: "スキル",
  certifications: "資格",
  languages: "言語",
  about: "自己紹介",
  profile: "プロフィール",
};

const KO: ResumeSectionLabels = {
  summary: "요약",
  experience: "경력 사항",
  education: "학력 사항",
  projects: "프로젝트",
  skills: "보유 기술",
  certifications: "자격증",
  languages: "외국어",
  about: "자기소개",
  profile: "프로필",
};

const LABELS_MAP: Record<string, ResumeSectionLabels> = {
  en: EN, hi: HI, mr: MR, ta: TA, te: TE, bn: BN, gu: GU, pa: PA,
  ml: ML, kn: KN, ur: UR, es: ES, fr: FR, de: DE, ar: AR, ja: JA, ko: KO,
};

export function getSectionLabels(languageCode: string | undefined): ResumeSectionLabels {
  if (!languageCode) return EN;
  return LABELS_MAP[languageCode] ?? EN;
}
