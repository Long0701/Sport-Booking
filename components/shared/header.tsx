"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">🏟️</span>
          </div>
          <span className="text-xl font-bold text-gray-900">SportBooking</span>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/search" className="text-gray-600 hover:text-green-600">
            Tìm sân
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-green-600">
            Về chúng tôi
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-green-600">
            Liên hệ
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                Xin chào, {user.name}
              </span>
              {/* {user.role === "owner" && (
                <Link href="/owner/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              )} */}
              <Button variant="ghost" onClick={logout}>
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost">Đăng nhập</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-green-600 hover:bg-green-700">
                  Đăng ký
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
