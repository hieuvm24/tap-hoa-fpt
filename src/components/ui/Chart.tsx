"use client";

import { ChartData } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

type ValueFormat = "default" | "currency" | "millions";

function formatChartValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "currency":
      return formatPrice(value);
    case "millions":
      if (value >= 1_000_000)
        return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
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
  /** Ẩn số trên cột khi nhiều điểm */
  hideValues?: boolean;
}

/** Cột đứng — mỗi cột có nhãn; cuộn ngang khi dày */
export function BarChart({
  data,
  className,
  valueFormat = "default",
  color = "bg-primary-500",
  hideValues,
}: BarChartProps) {
  const maxValue = Math.max(0, ...data.map((d) => d.value));
  const n = data.length;
  const dense = n > 12;
  const veryDense = n > 28;
  const showValues = hideValues === undefined ? n <= 14 : !hideValues;
  // Đủ rộng để luôn ghi được ngày dưới mỗi cột
  const barMinWidth = veryDense ? 36 : dense ? 40 : 0;
  const scroll = dense && barMinWidth > 0;

  if (n === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">Chưa có dữ liệu</p>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Thang tham chiếu max */}
      {maxValue > 0 && (
        <div className="mb-1 flex justify-end text-[10px] text-gray-400">
          Max {formatChartValue(maxValue, valueFormat)}
        </div>
      )}
      <div className={cn("h-60 w-full", scroll && "overflow-x-auto pb-1")}>
        <div
          className={cn(
            "flex h-full items-stretch",
            dense ? "gap-1" : "gap-2 sm:gap-3"
          )}
          style={
            scroll
              ? { minWidth: `${Math.max(n * barMinWidth, 320)}px` }
              : undefined
          }
        >
          {data.map((item, i) => {
            const ratio = maxValue > 0 ? item.value / maxValue : 0;
            // Cột 0 vẫn hiện nền; cột có data tối thiểu ~8% để nhìn được
            const heightPct =
              item.value > 0 ? Math.max(ratio * 100, 8) : 0;
            const shortLabel =
              item.label.length > 6 && item.label.includes("-")
                ? item.label.split("-").pop() || item.label
                : item.label;

            return (
              <div
                key={`${item.label}-${i}`}
                className="flex min-w-0 flex-1 flex-col"
                style={
                  scroll
                    ? { minWidth: barMinWidth, flex: "0 0 auto" }
                    : undefined
                }
              >
                <div
                  className={cn(
                    "mb-1 h-5 text-center font-medium tabular-nums text-gray-600",
                    dense ? "text-[9px]" : "text-[11px] sm:text-xs"
                  )}
                >
                  {showValues
                    ? item.value > 0
                      ? formatChartValue(item.value, valueFormat)
                      : "—"
                    : ""}
                </div>
                <div className="relative min-h-0 flex-1 rounded-md bg-gray-100/80">
                  <div
                    className={cn(
                      "absolute bottom-0 top-1 flex items-end",
                      dense ? "inset-x-0.5" : "inset-x-1 sm:inset-x-2"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all duration-500 hover:opacity-90",
                        color,
                        item.value === 0 && "bg-gray-200 opacity-40"
                      )}
                      style={{
                        height: item.value === 0 ? "4%" : `${heightPct}%`,
                      }}
                      title={`${item.label}: ${formatChartValue(item.value, valueFormat)}`}
                    />
                  </div>
                </div>
                <div
                  className={cn(
                    "mt-1.5 text-center font-semibold tabular-nums text-gray-700",
                    dense
                      ? "text-[10px] leading-tight"
                      : "truncate text-[11px] sm:text-xs"
                  )}
                  title={item.label}
                >
                  {dense ? shortLabel : item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {scroll && (
        <p className="mt-1 text-center text-[10px] text-gray-400">
          Vuốt ngang để xem đủ ngày · di chuột vào cột để xem số liệu
        </p>
      )}
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
        const width =
          maxValue > 0
            ? Math.max((item.value / maxValue) * 100, item.value > 0 ? 6 : 0)
            : 0;
        return (
          <div key={`${item.label}-${i}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span
                className="truncate font-medium text-gray-800"
                title={item.label}
              >
                {item.label}
              </span>
              <span className="shrink-0 tabular-nums text-gray-500">
                {formatChartValue(item.value, valueFormat)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  color
                )}
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
