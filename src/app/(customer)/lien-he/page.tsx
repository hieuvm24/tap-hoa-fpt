"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { DEFAULT_STORE } from "@/config/defaults";
import { Phone, MapPin, Clock, Mail, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import type { StoreInfo } from "@/types";

export default function ContactPage() {
  const [store, setStore] = useState<StoreInfo>(DEFAULT_STORE);

  useEffect(() => {
    api.store.get().then((res) => {
      if (res.success && res.data) setStore({ ...DEFAULT_STORE, ...res.data });
    });
  }, []);

  const mapSrc = useMemo(() => {
    if (store.mapEmbedUrl) return store.mapEmbedUrl;
    const lat = store.latitude ?? DEFAULT_STORE.latitude!;
    const lng = store.longitude ?? DEFAULT_STORE.longitude!;
    return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed&hl=vi`;
  }, [store]);

  const directionsUrl = useMemo(() => {
    const lat = store.latitude ?? DEFAULT_STORE.latitude!;
    const lng = store.longitude ?? DEFAULT_STORE.longitude!;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }, [store]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Liên hệ</h1>
      <p className="text-gray-500 text-center mb-8">
        Chúng tôi luôn sẵn sàng hỗ trợ bạn
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <Phone className="h-8 w-8 text-primary-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Hotline</h3>
          <p className="text-gray-600">{store.phone}</p>
        </Card>
        <Card className="text-center">
          <MapPin className="h-8 w-8 text-primary-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Địa chỉ</h3>
          <p className="text-gray-600 text-sm">{store.address}</p>
        </Card>
        <Card className="text-center">
          <Clock className="h-8 w-8 text-primary-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Giờ mở cửa</h3>
          <p className="text-gray-600">{store.openHours}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold">Thông tin cửa hàng</h2>
          <p className="text-sm text-gray-500">{store.slogan}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-primary-500" />
            {store.email}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-primary-500" />
            Zalo: {store.zalo}
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Chỉ đường Google Maps
            <ExternalLink className="h-4 w-4" />
          </a>
        </Card>

        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          <iframe
            title="Bản đồ cửa hàng"
            src={mapSrc}
            className="h-[360px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </Card>
      </div>
    </div>
  );
}
