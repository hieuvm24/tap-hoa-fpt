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
    cancel: (id: string, note?: string) =>
      request<import("@/types").Order>(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel", note }),
      }),
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
    create: (data: { productId: string; rating: number; comment: string }) =>
      request<import("@/types").Review>("/reviews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  recommendations: {
    get: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{
        type: string;
        products: import("@/types").Product[];
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
        message: string;
        resetUrl?: string;
        demo?: boolean;
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
    list: () => request<import("@/types").Customer[]>("/customers"),
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

  dashboard: {
    stats: () =>
      request<{
        stats: import("@/types").DashboardStats;
        revenueChart: import("@/types").ChartData[];
        ordersChart: import("@/types").ChartData[];
      }>("/dashboard/stats"),
    reports: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{
        range: { from: string; to: string; preset: string };
        summary: {
          revenue: number;
          orderCount: number;
          avgOrder: number;
          cancelledCount: number;
          cancelRate: number;
          paidCount: number;
          pickupCount: number;
          deliveryCount: number;
          discountTotal: number;
          shippingTotal: number;
        };
        monthlyRevenue: import("@/types").ChartData[];
        dailyRevenue: import("@/types").ChartData[];
        topProducts: (import("@/types").ChartData & { revenue?: number })[];
        topCustomers: import("@/types").ChartData[];
        ordersByStatus: import("@/types").ChartData[];
        revenueByPayment: import("@/types").ChartData[];
        revenueByCategory: import("@/types").ChartData[];
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
