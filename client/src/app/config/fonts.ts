export const FONT_OPTIONS = {
  nunito: { label: "Nunito (Default)", family: '"Nunito", sans-serif' },
  "pilcrow-rounded": {
    label: "Pilcrow Rounded",
    family: '"Pilcrow Rounded", sans-serif',
  },
  poppins: { label: "Poppins", family: '"Poppins", sans-serif' },
} as const;

export type FontChoice = keyof typeof FONT_OPTIONS;
export const DEFAULT_FONT: FontChoice = "nunito";

export function isFontChoice(value: string | null): value is FontChoice {
  return value !== null && Object.hasOwn(FONT_OPTIONS, value);
}
