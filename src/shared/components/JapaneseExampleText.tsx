"use client";

type JapaneseExampleTextProps = {
  text: string;
  furiganaEnabled: boolean;
};

export function JapaneseExampleText({ text, furiganaEnabled }: JapaneseExampleTextProps) {
  // MVP no-op: content JSON does not include furigana segments yet.
  // Keeping this component isolates future furigana rendering logic.
  return (
    <span data-furigana-enabled={furiganaEnabled ? "true" : "false"}>{text}</span>
  );
}
