export type CefrLevelCode = "A2" | "B1" | "B2" | "C1";

export type CefrLevelConfig = {
  code: CefrLevelCode;
  label: string;
  description: string;
  available: boolean;
};

export const CEFR_LEVELS: CefrLevelConfig[] = [
  {
    code: "A2",
    label: "A2",
    description: "Core grammar sessions ready to study now.",
    available: true,
  },
  {
    code: "B1",
    label: "B1",
    description: "Intermediate grammar content will be added next.",
    available: false,
  },
  {
    code: "B2",
    label: "B2",
    description: "Upper-intermediate sessions stay visible as placeholders.",
    available: false,
  },
  {
    code: "C1",
    label: "C1",
    description: "Advanced grammar sessions are reserved for a later content pass.",
    available: false,
  },
];
