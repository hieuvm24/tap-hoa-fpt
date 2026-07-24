"use client";

import { ChartData } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

type ValueFormat = "default" | "currency" | "millions";

function formatChartValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "currency":
      return formatPrice(value);
    case "millions":
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
      if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
      return String(value);
    default:
      return value.toLocaleString("vi-VN");
  }
}

interface BarChartProps {
  data: ChartData[];
  className?: string;
  valueFormat?: ValueFormat;
  color?: string;
}

/** Cột đứng — chiều cao theo % max, có khung cố định để phân hóa rõ */
export function BarChart({
  data,
  className,
  valueFormat = "default",
  color = "bg-primary-500",
}: BarChartProps) {
  const maxValue = Math.max(0, ...data.map((d) => d.value));

  return (
    <div className={cn("h-56 w-full", className)}>
      <div className="flex h-full items-stretch gap-2 sm:gap-3">
        {data.map((item, i) => {
          const ratio = maxValue > 0 ? item.value / maxValue : 0;
          const heightPct = item.value > 0 ? Math.max(ratio * 100, 8) : 0;
          return (
            <div key={`${item.label}-${i}`} className="flex min-w-0 flex-1 flex-col">
              <div className="mb-1 h-5 text-center text-[11px] font-medium text-gray-600 sm:text-xs">
                {item.value > 0 ? formatChartValue(item.value, valueFormat) : "—"}
              </div>
              <div className="relative min-h-0 flex-1 rounded-md bg-gray-50">
                <div className="absolute inset-x-1 bottom-0 top-2 flex items-end sm:inset-x-2">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all duration-500 hover:opacity-90",
                      color,
                      item.value === 0 && "opacity-0"
                    )}
                    style={{ height: `${heightPct}%` }}
                    title={`${item.label}: ${formatChartValue(item.value, valueFormat)}`}
                  />
                </div>
              </div>
              <div className="mt-2 truncate text-center text-[11px] font-medium text-gray-600 sm:text-xs">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HorizontalBarChartProps {
  data: ChartData[];
  className?: string;
  valueFormat?: ValueFormat;
  color?: string;
}

/** Thanh ngang — dễ đọc top sản phẩm / khách hàng */
export function HorizontalBarChart({
  data,
  className,
  valueFormat = "default",
  color = "bg-primary-500",
}: HorizontalBarChartProps) {
  const maxValue = Math.max(0, ...data.map((d) => d.value));

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item, i) => {
        const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, item.value > 0 ? 6 : 0) : 0;
        return (
          <div key={`${item.label}-${i}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-gray-800" title={item.label}>
                {item.label}
              </span>
              <span className="shrink-0 tabular-nums text-gray-500">
                {formatChartValue(item.value, valueFormat)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn("h-full rounded-full transition-all duration-500", color)}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
      {data.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">Chưa có dữ liệu</p>
      )}
    </div>
  );
}
