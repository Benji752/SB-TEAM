const ONLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes tolerance

export function isUserOnline(lastActiveAt: string | Date | null | undefined): boolean {
  if (!lastActiveAt) return false;
  
  // Parse the date - ensure we treat it as UTC if it's a string from the server
  let lastActiveTime: number;
  
  if (typeof lastActiveAt === 'string') {
    // Handle ISO strings from server (always UTC)
    // Ensure the string is treated as UTC even if missing 'Z' suffix
    const dateStr = lastActiveAt.endsWith('Z') || lastActiveAt.includes('+') 
      ? lastActiveAt 
      : lastActiveAt + 'Z';
    lastActiveTime = new Date(dateStr).getTime();
  } else {
    lastActiveTime = lastActiveAt.getTime();
  }
  
  // Both timestamps are now in UTC milliseconds - safe to compare
  const now = Date.now();
  const diff = now - lastActiveTime;
  
  return diff < ONLINE_THRESHOLD_MS && diff >= 0;
}
