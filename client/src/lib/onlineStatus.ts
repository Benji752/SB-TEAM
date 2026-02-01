// TIMEAGO Approach: Frontend judges online status from secondsSinceLastPing
// Server returns secondsSinceLastPing as an integer, frontend compares < 300 (5 min)

const ONLINE_THRESHOLD_SECONDS = 300; // 5 minutes

export function isUserOnlineFromSeconds(secondsSinceLastPing: number | null | undefined): boolean {
  if (secondsSinceLastPing === null || secondsSinceLastPing === undefined) {
    return false;
  }
  return secondsSinceLastPing < ONLINE_THRESHOLD_SECONDS;
}

// Legacy function - kept for backwards compatibility
export function isUserOnline(lastActiveAt: string | Date | null | undefined): boolean {
  if (!lastActiveAt) return false;
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - lastActive.getTime()) / 1000);
  return diffSeconds < ONLINE_THRESHOLD_SECONDS;
}
