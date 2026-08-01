export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title?: string;
  message: string;
  duration?: number;
};

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
};

export type PromptOptions = {
  title?: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: "text" | "number" | "password";
  validate?: (value: string) => string | null;
};

type ToastListener = (toast: ToastItem) => void;
type ConfirmListener = (
  options: ConfirmOptions,
  resolve: (ok: boolean) => void
) => void;
type PromptListener = (
  options: PromptOptions,
  resolve: (value: string | null) => void
) => void;

const toastListeners = new Set<ToastListener>();
const confirmListeners = new Set<ConfirmListener>();
const promptListeners = new Set<PromptListener>();

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeToast(fn: ToastListener) {
  toastListeners.add(fn);
  return () => {
    toastListeners.delete(fn);
  };
}

export function subscribeConfirm(fn: ConfirmListener) {
  confirmListeners.add(fn);
  return () => {
    confirmListeners.delete(fn);
  };
}

export function subscribePrompt(fn: PromptListener) {
  promptListeners.add(fn);
  return () => {
    promptListeners.delete(fn);
  };
}

function pushToast(
  tone: ToastTone,
  message: string,
  title?: string,
  duration = 3200
) {
  const item: ToastItem = { id: uid(), tone, message, title, duration };
  toastListeners.forEach((fn) => fn(item));
}

export const toast = {
  success(message: string, title = "Thành công") {
    pushToast("success", message, title);
  },
  error(message: string, title = "Có lỗi xảy ra") {
    pushToast("error", message, title, 4200);
  },
  info(message: string, title = "Thông báo") {
    pushToast("info", message, title);
  },
  warning(message: string, title = "Lưu ý") {
    pushToast("warning", message, title, 4000);
  },
};

/** Thay thế confirm() — trả về true nếu đồng ý */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions =
    typeof options === "string" ? { message: options } : options;
  return new Promise((resolve) => {
    if (!confirmListeners.size) {
      resolve(window.confirm(opts.message));
      return;
    }
    confirmListeners.forEach((fn) => fn(opts, resolve));
  });
}

/** Thay thế prompt() — trả về chuỗi hoặc null nếu hủy */
export function promptDialog(
  options: PromptOptions | string,
  defaultValue?: string
): Promise<string | null> {
  const opts: PromptOptions =
    typeof options === "string"
      ? { message: options, defaultValue }
      : options;
  return new Promise((resolve) => {
    if (!promptListeners.size) {
      resolve(window.prompt(opts.message, opts.defaultValue ?? "") );
      return;
    }
    promptListeners.forEach((fn) => fn(opts, resolve));
  });
}
