/* eslint-disable @typescript-eslint/no-non-null-assertion */
import mongoose from "mongoose";
import { envVars } from "../config/env";
import { Analytics } from "../modules/analytics/analytics.model";

const normalizeReferrer = (referrer: string): string | null => {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    // Filter out localhost
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) {
      return null;
    }

    // Normalize platforms
    if (hostname.includes("facebook.com") || hostname.includes("fb.com")) {
      return "facebook.com";
    }
    if (hostname.includes("google.com")) {
      return "google.com";
    }
    // ... add more normalizations

    return hostname;
  } catch {
    return null;
  }
};

async function cleanupAnalytics() {
  try {
    await mongoose.connect(envVars.DATABASE_URL);

    const analytics = await Analytics.find({ referrer: { $exists: true } });

    for (const record of analytics) {
      const normalized = normalizeReferrer(record.referrer!);

      if (normalized === null) {
        // Remove referrer from internal navigation
        await Analytics.findByIdAndUpdate(record._id, { $unset: { referrer: "" } });
        console.log(`Removed internal referrer: ${record.referrer}`);
      } else if (normalized !== record.referrer) {
        // Update to normalized referrer
        await Analytics.findByIdAndUpdate(record._id, { referrer: normalized });
        console.log(`Normalized: ${record.referrer} → ${normalized}`);
      }
    }

    console.log("Cleanup completed!");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

cleanupAnalytics();