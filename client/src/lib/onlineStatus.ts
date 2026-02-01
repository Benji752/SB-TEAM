// TIMEAGO Approach: Frontend judges online status from secondsSinceLastPing
// Server returns secondsSinceLastPing as an integer, frontend compares < threshold

const ONLINE_THRESHOLD_SECONDS = 3600; // 1 hour tolerance for timezone issues

export function isUserOnlineFromSeconds(
  secondsSinceLastPing: number | null | undefined,
  isCurrentUser: boolean = false
): boolean {
  // Current user is ALWAYS online when viewing
  if (isCurrentUser) {
    return true;
  }
  if (secondsSinceLastPing === null || secondsSinceLastPing === undefined) {
    return false;
  }
  return secondsSinceLastPing < ONLINE_THRESHOLD_SECONDS;
}

// Legacy function - kept for backwards compatibility
export function isUserOnline(
  lastActiveAt: string | Date | null | undefined,
  isCurrentUser: boolean = false
): boolean {
  // Current user is ALWAYS online when viewing
  if (isCurrentUser) {
    return true;
  }
  if (!lastActiveAt) return false;
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - lastActive.getTime()) / 1000);
  return diffSeconds < ONLINE_THRESHOLD_SECONDS;
}
