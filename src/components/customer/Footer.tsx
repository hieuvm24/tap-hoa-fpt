"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Facebook,
  MessageCircle,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { DEFAULT_STORE } from "@/config/defaults";

const footerLinks = {
  policies: [
    { label: "Chính sách đổi trả", href: "/chinh-sach/doi-tra" },
    { label: "Chính sách giao hàng", href: "/chinh-sach/giao-hang" },
    { label: "Chính sách bảo mật", href: "/chinh-sach/bao-mat" },
    { label: "Hướng dẫn mua hàng", href: "/danh-muc" },
  ],
  terms: [
    { label: "Điều khoản sử dụng", href: "/chinh-sach/dieu-khoan" },
    { label: "Quy chế hoạt động", href: "/chinh-sach/dieu-khoan" },
    { label: "Giải quyết khiếu nại", href: "/lien-he" },
  ],
};

export function Footer() {
  const [storeInfo, setStoreInfo] = useState(DEFAULT_STORE);

  useEffect(() => {
    api.store.get().then((res) => {
      if (res.success && res.data) setStoreInfo({ ...DEFAULT_STORE, ...res.data });
    });
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">{storeInfo.name}</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">{storeInfo.slogan}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary-400" />
                <span>{storeInfo.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary-400" />
                <a href={`tel:${storeInfo.phone}`} className="hover:text-primary-400 transition-colors">
                  Hotline: {storeInfo.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary-400" />
                <span>{storeInfo.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0 text-primary-400" />
                <span>Mở cửa: {storeInfo.openHours}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Kết nối với chúng tôi</h3>
            <div className="space-y-3">
              <a
                href={storeInfo.facebook.startsWith("http") ? storeInfo.facebook : `https://${storeInfo.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-primary-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Facebook className="h-4 w-4" />
                </div>
                Facebook
              </a>
              <a
                href={`https://zalo.me/${storeInfo.zalo.replace(/\s/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-primary-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                  <MessageCircle className="h-4 w-4" />
                </div>
                Zalo - {storeInfo.zalo}
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Chính sách</h3>
            <ul className="space-y-2">
              {footerLinks.policies.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Điều khoản</h3>
            <ul className="space-y-2">
              {footerLinks.terms.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-xl overflow-hidden border border-gray-700">
          <iframe
            title="Google Maps cửa hàng"
            src={
              storeInfo.mapEmbedUrl ||
              `https://maps.google.com/maps?q=${storeInfo.latitude ?? 10.9804},${storeInfo.longitude ?? 106.5031}&z=15&output=embed&hl=vi`
            }
            className="h-48 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="bg-gray-800 px-4 py-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary-400" />
            {storeInfo.address}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          <p>© 2025 {storeInfo.name}. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
