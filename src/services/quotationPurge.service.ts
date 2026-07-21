import { envVars } from "../config/env";
import { Quotation } from "../modules/quotations/quotation.model";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function purgeExpiredDeletedQuotations(): Promise<number> {
  const cutoff = new Date(
    Date.now() - envVars.QUOTATION_DELETE_AFTER_DAYS * DAY_MS,
  );
  const result = await Quotation.deleteMany({
    deletedAt: { $ne: null, $lte: cutoff },
  });

  if (result.deletedCount > 0) {
    console.log(
      `Permanently deleted ${result.deletedCount} expired quotation(s).`,
    );
  }

  return result.deletedCount;
}
