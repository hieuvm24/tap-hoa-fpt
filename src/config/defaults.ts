import type { StoreInfo } from "@/types";

/** Fallback khi API store chưa sẵn sàng — nguồn duy nhất cho default store */
export const DEFAULT_STORE: StoreInfo = {
  name: "Tạp Hóa FPT",
  slogan: "Siêu thị mini quê — Online & tại quầy",
  address: "Gián Khẩu, Xã Gia Trấn, Huyện Gia Viễn, Ninh Bình",
  phone: "0388025515",
  email: "vuminhhieunp@mail.com",
  facebook: "https://www.facebook.com/vu.minh.hieu.503599",
  zalo: "0388025515",
  openHours: "6:00 - 21:00 hàng ngày",
  description:
    "Tạp hóa / siêu thị mini ở Gia Viễn: bán thực phẩm, đồ uống, gia vị, bánh kẹo, đông lạnh và đồ gia dụng. Mua online giao tận nơi hoặc đến lấy tại quầy.",
  latitude: 20.333,
  longitude: 105.92,
  mapEmbedUrl: null,
  bankName: "Vietcombank",
  bankAccount: "0388025515",
  bankOwner: "VU MINH HIEU",
};

export const FREE_SHIP_THRESHOLD = 200000;
export const SHIPPING_FEE = 15000;
