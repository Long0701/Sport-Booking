"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Clock,
  DollarSign,
  Phone,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardStats {
  monthlyRevenue: number;
  totalBookings: number;
  averageRating: string;
  occupancyRate: number;
  revenueChart: Array<{ day: string; revenue: number }>;
  hourlyChart: Array<{ hour: string; bookings: number }>;
}

interface Booking {
  _id: string;
  user: {
    name: string;
    phone: string;
  };
  court: {
    name: string;
    type: string;
  };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Review {
  _id: string;
  user: {
    name: string;
    avatar: string;
  };
  court: {
    name: string;
    type: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "owner") {
      fetchDashboardData();
      fetchTodayBookings();
      fetchReviews()
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/owner/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayBookings = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/owner/bookings?date=${today}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setTodayBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching today bookings:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await fetch("/api/owner/reviews?limit=20", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800">Đã xác nhận</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Chờ xác nhận</Badge>
        );
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Đã hủy</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Hoàn thành</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSportTypeInVietnamese = (type: string) => {
    const sportMap: { [key: string]: string } = {
      football: "Bóng đá mini",
      badminton: "Cầu lông",
      tennis: "Tennis",
      basketball: "Bóng rổ",
      volleyball: "Bóng chuyền",
      pickleball: "Pickleball",
    };
    return sportMap[type] || type;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Dashboard Chủ Sân</h1>
                  <p className="text-sm text-gray-600">
                    Xin chào, {user?.name}
                  </p>
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-2">
              <Link href="/owner/courts">
                <Button variant="outline">Quản lý sân</Button>
              </Link>
              <Link href="/owner/bookings">
                <Button variant="outline">Xem booking</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="statistics">Thống kê</TabsTrigger>
            <TabsTrigger value="schedule">Lịch hôm nay</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Doanh thu tháng
                      </p>
                      <p className="text-2xl font-bold">
                        {loading
                          ? "..."
                          : `${stats?.monthlyRevenue.toLocaleString("vi-VN")}đ`}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Tổng booking
                      </p>
                      <p className="text-2xl font-bold">
                        {loading ? "..." : stats?.totalBookings}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Đánh giá TB
                      </p>
                      <p className="text-2xl font-bold">
                        {loading ? "..." : `${stats?.averageRating}/5`}
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Tỷ lệ lấp đầy
                      </p>
                      <p className="text-2xl font-bold">
                        {loading ? "..." : `${stats?.occupancyRate}%`}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/owner/courts/add">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Thêm sân mới
                    </Button>
                  </Link>
                  <Link href="/owner/bookings">
                    <Button variant="outline" className="w-full">
                      Xem tất cả booking
                    </Button>
                  </Link>
                  <Link href="/owner/courts">
                    <Button variant="outline" className="w-full">
                      Quản lý sân
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu 7 ngày qua</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats?.revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value).toLocaleString("vi-VN")}đ`,
                            "Doanh thu",
                          ]}
                        />
                        <Bar dataKey="revenue" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Hourly Bookings Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Lượt đặt theo giờ</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats?.hourlyChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value} lượt`, "Booking"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="bookings"
                          stroke="#2563eb"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lịch đặt hôm nay</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTodayBookings}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Không có lịch đặt hôm nay
                    </h3>
                    <p className="text-gray-600">
                      Chưa có booking nào cho ngày hôm nay
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayBookings.map((booking) => (
                      <Card
                        key={booking._id}
                        className="border-l-4 border-l-green-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold">
                                  {booking.court.name}
                                </h4>
                                <Badge variant="outline">
                                  {getSportTypeInVietnamese(booking.court.type)}
                                </Badge>
                                {getStatusBadge(booking.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>{booking.user.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{booking.user.phone}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {booking.startTime} - {booking.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>
                                    {booking.totalAmount.toLocaleString(
                                      "vi-VN"
                                    )}
                                    đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Đánh giá từ khách hàng</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchReviews}
                    disabled={reviewsLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        reviewsLoading ? "animate-spin" : ""
                      }`}
                    />
                    Làm mới
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex space-x-4">
                          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Chưa có đánh giá nào
                    </h3>
                    <p className="text-gray-600">
                      Khách hàng chưa để lại đánh giá nào cho sân của bạn
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="flex space-x-4">
                        <Avatar>
                          <AvatarImage
                            src={review.user.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {review.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">
                                {review.user.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {review.court.name} •{" "}
                                {getSportTypeInVietnamese(review.court.type)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-1 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(review.createdAt)}
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
