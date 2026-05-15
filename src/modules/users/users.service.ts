import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";

import QueryBuilder from "../../builder/QueryBuilder";
import { CACHE_KEYS } from "../../constants/cacheKeys";
import { cacheService } from "../../services/cache.service";
import { uploadProfileAvatarForUser } from "../../services/profileAvatar.service";
import AppError from "../../utils/AppError";
import { User } from "../user/user.model";
import { IUser, UserRole, UserStatus } from "../user/user.types";
import type { z } from "zod";
import type {
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
} from "./users.validation";

export type TListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type TCreateUserBody = z.infer<typeof createUserBodySchema>;
export type TUpdateUserBody = z.infer<typeof updateUserBodySchema>;

function adminUserDto(user: {
  _id: Types.ObjectId;
  userId?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified?: boolean;
  profilePhotoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    _id: String(user._id),
    userId: user.userId ?? String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerified),
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    createdAt: user.createdAt?.toISOString() ?? null,
    updatedAt: user.updatedAt?.toISOString() ?? null,
  };
}

function buildUserId(name: string, email: string, role: string) {
  return `${name.trim()}${email.trim().toLowerCase()}${role}`;
}

async function invalidateUserEmailCache(email: string) {
  await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(email.trim().toLowerCase()));
}

function applySoftDelete(user: InstanceType<typeof User>) {
  user.status = UserStatus.DELETED;
  user.deletedAt = new Date();
}

function isRestorableDeletedUser(user: { status: string; anonymizedAt?: Date | null }) {
  return user.status === UserStatus.DELETED && !user.anonymizedAt;
}

/** Maps frontend list params to QueryBuilder shape (`searchTerm`, `sort`, `fields`). */
function toBuilderQuery(query: TListUsersQuery): Record<string, unknown> {
  const { search, sortBy, sortOrder, fields, ...rest } = query;
  const prepared: Record<string, unknown> = { ...rest };

  if (search) prepared.searchTerm = search;
  if (sortBy) prepared.sort = sortOrder === "asc" ? sortBy : `-${sortBy}`;
  if (fields) prepared.fields = fields;
  else prepared.fields = "-password";

  return prepared;
}

