'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import Link from "next/link"
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/shared/logo'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        
        // Redirect based on user role from API response
        if (data.user.role === 'admin') {
          window.location.href = '/admin/dashboard'
        } else if (data.user.role === 'owner') {
          window.location.href = '/owner/dashboard'
        } else {
          window.location.href = '/'
        }
      } else {
        alert(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
      }
    } catch (error) {
      console.error("Login error:", error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-teal-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '4s', animationDuration: '7s' }}></div>
        
        {/* Floating Sports Icons */}
        <div className="absolute top-10 right-10 text-4xl animate-spin opacity-20" style={{ animationDuration: '20s' }}>🏟️</div>
        <div className="absolute bottom-20 left-10 text-3xl animate-pulse opacity-20" style={{ animationDelay: '1s' }}>🏆</div>
        <div className="absolute top-1/2 right-20 text-2xl animate-spin opacity-20" style={{ animationDelay: '3s', animationDuration: '15s' }}>⚽</div>
        <div className="absolute bottom-10 right-1/3 text-3xl animate-pulse opacity-20" style={{ animationDelay: '2s' }}>🏀</div>
        
        {/* Particle System */}
        <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '2s' }}></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <Logo 
              size="lg" 
              showText={true} 
              variant="light"
              className="animate-fade-in"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Đăng nhập
          </CardTitle>
          <CardDescription className="text-emerald-100 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Đăng nhập vào tài khoản SportBooking của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Label htmlFor="email" className="text-white font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-emerald-200/70 focus:border-emerald-400 focus:ring-emerald-400/20 hover:bg-white/15 transition-all duration-300"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <Label htmlFor="password" className="text-white font-medium">Mật khẩu</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-emerald-200/70 focus:border-emerald-400 focus:ring-emerald-400/20 hover:bg-white/15 transition-all duration-300"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-emerald-300 hover:text-emerald-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '1s' }}>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="remember" className="rounded bg-white/10 border-white/20 text-emerald-400 focus:ring-emerald-400/20" />
                <Label htmlFor="remember" className="text-sm text-emerald-100">Ghi nhớ đăng nhập</Label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold py-3 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-[1.02] animate-fade-in" 
              disabled={loading}
              style={{ animationDelay: '1.2s' }}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="relative animate-fade-in" style={{ animationDelay: '1.4s' }}>
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/10 backdrop-blur-sm px-4 py-1 text-emerald-200 rounded-full border border-white/20">Hoặc</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '1.6s' }}>
            <Button variant="outline" className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 group">
              <svg className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 group">
              <svg className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>

          <div className="text-center text-sm animate-fade-in" style={{ animationDelay: '1.8s' }}>
            <span className="text-emerald-200">Chưa có tài khoản?</span>{" "}
            <Link href="/auth/register" className="text-emerald-300 hover:text-emerald-200 hover:underline font-medium transition-colors">
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
