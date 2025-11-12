import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  verified?: boolean;
  className?: string;
  fallbackClassName?: string;
  showBadge?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const badgeSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const iconSizeClasses = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
  xl: "h-5 w-5",
};

export function UserAvatar({
  src,
  name,
  size = "md",
  verified = false,
  className,
  fallbackClassName,
  showBadge = true,
}: UserAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={src || undefined} alt={name || "User"} />
        <AvatarFallback
          className={cn(
            "bg-linear-to-br from-blue-500 to-indigo-600 text-white font-semibold",
            fallbackClassName
          )}
        >
          {initial}
        </AvatarFallback>
      </Avatar>
      {verified && showBadge && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white",
            badgeSizeClasses[size]
          )}
        >
          <CheckCircle className={cn("text-white", iconSizeClasses[size])} />
        </div>
      )}
    </div>
  );
}
