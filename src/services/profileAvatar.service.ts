import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import {
  cloudinaryUpload,
  deleteImageFromCLoudinary,
  uploadProfileAvatarToCloudinary,
} from "../config/cloudinary.config";
import { CACHE_KEYS } from "../constants/cacheKeys";
import { User } from "../modules/user/user.model";
import { UserStatus } from "../modules/user/user.types";
import { cacheService } from "./cache.service";
import AppError from "../utils/AppError";

/** Upload/replace profile avatar for a user (JPG/PNG/GIF, max 1MB — validated by multer). */
export async function uploadProfileAvatarForUser(
  userId: string,
  file: Express.Multer.File,
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user id.");
  }

  if (!file?.buffer) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Avatar image is required.");
  }

  const existing = await User.findById(userId);
  if (!existing || existing.status === UserStatus.DELETED) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  const upload = await uploadProfileAvatarToCloudinary(file.buffer, file.originalname);

  const previousPublicId = existing.profilePhotoPublicId;
  if (previousPublicId) {
    try {
      await cloudinaryUpload.uploader.destroy(previousPublicId);
    } catch {
      /* best-effort cleanup */
    }
  } else if (existing.profilePhotoUrl) {
    try {
      await deleteImageFromCLoudinary(existing.profilePhotoUrl);
    } catch {
      /* URL may not be Cloudinary or regex may not match */
    }
  }

  existing.profilePhotoUrl = upload.secure_url;
  existing.profilePhotoPublicId = upload.public_id;
  await existing.save();

  await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(existing.email.toLowerCase()));

  return existing;
}
