import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "fil";

interface Translations {
  [key: string]: { en: string; fil: string };
}

const translations: Translations = {
  welcome_title: { en: "AgriAble", fil: "AgriAble" },
  welcome_subtitle: { en: "Secure and Verified Fertilizer Distribution", fil: "Ligtas at Beripikadong Pamamahagi ng Pataba" },
  start: { en: "Start", fil: "Simulan" },
  scan_instruction: { en: "Scan your National ID (PhilSys QR)", fil: "I-scan ang iyong National ID (PhilSys QR)" },
  waiting_scan: { en: "Waiting for scan...", fil: "Naghihintay ng scan..." },
  verifying: { en: "Verifying identity...", fil: "Bini-verify ang pagkakakilanlan..." },
  verified: { en: "Identity Verified", fil: "Na-verify ang Pagkakakilanlan" },
  failed: { en: "Verification Failed", fil: "Hindi Na-verify" },
  try_again: { en: "Try Again", fil: "Subukan Muli" },
  your_allocation: { en: "Your Allocation", fil: "Iyong Alokasyon" },
  remaining_quota: { en: "Remaining Quota", fil: "Natitirang Quota" },
  previous_usage: { en: "Previous Usage", fil: "Nakaraang Paggamit" },
  proceed: { en: "Proceed", fil: "Magpatuloy" },
  scale_setup: { en: "Scale Setup", fil: "Pag-setup ng Timbangan" },
  step_zero: { en: "Press ZERO to reset scale", fil: "Pindutin ang ZERO para i-reset" },
  step_container: { en: "Place your container", fil: "Ilagay ang iyong lalagyan" },
  step_tare: { en: "Press TARE", fil: "Pindutin ang TARE" },
  dispensing: { en: "Dispensing", fil: "Nagdi-dispense" },
  start_dispensing: { en: "Start Dispensing", fil: "Simulan ang Pag-dispense" },
  stop: { en: "Stop", fil: "Itigil" },
  complete: { en: "Dispensing Complete", fil: "Tapos na ang Pag-dispense" },
  amount_received: { en: "Amount Received", fil: "Natanggap na Dami" },
  finish: { en: "Finish", fil: "Tapusin" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
