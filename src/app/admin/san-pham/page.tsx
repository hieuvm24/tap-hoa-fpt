import { ProductTable } from "@/components/admin";

export default function AdminProductsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý sản phẩm</h1>
      <ProductTable />
    </div>
  );
}
