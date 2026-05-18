const MAX_TEXT_LENGTH = 50_000;
const MAX_LINES = 200;
const MAX_LINE_LENGTH = 500;

export interface SanitizedInput {
  text: string;
  lines: string[];
}

export function sanitizeRawItineraryText(rawText: string): SanitizedInput {
  let text = rawText
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
  }

  const lines = text
    .split("\n")
    .slice(0, MAX_LINES)
    .map((line) => line.replace(/\s+/g, " ").trim().slice(0, MAX_LINE_LENGTH))
    .filter(Boolean);

  return { text, lines };
}
