import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🏟️</span>
              </div>
              <span className="text-xl font-bold">SportBooking</span>
            </div>
            <p className="text-gray-600">
              Nền tảng đặt sân thể thao thông minh hàng đầu Việt Nam
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Sản phẩm</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/search">Tìm sân</Link>
              </li>
              <li>
                <Link href="/mobile">Ứng dụng mobile</Link>
              </li>
              <li>
                <Link href="/owner">Dành cho chủ sân</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/help">Trung tâm trợ giúp</Link>
              </li>
              <li>
                <Link href="/contact">Liên hệ</Link>
              </li>
              <li>
                <Link href="/terms">Điều khoản</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-gray-600">
              <li>📧 support@sportbooking.vn</li>
              <li>📞 1900 1234</li>
              <li>📍 TP.HCM, Việt Nam</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2024 SportBooking. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
