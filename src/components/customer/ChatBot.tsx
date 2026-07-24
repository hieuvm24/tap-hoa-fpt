"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, X, Send, Bot, User, Minimize2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  ChatMessage,
  QUICK_REPLIES,
  getWelcomeMessage,
  setChatbotContext,
} from "@/lib/chatbot";
import { api } from "@/lib/api";
import { DEFAULT_STORE } from "@/config/defaults";

function createMessage(role: "user" | "bot", content: string, products?: ChatMessage["products"]): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
    products,
    timestamp: new Date(),
  };
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [storeName, setStoreName] = useState(DEFAULT_STORE.name);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.store.get().then((storeRes) => {
      const store =
        storeRes.success && storeRes.data ? storeRes.data : DEFAULT_STORE;
      setStoreName(store.name);
      setChatbotContext({ name: store.name, phone: store.phone });
    });
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([createMessage("bot", getWelcomeMessage())]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) inputRef.current?.focus();
  }, [isOpen, isMinimized]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [...prev, createMessage("user", trimmed)]);
    setInput("");
    setIsTyping(true);

    const history = messages
      .slice(-8)
      .map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

    const res = await api.ai.chat(trimmed, history);
    if (res.success && res.data) {
      setMessages((prev) => [
        ...prev,
        createMessage("bot", res.data!.text, res.data!.products),
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        createMessage(
          "bot",
          res.error || "Xin lỗi, em đang gặp sự cố. Anh/chị thử lại sau nhé!"
        ),
      ]);
    }
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
          {i < content.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 transition-all hover:scale-105 hover:bg-primary-600 animate-fade-in"
          aria-label="Nhắn tin hỗ trợ"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 animate-slide-up",
            isMinimized
              ? "bottom-5 right-5 h-14 w-72"
              : "bottom-5 right-5 h-[520px] w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-2.5rem)]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-500 to-emerald-500 px-4 py-3 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Hỗ trợ {storeName}</p>
                <p className="text-xs text-primary-100">Tư vấn & đặt hàng online</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
                aria-label="Thu nhỏ"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                        msg.role === "user" ? "bg-primary-100 text-primary-600" : "bg-emerald-100 text-emerald-600"
                      )}
                    >
                      {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary-500 text-white rounded-tr-sm"
                          : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-sm"
                      )}
                    >
                      {renderContent(msg.content)}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.products.map((p) => (
                            <Link
                              key={p.id}
                              href={`/san-pham/${p.slug}`}
                              className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 hover:bg-primary-50 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                                <Image src={p.image} alt={p.name} fill className="object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                                <p className="text-xs text-primary-600 font-semibold">{formatPrice(p.price)}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-2">
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr.id}
                      onClick={() => sendMessage(qr.message)}
                      disabled={isTyping}
                      className="flex-shrink-0 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập câu hỏi..."
                    disabled={isTyping}
                    className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                    aria-label="Gửi"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
