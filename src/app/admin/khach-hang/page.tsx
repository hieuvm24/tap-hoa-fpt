"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import { Customer } from "@/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api.customers.list().then((res) => {
      if (res.success && res.data) setCustomers(res.data);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý khách hàng</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <div className="flex items-center gap-3 mb-3">
              {customer.avatar ? (
                <Image src={customer.avatar} alt={customer.name} width={48} height={48} className="rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                  {customer.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-gray-500">{customer.email}</p>
              <p>{customer.orderCount} đơn hàng</p>
              <p className="font-medium text-primary-600">Chi tiêu: {formatPrice(customer.totalSpent)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
