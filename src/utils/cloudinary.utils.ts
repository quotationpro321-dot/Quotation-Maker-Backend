/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import {
  deleteImageFromCLoudinary,
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
} from "../config/cloudinary.config";
import { formatFileSize } from "../config/multer.config";
import AppError from "./AppError";

export const handleCloudinaryUpload = async (file: Express.Multer.File) => {
  const uploadStartTime = Date.now();

  try {
    if (!file.buffer) {
      throw new AppError(httpStatus.BAD_REQUEST, "File buffer is required");
    }

    const maxCloudinarySize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxCloudinarySize) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `File too large for Cloudinary. Maximum size is 100MB. Your file is ${formatFileSize(file.size)}.`,
      );
    }

    console.log(
      `📤 Uploading video to Cloudinary: ${file.originalname} (${formatFileSize(file.size)})`,
    );

    const cloudinaryUpload = await uploadVideoToCloudinary(file.buffer, file.originalname);

    const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
    console.log(`✅ Cloudinary video upload completed in ${uploadTime}s`);

    return {
      cloudinaryUrl: cloudinaryUpload.secure_url,
      cloudinaryPublicId: cloudinaryUpload.public_id,
    };
  } catch (error: any) {
    const failedTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
    console.error(`❌ Cloudinary video upload failed after ${failedTime}s:`, error.message);

    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Provide helpful error messages based on error type
    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      throw new AppError(
        httpStatus.REQUEST_TIMEOUT,
        "Video upload timed out. Please try again or use a smaller file.",
      );
    } else if (error.http_code === 429) {
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        "Too many upload requests. Please wait a moment and try again.",
      );
    } else if (error.http_code === 503) {
      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        "Cloudinary service temporarily unavailable. Please try again.",
      );
    } else {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to upload video to Cloudinary: ${error.message}`,
      );
    }
  }
};

export const handlePosterUpload = async (file: Express.Multer.File): Promise<string> => {
  const uploadStartTime = Date.now();

  try {
    if (!file.buffer) {
      throw new AppError(httpStatus.BAD_REQUEST, "Poster buffer is required");
    }

    const fileSizeKB = (file.size / 1024).toFixed(2);
    console.log(`📤 Uploading poster to Cloudinary: ${file.originalname} (${fileSizeKB} KB)`);

    const cloudinaryUpload = await uploadImageToCloudinary(file.buffer, file.originalname);

    const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
    console.log(`✅ Poster uploaded successfully in ${uploadTime}s`);

    return cloudinaryUpload.secure_url;
  } catch (error: any) {
    const failedTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
    console.error(`❌ Poster upload failed after ${failedTime}s:`, error.message);

    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Provide helpful error messages based on error type
    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      throw new AppError(
        httpStatus.REQUEST_TIMEOUT,
        "Poster upload timed out. Please try again with a smaller image.",
      );
    } else if (error.http_code === 429) {
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        "Too many upload requests. Please wait a moment and try again.",
      );
    } else if (error.http_code === 503) {
      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        "Cloudinary service temporarily unavailable. Please try again.",
      );
    } else {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to upload poster: ${error.message}`,
      );
    }
  }
};

export const handlePosterDelete = async (posterUrl: string): Promise<void> => {
  try {
    if (!posterUrl) {
      console.log("⚠️  No poster URL provided for deletion");
      return;
    }

    console.log(`🗑️  Deleting poster from Cloudinary: ${posterUrl}`);
    await deleteImageFromCLoudinary(posterUrl);
    console.log(`✅ Poster deleted successfully`);
  } catch (error: any) {
    // Log the error but don't throw - deletion failures shouldn't block operations
    console.error("⚠️  Failed to delete poster:", error.message);
    // Don't throw error - allow operation to continue
  }
};
