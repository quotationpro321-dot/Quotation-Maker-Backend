import fs from "fs";
import path from "path";

export const getBase64Font = (fontFileName: string): string => {
  const fontPath = path.join(process.cwd(), "src", "assets", "fonts", fontFileName);

  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file not found: ${fontFileName}`);
  }

  const fontBuffer = fs.readFileSync(fontPath);
  return fontBuffer.toString("base64");
};
