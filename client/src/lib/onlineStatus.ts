// DEPRECATED: Server-Side Authority is now in place.
// All isOnline calculations are done by the server in /api/user/presence-all
// The frontend should ONLY read the isOnline boolean from the API response.
// 
// DO NOT use this function for new code.
// This file is kept for backwards compatibility only.

export function isUserOnline(lastActiveAt: string | Date | null | undefined): boolean {
  console.warn('DEPRECATED: isUserOnline() should not be called. Use server isOnline value instead.');
  return false; // Always return false to force using server value
}
