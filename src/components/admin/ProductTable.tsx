"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import { ProductModal } from "./ProductModal";
import { Product } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isOwner } from "@/lib/permissions";

export function ProductTable() {
  const { user } = useAuth();
  const canDelete = isOwner(user?.role);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = () => {
    setLoading(true);
    api.products.list({ limit: "100" }).then((res) => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.products;
        setProducts(list);
      }
      setLoading(false);
    });
  };

  useEffect(() => { loadProducts(); }, []);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    await api.products.delete(id);
    loadProducts();
  };

  const handleSaved = () => {
    setIsModalOpen(false);
    loadProducts();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{products.length} sản phẩm</p>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ảnh</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tên</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Giá</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Tồn kho</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Image src={product.image} alt={product.name} width={40} height={40} className="rounded-lg object-cover" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{product.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{product.sku}</td>
                  <td className="px-4 py-3 font-medium text-primary-600">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{product.stock}</td>
                  <td className="px-4 py-3">
                    <Badge variant={product.status === "active" ? "success" : "danger"}>
                      {product.status === "active" ? "Đang bán" : "Ngừng bán"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(product)} className="rounded-lg p-1.5 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
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
