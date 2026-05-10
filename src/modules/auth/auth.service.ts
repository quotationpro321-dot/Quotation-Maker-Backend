import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CACHE_KEYS } from "../../constants/cacheKeys";
import { cacheService } from "../../services/cache.service";
import AppError from "../../utils/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import { createNewAccessTokenWithRefreshToken, createUserAuthTokens } from "../../utils/userTokens";
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

    let cachedUser = await cacheService.get<IUser>(cacheKey);

    if (!cachedUser) {
      cachedUser = await User.findOne({ email });

      if (!cachedUser) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Email does not exist");
      }

      await cacheService.set(cacheKey, cachedUser, 60);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Email does not exist");
    }
    const isPasswordMatch = await user.comparePassword(password as string);
    if (!isPasswordMatch) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Password");
    }

    const { accessToken, refreshToken } = createUserAuthTokens(cachedUser);
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
