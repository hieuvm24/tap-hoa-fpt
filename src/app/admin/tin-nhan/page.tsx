"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, User } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button, Card } from "@/components/ui";

type ThreadRow = {
  id: string;
  status: string;
  lastMessageAt: string;
  unread: number;
  preview?: string;
  customer?: { id: string; name: string; email: string; phone?: string };
};

type Msg = {
  id: string;
  senderRole: "customer" | "staff";
  senderName: string;
  content: string;
  createdAt: string;
};

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [customerLabel, setCustomerLabel] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [threadStatus, setThreadStatus] = useState<string>("open");

  const loadThreads = useCallback(async () => {
    const res = await api.support.listThreads();
    if (res.success && res.data) {
      const list = Array.isArray(res.data) ? res.data : [];
      setThreads(list);
      if (!activeId && list.length) setActiveId(list[0].id);
    }
  }, [activeId]);

  const loadThread = useCallback(async (id: string) => {
    const res = await api.support.getThread(id);
    if (res.success && res.data) {
      setMessages(res.data.messages || []);
      setThreadStatus(res.data.status || "open");
      setCustomerLabel(
        res.data.customer
          ? `${res.data.customer.name} · ${res.data.customer.phone || res.data.customer.email}`
          : ""
      );
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    const t = setInterval(() => void loadThreads(), 5000);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    if (!activeId) return;
    void loadThread(activeId);
    const t = setInterval(() => void loadThread(activeId), 3000);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    const res = await api.support.reply(activeId, text);
    if (res.success) {
      await loadThread(activeId);
      await loadThreads();
    }
    setSending(false);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tin nhắn khách hàng</h1>
      <div className="grid h-[calc(100vh-10rem)] min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <Card padding="none" className="flex flex-col overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
            Hội thoại ({threads.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 && (
              <p className="p-4 text-sm text-gray-500">Chưa có tin nhắn nào.</p>
            )}
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                  activeId === t.id && "bg-primary-50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {t.customer?.name || "Khách"}
                  </span>
                  {t.unread > 0 && (
                    <span className="rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                      {t.unread}
                    </span>
                  )}
                </div>
                <span className="truncate text-xs text-gray-500">
                  {t.preview || "—"}
                </span>
                <span className="text-[10px] text-gray-400">
                  {formatDate(t.lastMessageAt)}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card padding="none" className="flex flex-col overflow-hidden">
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
              <MessageSquare className="h-10 w-10" />
              <p className="text-sm">Chọn hội thoại để trả lời</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {customerLabel || "Khách hàng"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {threadStatus === "closed" ? "Đã đóng" : "Đang mở"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!activeId) return;
                    const next = threadStatus === "closed" ? "open" : "closed";
                    const res = await api.support.setStatus(activeId, next);
                    if (res.success) {
                      setThreadStatus(next);
                      await loadThreads();
                    }
                  }}
                >
                  {threadStatus === "closed" ? "Mở lại" : "Đóng hội thoại"}
                </Button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.senderRole === "staff" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                        m.senderRole === "staff"
                          ? "rounded-tr-sm bg-primary-500 text-white"
                          : "rounded-tl-sm border border-gray-100 bg-white text-gray-800"
                      )}
                    >
                      <p className="mb-0.5 text-[10px] opacity-70">
                        {m.senderName}
                      </p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form
                onSubmit={send}
                className="flex gap-2 border-t border-gray-100 bg-white p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập trả lời khách..."
                  className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="rounded-full px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
