'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Building, 
  Calendar, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  {
    title: 'Tổng quan',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Quản lý người dùng',
    href: '/admin/users',
    icon: Users
  },
  {
    title: 'Duyệt chủ sân',
    href: '/admin/owner-registrations',
    icon: UserCheck
  },
  {
    title: 'Quản lý sân',
    href: '/admin/courts',
    icon: Building
  },
  {
    title: 'Quản lý booking',
    href: '/admin/bookings',
    icon: Calendar
  },
  {
    title: 'Thống kê',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    title: 'Cài đặt',
    href: '/admin/settings',
    icon: Settings
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Wait for auth context to finish loading
    if (loading) return
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (user.role !== 'admin') {
      router.push('/')
      return
    }
  }, [user, router, loading])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  // Show loading while auth context is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Truy cập bị từ chối</h2>
          <p className="text-gray-600 mb-4">
            Bạn không có quyền truy cập trang quản trị.
          </p>
          <Link href="/" className="text-green-600 hover:underline">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🏟️</span>
            </div>
            <div>
              <span className="text-lg font-bold">Admin Panel</span>
              <p className="text-xs text-gray-500">SportBooking</p>
            </div>
          </Link>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-green-100 text-green-700 border-r-2 border-green-600' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Quản trị viên
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900">
                  Quản trị hệ thống
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-600">
                Xin chào, <span className="font-medium">{user.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
