import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  iconClassName?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconClassName,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="py-16 text-center">
        <div className={cn(
          "h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4",
          iconClassName
        )}>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 max-w-sm mx-auto">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}
