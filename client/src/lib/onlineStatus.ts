const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function isUserOnline(lastActiveAt: string | Date | null | undefined): boolean {
  if (!lastActiveAt) return false;
  
  const lastActive = typeof lastActiveAt === 'string' 
    ? new Date(lastActiveAt).getTime() 
    : lastActiveAt.getTime();
  
  const now = Date.now();
  return (now - lastActive) < ONLINE_THRESHOLD_MS;
}
