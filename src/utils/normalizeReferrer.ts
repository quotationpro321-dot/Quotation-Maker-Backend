export const normalizeReferrer = (referrer: string): string | null => {
  if (!referrer) return "direct";

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    // Filter out localhost and local development URLs
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.0.")
    ) {
      return null; // Don't track internal navigation
    }

    // Normalize common platforms
    if (hostname.includes("facebook.com") || hostname.includes("fb.com")) {
      return "facebook.com";
    }
    if (hostname.includes("instagram.com")) {
      return "instagram.com";
    }
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return "twitter.com";
    }
    if (hostname.includes("linkedin.com")) {
      return "linkedin.com";
    }
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "youtube.com";
    }
    if (hostname.includes("google.com") || hostname.includes("google.")) {
      return "google.com";
    }
    if (hostname.includes("tiktok.com")) {
      return "tiktok.com";
    }

    // Return the main domain without subdomains (except www)
    const parts = hostname.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      return parts.slice(-2).join(".");
    }

    return hostname;
  } catch (error) {
    // If URL parsing fails, return null (invalid referrer)
    console.log(error);
    return null;
  }
};
