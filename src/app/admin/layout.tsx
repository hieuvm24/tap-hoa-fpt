"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth";
import { AdminSidebar, AdminTopbar } from "@/components/admin";

function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["OWNER", "STAFF"]} redirectTo="/dang-nhap">
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
