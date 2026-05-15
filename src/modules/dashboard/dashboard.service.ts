import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import { CACHE_KEYS, CACHE_TTL } from "../../constants/cacheKeys";
import { cacheService } from "../../services/cache.service";
import { uploadProfileAvatarForUser } from "../../services/profileAvatar.service";
import AppError from "../../utils/AppError";
import { Analytics } from "../analytics/analytics.model";
import { User } from "../user/user.model";
import type { IUser } from "../user/user.types";

export type ProfileUpdatePayload = Pick<IUser, "name" | "email"> & {
  currentPassword?: string;
};

export type TUpdateMyProfileResult = {
  profile: ReturnType<typeof profileDto>;
  message: string;
};

function profileDto(user: {
  _id: Types.ObjectId;
  userId?: string;
  name: string;
  email: string;
  role: string;
  profilePhotoUrl?: string;
}) {
  return {
    _id: String(user._id),
    userId: user.userId ?? String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
  };
}

export const dashboardService = {
  getStats: async () => {
    const cached = await cacheService.get(CACHE_KEYS.DASHBOARD_STATS);

    if (cached) return cached;

    const [totalAnalyticsEvents, totalPixels] = await Promise.all([
      Analytics.countDocuments(),
      User.countDocuments(),
    ]);

    const result = { totalAnalyticsEvents, totalPixels };
    await cacheService.set(CACHE_KEYS.DASHBOARD_STATS, result, CACHE_TTL.MEDIUM);
    return result;
  },

  getMyProfile: async (req: Request) => {
    const userId = req.user?.userId;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid session user.");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }

    return profileDto(user);
  },

  updateMyProfile: async (req: Request, body: ProfileUpdatePayload): Promise<TUpdateMyProfileResult> => {
    const userId = req.user?.userId;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid session user.");
    }

    const existing = await User.findById(userId);
    if (!existing) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }

    const nextName = body.name.trim();
    const nextEmail = body.email.trim().toLowerCase();
    const prevName = existing.name.trim();
    const previousEmail = existing.email.toLowerCase();

    const nameChanged = nextName !== prevName;
    const emailChanged = nextEmail !== previousEmail;

    if (!nameChanged && !emailChanged) {
      return {
        profile: profileDto(existing),
        message: "Everything is already up to date.",
      };
    }

    if (emailChanged) {
      const pwd = body.currentPassword?.trim();
      if (!pwd) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Password is required to change your email.",
        );
      }
      const passwordOk = await existing.comparePassword(pwd);
      if (!passwordOk) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Current password is incorrect.");
      }

      const taken = await User.findOne({
        email: nextEmail,
        _id: { $ne: existing._id },
      });
      if (taken) {
        throw new AppError(StatusCodes.CONFLICT, "Email is already in use.");
      }
    }

    existing.name = nextName;
    existing.email = nextEmail;

    await existing.save();

    await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(previousEmail));
    await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(nextEmail));

    const refreshed = await User.findById(userId).lean();
    if (!refreshed) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }

    let message: string;
    if (nameChanged && emailChanged) {
      message = "Your name and email were updated.";
    } else if (nameChanged) {
      message = "Your name was updated.";
    } else {
      message = "Your email was updated.";
    }

    return {
      profile: profileDto(refreshed),
      message,
    };
  },

  uploadMyProfileAvatar: async (req: Request) => {
    const userId = req.user?.userId;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid session user.");
    }

    const file = req.file;
    if (!file) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Avatar image is required.");
    }

    await uploadProfileAvatarForUser(userId, file);

    const refreshed = await User.findById(userId).lean();
    if (!refreshed) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }

    return profileDto(refreshed);
  },

  changeMyPassword: async (
    req: Request,
    payload: { currentPassword: string; newPassword: string },
  ) => {
    const userId = req.user?.userId;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid session user.");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }

    const ok = await user.comparePassword(payload.currentPassword);
    if (!ok) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Current password is incorrect.");
    }

    user.password = payload.newPassword;
    await user.save();

    await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(user.email));
  },
};
