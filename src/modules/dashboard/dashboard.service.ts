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
  /** Optional; omit to keep current, send "" to clear. */
  whatsappNumber?: string | null;
  consultantDesignation?: string | null;
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
  whatsappNumber?: string | null;
  consultantDesignation?: string | null;
  profilePhotoUrl?: string;
}) {
  return {
    _id: String(user._id),
    userId: user.userId ?? String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    whatsappNumber: user.whatsappNumber ?? null,
    consultantDesignation: user.consultantDesignation ?? null,
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

    const whatsappProvided = body.whatsappNumber !== undefined;
    const nextWhatsapp = whatsappProvided
      ? body.whatsappNumber?.trim() || null
      : (existing.whatsappNumber ?? null);
    const prevWhatsapp = existing.whatsappNumber ?? null;

    const designationProvided = body.consultantDesignation !== undefined;
    const nextDesignation = designationProvided
      ? body.consultantDesignation?.trim() || null
      : (existing.consultantDesignation ?? null);
    const prevDesignation = existing.consultantDesignation ?? null;

    const nameChanged = nextName !== prevName;
    const emailChanged = nextEmail !== previousEmail;
    const whatsappChanged = whatsappProvided && nextWhatsapp !== prevWhatsapp;
    const designationChanged =
      designationProvided && nextDesignation !== prevDesignation;

    if (!nameChanged && !emailChanged && !whatsappChanged && !designationChanged) {
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
    if (whatsappChanged) {
      existing.whatsappNumber = nextWhatsapp;
    }
    if (designationChanged) {
      existing.consultantDesignation = nextDesignation;
    }

    await existing.save();

    await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(previousEmail));
    await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(nextEmail));

    const refreshed = await User.findById(userId).lean();
    if (!refreshed) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }

    const changedLabels = [
      nameChanged ? "name" : null,
      emailChanged ? "email" : null,
      whatsappChanged ? "WhatsApp number" : null,
      designationChanged ? "designation" : null,
    ].filter((label): label is string => label !== null);

    const lastLabel = changedLabels[changedLabels.length - 1];
    const message =
      changedLabels.length === 1
        ? `Your ${changedLabels[0]} was updated.`
        : `Your ${changedLabels.slice(0, -1).join(", ")} and ${lastLabel} were updated.`;

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
