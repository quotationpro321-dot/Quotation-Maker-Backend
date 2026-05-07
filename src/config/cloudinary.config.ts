/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import stream from "stream";
import AppError from "../utils/AppError";
import { envVars } from "./env";

cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 600000,
});

const generateUniqueFileName = (originalName: string): string => {
  const fileName = originalName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\./g, "-")
    .replace(/[^a-z0-9\-\\.]/g, "");

  const lastDotIndex = originalName.lastIndexOf(".");
  const extension =
    lastDotIndex > 0 && lastDotIndex < originalName.length - 1
      ? originalName.slice(lastDotIndex + 1)
      : "";

  const randomString = Math.random().toString(36).substring(2);
  const timestamp = Date.now();

  return extension
    ? `${randomString}-${timestamp}-${fileName}.${extension}`
    : `${randomString}-${timestamp}-${fileName}`;
};

const performCloudinaryUploadWithRetry = async (
  buffer: Buffer,
  uploadOptions: any,
  resourceType: "video" | "image" | "auto",
  maxRetries = 3,
  baseDelayMs = 2000,
): Promise<UploadApiResponse> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `☁️  Uploading to Cloudinary (attempt ${attempt}/${maxRetries}) - ${resourceType}`,
      );

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) {
              console.error(`❌ Upload error:`, error);
              return reject(error);
            }
            resolve(result as UploadApiResponse);
          })
          .end(buffer);
      });

      console.log(`✅ Cloudinary upload successful on attempt ${attempt}: ${result.secure_url}`);
      return result;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const errorMessage = error.message || "Unknown error";
      const errorCode = error.http_code || error.code || error.error?.code;

      console.log(
        `❌ Cloudinary upload attempt ${attempt} failed: ${errorMessage} (Code: ${errorCode})`,
      );

      // Check if it's a retryable error
      const isRetryable =
        errorCode === 499 || // Request Timeout
        errorCode === 503 || // Service Unavailable
        errorCode === 429 || // Too Many Requests
        errorCode === 500 || // Internal Server Error
        errorMessage.includes("timeout") ||
        errorMessage.includes("Timeout") ||
        errorMessage.includes("ETIMEDOUT") ||
        errorMessage.includes("ECONNRESET") ||
        errorMessage.includes("ECONNREFUSED");

      if (isLastAttempt) {
        if (isRetryable) {
          console.error(
            `❌ Cloudinary upload failed after ${maxRetries} attempts (transient error)`,
          );
          throw new AppError(
            500,
            `Failed to upload to Cloudinary after ${maxRetries} attempts: ${errorMessage}`,
          );
        } else {
          console.error(`❌ Cloudinary upload failed with non-retryable error: ${errorMessage}`);
          throw new AppError(500, `Cloudinary upload failed: ${errorMessage}`);
        }
      }

      if (!isRetryable) {
        console.error(`❌ Non-retryable error encountered: ${errorMessage}`);
        throw new AppError(500, `Cloudinary upload failed: ${errorMessage}`);
      }

      // Calculate exponential backoff with jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000; // Add up to 1 second random jitter
      const waitTime = exponentialDelay + jitter;

      console.log(`⏳ Waiting ${Math.round(waitTime)}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new AppError(500, "Failed to upload to Cloudinary after all retries");
};

/**
 * Upload video buffer to Cloudinary
 * Used for videos under 100MB
 */
export const uploadVideoToCloudinary = async (
  buffer: Buffer,
  originalName: string,
): Promise<UploadApiResponse> => {
  try {
    const fileName = generateUniqueFileName(originalName);
    const public_id = `videos/${fileName}`;

    console.log(`📤 Uploading video to Cloudinary: ${fileName}`);
    console.log(`   Size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);

    const uploadOptions = {
      resource_type: "video" as const,
      public_id: public_id,
      folder: "cinematography/videos",
      chunk_size: 6000000, // 6MB chunks
      timeout: 600000, // 10 minutes
    };

    return await performCloudinaryUploadWithRetry(buffer, uploadOptions, "video");
  } catch (error: any) {
    console.error("❌ Cloudinary video upload failed:", error);
    throw error; // Re-throw the AppError from performCloudinaryUploadWithRetry
  }
};

export const uploadImageToCloudinary = async (
  buffer: Buffer,
  originalName: string,
): Promise<UploadApiResponse> => {
  try {
    const fileName = generateUniqueFileName(originalName);
    const public_id = `images/${fileName}`;

    console.log(`📤 Uploading image to Cloudinary: ${fileName}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);

    const uploadOptions = {
      resource_type: "image" as const,
      public_id: public_id,
      folder: "cinematography/posters",
      timeout: 600000, // 10 minutes
    };

    return await performCloudinaryUploadWithRetry(buffer, uploadOptions, "image");
  } catch (error: any) {
    console.error("❌ Cloudinary image upload failed:", error);
    throw error; // Re-throw the AppError from performCloudinaryUploadWithRetry
  }
};

export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse | undefined> => {
  try {
    const public_id = `pdf/${fileName}-${Date.now()}`;

    console.log(`📤 Uploading file to Cloudinary: ${fileName}`);

    const uploadOptions = {
      resource_type: "auto" as const,
      public_id: public_id,
      folder: "pdf",
      timeout: 600000,
    };

    return await performCloudinaryUploadWithRetry(buffer, uploadOptions, "auto");
  } catch (error: any) {
    console.log(error);
    throw new AppError(401, `Error uploading file ${error.message}`);
  }
};

export const deleteVideoFromCloudinary = async (url: string): Promise<void> => {
  try {
    // Extract public_id from Cloudinary URL
    const regex = /\/v\d+\/(.*?)\.(mp4|mov|avi|webm|mkv)$/i;
    const match = url.match(regex);

    if (match && match[1]) {
      const public_id = match[1];
      await cloudinary.uploader.destroy(public_id, { resource_type: "video" });
      console.log(`🗑️  Video deleted from Cloudinary: ${public_id}`);
    } else {
      console.warn("⚠️  Could not extract public_id from URL:", url);
    }
  } catch (error: any) {
    console.error("❌ Cloudinary deletion error:", error);
    throw new AppError(500, "Cloudinary video deletion failed");
  }
};

export const deleteImageFromCLoudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;

    const match = url.match(regex);

    console.log({ match });

    if (match && match[1]) {
      const public_id = match[1];
      await cloudinary.uploader.destroy(public_id);
      console.log(`File ${public_id} is deleted from cloudinary`);
    }
  } catch (error: any) {
    throw new AppError(401, "Cloudinary image deletion failed", error.message);
  }
};

export const fileExistsInCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch (error: any) {
    if (error.http_code === 404) {
      return false;
    }
    throw error;
  }
};

export const cloudinaryUpload = cloudinary;

//Multer storage cloudinary
//Amader folder -> image -> form data -> File -> Multer -> storage in cloudinary -> url ->  req.file  -> url  -> mongoose -> mongodb