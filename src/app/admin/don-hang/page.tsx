import { OrderTable } from "@/components/admin";

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý đơn hàng</h1>
      <OrderTable />
    </div>
  );
}
