/* eslint-disable @typescript-eslint/no-extraneous-class */
import puppeteer, { Browser, Page } from "puppeteer-core";
import {
  DEFAULT_PDF_OPTIONS,
  getLaunchOptions,
  PDF_GENERATION_CONFIG,
} from "../config/puppeteer.config";

export class PDFGeneratorHelper {
  static async generatePDF(
    html: string,
    options: Partial<typeof DEFAULT_PDF_OPTIONS> = {},
  ): Promise<Buffer> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await puppeteer.launch(await getLaunchOptions());
      console.log("Puppeteer launch options:", await getLaunchOptions());

      page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: PDF_GENERATION_CONFIG.waitUntil,
        timeout: PDF_GENERATION_CONFIG.timeout,
      });

      const pdfBuffer = await page.pdf({
        ...DEFAULT_PDF_OPTIONS,
        ...options,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      throw new Error(
        `PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      if (page) await page.close().catch(console.error);
      if (browser) await browser.close().catch(console.error);
    }
  }

  static async generateMultiplePDFs(
    htmls: string[],
    options?: Partial<typeof DEFAULT_PDF_OPTIONS>,
  ): Promise<Buffer[]> {
    return Promise.all(htmls.map((html) => this.generatePDF(html, options)));
  }
}
