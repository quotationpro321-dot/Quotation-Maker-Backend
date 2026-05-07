import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CACHE_KEYS } from "../../constants/cacheKeys.constant";
import { cacheService } from "../../services/cache.service";
import AppError from "../../utils/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import { createNewAccessTokenWithRefreshToken, createUsersToken } from "../../utils/userTokens";
import { User } from "../user/user.model";
import { IUser } from "../user/user.types";

export const authService = {
  getNewAccessToken: async (refreshToken: string) => {
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);
    return {
      accessToken: newAccessToken,
    };
  },
  login: async (res: Response, payload: Partial<IUser>) => {
    const { email, password } = payload;

    const cacheKey = CACHE_KEYS.USER_BY_EMAIL(email as string);

    let isUserExist = await cacheService.get<IUser>(cacheKey);

    if (!isUserExist) {
      // 2. DB fallback
      isUserExist = await User.findOne({ email });

      if (!isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Email does not exist");
      }

      // 3. Cache it (short TTL for auth)
      await cacheService.set(cacheKey, isUserExist, 60);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Email does not exist");
    }
    const isPasswordMatch = await user.comparePassword(password as string);
    if (!isPasswordMatch) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Password");
    }

    const { accessToken, refreshToken } = createUsersToken(isUserExist);
    setAuthCookie(res, {
      accessToken,
      refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  },
};
