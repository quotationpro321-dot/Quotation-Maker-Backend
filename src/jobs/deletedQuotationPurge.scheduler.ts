import { purgeExpiredDeletedQuotations } from "../services/quotationPurge.service";

const DAY_MS = 24 * 60 * 60 * 1000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

async function runJob(): Promise<void> {
  try {
    await purgeExpiredDeletedQuotations();
  } catch (error) {
    console.error("Deleted quotation purge scheduler failed:", error);
  }
}

/** Runs once at startup and every 24 hours. */
export function startDeletedQuotationPurgeScheduler(): void {
  if (intervalHandle) return;

  void runJob();
  intervalHandle = setInterval(() => {
    void runJob();
  }, DAY_MS);

  console.log("Deleted quotation purge scheduler started (daily).");
}
