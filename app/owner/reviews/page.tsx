"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { formatRating } from "@/lib/utils";
import { Filter, RefreshCw, Search, Star } from "lucide-react";
import { useEffect, useState } from "react";

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

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterCourt, setFilterCourt] = useState("all");
  const [courts, setCourts] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchCourts();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/owner/reviews?limit=100", {
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
      setLoading(false);
    }
  };

  const fetchCourts = async () => {
    try {
      const response = await fetch("/api/owner/courts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setCourts(data.data);
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
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

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.court.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      filterRating === "all" || review.rating.toString() === filterRating;
    const matchesCourt =
      filterCourt === "all" || review.court.name === filterCourt;

    return matchesSearch && matchesRating && matchesCourt;
  });

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
    : "0.0";
  
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  if (!user || user.role !== "owner") {
    return null; // Layout will handle access control
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">⭐</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
            <p className="text-sm text-gray-600">
              Xem và quản lý đánh giá từ khách hàng
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng đánh giá</p>
                  <p className="text-2xl font-bold">{totalReviews}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đánh giá TB</p>
                  <p className="text-2xl font-bold">{averageRating}/5</p>
                </div>
                <div className="text-yellow-600 text-2xl">⭐</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">5 sao</p>
                  <p className="text-2xl font-bold">{ratingDistribution[5]}</p>
                </div>
                <div className="text-yellow-600 text-2xl">⭐⭐⭐⭐⭐</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">4 sao</p>
                  <p className="text-2xl font-bold">{ratingDistribution[4]}</p>
                </div>
                <div className="text-yellow-600 text-2xl">⭐⭐⭐⭐</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Bộ lọc</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tên khách hàng, sân, nội dung..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Đánh giá
                  </label>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả đánh giá</SelectItem>
                      <SelectItem value="5">5 sao</SelectItem>
                      <SelectItem value="4">4 sao</SelectItem>
                      <SelectItem value="3">3 sao</SelectItem>
                      <SelectItem value="2">2 sao</SelectItem>
                      <SelectItem value="1">1 sao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sân</label>
                  <Select value={filterCourt} onValueChange={setFilterCourt}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả sân</SelectItem>
                      {courts.map((court) => (
                        <SelectItem key={court.id} value={court.name}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={fetchReviews}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Phân bố đánh giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{rating} sao</span>
                      <div className="flex">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <Badge variant="secondary">{ratingDistribution[rating as keyof typeof ratingDistribution] || 0}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Danh sách đánh giá ({filteredReviews.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
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
                ) : filteredReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Không có đánh giá nào
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery || filterRating !== "all" || filterCourt !== "all"
                        ? "Thử thay đổi bộ lọc để xem kết quả khác"
                        : "Chưa có đánh giá nào cho sân của bạn"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 overflow-auto h-[calc(100vh-300px)]">
                    {filteredReviews.map((review) => (
                      <div key={review._id} className="flex space-x-4 p-4 border rounded-lg hover:bg-gray-50">
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
                              <h4 className="font-semibold text-gray-900">
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
          </div>
        </div>
      </div>
    </div>
  );
}
