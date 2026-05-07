/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable no-console */
import axios from "axios";

export class Base64EncoderHelper {
  static async encodeImage(url: string): Promise<string> {
    if (!url) return "";

    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 10000,
      });

      const base64 = Buffer.from(response.data).toString("base64");
      const mimeType = response.headers["content-type"] || "image/png";

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error("Image encoding error:", error);
      return "";
    }
  }

  static async encodeMultipleImages(urls: string[]): Promise<string[]> {
    return Promise.all(urls.map((url) => this.encodeImage(url)));
  }
}
