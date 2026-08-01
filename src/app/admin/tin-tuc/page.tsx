"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, Badge, Button, Input, Textarea, Modal, ImageUpload } from "@/components/ui";
import { api } from "@/lib/api";
import type { NewsArticle } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { confirmDialog, toast } from "@/lib/feedback";

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    isPublished: true,
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.news.list(true).then((res) => {
      if (res.success && res.data) setNews(res.data);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      image: "",
      isPublished: true,
    });
    setOpen(true);
  };

  const openEdit = (n: NewsArticle) => {
    setEditing(n);
    setForm({
      title: n.title,
      slug: n.slug,
      excerpt: n.excerpt,
      content: n.content,
      image: n.image,
      isPublished: n.isPublished,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.image) {
      toast.warning("Vui lòng chọn ảnh bài viết");
      return;
    }
    setSaving(true);
    if (editing) await api.news.update(editing.id, form);
    else await api.news.create(form);
    setSaving(false);
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: "Xóa bài viết",
      message: "Bài viết sẽ bị xóa vĩnh viễn khỏi trang tin tức.",
      variant: "danger",
      confirmText: "Xóa bài viết",
    });
    if (!ok) return;
    const res = await api.news.delete(id);
    if (res.success) {
      toast.success("Đã xóa bài viết");
      load();
    } else toast.error(res.error || "Không xóa được");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tin tức</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm bài
        </Button>
      </div>
      <div className="grid gap-4">
        {news.map((item) => (
          <Card key={item.id} className="flex gap-4">
            <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg">
              <Image src={item.image} alt={item.title} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <Badge variant={item.isPublished ? "success" : "default"}>
                  {item.isPublished ? "Đã đăng" : "Nháp"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{item.excerpt}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
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
        title={editing ? "Sửa bài viết" : "Thêm bài viết"}
        size="lg"
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input
            label="Tiêu đề"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="tu-dong-neu-de-trong"
          />
          <ImageUpload
            label="Ảnh bài viết"
            folder="news"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
          />
          <Textarea
            label="Tóm tắt"
            rows={2}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
          <Textarea
            label="Nội dung"
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm({ ...form, isPublished: e.target.checked })
              }
            />
            Xuất bản
          </label>
          <Button onClick={handleSave} isLoading={saving} className="w-full">
            Lưu
          </Button>
        </div>
      </Modal>
    </div>
  );
}
