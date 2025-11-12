import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  message?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
  xl: "h-16 w-16 border-4",
};

export function LoadingSpinner({ 
  size = "md", 
  className, 
  message 
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={cn(
          "rounded-full border-blue-600 border-t-transparent animate-spin",
          sizeClasses[size],
          className
        )}
      />
      {message && (
        <p className="text-gray-600 text-sm mt-3">{message}</p>
      )}
    </div>
  );
}
