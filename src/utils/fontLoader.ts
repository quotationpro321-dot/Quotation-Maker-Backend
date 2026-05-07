/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-extraneous-class */
import fs from "fs";
import path from "path";

export class FontLoaderHelper {
  private static readonly FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");

  static loadFont(fontFileName: string): string {
    try {
      const fontPath = path.join(this.FONT_DIR, fontFileName);

      if (!fs.existsSync(fontPath)) {
        throw new Error(`Font file not found: ${fontFileName}`);
      }

      const fontBuffer = fs.readFileSync(fontPath);
      return fontBuffer.toString("base64");
    } catch (error) {
      console.error(`Font loading error for ${fontFileName}:`, error);
      throw error;
    }
  }

  static loadMultipleFonts(fontFileNames: string[]): string[] {
    return fontFileNames.map((name) => this.loadFont(name));
  }
}
