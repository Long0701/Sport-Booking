"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, CreditCard, Globe, Lock, Shield, User } from "lucide-react";
import { useState } from "react";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    dataSharing: false,
  });

  if (!user || user.role !== "owner") {
    return null; // Layout will handle access control
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">⚙️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
            <p className="text-sm text-gray-600">
              Quản lý cài đặt tài khoản và hệ thống
            </p>
          </div>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Thông tin cá nhân</span>
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin cá nhân và thông tin liên hệ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" defaultValue={user?.name} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" defaultValue={user?.phone} />
              </div>
              <div>
                <Label htmlFor="role">Vai trò</Label>
                <Input id="role" value="Chủ sân" disabled />
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              Cập nhật thông tin
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Cài đặt thông báo</span>
            </CardTitle>
            <CardDescription>
              Quản lý cách bạn nhận thông báo từ hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Thông báo qua email</Label>
                <p className="text-sm text-gray-600">
                  Nhận thông báo về booking, đánh giá và cập nhật hệ thống
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications">Thông báo qua SMS</Label>
                <p className="text-sm text-gray-600">
                  Nhận thông báo khẩn cấp qua tin nhắn SMS
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={notifications.sms}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, sms: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Thông báo đẩy</Label>
                <p className="text-sm text-gray-600">
                  Nhận thông báo trực tiếp trên trình duyệt
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={notifications.push}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, push: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Quyền riêng tư</span>
            </CardTitle>
            <CardDescription>
              Kiểm soát quyền riêng tư và bảo mật tài khoản
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profile-visibility">Hiển thị hồ sơ</Label>
              <Select
                value={privacy.profileVisibility}
                onValueChange={(value) =>
                  setPrivacy({ ...privacy, profileVisibility: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Công khai</SelectItem>
                  <SelectItem value="private">Riêng tư</SelectItem>
                  <SelectItem value="friends">Chỉ bạn bè</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="data-sharing">Chia sẻ dữ liệu</Label>
                <p className="text-sm text-gray-600">
                  Cho phép chia sẻ dữ liệu thống kê ẩn danh để cải thiện dịch vụ
                </p>
              </div>
              <Switch
                id="data-sharing"
                checked={privacy.dataSharing}
                onCheckedChange={(checked) =>
                  setPrivacy({ ...privacy, dataSharing: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Cài đặt hệ thống</span>
            </CardTitle>
            <CardDescription>
              Cấu hình ngôn ngữ, múi giờ và các tùy chọn khác
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Ngôn ngữ</Label>
                <Select defaultValue="vi">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone">Múi giờ</Label>
                <Select defaultValue="Asia/Ho_Chi_Minh">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Ho_Chi_Minh">GMT+7 (Việt Nam)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Bảo mật</span>
            </CardTitle>
            <CardDescription>
              Quản lý mật khẩu và bảo mật tài khoản
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                <Input id="current-password" type="password" />
              </div>
              <div>
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <Input id="new-password" type="password" />
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button variant="outline">Đổi mật khẩu</Button>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Cài đặt thanh toán</span>
            </CardTitle>
            <CardDescription>
              Quản lý thông tin thanh toán và rút tiền
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có phương thức thanh toán
              </h3>
              <p className="text-gray-600 mb-4">
                Thêm phương thức thanh toán để nhận tiền từ khách hàng
              </p>
              <Button variant="outline">Thêm phương thức thanh toán</Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button variant="outline">Hủy thay đổi</Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Lưu cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
}
