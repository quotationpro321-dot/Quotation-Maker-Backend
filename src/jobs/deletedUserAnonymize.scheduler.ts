import { anonymizeExpiredDeletedUsers } from "../services/userAnonymize.service";

const DAY_MS = 24 * 60 * 60 * 1000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

async function runJob(): Promise<void> {
  try {
    await anonymizeExpiredDeletedUsers();
  } catch (error) {
    console.error("Deleted user anonymize scheduler failed:", error);
  }
}

/** Runs once at startup and every 24 hours. */
export function startDeletedUserAnonymizeScheduler(): void {
  if (intervalHandle) {
    return;
  }

  void runJob();
  intervalHandle = setInterval(() => {
    void runJob();
  }, DAY_MS);

  console.log("Deleted user anonymize scheduler started (daily).");
}

export function stopDeletedUserAnonymizeScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
