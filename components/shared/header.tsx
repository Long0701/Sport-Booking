"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, Settings, BookOpen, Home } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Logo from "./logo";

export default function Header() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Tìm sân', href: '/search', icon: BookOpen },
    { name: 'Về chúng tôi', href: '/about', icon: User },
    { name: 'Liên hệ', href: '/contact', icon: Settings }
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-3 transition-all duration-300 rounded-lg group ${
                    isActive 
                      ? 'text-green-600 bg-green-50/80 shadow-sm' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  
                  {/* Animated underline */}
                  <div className={`nav-underline absolute bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full ${
                    isActive 
                      ? 'w-3/4 opacity-100 nav-underline-active' 
                      : 'w-0 group-hover:w-3/4 opacity-0 group-hover:opacity-100'
                  }`}></div>
                  
                  {/* Subtle glow effect for active tab */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-lg border border-green-200/20"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{user.name}</span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up">
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                      <p className="text-sm text-gray-600">Xin chào,</p>
                      <p className="font-semibold text-gray-800">{user.name}</p>
                    </div>
                    
                    {user.role === "owner" && (
                      <Link 
                        href="/owner/dashboard" 
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                    )}
                    
                    {user.role === "user" && (
                      <Link 
                        href="/bookings" 
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Sân đã đặt</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost" className="font-medium hover:bg-gray-100">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 animate-fade-in-up">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'text-green-600 bg-green-50/80 border-l-2 border-green-500' 
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'scale-110' : ''
                    }`} />
                    <span className="font-medium">{item.name}</span>
                    
                    {/* Active indicator for mobile */}
                    {isActive && (
                      <div className="absolute right-3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-2">
                    <p className="text-sm text-gray-600">Xin chào,</p>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                  </div>
                  
                  {user.role === "owner" && (
                    <Link
                      href="/owner/dashboard"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  )}
                  
                  {user.role === "user" && (
                    <Link
                      href="/bookings"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span className="font-medium">Sân đã đặt</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 px-4">
                  <Link href="/auth/login" className="block">
                    <Button variant="ghost" className="w-full justify-start font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="block">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" onClick={() => setIsMobileMenuOpen(false)}>
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
