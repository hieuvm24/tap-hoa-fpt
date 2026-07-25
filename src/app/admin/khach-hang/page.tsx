"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, Pencil, Search } from "lucide-react";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { normalizeVi } from "@/lib/normalize-vi";
import { Button, Card, Input, Modal } from "@/components/ui";
import { api } from "@/lib/api";
import { Customer, Order } from "@/types";

type CustomerDetail = Customer & {
  addresses: {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    address: string;
    isDefault: boolean;
  }[];
  recentOrders: Order[];
};

function AdminCustomersPageContent() {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const loadList = useCallback(async () => {
    setLoading(true);
    const res = await api.customers.list();
    if (res.success && res.data) setCustomers(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openDetail = useCallback(async (id: string, startEdit = false) => {
    setSelectedId(id);
    setEditing(startEdit);
    setError("");
    setDetailLoading(true);
    const res = await api.customers.get(id);
    if (res.success && res.data) {
      setDetail(res.data);
      setForm({
        name: res.data.name,
        phone: res.data.phone || "",
        email: res.data.email,
      });
    } else {
      setDetail(null);
      setError(res.error || "Không tải được chi tiết");
    }
    setDetailLoading(false);
  }, []);

  const openFromQuery = searchParams.get("id");
  useEffect(() => {
    if (openFromQuery) void openDetail(openFromQuery);
  }, [openFromQuery, openDetail]);

  const filtered = useMemo(() => {
    const q = normalizeVi(filter);
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = normalizeVi(`${c.name} ${c.email} ${c.phone}`);
      return hay.includes(q);
    });
  }, [customers, filter]);

  const closeModal = () => {
    setSelectedId(null);
    setDetail(null);
    setEditing(false);
    setError("");
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    const res = await api.customers.update(selectedId, form);
    if (res.success && res.data) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, ...res.data! } : c))
      );
      setDetail((prev) => (prev ? { ...prev, ...res.data! } : prev));
      setEditing(false);
    } else {
      setError(res.error || "Không lưu được");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Tìm khách hàng (tên, SĐT, email)..."
            icon={<Search className="h-4 w-4" />}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Không tìm thấy khách hàng phù hợp.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => void openDetail(customer.id)}
            >
              <div className="mb-3 flex items-center gap-3">
                {customer.avatar ? (
                  <Image
                    src={customer.avatar}
                    alt={customer.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-600">
                    {customer.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.phone || "—"}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="truncate text-gray-500">{customer.email}</p>
                <p>{customer.orderCount} đơn hàng</p>
                <p className="font-medium text-primary-600">
                  Chi tiêu: {formatPrice(customer.totalSpent)}
                </p>
              </div>
              <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    void openDetail(customer.id, false);
                  }}
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Chi tiết
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    void openDetail(customer.id, true);
                  }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Sửa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedId}
        onClose={closeModal}
        title={editing ? "Sửa thông tin khách" : "Chi tiết khách hàng"}
        size="lg"
        footer={
          editing ? (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Đóng
              </Button>
              <Button type="button" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Chỉnh sửa
              </Button>
            </div>
          )
        }
      >
        {detailLoading && (
          <p className="text-sm text-gray-500">Đang tải chi tiết...</p>
        )}
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {detail && !detailLoading && (
          <div className="space-y-5">
            {editing ? (
              <div className="space-y-3">
                <Input
                  label="Họ tên"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                <Input
                  label="Số điện thoại"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {detail.avatar ? (
                    <Image
                      src={detail.avatar}
                      alt={detail.name}
                      width={56}
                      height={56}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-600">
                      {detail.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {detail.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Tham gia {detail.joinedAt}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{detail.email}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Số điện thoại</p>
                    <p className="font-medium text-gray-900">
                      {detail.phone || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Số đơn (không hủy)</p>
                    <p className="font-medium text-gray-900">
                      {detail.orderCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Tổng chi tiêu</p>
                    <p className="font-medium text-primary-600">
                      {formatPrice(detail.totalSpent)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Địa chỉ giao hàng
                  </h3>
                  {detail.addresses.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có địa chỉ lưu.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.addresses.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-lg border border-gray-100 px-3 py-2 text-sm"
                        >
                          <p className="font-medium">
                            {a.label}
                            {a.isDefault && (
                              <span className="ml-2 text-xs text-primary-600">
                                Mặc định
                              </span>
                            )}
                          </p>
                          <p className="text-gray-600">
                            {a.fullName} · {a.phone}
                          </p>
                          <p className="text-gray-500">{a.address}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Đơn hàng gần đây
                    </h3>
                    <Link
                      href="/admin/don-hang"
                      className="text-xs font-medium text-primary-600 hover:underline"
                    >
                      Tất cả đơn
                    </Link>
                  </div>
                  {detail.recentOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có đơn hàng.</p>
                  ) : (
                    <ul className="max-h-48 space-y-2 overflow-y-auto">
                      {detail.recentOrders.map((o) => (
                        <li
                          key={o.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
                          )}
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {o.orderCode}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(o.createdAt)} · {o.status}
                            </p>
                          </div>
                          <p className="font-semibold text-primary-600">
                            {formatPrice(o.total)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Đang tải...</p>}>
      <AdminCustomersPageContent />
    </Suspense>
  );
}
