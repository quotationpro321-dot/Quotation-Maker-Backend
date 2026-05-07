/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-extraneous-class */
import axios from "axios";
import { envVars } from "../config/env";

export class PDFShiftGeneratorHelper {
  private static readonly API_URL = "https://api.pdfshift.io/v3/convert/pdf";
  private static readonly API_KEY = envVars.PDF_SHIFT_API_KEY;

  static async generatePDF(html: string): Promise<Buffer> {
    if (!this.API_KEY) {
      throw new Error("PDF_SHIFT_API_KEY is not configured in environment variables");
    }

    try {
      console.log("Generating PDF via PDFShift...");

      const response = await axios.post(
        this.API_URL,
        {
          source: html,
          format: "A4",
          landscape: "true",
          margin: {
            top: "0mm",
            bottom: "10mm",
            left: "10mm",
            right: "10mm",
          },
          zoom: "1",
          css: "true",
          javascript: "false",
        },
        {
          auth: {
            username: "api",
            password: this.API_KEY,
          },
          responseType: "arraybuffer",
          timeout: 50000,
          maxBodyLength: Infinity,
        },
      );
      console.log("PDF generated successfully via PDFShift");

      return Buffer.from(response.data);
    } catch (error) {
      console.error("PDFShift Error:", error);

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.toString() || error.message;
        throw new Error(`PDF service failed: ${errorMessage}`);
      }

      throw new Error(
        `PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
