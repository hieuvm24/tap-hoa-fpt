"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  PackagePlus,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Input } from "./Input";
import {
  subscribeConfirm,
  subscribePrompt,
  subscribeToast,
  type ConfirmOptions,
  type PromptOptions,
  type ToastItem,
  type ToastTone,
} from "@/lib/feedback";

const toneStyle: Record<
  ToastTone,
  { wrap: string; icon: typeof CheckCircle2; iconClass: string }
> = {
  success: {
    wrap: "border-emerald-200 bg-white",
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
  },
  error: {
    wrap: "border-red-200 bg-white",
    icon: XCircle,
    iconClass: "text-red-500",
  },
  info: {
    wrap: "border-sky-200 bg-white",
    icon: Info,
    iconClass: "text-sky-500",
  },
  warning: {
    wrap: "border-amber-200 bg-white",
    icon: AlertTriangle,
    iconClass: "text-amber-500",
  },
};

type ConfirmState = ConfirmOptions & {
  resolve: (ok: boolean) => void;
};

type PromptState = PromptOptions & {
  resolve: (value: string | null) => void;
};

export function FeedbackHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [promptError, setPromptError] = useState<string | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return subscribeToast((item) => {
      setToasts((prev) => [...prev.slice(-4), item]);
      const ms = item.duration ?? 3200;
      window.setTimeout(() => dismissToast(item.id), ms);
    });
  }, [dismissToast]);

  useEffect(() => {
    return subscribeConfirm((options, resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  useEffect(() => {
    return subscribePrompt((options, resolve) => {
      setPromptValue(options.defaultValue ?? "");
      setPromptError(null);
      setPromptState({ ...options, resolve });
    });
  }, []);

  useEffect(() => {
    if (!confirmState && !promptState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (promptState) {
          promptState.resolve(null);
          setPromptState(null);
        } else if (confirmState) {
          confirmState.resolve(false);
          setConfirmState(null);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [confirmState, promptState]);

  const closeConfirm = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  const closePrompt = (value: string | null) => {
    promptState?.resolve(value);
    setPromptState(null);
    setPromptError(null);
  };

  const submitPrompt = () => {
    if (!promptState) return;
    const value = promptValue.trim();
    const err = promptState.validate?.(value) ?? null;
    if (err) {
      setPromptError(err);
      return;
    }
    closePrompt(value);
  };

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-end gap-2 p-3 sm:p-4"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const conf = toneStyle[t.tone];
          const Icon = conf.icon;
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-black/10 animate-slide-up",
                conf.wrap
              )}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", conf.iconClass)} />
              <div className="min-w-0 flex-1">
                {t.title && (
                  <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                )}
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => closeConfirm(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-50">
                {confirmState.variant === "danger" ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <Info className="h-5 w-5 text-primary-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmState.title ||
                  (confirmState.variant === "danger"
                    ? "Xác nhận xóa"
                    : "Xác nhận")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                {confirmState.message}
              </p>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-white"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.cancelText || "Hủy"}
              </Button>
              <Button
                variant={confirmState.variant === "danger" ? "danger" : "primary"}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmText ||
                  (confirmState.variant === "danger" ? "Xóa" : "Đồng ý")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {promptState && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => closePrompt(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-50">
                <PackagePlus className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {promptState.title || "Nhập thông tin"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                {promptState.message}
              </p>
              <div className="mt-4">
                <Input
                  autoFocus
                  type={promptState.inputType || "text"}
                  value={promptValue}
                  placeholder={promptState.placeholder}
                  onChange={(e) => {
                    setPromptValue(e.target.value);
                    setPromptError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitPrompt();
                    }
                  }}
                />
                {promptError && (
                  <p className="mt-2 text-sm text-red-600">{promptError}</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-white"
                onClick={() => closePrompt(null)}
              >
                {promptState.cancelText || "Hủy"}
              </Button>
              <Button variant="primary" onClick={submitPrompt}>
                {promptState.confirmText || "Xác nhận"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
