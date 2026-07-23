"use client";

import { ChartData } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

type ValueFormat = "default" | "currency" | "millions";

function formatChartValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "currency":
      return formatPrice(value);
    case "millions":
      return `${(value / 1_000_000).toFixed(value >= 1_000_000 ? 0 : 1)}M`;
    default:
      return value.toString();
  }
}

interface BarChartProps {
  data: ChartData[];
  className?: string;
  valueFormat?: ValueFormat;
  color?: string;
}

export function BarChart({
  data,
  className,
  valueFormat = "default",
  color = "bg-primary-500",
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn("flex h-48 items-end gap-2 sm:gap-3", className)}>
      {data.map((item, i) => {
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:block">
              {formatChartValue(item.value, valueFormat)}
            </span>
            <div className="relative w-full flex-1 flex items-end">
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all duration-500 hover:opacity-80",
                  color
                )}
                style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0" }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface HorizontalBarChartProps {
  data: ChartData[];
  className?: string;
  valueFormat?: ValueFormat;
}

export function HorizontalBarChart({
  data,
  className,
  valueFormat = "default",
}: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, i) => {
        const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={i}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-gray-700 truncate mr-2">{item.label}</span>
              <span className="text-gray-500 flex-shrink-0">{formatChartValue(item.value, valueFormat)}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
