"use client";

import { useEffect, useState } from "react";
import { subscribeToUserPresence } from "@/lib/firebase/chat-presence";
import { formatDistanceToNow } from "date-fns";

interface OnlineStatusProps {
  userId: string;
  showLastSeen?: boolean;
  className?: string;
  dotOnly?: boolean;
}

export function OnlineStatus({
  userId,
  showLastSeen = true,
  className = "",
  dotOnly = false,
}: OnlineStatusProps) {
  const [status, setStatus] = useState<"online" | "away" | "offline">("offline");
  const [lastSeen, setLastSeen] = useState<Date | undefined>();

  useEffect(() => {
    const unsubscribe = subscribeToUserPresence(userId, (newStatus, newLastSeen) => {
      setStatus(newStatus);
      setLastSeen(newLastSeen);
    });

    return () => unsubscribe();
  }, [userId]);

  const statusColor = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  }[status];

  const statusText = {
    online: "Online",
    away: "Away",
    offline: lastSeen
      ? `Last seen ${formatDistanceToNow(lastSeen, { addSuffix: true })}`
      : "Offline",
  }[status];

  if (dotOnly) {
    return (
      <div
        className={`w-3 h-3 rounded-full ${statusColor} ${className}`}
        title={statusText}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${statusColor}`} />
      {showLastSeen && (
        <span className="text-xs text-gray-500">{statusText}</span>
      )}
    </div>
  );
}
