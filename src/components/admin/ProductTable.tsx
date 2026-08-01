"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search, PackagePlus, Copy } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { normalizeVi } from "@/lib/normalize-vi";
import { Button, Badge, Input } from "@/components/ui";
import { ProductModal } from "./ProductModal";
import { Product } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isOwner } from "@/lib/permissions";
import { confirmDialog, promptDialog, toast } from "@/lib/feedback";

export function ProductTable() {
  const { user } = useAuth();
  const canDelete = isOwner(user?.role);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );

  const loadProducts = () => {
    setLoading(true);
    api.products.list({ limit: "500", all: "true" }).then((res) => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.products;
        setProducts(list);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeVi(search);
    return products.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      const hay = normalizeVi(
        `${p.name} ${p.sku} ${p.brand} ${p.category || ""}`
      );
      return hay.includes(q);
    });
  }, [products, search, statusFilter]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: "Xóa sản phẩm",
      message: "Sản phẩm sẽ bị xóa khỏi cửa hàng. Thao tác này không hoàn tác.",
      variant: "danger",
      confirmText: "Xóa sản phẩm",
    });
    if (!ok) return;
    const res = await api.products.delete(id);
    if (res.success) {
      toast.success("Đã xóa sản phẩm");
      loadProducts();
    } else toast.error(res.error || "Không xóa được sản phẩm");
  };

  const handleRestock = async (product: Product) => {
    const raw = await promptDialog({
      title: "Nhập thêm tồn kho",
      message: `"${product.name}" — hiện còn ${product.stock}. Nhập số lượng cần cộng thêm (có thể âm để trừ).`,
      defaultValue: "20",
      placeholder: "Ví dụ: 20",
      inputType: "number",
      confirmText: "Cập nhật tồn",
      validate: (v) => {
        const n = parseInt(v, 10);
        if (!Number.isFinite(n) || n === 0) return "Số lượng không hợp lệ";
        return null;
      },
    });
    if (raw == null) return;
    const delta = parseInt(raw, 10);
    const res = await api.products.adjustStock(product.id, {
      delta,
      reason: "Nhập hàng nhanh",
    });
    if (res.success) {
      toast.success(`Đã cập nhật tồn (+${delta})`);
      loadProducts();
    } else toast.error(res.error || "Cập nhật tồn thất bại");
  };

  const handleDuplicate = async (product: Product) => {
    const ok = await confirmDialog({
      title: "Nhân bản sản phẩm",
      message: `Tạo bản sao của "${product.name}"?`,
      confirmText: "Nhân bản",
    });
    if (!ok) return;
    const res = await api.products.duplicate(product.id);
    if (res.success) {
      toast.success("Đã nhân bản sản phẩm");
      loadProducts();
    } else toast.error(res.error || "Nhân bản thất bại");
  };

  const handleSaved = () => {
    setIsModalOpen(false);
    loadProducts();
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-sm">
            <Input
              placeholder="Tìm sản phẩm (tên, SKU, thương hiệu)..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {filtered.length}/{products.length} sản phẩm
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Ảnh
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Tên
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">
                  SKU
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Giá
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">
                  Tồn kho
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary-600">
                    {formatPrice(product.price)}
                  </td>
                  <td
                    className={
                      product.stock <= 10
                        ? "px-4 py-3 font-semibold text-red-600 hidden sm:table-cell"
                        : "px-4 py-3 text-gray-600 hidden sm:table-cell"
                    }
                  >
                    {product.stock}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        product.status === "active" ? "success" : "danger"
                      }
                    >
                      {product.status === "active" ? "Đang bán" : "Ngừng bán"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Nhập thêm tồn"
                        onClick={() => handleRestock(product)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        <PackagePlus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Nhân bản"
                        onClick={() => handleDuplicate(product)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSaved={handleSaved}
      />
    </>
  );
}
