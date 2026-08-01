"use client";

import { useState, useEffect } from "react";
import { Input, Textarea, Button, Modal, ImageUpload } from "@/components/ui";
import { Product, Category } from "@/types";
import { api } from "@/lib/api";
import { toast } from "@/lib/feedback";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSaved: () => void;
}

export function ProductModal({ isOpen, onClose, product, onSaved }: ProductModalProps) {
  const isEdit = !!product;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    price: 0,
    originalPrice: 0,
    stock: 0,
    categorySlug: "rau-cu",
    status: "active",
    description: "",
    brand: "",
    image: "",
    isFeatured: false,
  });

  useEffect(() => {
    api.categories.list().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        categorySlug: product.categorySlug,
        status: product.status,
        description: product.description,
        brand: product.brand,
        image: product.image,
        isFeatured: !!product.isFeatured,
      });
    } else {
      setForm({
        name: "", slug: "", sku: "", price: 0, originalPrice: 0, stock: 0,
        categorySlug: "rau-cu", status: "active", description: "", brand: "",
        image: "", isFeatured: false,
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) {
      toast.warning("Vui lòng chọn ảnh sản phẩm");
      return;
    }
    setLoading(true);
    const slug = form.slug || form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    const payload = { ...form, slug, images: [form.image] };

    const res = isEdit
      ? await api.products.update(product!.id, payload)
      : await api.products.create(payload);

    setLoading(false);
    if (res.success) {
      toast.success(isEdit ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm");
      onSaved();
    } else toast.error(res.error || "Lỗi lưu sản phẩm");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới"} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Giá bán" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} required />
          <Input label="Giá gốc" type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: +e.target.value })} />
          <Input label="Tồn kho" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Danh mục</label>
            <select
              value={form.categorySlug}
              onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
            >
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>
        </div>
        <Input label="Thương hiệu" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) =>
              setForm({ ...form, isFeatured: e.target.checked })
            }
          />
          Hiển thị ở mục nổi bật (trang chủ)
        </label>
        <ImageUpload
          label="Ảnh sản phẩm"
          folder="products"
          value={form.image}
          onChange={(url) => setForm({ ...form, image: url })}
        />
        <Textarea label="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Hủy</Button>
          <Button type="submit" isLoading={loading}>{isEdit ? "Cập nhật" : "Thêm mới"}</Button>
        </div>
      </form>
    </Modal>
  );
}
