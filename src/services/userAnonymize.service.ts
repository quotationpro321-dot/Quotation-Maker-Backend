import crypto from "crypto";

import { envVars } from "../config/env";
import { cloudinaryUpload, deleteImageFromCLoudinary } from "../config/cloudinary.config";
import { CACHE_KEYS } from "../constants/cacheKeys";
import { User } from "../modules/user/user.model";
import { UserStatus } from "../modules/user/user.types";
import { cacheService } from "./cache.service";

const ANONYMIZED_NAME = "Removed user";
const JOB_BATCH_SIZE = 50;

export function buildAnonymizedEmail(userObjectId: string): string {
  return `removed.${userObjectId}@anonymized.invalid`;
}

export function buildAnonymizedUserId(userObjectId: string): string {
  return `anonymized-${userObjectId}`;
}

async function removeProfilePhoto(user: {
  profilePhotoPublicId?: string;
  profilePhotoUrl?: string;
}) {
  if (user.profilePhotoPublicId) {
    try {
      await cloudinaryUpload.uploader.destroy(user.profilePhotoPublicId);
    } catch {
      /* best-effort */
    }
    return;
  }

  if (user.profilePhotoUrl) {
    try {
      await deleteImageFromCLoudinary(user.profilePhotoUrl);
    } catch {
      /* best-effort */
    }
  }
}

/** Clears PII on a soft-deleted user; keeps Mongo `_id` for historical references. */
export async function anonymizeDeletedUser(
  user: InstanceType<typeof User>,
): Promise<void> {
  if (user.anonymizedAt) {
    return;
  }

  const previousEmail = user.email.trim().toLowerCase();
  const objectId = String(user._id);

  await removeProfilePhoto(user);

  user.name = ANONYMIZED_NAME;
  user.email = buildAnonymizedEmail(objectId);
  user.userId = buildAnonymizedUserId(objectId);
  user.password = crypto.randomBytes(48).toString("hex");
  user.emailVerified = false;
  user.profilePhotoUrl = undefined;
  user.profilePhotoPublicId = undefined;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.passwordResetUsedAt = null;
  user.status = UserStatus.DELETED;
  user.anonymizedAt = new Date();

  await user.save();
  await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(previousEmail));
}

export async function anonymizeExpiredDeletedUsers(): Promise<number> {
  const retentionDays = envVars.USER_ANONYMIZE_AFTER_DAYS;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const candidates = await User.find({
    status: UserStatus.DELETED,
    anonymizedAt: null,
    $or: [
      { deletedAt: { $lte: cutoff } },
      { deletedAt: null, updatedAt: { $lte: cutoff } },
    ],
  }).limit(JOB_BATCH_SIZE);

  let processed = 0;
  for (const user of candidates) {
    try {
      await anonymizeDeletedUser(user);
      processed += 1;
    } catch (error) {
      console.error(`Failed to anonymize user ${String(user._id)}:`, error);
    }
  }

  if (processed > 0) {
    console.log(
      `Anonymized ${processed} soft-deleted user(s) (retention: ${retentionDays} days).`,
    );
  }

  return processed;
}
