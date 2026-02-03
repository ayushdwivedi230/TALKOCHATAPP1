import React from "react";

interface TypingIndicatorProps {
  users: Array<{ id: number; username: string }>;
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (!users || users.length === 0) return null;

  const text = users.length === 1 ? `${users[0].username} is typing...` : `${users.length} people are typing...`;

  return (
    <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
      <span className="animate-pulse">{text}</span>
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce" />
        <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce delay-75" />
        <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce delay-150" />
      </div>
    </div>
  );
}
