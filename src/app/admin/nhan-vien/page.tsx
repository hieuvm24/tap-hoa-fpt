"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input, Modal, Badge } from "@/components/ui";
import { api } from "@/lib/api";
import { Plus, Trash2, KeyRound } from "lucide-react";

type Staff = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "STAFF" | "OWNER";
  createdAt: string;
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "STAFF" as "STAFF" | "OWNER",
  });

  const load = () => {
    api.staff.list().then((res) => {
      if (res.success && res.data) setStaff(res.data as Staff[]);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const res = await api.staff.create(form);
    setSaving(false);
    if (res.success) {
      setOpen(false);
      setForm({ name: "", email: "", phone: "", password: "", role: "STAFF" });
      load();
    } else {
      alert(res.error || "Không tạo được nhân viên");
    }
  };

  const handleResetPassword = async (s: Staff) => {
    const password = prompt(`Mật khẩu mới cho ${s.name} (tối thiểu 6 ký tự):`);
    if (!password) return;
    if (password.length < 6) {
      alert("Mật khẩu quá ngắn");
      return;
    }
    const res = await api.staff.update(s.id, { password });
    if (res.success) alert("Đã đổi mật khẩu");
    else alert(res.error || "Lỗi đổi mật khẩu");
  };

  const handleDelete = async (s: Staff) => {
    if (!confirm(`Xóa tài khoản ${s.name}?`)) return;
    const res = await api.staff.delete(s.id);
    if (res.success) load();
    else alert(res.error || "Không xóa được");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhân viên</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tài khoản đăng nhập Admin / bán tại quầy
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm nhân viên
        </Button>
      </div>

      <div className="space-y-3">
        {staff.map((s) => (
          <Card key={s.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">{s.name}</p>
                <Badge variant={s.role === "OWNER" ? "info" : "default"}>
                  {s.role === "OWNER" ? "Chủ cửa hàng" : "Nhân viên"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {s.email}
                {s.phone ? ` · ${s.phone}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResetPassword(s)}
                title="Đổi mật khẩu"
              >
                <KeyRound className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(s)}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
        {staff.length === 0 && (
          <p className="text-gray-500">Chưa có nhân sự.</p>
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Thêm nhân viên"
      >
        <div className="space-y-3">
          <Input
            label="Họ tên"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email đăng nhập"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="SĐT"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Mật khẩu tạm"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Vai trò
            </label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as "STAFF" | "OWNER",
                })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
            >
              <option value="STAFF">Nhân viên</option>
              <option value="OWNER">Chủ cửa hàng</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button isLoading={saving} onClick={handleCreate}>
              Tạo tài khoản
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
