"use client";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CalendarDays
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

type FilterType = "day" | "month" | "year" | "range";

interface DateFilter {
  type: FilterType;
  startDate: string;
  endDate: string;
  currentDate: Date;
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

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    type: "month",
    startDate: "",
    endDate: "",
    currentDate: new Date()
  });

  useEffect(() => {
    if (user?.role === "owner") {
      fetchDashboardData();
      fetchTodayBookings();
      fetchReviews()
    }
  }, [user]);

  // Refetch data when date filter changes
  useEffect(() => {
    if (user?.role === "owner") {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, user?.role]);

  const fetchDashboardData = async (filterOverride?: DateFilter) => {
    try {
      setLoading(true);
      const filter = filterOverride || dateFilter;
      const { startDate, endDate } = getDateRangeForFilter(filter);
      
      const params = new URLSearchParams({
        startDate,
        endDate,
        filterType: filter.type
      });

      const response = await fetch(`/api/owner/dashboard/stats?${params}`, {
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

  // Date filter helper functions
  const getDateRangeForFilter = (filter: DateFilter) => {
    const current = new Date(filter.currentDate);
    let startDate: Date;
    let endDate: Date;

    switch (filter.type) {
      case "day":
        startDate = new Date(current.getFullYear(), current.getMonth(), current.getDate());
        endDate = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59);
        break;
      case "month":
        startDate = new Date(current.getFullYear(), current.getMonth(), 1);
        endDate = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
        break;
      case "year":
        startDate = new Date(current.getFullYear(), 0, 1);
        endDate = new Date(current.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case "range":
        return {
          startDate: filter.startDate,
          endDate: filter.endDate
        };
      default:
        startDate = new Date(current.getFullYear(), current.getMonth(), 1);
        endDate = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const navigateDate = (direction: "prev" | "next") => {
    const current = new Date(dateFilter.currentDate);
    
    switch (dateFilter.type) {
      case "day":
        current.setDate(current.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "month":
        current.setMonth(current.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "year":
        current.setFullYear(current.getFullYear() + (direction === "next" ? 1 : -1));
        break;
    }

    setDateFilter(prev => ({
      ...prev,
      currentDate: current
    }));
  };

  const getFilterDisplayText = () => {
    const current = dateFilter.currentDate;
    
    switch (dateFilter.type) {
      case "day":
        return current.toLocaleDateString("vi-VN");
      case "month":
        return `Tháng ${current.getMonth() + 1}/${current.getFullYear()}`;
      case "year":
        return `Năm ${current.getFullYear()}`;
      case "range":
        if (dateFilter.startDate && dateFilter.endDate) {
          return `${new Date(dateFilter.startDate).toLocaleDateString("vi-VN")} - ${new Date(dateFilter.endDate).toLocaleDateString("vi-VN")}`;
        }
        return "Chọn khoảng thời gian";
      default:
        return "";
    }
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
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="overview" className="space-y-6">
          {/* <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="statistics">Thống kê</TabsTrigger>
            <TabsTrigger value="schedule">Lịch hôm nay</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList> */}

          {/* Date Filter Section */}
          <Card className="border-green-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-green-600" />
                Bộ lọc thời gian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Filter Type Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 min-w-fit">Loại filter:</span>
                  <Select
                    value={dateFilter.type}
                    onValueChange={(value: FilterType) => {
                      setDateFilter(prev => ({
                        ...prev,
                        type: value,
                        currentDate: new Date() // Reset to current date when changing filter type
                      }));
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Ngày</SelectItem>
                      <SelectItem value="month">Tháng</SelectItem>
                      <SelectItem value="year">Năm</SelectItem>
                      <SelectItem value="range">Khoảng thời gian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Navigation for day/month/year */}
                {dateFilter.type !== "range" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate("prev")}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="min-w-fit px-3 py-1 bg-green-50 rounded text-sm font-medium text-green-800">
                      {getFilterDisplayText()}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate("next")}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Date Range Picker */}
                {dateFilter.type === "range" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Từ:</span>
                    <Input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => {
                        setDateFilter(prev => ({
                          ...prev,
                          startDate: e.target.value
                        }));
                      }}
                      className="w-40"
                    />
                    <span className="text-sm text-gray-600">Đến:</span>
                    <Input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => {
                        setDateFilter(prev => ({
                          ...prev,
                          endDate: e.target.value
                        }));
                      }}
                      className="w-40"
                    />
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFilter({
                        type: "day",
                        startDate: "",
                        endDate: "",
                        currentDate: new Date()
                      });
                    }}
                    className="text-xs"
                  >
                    Hôm nay
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastMonth = new Date();
                      lastMonth.setMonth(lastMonth.getMonth() - 1);
                      setDateFilter({
                        type: "month",
                        startDate: "",
                        endDate: "",
                        currentDate: lastMonth
                      });
                    }}
                    className="text-xs"
                  >
                    Tháng trước
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Tab */}
          {/**/}


          {/* Statistics Tab */}
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
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Doanh thu - {getFilterDisplayText()}
                  </CardTitle>
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
                  <CardTitle>
                    Lượt đặt theo giờ - {getFilterDisplayText()}
                  </CardTitle>
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

        </Tabs>
      </div>
    </div>
  );
}
