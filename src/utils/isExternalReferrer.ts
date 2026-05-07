export const isExternalReferrer = (referrer: string, currentHost: string): boolean => {
  if (!referrer) return false;

  try {
    const referrerUrl = new URL(referrer);
    const currentUrl = new URL(currentHost);
    return referrerUrl.hostname !== currentUrl.hostname;
  } catch {
    return false;
  }
};
