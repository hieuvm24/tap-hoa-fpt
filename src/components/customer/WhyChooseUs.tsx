import {
  Store,
  ShoppingBag,
  Truck,
  RefreshCw,
  LucideIcon,
} from "lucide-react";
import { WHY_CHOOSE_US } from "@/config/marketing";
import { Card } from "@/components/ui";

const iconMap: Record<string, LucideIcon> = {
  Store,
  ShoppingBag,
  Truck,
  RefreshCw,
};

export function WhyChooseUs() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Vì sao chọn chúng tôi</h2>
          <p className="text-gray-500">Cam kết mang đến trải nghiệm mua sắm tốt nhất</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {WHY_CHOOSE_US.map((item) => {
            const Icon = iconMap[item.icon] || Store;
            return (
              <Card key={item.id} hover className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mx-auto mb-4">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
