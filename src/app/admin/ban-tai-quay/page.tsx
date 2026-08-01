"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button, Card, Input } from "@/components/ui";
import { api } from "@/lib/api";
import type { Product } from "@/types";
import { toast } from "@/lib/feedback";

type Line = {
  product: Product;
  quantity: number;
};

export default function PosPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState("Khách lẻ");
  const [customerPhone, setCustomerPhone] = useState("");
  const [matchedCustomer, setMatchedCustomer] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "transfer">("cod");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    id: string;
    orderCode: string;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearching(true);
      const params: Record<string, string> = {
        limit: "24",
        all: "true",
        status: "active",
      };
      if (query.trim()) params.search = query.trim();
      api.products
        .list(params)
        .then((res) => {
          if (res.success && res.data) {
            const list = Array.isArray(res.data) ? res.data : res.data.products;
            setResults(list.filter((p) => p.stock > 0));
          }
        })
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Tra cứu khách theo SĐT
  useEffect(() => {
    const digits = customerPhone.replace(/\D/g, "");
    if (digits.length < 9) {
      setMatchedCustomer(null);
      return;
    }
    const t = setTimeout(() => {
      api.customers.lookupByPhone(digits).then((res) => {
        if (res.success && res.data?.customer) {
          const c = res.data.customer;
          setMatchedCustomer(c.name);
          if (!customerName || customerName === "Khách lẻ") {
            setCustomerName(c.name);
          }
        } else {
          setMatchedCustomer(null);
        }
      });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerPhone]);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [lines]
  );

  const addProduct = (product: Product) => {
    setLines((prev) => {
      const exist = prev.find((l) => l.product.id === product.id);
      if (exist) {
        if (exist.quantity >= product.stock) return prev;
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: l.quantity + 1 }
            : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const setQty = (productId: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => {
          if (l.product.id !== productId) return l;
          const q = Math.max(0, Math.min(quantity, l.product.stock));
          return { ...l, quantity: q };
        })
        .filter((l) => l.quantity > 0)
    );
  };

  const checkout = async () => {
    if (!lines.length) return;
    const phone = customerPhone.trim() || "0000000000";
    if (!customerName.trim()) {
      toast.warning("Nhập tên khách (hoặc giữ Khách lẻ)");
      return;
    }
    setSubmitting(true);
    const res = await api.orders.create({
      customerName: customerName.trim(),
      customerPhone: phone,
      address: "Tại quầy",
      paymentMethod,
      fulfillmentType: "pickup",
      walkIn: true,
      items: lines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
      })),
    });
    setSubmitting(false);
    if (!res.success || !res.data) {
      toast.error(res.error || "Không tạo được hóa đơn");
      return;
    }
    setLastOrder({ id: res.data.id, orderCode: res.data.orderCode });
    setLines([]);
    setCustomerName("Khách lẻ");
    setCustomerPhone("");
    setMatchedCustomer(null);
    toast.success(`Đã tạo hóa đơn ${res.data.orderCode}`);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bán tại quầy</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo hóa đơn walk-in — trừ kho ngay, đánh dấu đã thanh toán.
          </p>
        </div>
        {lastOrder && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
            <span>
              Đã bán: <strong>{lastOrder.orderCode}</strong>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(
                  api.orders.receiptUrl(lastOrder.id, { print: true }),
                  "_blank"
                )
              }
            >
              In hóa đơn
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên / SKU / thương hiệu..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          {searching && <p className="text-sm text-gray-400">Đang tìm...</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p)}
                className="rounded-xl border border-gray-200 p-3 text-left hover:border-primary-400 hover:bg-primary-50/40 transition-colors"
              >
                <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-gray-50">
                  <Image src={p.image} alt={p.name} fill className="object-cover" />
                </div>
                <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{p.sku}</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary-600">
                    {formatPrice(p.price)}
                  </span>
                  <span className="text-gray-400">Kho {p.stock}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Card className="lg:col-span-2 h-fit sticky top-20 space-y-4">
          <h2 className="font-semibold text-lg">Hóa đơn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tên khách"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <div>
              <Input
                label="SĐT"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="09..."
              />
              {matchedCustomer && (
                <p className="mt-1 text-xs text-emerald-600">
                  Khớp KH: {matchedCustomer} — đơn sẽ gắn vào tài khoản
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm ${
                paymentMethod === "cod"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200"
              }`}
            >
              Tiền mặt
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("transfer")}
              className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm ${
                paymentMethod === "transfer"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200"
              }`}
            >
              Chuyển khoản
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lines.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                Chọn sản phẩm bên trái
              </p>
            )}
            {lines.map((l) => (
              <div
                key={l.product.id}
                className="flex items-center gap-2 rounded-lg border border-gray-100 px-2 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{l.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(l.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-gray-100"
                    onClick={() => setQty(l.product.id, l.quantity - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm">{l.quantity}</span>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-gray-100"
                    onClick={() => setQty(l.product.id, l.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-red-50 text-red-500"
                    onClick={() => setQty(l.product.id, 0)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Tổng thu</span>
            <span className="text-primary-600">{formatPrice(subtotal)}</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!lines.length}
            isLoading={submitting}
            onClick={checkout}
          >
            Thanh toán & trừ kho
          </Button>
        </Card>
      </div>
    </div>
  );
}
