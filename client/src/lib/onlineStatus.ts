/**
 * Utility functions for calculating user online status based on last_seen timestamp
 */

export type OnlineStatus = "online" | "offline";

/**
 * Determines if a user is online based on their last_seen timestamp
 * A user is considered online if last_seen is within the last 2 minutes
 */
export function isUserOnline(lastSeen: Date | string | null): boolean {
  if (!lastSeen) return false;

  const lastSeenDate = typeof lastSeen === "string" ? new Date(lastSeen) : lastSeen;
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes < 2;
}

/**
 * Gets the online status as a string ("online" or "offline")
 */
export function getOnlineStatus(lastSeen: Date | string | null): OnlineStatus {
  return isUserOnline(lastSeen) ? "online" : "offline";
}

/**
 * Formats the last seen time for display
 * If online: returns "Online"
 * If offline: returns "Last seen X mins ago", "Last seen X hours ago", etc.
 */
export function formatLastSeen(lastSeen: Date | string | null): string {
  if (!lastSeen) return "Never seen";

  const lastSeenDate = typeof lastSeen === "string" ? new Date(lastSeen) : lastSeen;
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 2) {
    return "Online";
  } else if (diffMinutes < 60) {
    return `Last seen ${diffMinutes} min${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `Last seen ${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 30) {
    return `Last seen ${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    return lastSeenDate.toLocaleDateString();
  }
}
