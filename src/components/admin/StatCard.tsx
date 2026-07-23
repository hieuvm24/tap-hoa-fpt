import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({ title, value, change, icon: Icon, color = "bg-primary-50 text-primary-600" }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={cn("text-xs mt-1 font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
              {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% so với hôm qua
            </p>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
