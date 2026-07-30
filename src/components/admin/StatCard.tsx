import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  hint?: string;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "so với hôm qua",
  hint,
  icon: Icon,
  color = "bg-primary-50 text-primary-600",
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-sm text-gray-500">{title}</p>
          <p className="truncate text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                change >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% {changeLabel}
            </p>
          )}
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            color
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