export const usersService = {
  list: async (query: TListUsersQuery, excludeUserId?: string) => {
    const baseFilter: Record<string, unknown> = {};
    if (!query.status) {
      baseFilter.status = { $ne: UserStatus.DELETED };
    } else if (query.status === UserStatus.DELETED) {
      baseFilter.anonymizedAt = null;
    }
    if (excludeUserId && Types.ObjectId.isValid(excludeUserId)) {
      baseFilter._id = { $ne: new Types.ObjectId(excludeUserId) };
    }

    const userQuery = new QueryBuilder(User.find(baseFilter), toBuilderQuery(query))
      .search(["name", "email", "userId"])
      .filter()
      .sort()
      .paginate()
      .fields();

    type UserListLean = Pick<
      IUser,
      "userId" | "name" | "email" | "role" | "status" | "emailVerified" | "profilePhotoUrl"
    > & {
      _id: Types.ObjectId;
      createdAt?: Date;
      updatedAt?: Date;
    };

    const [items, meta] = await Promise.all([
      userQuery.modelQuery.lean<UserListLean[]>(),
      userQuery.countTotal(),
    ]);

    return {
      items: items.map(adminUserDto),
      pagination: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPage,
      },
    };
  },

  getById: async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user id.");
    }
    const user = await User.findById(id).select("-password").lean();
    if (!user || user.status === UserStatus.DELETED) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }
    return adminUserDto(user);
  },

  create: async (body: TCreateUserBody) => {
    const email = body.email.trim().toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
      if (!isRestorableDeletedUser(existing)) {
        throw new AppError(StatusCodes.CONFLICT, "A user with this email already exists.");
      }

      const userId = buildUserId(body.name, email, body.role);
      const duplicateUserId = await User.findOne({ userId, _id: { $ne: existing._id } });
      if (duplicateUserId) {
        throw new AppError(
          StatusCodes.CONFLICT,
          "Could not generate a unique user id. Try a different email.",
        );
      }

      const status =
        body.status === UserStatus.DELETED ? UserStatus.ACTIVE : body.status;

      existing.name = body.name.trim();
      existing.userId = userId;
      existing.role = body.role;
      existing.status = status;
      existing.password = body.password;
      existing.emailVerified = body.emailVerified ?? true;
      existing.deletedAt = null;
      existing.anonymizedAt = null;

      await existing.save();
      await invalidateUserEmailCache(email);

      return { ...adminUserDto(existing), restored: true as const };
    }

    const userId = buildUserId(body.name, email, body.role);
    const duplicateUserId = await User.findOne({ userId });
    if (duplicateUserId) {
      throw new AppError(StatusCodes.CONFLICT, "Could not generate a unique user id. Try a different email.");
    }

    const created = await User.create({
      userId,
      name: body.name.trim(),
      email,
      password: body.password,
      role: body.role,
      status: body.status,
      emailVerified: body.emailVerified ?? true,
    });

    return adminUserDto(created);
  },

  restore: async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user id.");
    }

    const existing = await User.findById(id);
    if (!existing || !isRestorableDeletedUser(existing)) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        existing?.anonymizedAt
          ? "This account was permanently anonymized and cannot be restored."
          : "Removed user not found.",
      );
    }

    existing.status = UserStatus.ACTIVE;
    existing.deletedAt = null;
    await existing.save();
    await invalidateUserEmailCache(existing.email);

    return adminUserDto(existing);
  },

  update: async (id: string, body: TUpdateUserBody, actorUserId: string) => {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user id.");
    }

    const existing = await User.findById(id);
    if (!existing || existing.status === UserStatus.DELETED) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }

    if (body.status === UserStatus.DELETED) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Use delete to remove a user.");
    }

    if (String(existing._id) === actorUserId && body.status && body.status !== UserStatus.ACTIVE) {
      throw new AppError(StatusCodes.BAD_REQUEST, "You cannot deactivate your own account.");
    }

    if (String(existing._id) === actorUserId && body.role && body.role !== UserRole.ADMIN) {
      throw new AppError(StatusCodes.BAD_REQUEST, "You cannot change your own admin role.");
    }

    if (body.email) {
      const nextEmail = body.email.trim().toLowerCase();
      if (nextEmail !== existing.email.toLowerCase()) {
        const taken = await User.findOne({ email: nextEmail, _id: { $ne: existing._id } });
        if (taken) {
          throw new AppError(StatusCodes.CONFLICT, "Email is already in use.");
        }
        existing.email = nextEmail;
      }
    }

    if (body.name) existing.name = body.name.trim();
    if (body.role) existing.role = body.role;
    if (body.status) existing.status = body.status;
    if (typeof body.emailVerified === "boolean") existing.emailVerified = body.emailVerified;
    if (body.password) existing.password = body.password;

    await existing.save();
    return adminUserDto(existing);
  },

  bulkRemove: async (ids: string[], actorUserId: string) => {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    const deleted: string[] = [];
    const failed: { id: string; message: string }[] = [];

    for (const id of uniqueIds) {
      if (!Types.ObjectId.isValid(id)) {
        failed.push({ id, message: "Invalid user id." });
        continue;
      }

      if (id === actorUserId) {
        failed.push({ id, message: "You cannot delete your own account." });
        continue;
      }

      const existing = await User.findById(id);
      if (!existing || existing.status === UserStatus.DELETED) {
        failed.push({ id, message: "User not found." });
        continue;
      }

      applySoftDelete(existing);
      await existing.save();
      await invalidateUserEmailCache(existing.email);
      deleted.push(id);
    }

    if (deleted.length === 0 && failed.length > 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        failed.length === 1 ? failed[0].message : "No users could be deleted.",
      );
    }

    return { deleted, failed };
  },

  remove: async (id: string, actorUserId: string) => {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user id.");
    }

    if (id === actorUserId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "You cannot delete your own account.");
    }

    const existing = await User.findById(id);
    if (!existing || existing.status === UserStatus.DELETED) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
    }

    applySoftDelete(existing);
    await existing.save();
    await invalidateUserEmailCache(existing.email);

    return { _id: String(existing._id) };
  },

  uploadAvatar: async (id: string, file: Express.Multer.File) => {
    const updated = await uploadProfileAvatarForUser(id, file);
    return adminUserDto(updated);
  },
};
