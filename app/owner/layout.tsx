"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Calendar,
  Home,
  LogOut,
  MapPin,
  Settings,
  Star,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: "Quản lý sân",
    href: "/owner/courts",
    icon: MapPin,
    description: "Thêm, sửa, xóa sân",
  },
  {
    name: "Quản lý booking",
    href: "/owner/bookings",
    icon: Calendar,
    description: "Xem và quản lý đặt sân",
  },
  {
    name: "Đánh giá",
    href: "/owner/reviews",
    icon: Star,
    description: "Quản lý đánh giá khách hàng",
  },
  {
    name: "Thống kê",
    href: "/owner/dashboard",
    icon: BarChart3,
    description: "Báo cáo và phân tích",
  },
  {
    name: "Cài đặt",
    href: "/owner/settings",
    icon: Settings,
    description: "Cấu hình hệ thống",
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (user?.role !== "owner") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Không có quyền truy cập</h2>
            <p className="text-gray-600 mb-4">
              Bạn cần đăng nhập với tài khoản chủ sân để truy cập trang này.
            </p>
            <Link href="/auth/login">
              <Button className="bg-green-600 hover:bg-green-700">
                Đăng nhập
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Brand */}
                       <div className="p-6 border-b border-gray-200">
                 <Link href="/owner/courts" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🏟️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-600">Sport Booking</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500">Chủ sân</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-[12px] space-y-2">
                           {navigationItems.map((item) => {
                   const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
                                   <h2 className="text-2xl font-bold text-gray-900">
                       {navigationItems.find(item =>
                         pathname === item.href
                       )?.name || 'Admin Panel'}
                     </h2>
                     <p className="text-sm text-gray-600">
                       {navigationItems.find(item =>
                         pathname === item.href
                       )?.description || 'Quản lý hệ thống đặt sân thể thao'}
                     </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
