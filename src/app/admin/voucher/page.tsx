"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button, Input, Modal } from "@/components/ui";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Voucher = {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  isActive: boolean;
  usageCount?: number;
  revenueImpact?: number;
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form, setForm] = useState({
    code: "",
    discount: "10",
    minOrder: "0",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.vouchers.list().then((res) => {
      if (res.success && res.data) setVouchers(res.data as Voucher[]);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", discount: "10", minOrder: "0", isActive: true });
    setOpen(true);
  };

  const openEdit = (v: Voucher) => {
    setEditing(v);
    setForm({
      code: v.code,
      discount: String(v.discount),
      minOrder: String(v.minOrder),
      isActive: v.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      code: form.code,
      discount: Number(form.discount),
      minOrder: Number(form.minOrder),
      isActive: form.isActive,
    };
    if (editing) await api.vouchers.update(editing.id, payload);
    else await api.vouchers.create(payload);
    setSaving(false);
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa voucher này?")) return;
    await api.vouchers.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý voucher</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm voucher
        </Button>
      </div>
      <div className="grid gap-3">
        {vouchers.map((v) => (
          <Card key={v.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary-600">{v.code}</span>
                <Badge variant={v.isActive ? "success" : "default"}>
                  {v.isActive ? "Đang dùng" : "Tắt"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Giảm {v.discount}% · Đơn tối thiểu {formatPrice(v.minOrder)}
                {" · "}
                Đã dùng {v.usageCount ?? 0} lần
                {(v.revenueImpact ?? 0) > 0
                  ? ` · Giảm tổng ${formatPrice(v.revenueImpact || 0)}`
                  : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(v)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id)}>
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
        {vouchers.length === 0 && (
          <p className="text-gray-500">Chưa có voucher.</p>
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa voucher" : "Thêm voucher"}
      >
        <div className="space-y-3">
          <Input
            label="Mã"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Giảm %"
              type="number"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />
            <Input
              label="Đơn tối thiểu"
              type="number"
              value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Đang kích hoạt
          </label>
          <Button onClick={handleSave} isLoading={saving} className="w-full">
            Lưu
          </Button>
        </div>
      </Modal>
    </div>
  );
}
