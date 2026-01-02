import { formatLastSeen, isUserOnline } from "@/lib/onlineStatus";

interface UserStatusProps {
  lastSeen: Date | string | null;
  className?: string;
  showDot?: boolean;
}

/**
 * Component to display user's online status indicator and last seen text
 */
export function UserStatus({ lastSeen, className = "", showDot = true }: UserStatusProps) {
  const online = isUserOnline(lastSeen);
  const statusText = formatLastSeen(lastSeen);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showDot && (
        <div
          className={`h-2 w-2 rounded-full ${
            online ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      )}
      <span className={`text-xs ${online ? "text-green-600" : "text-gray-500"}`}>
        {statusText}
      </span>
    </div>
  );
}
