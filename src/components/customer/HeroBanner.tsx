import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 mb-4">
              <Sparkles className="h-4 w-4" />
              Giao hàng miễn phí đơn từ 200K
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Thực phẩm sạch
              <span className="block text-primary-600">Giao tận nhà</span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-lg">
              Tạp Hóa FPT - Nơi mua sắm thực phẩm tươi ngon, giá tốt cho mọi gia đình.
              Đặt hàng online, giao tận cổng trong 2 giờ.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/danh-muc">
                <Button size="lg" className="gap-2">
                  Mua ngay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/khuyen-mai">
                <Button variant="outline" size="lg">
                  Xem khuyến mãi
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop"
                alt="Thực phẩm tươi sạch"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-white p-4 shadow-lg hidden sm:block">
              <p className="text-2xl font-bold text-primary-600">330+</p>
              <p className="text-sm text-gray-500">Sản phẩm</p>
            </div>
            <div className="absolute -top-4 -right-4 rounded-xl bg-white p-4 shadow-lg hidden sm:block">
              <p className="text-2xl font-bold text-primary-600">2h</p>
              <p className="text-sm text-gray-500">Giao hàng</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
