import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, ExternalLink, ArrowRight } from "lucide-react";
import Logo from "./logo";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-800 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-br from-green-400/15 to-green-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Dynamic Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='footerPattern' width='40' height='40' patternUnits='userSpaceOnUse'%3e%3ccircle cx='20' cy='20' r='12' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3e%3ccircle cx='20' cy='20' r='6' fill='%23ffffff' fill-opacity='0.1'/%3e%3cpath d='M20 14l6 6-6 6-6-6z' fill='%23ffffff' fill-opacity='0.08'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23footerPattern)'/%3e%3c/svg%3e")`,
      }}></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-6 md:grid-cols-2 sm:grid-cols-1 gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 md:col-span-2 mb-8 md:mb-0">
            <div className="mb-6 group cursor-pointer">
              <Link href="/" className="inline-block transition-transform hover:scale-105">
                <Logo 
                  size="lg" 
                  showText={true} 
                  variant="light"
                  className="filter brightness-110 contrast-110"
                />
              </Link>
            </div>
            
            <p className="text-emerald-100 leading-relaxed mb-8 text-lg">
              Nền tảng đặt sân thể thao thông minh hàng đầu Việt Nam. 
              Kết nối đam mê thể thao với trải nghiệm booking hoàn hảo.
            </p>

            {/* Social Media */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-lg mb-4 flex items-center">
                Theo dõi chúng tôi
                <div className="ml-2 w-8 h-px bg-gradient-to-r from-emerald-400 to-transparent"></div>
              </h4>
              <div className="flex space-x-4">
                {[
                  { icon: Facebook, label: "Facebook", color: "hover:bg-blue-600" },
                  { icon: Instagram, label: "Instagram", color: "hover:bg-pink-600" },
                  { icon: Twitter, label: "Twitter", color: "hover:bg-blue-400" },
                  { icon: Youtube, label: "Youtube", color: "hover:bg-red-600" }
                ].map(({ icon: Icon, label, color }) => (
                  <Link 
                    key={label}
                    href="#" 
                    className={`w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 ${color} group border border-white/20`}
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5 text-white group-hover:text-white transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-bold mb-6 text-white flex items-center">
              Sản phẩm
              <ArrowRight className="w-4 h-4 ml-2 text-emerald-400" />
            </h3>
            <ul className="space-y-4">
              {[
                { href: "/search", label: "Tìm sân", desc: "Khám phá sân thể thao" },
                { href: "/mobile", label: "Ứng dụng mobile", desc: "Download app ngay" },
                { href: "/owner", label: "Dành cho chủ sân", desc: "Quản lý sân hiệu quả" }
              ].map(({ href, label, desc }) => (
                <li key={href}>
                  <Link 
                    href={href}
                    className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-300 hover:-translate-x-1"
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 group-hover:bg-cyan-400 transition-colors"></div>
                    <div>
                      <div className="text-white font-medium group-hover:text-emerald-300 transition-colors flex items-center">
                        {label}
                        <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-emerald-200 text-sm mt-1">{desc}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-bold mb-6 text-white flex items-center">
              Hỗ trợ
              <ArrowRight className="w-4 h-4 ml-2 text-emerald-400" />
            </h3>
            <ul className="space-y-4">
              {[
                { href: "/help", label: "Trung tâm trợ giúp", desc: "FAQ & Hướng dẫn" },
                { href: "/contact", label: "Liên hệ", desc: "Hỗ trợ 24/7" },
                { href: "/terms", label: "Điều khoản", desc: "Chính sách & quy định" }
              ].map(({ href, label, desc }) => (
                <li key={href}>
                  <Link 
                    href={href}
                    className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-300 hover:-translate-x-1"
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 group-hover:bg-cyan-400 transition-colors"></div>
                    <div>
                      <div className="text-white font-medium group-hover:text-emerald-300 transition-colors flex items-center">
                        {label}
                        <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-emerald-200 text-sm mt-1">{desc}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2 md:col-span-2">
            <h3 className="text-xl font-bold mb-6 text-white flex items-center">
              Liên hệ
              <ArrowRight className="w-4 h-4 ml-2 text-emerald-400" />
            </h3>
            <div className="space-y-4">
              {[
                { 
                  icon: Mail, 
                  label: "support@sportbooking.vn", 
                  href: "mailto:support@sportbooking.vn",
                  desc: "Email hỗ trợ"
                },
                { 
                  icon: Phone, 
                  label: "1900 1234", 
                  href: "tel:19001234",
                  desc: "Hotline 24/7"
                },
                { 
                  icon: MapPin, 
                  label: "TP Đà Nẵng, Việt Nam", 
                  href: "#",
                  desc: "Văn phòng chính"
                }
              ].map(({ icon: Icon, label, href, desc }) => (
                <Link 
                  key={label}
                  href={href}
                  className="group flex items-start space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] border border-white/10 hover:border-emerald-400/30"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-emerald-500/10 rounded-lg flex items-center justify-center group-hover:from-emerald-400/30 group-hover:to-emerald-500/20 transition-all duration-300 flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium group-hover:text-emerald-200 transition-colors text-sm break-words">
                      {label}
                    </div>
                    <div className="text-emerald-300 text-xs mt-1">{desc}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 p-8 bg-gradient-to-r from-emerald-600/30 via-green-600/20 to-emerald-600/30 rounded-3xl border border-white/10 backdrop-blur-sm">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-3">
              Đăng ký nhận tin tức mới nhất
            </h3>
            <p className="text-emerald-100 mb-6">
              Cập nhật thông tin khuyến mãi, sân mới và các tính năng hấp dẫn từ SportBooking
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Nhập email của bạn..."
                className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
              <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center space-x-2">
                <span>Đăng ký</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-emerald-200 text-center md:text-left">
              <p className="flex items-center justify-center md:justify-start space-x-2">
                <span>&copy; 2024 SportBooking. All rights reserved.</span>
                <span className="hidden md:block">|</span>
                <span className="text-emerald-300">Made with ❤️ in Vietnam</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-emerald-200 hover:text-white transition-colors text-sm">
                Chính sách bảo mật
              </Link>
              <Link href="/terms" className="text-emerald-200 hover:text-white transition-colors text-sm">
                Điều khoản sử dụng
              </Link>
              <Link href="/cookies" className="text-emerald-200 hover:text-white transition-colors text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
