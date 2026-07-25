export const WHY_CHOOSE_US = [
  {
    id: "1",
    title: "Siêu thị mini quê",
    description:
      "Đầy đủ đồ ăn uống, gia vị, bánh kẹo đến đồ gia dụng — ghé quầy hoặc đặt online",
    icon: "Store",
  },
  {
    id: "2",
    title: "Online & tại quầy",
    description:
      "Đặt trên web giao tận nhà, hoặc đến cửa hàng chọn hàng thanh toán ngay",
    icon: "ShoppingBag",
  },
  {
    id: "3",
    title: "Giao nhanh gần nhà",
    description:
      "Giao nội thị khoảng 2 giờ, vùng ven 3–4 giờ trong giờ mở cửa",
    icon: "Truck",
  },
  {
    id: "4",
    title: "Đổi trả dễ dàng",
    description: "Đổi trả trong 24h nếu sản phẩm không đạt chất lượng",
    icon: "RefreshCw",
  },
] as const;

export const POLICY_PAGES = {
  "doi-tra": {
    title: "Chính sách đổi trả",
    updatedAt: "2026-07-01",
    sections: [
      {
        heading: "Điều kiện đổi trả",
        body: "Sản phẩm còn nguyên bao bì, chưa sử dụng (trừ hàng tươi sống bị hỏng do vận chuyển). Thời hạn đổi/trả trong 24 giờ kể từ khi nhận hàng hoặc mua tại quầy.",
      },
      {
        heading: "Quy trình",
        body: "Liên hệ hotline hoặc Zalo, gửi ảnh sản phẩm và mã đơn / hóa đơn. Shop xác nhận và hỗ trợ đổi mới hoặc hoàn tiền trong 3–5 ngày làm việc.",
      },
      {
        heading: "Không áp dụng",
        body: "Hàng đã mở dùng (không phải lỗi chất lượng), hàng khuyến mãi ghi rõ không đổi trả, hoặc quá thời hạn 24 giờ.",
      },
    ],
  },
  "giao-hang": {
    title: "Chính sách giao hàng",
    updatedAt: "2026-07-01",
    sections: [
      {
        heading: "Khu vực",
        body: "Giao nội thị Gia Viễn (Ninh Bình) và vùng lân cận. Ngoài khu vực vui lòng liên hệ shop để tư vấn. Khách cũng có thể đến lấy tại quầy.",
      },
      {
        heading: "Thời gian & phí",
        body: "Nội thị khoảng 2 giờ, vùng ven khoảng 3–4 giờ trong giờ mở cửa. Phí ship 15.000đ; miễn phí với đơn từ 200.000đ. Đến lấy tại cửa hàng: không tính ship.",
      },
      {
        heading: "Nhận hàng",
        body: "Kiểm tra hàng trước khi thanh toán COD hoặc khi nhận tại quầy. Nếu thiếu/hỏng, từ chối nhận và báo ngay cho shop.",
      },
    ],
  },
  "bao-mat": {
    title: "Chính sách bảo mật",
    updatedAt: "2026-07-01",
    sections: [
      {
        heading: "Thu thập thông tin",
        body: "Chúng tôi thu thập họ tên, SĐT, email, địa chỉ giao hàng để xử lý đơn và hỗ trợ khách hàng.",
      },
      {
        heading: "Sử dụng & bảo vệ",
        body: "Thông tin chỉ dùng cho mục đích bán hàng và chăm sóc. Không bán dữ liệu cho bên thứ ba. Mật khẩu được mã hóa.",
      },
      {
        heading: "Liên hệ",
        body: "Mọi thắc mắc về bảo mật vui lòng gọi hotline cửa hàng hoặc gửi email theo thông tin trên trang Liên hệ.",
      },
    ],
  },
  "dieu-khoan": {
    title: "Điều khoản sử dụng",
    updatedAt: "2026-07-01",
    sections: [
      {
        heading: "Chấp nhận điều khoản",
        body: "Khi sử dụng website và dịch vụ của Tạp Hóa FPT, bạn đồng ý với các điều khoản mua bán, giao nhận và thanh toán được nêu trên website.",
      },
      {
        heading: "Đặt hàng & giá",
        body: "Giá và tồn kho trên web có thể thay đổi theo ngày. Đơn hàng chỉ được xác nhận khi shop xác nhận hoặc khách thanh toán thành công.",
      },
    ],
  },
} as const;

export type PolicySlug = keyof typeof POLICY_PAGES;
