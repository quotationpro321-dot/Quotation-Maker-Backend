/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from "multer";
import AppError from "../utils/AppError";

export const multerMemoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB for large video uploads
    fieldSize: 5 * 1024 * 1024 * 1024,
    files: 2,
  },
  fileFilter: (req, file, cb) => {
    // Allow chunks (binary data with fieldname 'chunk')
    if (file.fieldname === "chunk") {
      cb(null, true);
      return;
    }

    // For regular uploads, check MIME type
    if (file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video and image files are allowed"));
    }
  },
});

export const handleMulterError = (error: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        throw new AppError(413, "File too large. Maximum 5GB for videos");
      case "LIMIT_FILE_COUNT":
        throw new AppError(400, "Too many files uploaded");
      case "LIMIT_UNEXPECTED_FILE":
        throw new AppError(400, "Unexpected field in upload");
      default:
        throw new AppError(400, `Upload error: ${error.message}`);
    }
  }
  throw error;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
