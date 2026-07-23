export const WHY_CHOOSE_US = [
  {
    id: "1",
    title: "Hàng tươi mỗi ngày",
    description:
      "Nhập hàng tươi mỗi sáng từ nông trại và chợ đầu mối địa phương",
    icon: "Leaf",
  },
  {
    id: "2",
    title: "Giá tốt",
    description:
      "Cam kết giá cạnh tranh, nhiều ưu đãi cho khách hàng thân thiết",
    icon: "BadgePercent",
  },
  {
    id: "3",
    title: "Giao nhanh",
    description:
      "Giao hàng trong 2 giờ cho khu vực nội thị, 4 giờ cho vùng ven",
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
        body: "Sản phẩm còn nguyên bao bì, chưa sử dụng (trừ hàng tươi sống bị hỏng do vận chuyển). Thời hạn đổi/trả trong 24 giờ kể từ khi nhận hàng.",
      },
      {
        heading: "Quy trình",
        body: "Liên hệ hotline hoặc Zalo, gửi ảnh sản phẩm và mã đơn hàng. Shop xác nhận và hỗ trợ đổi mới hoặc hoàn tiền trong 3–5 ngày làm việc.",
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
        body: "Giao nội thị Củ Chi và vùng lân cận (Long An, Bình Dương). Ngoài khu vực vui lòng liên hệ shop để tư vấn.",
      },
      {
        heading: "Thời gian & phí",
        body: "Nội thị khoảng 2 giờ, vùng ven khoảng 4 giờ trong giờ mở cửa. Phí ship 15.000đ; miễn phí với đơn từ 200.000đ.",
      },
      {
        heading: "Nhận hàng",
        body: "Kiểm tra hàng trước khi thanh toán COD. Nếu thiếu/hỏng, từ chối nhận và báo ngay cho shipper/shop.",
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
        heading: "Quyền của bạn",
        body: "Bạn có thể yêu cầu xem/sửa/xóa thông tin cá nhân qua trang Tài khoản hoặc hotline cửa hàng.",
      },
    ],
  },
  "dieu-khoan": {
    title: "Điều khoản sử dụng",
    updatedAt: "2026-07-01",
    sections: [
      {
        heading: "Chấp nhận điều khoản",
        body: "Khi sử dụng website Tạp Hóa FPT, bạn đồng ý với các điều khoản và chính sách liên quan.",
      },
      {
        heading: "Tài khoản",
        body: "Bạn chịu trách nhiệm bảo mật tài khoản. Không sử dụng dịch vụ cho mục đích gian lận hoặc trái pháp luật.",
      },
      {
        heading: "Giá & đơn hàng",
        body: "Giá có thể thay đổi theo thời điểm. Đơn hàng có hiệu lực sau khi shop xác nhận. Shop có quyền từ chối đơn bất thường.",
      },
    ],
  },
} as const;

export type PolicySlug = keyof typeof POLICY_PAGES;
