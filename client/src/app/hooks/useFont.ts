import { useEffect, useState } from "react";
import { DEFAULT_FONT, isFontChoice, type FontChoice } from "../config/fonts";

export function useFont(userId: number) {
  const fontStorageKey = `rubix.font.${userId}`;
  const [font, setFont] = useState<FontChoice>(() => {
    try {
      const savedFont = window.localStorage.getItem(fontStorageKey);
      return isFontChoice(savedFont) ? savedFont : DEFAULT_FONT;
    } catch {
      return DEFAULT_FONT;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(fontStorageKey, font);
    } catch {
      // Font changes still apply when browser storage is unavailable.
    }
  }, [font, fontStorageKey]);

  return { font, setFont };
}
