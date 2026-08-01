"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button, Input, Modal } from "@/components/ui";
import { api } from "@/lib/api";
import type { Category } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { confirmDialog, toast } from "@/lib/feedback";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("Package");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.categories.list().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setIcon("Package");
    setOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await api.categories.update(editing.id, { name, slug, icon });
    } else {
      await api.categories.create({ name, slug, icon });
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: "Xóa danh mục",
      message: "Xóa danh mục này? Chỉ xóa được khi không còn sản phẩm.",
      variant: "danger",
      confirmText: "Xóa danh mục",
    });
    if (!ok) return;
    const res = await api.categories.delete(id);
    if (res.success) {
      toast.success("Đã xóa danh mục");
      load();
    } else toast.error(res.error || "Không xóa được");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm danh mục
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} hover>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{cat.productCount} sản phẩm</p>
                <p className="text-xs text-gray-400 mt-2">/{cat.slug}</p>
                <Badge className="mt-2">{cat.icon}</Badge>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa danh mục" : "Thêm danh mục"}
      >
        <div className="space-y-3">
          <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="rau-cu"
          />
          <Input label="Icon (Lucide name)" value={icon} onChange={(e) => setIcon(e.target.value)} />
          <Button onClick={handleSave} isLoading={saving} className="w-full">
            Lưu
          </Button>
        </div>
      </Modal>
    </div>
  );
}
