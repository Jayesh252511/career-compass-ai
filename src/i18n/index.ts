import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./translations/en.json";
import hi from "./translations/hi.json";
import mr from "./translations/mr.json";
import ta from "./translations/ta.json";
import te from "./translations/te.json";
import bn from "./translations/bn.json";
import gu from "./translations/gu.json";
import pa from "./translations/pa.json";
import ml from "./translations/ml.json";
import kn from "./translations/kn.json";
import ur from "./translations/ur.json";
import es from "./translations/es.json";
import fr from "./translations/fr.json";
import de from "./translations/de.json";
import ar from "./translations/ar.json";
import ja from "./translations/ja.json";
import ko from "./translations/ko.json";
import { LANGUAGES } from "@/lib/constants";

const STORAGE_KEY = "linnea_lang";

export function getStoredLanguage(): string {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(STORAGE_KEY) || "en";
}

export function setStoredLanguage(lang: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
}

export function ensureI18nInitialized() {
  if (i18n.isInitialized) return i18n;

  if (typeof window !== "undefined" && !window.localStorage.getItem(STORAGE_KEY)) {
    // don't overwrite if user hasn't chosen
  }

  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      ta: { translation: ta },
      te: { translation: te },
      bn: { translation: bn },
      gu: { translation: gu },
      pa: { translation: pa },
      ml: { translation: ml },
      kn: { translation: kn },
      ur: { translation: ur },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      ar: { translation: ar },
      ja: { translation: ja },
      ko: { translation: ko },
    },
    lng: getStoredLanguage(),
    fallbackLng: "en",
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
    react: { useSuspense: false },
  });

  return i18n;
}

export { i18n };

