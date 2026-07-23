"use client";

import { Bell, Search, Menu, User } from "lucide-react";
import { Input } from "@/components/ui";

interface AdminTopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function AdminTopbar({ onMenuClick, title }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 max-w-xl">
        <div className="hidden md:block flex-1 max-w-xs">
          <Input
            placeholder="Tìm kiếm..."
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 cursor-pointer transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
        </div>
      </div>
    </header>
  );
}
