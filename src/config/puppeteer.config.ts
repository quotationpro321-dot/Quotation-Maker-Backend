import chromium from "@sparticuz/chromium";
import { LaunchOptions, PDFOptions } from "puppeteer-core";

// export const PUPPETEER_LAUNCH_OPTIONS: LaunchOptions = {
//   headless: true,
//   executablePath:
//     process.env.NODE_ENV === "production" ? "/usr/bin/chromium" : "/usr/bin/google-chrome",
//   args: [
//     "--no-sandbox",
//     "--disable-setuid-sandbox",
//     "--disable-dev-shm-usage",
//     "--disable-gpu",
//     "--disable-software-rasterizer",
//     "--disable-extensions",
//     "--font-render-hinting=none",
//   ],
// };

export const getLaunchOptions = async (): Promise<LaunchOptions> => ({
  headless: true,
  args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  executablePath: await chromium.executablePath(),
  //  executablePath: process.env.NODE_ENV === "production"
  //   ? await chromium.executablePath()
  //   : "/usr/bin/google-chrome",
  defaultViewport: {
    width: 1200,
    height: 800,
  },
});

export const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: "A4",
  printBackground: true,
  margin: {
    top: "0mm",
    bottom: "10mm",
    left: "10mm",
    right: "10mm",
  },
};

export const PDF_GENERATION_CONFIG = {
  timeout: 60000,
  waitUntil: "networkidle0" as const,
};
