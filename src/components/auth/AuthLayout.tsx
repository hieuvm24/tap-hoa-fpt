"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Store, Leaf, Truck, ShieldCheck, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { DEFAULT_STORE } from "@/config/defaults";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  { icon: Leaf, text: "Thực phẩm tươi sạch mỗi ngày" },
  { icon: Truck, text: "Giao hàng tận nhà trong 2 giờ" },
  { icon: ShieldCheck, text: "Đổi trả dễ dàng trong 24h" },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const [storeInfo, setStoreInfo] = useState(DEFAULT_STORE);

  useEffect(() => {
    api.store.get().then((res) => {
      if (res.success && res.data) setStoreInfo({ ...DEFAULT_STORE, ...res.data });
    });
  }, []);
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold">{storeInfo.name}</span>
                <p className="text-xs text-primary-100">{storeInfo.slogan}</p>
              </div>
            </Link>
          </div>

          <div>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              Mua sắm tiện lợi
              <br />
              <span className="text-primary-100">ngay tại nhà bạn</span>
            </h2>
            <p className="text-primary-100 text-base mb-8 max-w-md">
              Tham gia cùng hàng nghìn khách hàng tin tưởng mua sắm tại cửa hàng tạp hóa địa phương.
            </p>

            <ul className="space-y-4">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative h-48 xl:h-56 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop"
              alt="Cửa hàng tạp hóa"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-sm font-medium">📍 {storeInfo.address}</p>
              <p className="text-xs text-primary-100 mt-1">Hotline: {storeInfo.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
              <Store className="h-4 w-4" />
            </div>
            <span className="font-bold text-gray-900">{storeInfo.name}</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-8">
          <div className="w-full max-w-md animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              <p className="text-gray-500 text-sm sm:text-base">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6 px-4">
          © 2025 {storeInfo.name}. Bảo mật thông tin của bạn là ưu tiên hàng đầu.
        </p>
      </div>
    </div>
  );
}
