"use client";

import { useState, Suspense, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  Lock,
  Bell,
  ChevronRight,
  Save,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { AuthGuard } from "@/components/auth";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input, Badge, ImageUpload } from "@/components/ui";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Address, Order } from "@/types";
import { confirmDialog, toast } from "@/lib/feedback";

const tabs = [
  { id: "profile", label: "Thông tin cá nhân", icon: User },
  { id: "orders", label: "Đơn hàng", icon: Package },
  { id: "address", label: "Địa chỉ", icon: MapPin },
  { id: "password", label: "Mật khẩu", icon: Lock },
  { id: "settings", label: "Cài đặt", icon: Bell },
];

function AccountContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({
    label: "Nhà",
    fullName: "",
    phone: "",
    address: "",
    isDefault: true,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [notifyPrefs, setNotifyPrefs] = useState({
    order: true,
    promo: true,
    news: true,
  });
  const [notifySaved, setNotifySaved] = useState(false);
  const [notifySaving, setNotifySaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setAvatar(user.avatar || "");
      setAddrForm((f) => ({
        ...f,
        fullName: user.name,
        phone: user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    api.orders.list({ mine: "true" }).then((res) => {
      if (res.success && res.data) setUserOrders(res.data);
    });
    api.addresses.list().then((res) => {
      if (res.success && res.data) setAddresses(res.data);
    });
    api.auth.getNotifyPrefs().then((res) => {
      if (res.success && res.data?.prefs) setNotifyPrefs(res.data.prefs);
    });
  }, []);

  const loadAddresses = () => {
    api.addresses.list().then((res) => {
      if (res.success && res.data) setAddresses(res.data);
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile({ name, phone, avatar });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddAddress = async () => {
    const res = editingAddrId
      ? await api.addresses.update(editingAddrId, addrForm)
      : await api.addresses.create(addrForm);
    if (res.success) {
      setAddrForm({
        label: "Nhà",
        fullName: user?.name || "",
        phone: user?.phone || "",
        address: "",
        isDefault: false,
      });
      setEditingAddrId(null);
      loadAddresses();
    } else {
      toast.error(res.error || "Không lưu được địa chỉ");
    }
  };

  const handleEditAddress = (a: Address) => {
    setEditingAddrId(a.id);
    setAddrForm({
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      address: a.address,
      isDefault: a.isDefault,
    });
  };

  const handleDeleteAddress = async (id: string) => {
    const ok = await confirmDialog({
      title: "Xóa địa chỉ",
      message: "Bạn có chắc muốn xóa địa chỉ này?",
      variant: "danger",
      confirmText: "Xóa địa chỉ",
    });
    if (!ok) return;
    const res = await api.addresses.delete(id);
    if (res.success) {
      toast.success("Đã xóa địa chỉ");
      loadAddresses();
    } else toast.error(res.error || "Không xóa được địa chỉ");
  };

  const handleChangePassword = async () => {
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Mật khẩu xác nhận không khớp");
      return;
    }
    const res = await api.auth.changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordMsg("Đã đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMsg(res.error || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        {avatar || user?.avatar ? (
          <Image
            src={avatar || user?.avatar || ""}
            alt={user?.name || ""}
            width={72}
            height={72}
            className="rounded-2xl object-cover ring-4 ring-primary-100"
            unoptimized={(avatar || user?.avatar || "").startsWith("/uploads/")}
          />
        ) : (
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <User className="h-8 w-8" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-gray-500">{user?.email}</p>
          <Badge variant="success" className="mt-1">
            Thành viên
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card padding="sm" className="lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeTab === id
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
              </button>
            ))}
          </nav>
        </Card>

        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Thông tin cá nhân</h2>
              <div className="space-y-4 max-w-md">
                <ImageUpload
                  label="Ảnh đại diện"
                  folder="avatars"
                  round
                  value={avatar}
                  onChange={setAvatar}
                />
                <Input label="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Email" value={user?.email || ""} disabled className="bg-gray-50" />
                <Input label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveProfile} isLoading={isSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    Lưu thay đổi
                  </Button>
                  {saved && (
                    <span className="flex items-center gap-1 text-sm text-green-600 animate-fade-in">
                      <CheckCircle2 className="h-4 w-4" />
                      Đã lưu
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === "orders" && (
            <Card padding="none">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Đơn hàng của tôi</h2>
              </div>
              {userOrders.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {userOrders.map((order) => (
                    <Link
                      key={order.id}
                      href="/don-hang"
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-primary-600">{order.orderCode}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(order.total)}</p>
                        <Badge variant="info" className="mt-1">
                          {order.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có đơn hàng nào</p>
                  <Link href="/danh-muc" className="mt-3 inline-block">
                    <Button size="sm">Mua sắm ngay</Button>
                  </Link>
                </div>
              )}
            </Card>
          )}

          {activeTab === "address" && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
              <div className="space-y-3 mb-6">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-gray-200 p-4 flex justify-between gap-3"
                  >
                    <div>
                      {a.isDefault && (
                        <Badge variant="success" className="mb-2">
                          Mặc định
                        </Badge>
                      )}
                      <p className="font-medium">
                        {a.label} — {a.fullName}
                      </p>
                      <p className="text-sm text-gray-600">{a.phone}</p>
                      <p className="text-sm text-gray-500">{a.address}</p>
                    </div>
                    <div className="flex gap-1 h-fit">
                      <button
                        type="button"
                        onClick={() => handleEditAddress(a)}
                        className="text-primary-600 hover:bg-primary-50 rounded-lg px-2 py-2 text-xs font-medium"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(a.id)}
                        className="text-red-500 hover:bg-red-50 rounded-lg p-2 h-fit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {addresses.length === 0 && (
                  <p className="text-sm text-gray-500">Chưa có địa chỉ nào.</p>
                )}
              </div>
              <div className="border-t pt-4 space-y-3 max-w-md">
                <h3 className="font-medium">
                  {editingAddrId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
                </h3>
                <Input
                  label="Nhãn"
                  value={addrForm.label}
                  onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                />
                <Input
                  label="Họ tên"
                  value={addrForm.fullName}
                  onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                />
                <Input
                  label="SĐT"
                  value={addrForm.phone}
                  onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                />
                <Input
                  label="Địa chỉ"
                  value={addrForm.address}
                  onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={addrForm.isDefault}
                    onChange={(e) =>
                      setAddrForm({ ...addrForm, isDefault: e.target.checked })
                    }
                  />
                  Đặt làm mặc định
                </label>
                <Button size="sm" onClick={handleAddAddress}>
                  {editingAddrId ? "Cập nhật địa chỉ" : "+ Lưu địa chỉ"}
                </Button>
                {editingAddrId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingAddrId(null);
                      setAddrForm({
                        label: "Nhà",
                        fullName: user?.name || "",
                        phone: user?.phone || "",
                        address: "",
                        isDefault: false,
                      });
                    }}
                  >
                    Hủy sửa
                  </Button>
                )}
              </div>
            </Card>
          )}

          {activeTab === "password" && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Đổi mật khẩu</h2>
              <div className="space-y-4 max-w-md">
                <PasswordInput
                  label="Mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <PasswordInput
                  label="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <PasswordInput
                  label="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {passwordMsg && (
                  <p className="text-sm text-primary-600">{passwordMsg}</p>
                )}
                <Button onClick={handleChangePassword}>Cập nhật mật khẩu</Button>
              </div>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Cài đặt thông báo</h2>
              <div className="space-y-4">
                {(
                  [
                    {
                      key: "order" as const,
                      label: "Thông báo đơn hàng",
                      desc: "Cập nhật trạng thái giao hàng",
                    },
                    {
                      key: "promo" as const,
                      label: "Khuyến mãi & ưu đãi",
                      desc: "Nhận thông tin giảm giá mới",
                    },
                    {
                      key: "news" as const,
                      label: "Tin tức cửa hàng",
                      desc: "Sản phẩm mới, thông báo từ shop",
                    },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between py-2 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyPrefs[item.key]}
                      onChange={(e) =>
                        setNotifyPrefs((p) => ({
                          ...p,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded text-primary-500 focus:ring-primary-500"
                    />
                  </label>
                ))}
                {notifySaved && (
                  <p className="text-sm text-primary-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Đã lưu tùy chọn
                  </p>
                )}
                <Button
                  isLoading={notifySaving}
                  onClick={async () => {
                    setNotifySaving(true);
                    setNotifySaved(false);
                    const res = await api.auth.updateNotifyPrefs(notifyPrefs);
                    setNotifySaving(false);
                    if (res.success && res.data?.prefs) {
                      setNotifyPrefs(res.data.prefs);
                      setNotifySaved(true);
                    } else {
                      toast.error(res.error || "Không lưu được");
                    }
                  }}
                >
                  <Save className="h-4 w-4 mr-1" /> Lưu cài đặt
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard allowedRoles={["CUSTOMER"]}>
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <AccountContent />
      </Suspense>
    </AuthGuard>
  );
}
