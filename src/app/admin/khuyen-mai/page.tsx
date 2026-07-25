"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, Badge, Button, Input, Textarea, Modal, ImageUpload } from "@/components/ui";
import { api } from "@/lib/api";
import type { Category, Promotion } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

type FormState = {
  title: string;
  description: string;
  image: string;
  discount: string;
  endDate: string;
  ruleType: "percent" | "bogo" | "banner";
  categorySlug: string;
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  image: "",
  discount: "10",
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  ruleType: "percent",
  categorySlug: "",
});

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.promotions.list(true).then((res) => {
      if (res.success && res.data) setPromotions(res.data);
    });
  };

  useEffect(() => {
    load();
    api.categories.list().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description,
      image: p.image,
      discount: String(p.discount),
      endDate: p.endDate,
      ruleType: p.ruleType || "banner",
      categorySlug: p.categorySlug || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.image) {
      alert("Vui lòng chọn ảnh khuyến mãi");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      image: form.image,
      discount: Number(form.discount),
      endDate: form.endDate,
      ruleType: form.ruleType,
      categorySlug: form.categorySlug || null,
    };
    if (editing) await api.promotions.update(editing.id, payload);
    else await api.promotions.create(payload);
    setSaving(false);
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa khuyến mãi này?")) return;
    await api.promotions.delete(id);
    load();
  };

  const ruleLabel = (p: Promotion) => {
    if (p.ruleType === "percent") return `-%${p.discount} danh mục`;
    if (p.ruleType === "bogo") return "Mua 2 tặng 1";
    return "Banner";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khuyến mãi</h1>
          <p className="text-sm text-gray-500 mt-1">
            percent / bogo sẽ tự trừ khi khách thanh toán; banner chỉ trưng bày.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm khuyến mãi
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map((promo) => (
          <Card key={promo.id} className="flex gap-4">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
              <Image src={promo.image} alt={promo.title} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate">{promo.title}</h3>
                <Badge variant="info">{ruleLabel(promo)}</Badge>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{promo.description}</p>
              <p className="text-xs text-gray-400 mt-2">
                {promo.categorySlug
                  ? `Danh mục: ${promo.categorySlug}`
                  : "Không gắn danh mục"}{" "}
                · Hết hạn: {new Date(promo.endDate).toLocaleDateString("vi-VN")}
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(promo)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(promo.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
      >
        <div className="space-y-3">
          <Input
            label="Tiêu đề"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Mô tả"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <ImageUpload
            label="Ảnh khuyến mãi"
            folder="promotions"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Loại áp dụng
              </label>
              <select
                value={form.ruleType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ruleType: e.target.value as FormState["ruleType"],
                  })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="percent">Giảm % theo danh mục</option>
                <option value="bogo">Mua 2 tặng 1</option>
                <option value="banner">Chỉ banner</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Danh mục
              </label>
              <select
                value={form.categorySlug}
                onChange={(e) =>
                  setForm({ ...form, categorySlug: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">— Không —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Giảm % (nếu percent)"
              type="number"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />
            <Input
              label="Hết hạn"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <Button onClick={handleSave} isLoading={saving} className="w-full">
            Lưu
          </Button>
        </div>
      </Modal>
    </div>
  );
}
