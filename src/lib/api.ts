const BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });
  return res.json();
}

export const api = {
  health: () =>
    request<{
      status: string;
      database: string;
      uptimeMs: number;
      latencyMs: number;
      timestamp: string;
    }>("/health"),

  cart: {
    validate: (items: { productId: string; quantity: number }[]) =>
      request<{
        items: {
          productId: string;
          available: boolean;
          quantity: number;
          stock: number;
          price: number;
          name?: string;
          slug?: string;
          image?: string;
          categorySlug?: string;
          removed?: boolean;
        }[];
        warnings: string[];
        ok: boolean;
      }>("/cart/validate", {
        method: "POST",
        body: JSON.stringify({ items }),
      }),
  },

  upload: async (
    file: File,
    folder: "products" | "avatars" | "news" | "promotions" = "products"
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch(`${BASE}/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    return res.json() as Promise<{
      success: boolean;
      data?: { url: string; filename: string };
      error?: string;
    }>;
  },

  auth: {
    login: (email: string, password: string) =>
      request<{ user: import("@/types/auth").AuthUser; redirect?: string }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    register: (data: import("@/types/auth").RegisterData) =>
      request<{ user: import("@/types/auth").AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () =>
      request<{ user: import("@/types/auth").AuthUser }>("/auth/me"),
    updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
      request<{ user: import("@/types/auth").AuthUser }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ user: import("@/types/auth").AuthUser; passwordChanged: boolean }>(
        "/auth/me",
        {
          method: "PATCH",
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      ),
    getNotifyPrefs: () =>
      request<{ prefs: { order: boolean; promo: boolean; news: boolean } }>(
        "/auth/preferences"
      ),
    updateNotifyPrefs: (prefs: {
      order?: boolean;
      promo?: boolean;
      news?: boolean;
    }) =>
      request<{ prefs: { order: boolean; promo: boolean; news: boolean } }>(
        "/auth/preferences",
        { method: "PATCH", body: JSON.stringify(prefs) }
      ),
  },

  products: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{
        products: import("@/types").Product[];
        total: number;
        brands: string[];
      }>(`/products${qs}`);
    },
    byIds: (ids: string[]) => {
      if (ids.length === 0) {
        return Promise.resolve({
          success: true as const,
          data: { products: [] as import("@/types").Product[], total: 0, brands: [] as string[] },
        });
      }
      return request<{
        products: import("@/types").Product[];
        total: number;
        brands: string[];
      }>(`/products?ids=${encodeURIComponent(ids.slice(0, 50).join(","))}`);
    },
    featured: () =>
      request<import("@/types").Product[]>("/products?featured=true"),
    getBySlug: (slug: string) =>
      request<{
        product: import("@/types").Product;
        reviews: import("@/types").Review[];
      }>(`/products/slug/${slug}`),
    create: (data: Record<string, unknown>) =>
      request<import("@/types").Product>("/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<import("@/types").Product>(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    adjustStock: (
      id: string,
      data: { quantity?: number; delta?: number; reason?: string }
    ) =>
      request<{
        product: import("@/types").Product;
        previousStock: number;
        stock: number;
        delta: number;
        reason?: string;
      }>(`/products/${id}/stock`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    duplicate: (id: string) =>
      request<import("@/types").Product>(`/products/${id}/duplicate`, {
        method: "POST",
      }),
    delete: (id: string) =>
      request(`/products/${id}`, { method: "DELETE" }),
  },

  categories: {
    list: () => request<import("@/types").Category[]>("/categories"),
    create: (data: { name: string; slug: string; icon?: string }) =>
      request<import("@/types").Category>("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<import("@/types").Category>(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/categories/${id}`, { method: "DELETE" }),
  },

  orders: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<import("@/types").Order[]>(`/orders${qs}`);
    },
    get: (id: string) =>
      request<import("@/types").Order>(`/orders/${id}`),
    create: (data: Record<string, unknown>) =>
      request<import("@/types").Order>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string, note?: string) =>
      request<import("@/types").Order>(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      }),
    markPaid: (id: string, note?: string) =>
      request<import("@/types").Order>(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: "paid", note }),
      }),
    refund: (id: string, note?: string) =>
      request<import("@/types").Order>(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: "refunded", note }),
      }),
    updatePayment: (
      id: string,
      paymentStatus: "pending" | "paid" | "failed" | "refunded",
      note?: string
    ) =>
      request<import("@/types").Order>(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus, note }),
      }),
    bulkStatus: (ids: string[], status: string, note?: string) =>
      request<{
        updated: number;
        skipped: number;
        orders: import("@/types").Order[];
        errors: { id: string; orderCode?: string; reason: string }[];
      }>("/orders/bulk-status", {
        method: "POST",
        body: JSON.stringify({ ids, status, note }),
      }),
    exportCsv: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return `${BASE}/orders/export${qs}`;
    },
    cancel: (
      id: string,
      note?: string,
      guest?: { phone: string; orderCode?: string }
    ) =>
      request<import("@/types").Order>(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "cancel",
          note,
          ...(guest
            ? { phone: guest.phone, orderCode: guest.orderCode }
            : {}),
        }),
      }),
    reorder: (id: string) =>
      request<{
        orderCode: string;
        items: {
          productId: string;
          name: string;
          slug: string;
          price: number;
          image: string;
          quantity: number;
          maxStock: number;
        }[];
        unavailable: { productId: string; name: string; reason: string }[];
      }>(`/orders/${id}/reorder`, { method: "POST" }),
    receiptUrl: (
      id: string,
      opts?: { print?: boolean; phone?: string; code?: string }
    ) => {
      const q = new URLSearchParams();
      if (opts?.print) q.set("print", "1");
      if (opts?.phone) q.set("phone", opts.phone);
      if (opts?.code) q.set("code", opts.code);
      const qs = q.toString();
      return `/api/orders/${id}/receipt${qs ? `?${qs}` : ""}`;
    },
  },

  promotions: {
    list: (all = false) =>
      request<import("@/types").Promotion[]>(
        `/promotions${all ? "?all=true" : ""}`
      ),
    create: (data: Record<string, unknown>) =>
      request<import("@/types").Promotion>("/promotions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<import("@/types").Promotion>(`/promotions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/promotions/${id}`, { method: "DELETE" }),
  },

  vouchers: {
    validate: (code: string, subtotal: number) =>
      request<{ discount: number; code: string }>("/vouchers/validate", {
        method: "POST",
        body: JSON.stringify({ code, subtotal }),
      }),
    list: (activeOnly = false) =>
      request<
        {
          id: string;
          code: string;
          discount: number;
          minOrder: number;
          isActive: boolean;
          usageCount?: number;
          revenueImpact?: number;
        }[]
      >(`/vouchers${activeOnly ? "?active=true" : ""}`),
    create: (data: Record<string, unknown>) =>
      request("/vouchers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/vouchers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/vouchers/${id}`, { method: "DELETE" }),
  },

  wishlist: {
    list: () =>
      request<
        {
          id: string;
          productId: string;
          product: import("@/types").Product;
        }[]
      >("/wishlist"),
    add: (productId: string) =>
      request("/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId }),
      }),
    remove: (productId: string) =>
      request(`/wishlist?productId=${productId}`, { method: "DELETE" }),
  },

  reviews: {
    list: (productId?: string) =>
      request<import("@/types").Review[]>(
        `/reviews${productId ? `?productId=${productId}` : ""}`
      ),
    listAdmin: (params?: Record<string, string>) => {
      const qs = new URLSearchParams({ all: "true", ...params }).toString();
      return request<{
        reviews: (import("@/types").Review & {
          productName?: string;
          productSlug?: string;
        })[];
        total: number;
        page: number;
        limit: number;
      }>(`/reviews?${qs}`);
    },
    create: (data: { productId: string; rating: number; comment: string }) =>
      request<import("@/types").Review>("/reviews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/reviews/${id}`, { method: "DELETE" }),
  },

  recommendations: {
    get: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{
        type: string;
        source?: string;
        products: import("@/types").Product[];
        reasons?: Record<string, string>;
        meta?: Record<string, unknown>;
      }>(`/recommendations${qs}`);
    },
  },

  ai: {
    chat: (
      message: string,
      history?: { role: "user" | "assistant"; content: string }[]
    ) =>
      request<{
        text: string;
        products?: import("@/types").Product[];
        source: "openai" | "rules";
      }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      }),
  },

  support: {
    myThread: () =>
      request<{
        id: string;
        status: string;
        messages: {
          id: string;
          senderRole: "customer" | "staff";
          senderName: string;
          content: string;
          createdAt: string;
        }[];
      }>("/support/threads"),
    listThreads: () =>
      request<
        {
          id: string;
          status: string;
          lastMessageAt: string;
          unread: number;
          preview?: string;
          customer?: {
            id: string;
            name: string;
            email: string;
            phone?: string;
          };
        }[]
      >("/support/threads"),
    getThread: (id: string) =>
      request<{
        id: string;
        status: string;
        customer?: {
          id: string;
          name: string;
          email: string;
          phone?: string;
        };
        messages: {
          id: string;
          senderRole: "customer" | "staff";
          senderName: string;
          content: string;
          createdAt: string;
        }[];
      }>(`/support/threads/${id}`),
    send: (content: string) =>
      request("/support/threads", {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    reply: (threadId: string, content: string) =>
      request(`/support/threads/${threadId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    setStatus: (threadId: string, status: "open" | "closed") =>
      request<{
        id: string;
        status: string;
        lastMessageAt: string;
        customer?: {
          id: string;
          name: string;
          email: string;
          phone?: string;
        };
      }>(`/support/threads/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  payments: {
    createVnpay: (data: { orderId?: string; orderCode?: string }) =>
      request<{
        paymentUrl: string;
        txnRef: string;
        demo: boolean;
        orderCode: string;
        amount: number;
      }>("/payments/vnpay/create", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  addresses: {
    list: () => request<import("@/types").Address[]>("/addresses"),
    create: (data: Partial<import("@/types").Address>) =>
      request<import("@/types").Address>("/addresses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<import("@/types").Address>) =>
      request<import("@/types").Address>(`/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/addresses/${id}`, { method: "DELETE" }),
  },

  news: {
    list: (all = false) =>
      request<import("@/types").NewsArticle[]>(
        `/news${all ? "?all=true" : ""}`
      ),
    get: (idOrSlug: string) =>
      request<import("@/types").NewsArticle>(`/news/${idOrSlug}`),
    create: (data: Record<string, unknown>) =>
      request<import("@/types").NewsArticle>("/news", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<import("@/types").NewsArticle>(`/news/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/news/${id}`, { method: "DELETE" }),
  },

  authForgot: {
    request: (email: string) =>
      request<{
        sent: boolean;
        emailed?: boolean;
        demo?: boolean;
        message: string;
        resetUrl?: string;
        mailError?: string;
      }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    reset: (token: string, newPassword: string) =>
      request<{ reset: boolean }>("/auth/forgot-password", {
        method: "PUT",
        body: JSON.stringify({ token, newPassword }),
      }),
  },

  customers: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<
        | import("@/types").Customer[]
        | {
            customers: import("@/types").Customer[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          }
      >(`/customers${qs}`);
    },
    lookupByPhone: (phone: string) =>
      request<{
        customer: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          avatar?: string;
        } | null;
      }>(`/customers/lookup?phone=${encodeURIComponent(phone)}`),
    get: (id: string) =>
      request<
        import("@/types").Customer & {
          addresses: {
            id: string;
            label: string;
            fullName: string;
            phone: string;
            address: string;
            isDefault: boolean;
          }[];
          recentOrders: import("@/types").Order[];
        }
      >(`/customers/${id}`),
    update: (
      id: string,
      data: { name: string; phone?: string; email: string }
    ) =>
      request<import("@/types").Customer>(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  staff: {
    list: () =>
      request<
        {
          id: string;
          email: string;
          name: string;
          phone?: string;
          role: "STAFF" | "OWNER";
          avatar?: string;
          createdAt: string;
        }[]
      >("/admin/staff"),
    create: (data: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      role?: "STAFF" | "OWNER";
    }) =>
      request("/admin/staff", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: {
        name?: string;
        phone?: string;
        password?: string;
        role?: "STAFF" | "OWNER";
      }
    ) =>
      request(`/admin/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/admin/staff/${id}`, { method: "DELETE" }),
  },

  adminSearch: {
    query: (q: string) =>
      request<{
        products: {
          id: string;
          name: string;
          slug: string;
          price: number;
          image: string;
        }[];
        customers: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
        }[];
        orders: {
          id: string;
          orderCode: string;
          customerName: string;
          total: number;
          status: string;
        }[];
      }>(`/admin/search?q=${encodeURIComponent(q)}`),
  },

  adminNotifications: {
    list: () =>
      request<{
        counts: {
          pendingOrders: number;
          unpaid: number;
          lowStock: number;
          supportUnread: number;
        };
        total: number;
        items: {
          id: string;
          type: "order_pending" | "unpaid" | "low_stock" | "support";
          title: string;
          subtitle: string;
          href: string;
          createdAt: string;
        }[];
      }>("/admin/notifications"),
  },

  dashboard: {
    stats: () =>
      request<{
        stats: import("@/types").DashboardStats;
        revenueChart: import("@/types").ChartData[];
        ordersChart: import("@/types").ChartData[];
        actionOrders: {
          id: string;
          orderCode: string;
          customerName: string;
          total: number;
          status: string;
          fulfillmentType: string;
          paymentMethod: string;
          paymentStatus: string;
          createdAt: string;
        }[];
        lowStockItems: (import("@/types").ChartData & { sku?: string })[];
        topWeekProducts: import("@/types").ChartData[];
      }>("/dashboard/stats"),
    reports: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{
        range: {
          from: string;
          to: string;
          preset: string;
          prevFrom?: string;
          prevTo?: string;
        };
        summary: {
          revenue: number;
          orderCount: number;
          avgOrder: number;
          itemsSold: number;
          cancelledCount: number;
          cancelRate: number;
          paidCount: number;
          unpaidCount: number;
          unpaidAmount: number;
          pickupCount: number;
          deliveryCount: number;
          pickupRevenue: number;
          deliveryRevenue: number;
          discountTotal: number;
          shippingTotal: number;
          subtotalTotal: number;
          prevRevenue: number;
          prevOrderCount: number;
          revenueChangePct: number;
          ordersChangePct: number;
        };
        monthlyRevenue: import("@/types").ChartData[];
        dailyRevenue: import("@/types").ChartData[];
        peakHours: import("@/types").ChartData[];
        hourlyOrders: import("@/types").ChartData[];
        topProducts: (import("@/types").ChartData & { revenue?: number })[];
        topCustomers: (import("@/types").ChartData & { orders?: number })[];
        ordersByStatus: import("@/types").ChartData[];
        revenueByPayment: import("@/types").ChartData[];
        revenueByCategory: import("@/types").ChartData[];
        channelMix: import("@/types").ChartData[];
        lowStockItems: (import("@/types").ChartData & { sku?: string })[];
      }>(`/dashboard/reports${qs}`);
    },
  },

  store: {
    get: () => request<import("@/types").StoreInfo>("/store"),
    update: (data: Partial<import("@/types").StoreInfo>) =>
      request<import("@/types").StoreInfo>("/store", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
};
