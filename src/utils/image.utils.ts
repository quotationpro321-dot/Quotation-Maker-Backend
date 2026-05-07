/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { deleteImageFromCLoudinary, uploadImageToCloudinary } from "../config/cloudinary.config";
import { formatFileSize } from "../config/multer.config";
import AppError from "./AppError";

interface ImageSourceItem {
  imageSource: string;
  cloudinaryUrl?: string;
  url?: string;
}

interface ImageUploadResult {
  url: string;
  publicId?: string;
  fileId?: string;
}

export const handleImageUpload = async (
  file: Express.Multer.File,
  _source: "cloudinary",
): Promise<ImageUploadResult> => {
  const uploadStartTime = Date.now();

  try {
    if (!file.buffer) {
      throw new AppError(httpStatus.BAD_REQUEST, "File buffer is required");
    }

    const maxCloudinarySize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxCloudinarySize) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Image too large for Cloudinary. Maximum size is 10MB. Your file is ${formatFileSize(file.size)}.`,
      );
    }

    console.log(`📤 Uploading image to Cloudinary: ${file.originalname} (${formatFileSize(file.size)})`);

    const cloudinaryUpload = await uploadImageToCloudinary(file.buffer, file.originalname);

    const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
    console.log(`✅ Cloudinary image upload completed in ${uploadTime}s`);

    return {
      url: cloudinaryUpload.secure_url,
      publicId: cloudinaryUpload.public_id,
    };
  } catch (error: any) {
    const failedTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
    console.error(`❌ Image upload failed after ${failedTime}s:`, error.message);

    if (error instanceof AppError) {
      throw error;
    }

    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      throw new AppError(
        httpStatus.REQUEST_TIMEOUT,
        "Image upload timed out. Please try again or use a smaller file.",
      );
    } else if (error.http_code === 429) {
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        "Too many upload requests. Please wait a moment and try again.",
      );
    } else if (error.http_code === 503) {
      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        "Upload service temporarily unavailable. Please try again.",
      );
    } else {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to upload image: ${error.message}`,
      );
    }
  }
};

export const handleImageDelete = async (item: ImageSourceItem): Promise<void> => {
  try {
    if (item.imageSource === "cloudinary" && (item.cloudinaryUrl || item.url)) {
      const urlToDelete = item.cloudinaryUrl || item.url;
      if (urlToDelete) {
        console.log(`🗑️ Deleting image from Cloudinary: ${urlToDelete}`);
        await deleteImageFromCLoudinary(urlToDelete);
        console.log(`✅ Image deleted from Cloudinary`);
      }
    }
  } catch (error: any) {
    console.error("⚠️ Failed to delete image:", error.message);
    // Don't throw - allow operation to continue
  }
};

export const validateImageSource = (payload: ImageSourceItem): void => {
  const { imageSource, cloudinaryUrl, url } = payload;

  if (imageSource === "cloudinary" && !cloudinaryUrl && !url) {
    throw new AppError(httpStatus.BAD_REQUEST, "Cloudinary URL required for cloudinary uploads");
  }

};
