export const httpMessages = {
  // General
  WELCOME_MESSAGE: "Welcome to Quotation-Maker Server",
  SUCCESS: "Request completed successfully",
  NOT_FOUND: "Endpoint not found",
  RESOURCE_NOT_FOUND: "Resource not found",
  SERVER_ERROR: "Internal server error",
  BAD_REQUEST: "Bad request",
  VALIDATION_ERROR: "Validation failed",
  CONFLICT: "Resource already exists",
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",

  // Auth & Access
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden",
  ACCESS: "You are not authorized",
  INVALID_CREDENTIALS: "Invalid email or password",
  TOKEN_MISSING: "Authentication token is missing",
  TOKEN_INVALID: "Invalid authentication token",
  TOKEN_EXPIRED: "Authentication token has expired",
  REFRESH_TOKEN_INVALID: "Invalid or expired refresh token",
  SESSION_EXPIRED: "Your session has expired, please log in again",

  // User account
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User with this email already exists",
  USER_REGISTERED: "User registered successfully",
  LOGIN_SUCCESS: "Logged in successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  PASSWORD_CHANGED: "Password updated successfully",
  PASSWORD_INCORRECT: "Current password is incorrect",
  EMAIL_NOT_VERIFIED: "Email address is not verified",
  EMAIL_VERIFIED: "Email verified successfully",
  ACCOUNT_INACTIVE: "Your account is inactive",
  ACCOUNT_BLOCKED: "Your account has been blocked",

  // CRUD
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  FETCHED: "Fetched successfully",

  // File / Upload
  FILE_REQUIRED: "File is required",
  FILE_TOO_LARGE: "File size exceeds the allowed limit",
  INVALID_FILE_TYPE: "Invalid file type",
  UPLOAD_FAILED: "File upload failed",

  // Email
  EMAIL_SENT: "Email sent successfully",
  EMAIL_FAILED: "Failed to send email",
};
