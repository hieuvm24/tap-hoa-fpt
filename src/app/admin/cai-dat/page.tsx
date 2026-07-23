"use client";

import { useEffect, useState } from "react";
import { Card, Input, Button, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import type { StoreInfo } from "@/types";

const empty: StoreInfo = {
  name: "",
  slogan: "",
  address: "",
  phone: "",
  email: "",
  facebook: "",
  zalo: "",
  openHours: "",
  description: "",
  latitude: 10.9804,
  longitude: 106.5031,
  mapEmbedUrl: "",
  bankName: "Vietcombank",
  bankAccount: "0123456789",
  bankOwner: "TAP HOA FPT",
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<StoreInfo>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.store.get().then((res) => {
      if (res.success && res.data) setForm({ ...empty, ...res.data });
      setLoading(false);
    });
  }, []);

  const set = (key: keyof StoreInfo, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await api.store.update({
      ...form,
      latitude: form.latitude != null ? Number(form.latitude) : null,
      longitude: form.longitude != null ? Number(form.longitude) : null,
    });
    setSaving(false);
    setMessage(res.success ? "Đã lưu cài đặt" : res.error || "Lỗi lưu");
  };

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt cửa hàng</h1>
      <Card className="max-w-3xl">
        <form className="space-y-4" onSubmit={handleSave}>
          <Input label="Tên cửa hàng" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <Input label="Slogan" value={form.slogan} onChange={(e) => set("slogan", e.target.value)} />
          <Input label="Địa chỉ" value={form.address} onChange={(e) => set("address", e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Hotline" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <Input label="Email" value={form.email} type="email" onChange={(e) => set("email", e.target.value)} />
          </div>
          <Input label="Giờ mở cửa" value={form.openHours} onChange={(e) => set("openHours", e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Facebook" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
            <Input label="Zalo" value={form.zalo} onChange={(e) => set("zalo", e.target.value)} />
          </div>
          <Textarea
            label="Mô tả cửa hàng"
            rows={3}
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vĩ độ (Google Maps)"
              value={String(form.latitude ?? "")}
              onChange={(e) => set("latitude", e.target.value)}
            />
            <Input
              label="Kinh độ (Google Maps)"
              value={String(form.longitude ?? "")}
              onChange={(e) => set("longitude", e.target.value)}
            />
          </div>
          <Input
            label="URL embed Google Maps (tuỳ chọn)"
            value={form.mapEmbedUrl || ""}
            onChange={(e) => set("mapEmbedUrl", e.target.value)}
            placeholder="https://maps.google.com/maps?q=...&output=embed"
          />
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Thông tin chuyển khoản</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Ngân hàng" value={form.bankName || ""} onChange={(e) => set("bankName", e.target.value)} />
              <Input label="Số tài khoản" value={form.bankAccount || ""} onChange={(e) => set("bankAccount", e.target.value)} />
              <Input label="Chủ tài khoản" value={form.bankOwner || ""} onChange={(e) => set("bankOwner", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" isLoading={saving}>
              Lưu thay đổi
            </Button>
            {message && <span className="text-sm text-primary-600">{message}</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
