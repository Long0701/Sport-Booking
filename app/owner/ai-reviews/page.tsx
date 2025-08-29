"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Bot, Brain, Eye, EyeOff, RefreshCw, Search, Shield, Star, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
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
  sentimentScore?: number;
  sentimentLabel?: 'positive' | 'negative' | 'neutral';
  status?: 'visible' | 'hidden' | 'pending_review';
  aiFlagged?: boolean;
  adminReviewed?: boolean;
  adminNotes?: string;
  hiddenBy?: string;
  hiddenAt?: string;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  visibleReviews: number;
  hiddenReviews: number;
  pendingReviews: number;
  aiFlaggedReviews: number;
  negativeReviews: number;
  needsReview: number;
}

export default function AIReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [flaggedFilter, setFlaggedFilter] = useState("all");
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "owner") {
      fetchReviews();
    }
  }, [user, statusFilter, sentimentFilter, flaggedFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        sentiment: sentimentFilter,
        flagged: flaggedFilter,
        limit: '50'
      });

      const response = await fetch(`/api/admin/reviews?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setReviews(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching AI reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: string, notes?: string) => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          reviewId,
          status,
          adminNotes: notes,
        }),
      });

      if (response.ok) {
        fetchReviews();
        setEditingReview(null);
        setAdminNotes("");
      }
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  const reanalyzeSentiment = async (reviewId: string) => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          action: "reanalyze_sentiment",
          reviewId,
        }),
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error("Error reanalyzing sentiment:", error);
    }
  };

  const bulkUpdateReviews = async (status: string) => {
    if (selectedReviews.length === 0) return;

    try {
      setBulkActionLoading(true);
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          action: "bulk_update",
          reviewIds: selectedReviews,
          status,
          adminNotes: `Bulk action: ${status} by AI review system`,
        }),
      });

      if (response.ok) {
        setSelectedReviews([]);
        fetchReviews();
      }
    } catch (error) {
      console.error("Error bulk updating reviews:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getSentimentIcon = (label?: string, score?: number) => {
    if (label === 'positive') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (label === 'negative') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <span className="h-4 w-4 text-gray-600">-</span>;
  };

  const getSentimentBadge = (label?: string, score?: number) => {
    if (!label) return null;
    
    const color = label === 'positive' ? 'bg-green-100 text-green-800' :
                  label === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={color}>
        {label} {score ? `(${(score * 100).toFixed(0)}%)` : ''}
      </Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'visible') return null;
    
    switch (status) {
      case 'hidden':
        return <Badge className="bg-red-100 text-red-800">Ẩn</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReviews = reviews.filter(review =>
    review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.court.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user?.role !== "owner") {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Review Management</h1>
          </div>
          <p className="text-gray-600">Quản lý đánh giá với AI sentiment analysis</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalReviews}</div>
                  <div className="text-xs text-gray-600">Tổng reviews</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.visibleReviews}</div>
                  <div className="text-xs text-gray-600">Hiển thị</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.hiddenReviews}</div>
                  <div className="text-xs text-gray-600">Ẩn</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
                  <div className="text-xs text-gray-600">Chờ duyệt</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.aiFlaggedReviews}</div>
                  <div className="text-xs text-gray-600">AI flagged</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.negativeReviews}</div>
                  <div className="text-xs text-gray-600">Tiêu cực</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.needsReview}</div>
                  <div className="text-xs text-gray-600">Cần duyệt</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="visible">Hiển thị</SelectItem>
                    <SelectItem value="hidden">Ẩn</SelectItem>
                    <SelectItem value="pending_review">Chờ duyệt</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sentiment</SelectItem>
                    <SelectItem value="positive">Tích cực</SelectItem>
                    <SelectItem value="negative">Tiêu cực</SelectItem>
                    <SelectItem value="neutral">Trung tính</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">AI Flag</SelectItem>
                    <SelectItem value="true">Flagged</SelectItem>
                    <SelectItem value="false">Not Flagged</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={fetchReviews} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedReviews.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-600 py-2">
                    {selectedReviews.length} selected
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Hiển thị
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hiển thị reviews</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn hiển thị {selectedReviews.length} reviews đã chọn?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => bulkUpdateReviews('visible')}>
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <EyeOff className="h-4 w-4 mr-1" />
                        Ẩn
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ẩn reviews</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn ẩn {selectedReviews.length} reviews đã chọn?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => bulkUpdateReviews('hidden')}>
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Đang tải...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">Không có reviews nào</p>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review._id} className={`${review.aiFlagged ? 'border-orange-200 bg-orange-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReviews([...selectedReviews, review._id]);
                          } else {
                            setSelectedReviews(selectedReviews.filter(id => id !== review._id));
                          }
                        }}
                        className="mt-1"
                      />

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{review.user.name}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{review.rating}</span>
                          </div>
                          {review.aiFlagged && (
                            <div title="AI Flagged">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            </div>
                          )}
                        </div>

                        <p className="text-gray-700 mb-2">{review.comment}</p>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <span>{review.court.name}</span>
                          <span>•</span>
                          <span>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>

                        {/* Sentiment Analysis */}
                        <div className="flex items-center gap-2 mb-2">
                          {getSentimentIcon(review.sentimentLabel, review.sentimentScore)}
                          {getSentimentBadge(review.sentimentLabel, review.sentimentScore)}
                          {getStatusBadge(review.status)}
                          {(!review.sentimentLabel || !review.status) && (
                            <Badge className="bg-blue-100 text-blue-800">Legacy</Badge>
                          )}
                        </div>

                        {/* Admin Notes */}
                        {review.adminNotes && (
                          <div className="bg-blue-50 p-2 rounded text-sm text-blue-800 mb-2">
                            <strong>Admin Notes:</strong> {review.adminNotes}
                          </div>
                        )}

                        {review.hiddenBy && (
                          <div className="text-xs text-gray-500">
                            Ẩn bởi: {review.hiddenBy} • {new Date(review.hiddenAt!).toLocaleDateString("vi-VN")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {review.sentimentLabel && (
                        <div title="Re-analyze sentiment">
                          <Button
                            onClick={() => reanalyzeSentiment(review._id)}
                            size="sm"
                            variant="outline"
                          >
                            <Brain className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              setEditingReview(review);
                              setAdminNotes(review.adminNotes || "");
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Quản lý Review</DialogTitle>
                            <DialogDescription>
                              Thay đổi trạng thái và thêm ghi chú cho review này
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Trạng thái</Label>
                              <Select
                                value={editingReview?.status}
                                onValueChange={(value) => {
                                  if (editingReview) {
                                    setEditingReview({ ...editingReview, status: value as any });
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="visible">Hiển thị</SelectItem>
                                  <SelectItem value="hidden">Ẩn</SelectItem>
                                  <SelectItem value="pending_review">Chờ duyệt</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Ghi chú admin</Label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Thêm ghi chú về quyết định này..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                if (editingReview) {
                                  updateReviewStatus(editingReview._id, editingReview.status, adminNotes);
                                }
                              }}
                            >
                              Cập nhật
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {review.status === 'visible' ? (
                        <Button
                          onClick={() => updateReviewStatus(review._id, 'hidden')}
                          size="sm"
                          variant="outline"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => updateReviewStatus(review._id, 'visible')}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
