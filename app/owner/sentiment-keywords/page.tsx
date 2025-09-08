"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, Edit, Trash2, Download, Upload, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface SentimentKeyword {
  id: number;
  keyword: string;
  type: 'positive' | 'negative' | 'strong_negative';
  weight: number;
  language: string;
  isActive: boolean;
  categoryId?: number;
  categoryName?: string;
  categoryColor?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface SentimentCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  keywordCount: number;
  activeKeywordCount: number;
  createdAt: string;
}

interface KeywordStats {
  positive: number;
  negative: number;
  strong_negative: number;
  total_active: number;
}

export default function SentimentKeywordsPage() {
  const [keywords, setKeywords] = useState<SentimentKeyword[]>([]);
  const [categories, setCategories] = useState<SentimentCategory[]>([]);
  const [stats, setStats] = useState<KeywordStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [editingKeyword, setEditingKeyword] = useState<SentimentKeyword | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState({
    keyword: "",
    type: "positive" as const,
    weight: 1.0,
    categoryId: undefined as number | undefined
  });
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "owner") {
      fetchKeywords();
      fetchCategories();
    }
  }, [user, typeFilter, categoryFilter, activeFilter]);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: typeFilter,
        category: categoryFilter,
        active: activeFilter,
        search: searchQuery,
        limit: '100'
      });

      const response = await fetch(`/api/admin/sentiment-keywords?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setKeywords(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching keywords:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/sentiment-categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const addKeyword = async () => {
    try {
      const response = await fetch("/api/admin/sentiment-keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newKeyword),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setNewKeyword({
          keyword: "",
          type: "positive",
          weight: 1.0,
          categoryId: undefined
        });
        fetchKeywords();
      }
    } catch (error) {
      console.error("Error adding keyword:", error);
    }
  };

  const updateKeyword = async (id: number, updates: Partial<SentimentKeyword>) => {
    try {
      const response = await fetch("/api/admin/sentiment-keywords", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        setEditingKeyword(null);
        fetchKeywords();
      }
    } catch (error) {
      console.error("Error updating keyword:", error);
    }
  };

  const deleteKeyword = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/sentiment-keywords?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        fetchKeywords();
      }
    } catch (error) {
      console.error("Error deleting keyword:", error);
    }
  };

  const bulkAction = async (action: string, data?: any) => {
    if (selectedKeywords.length === 0) return;

    try {
      setBulkActionLoading(true);
      const response = await fetch("/api/admin/sentiment-keywords/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          action,
          ids: selectedKeywords.map(String),
          data
        }),
      });

      if (response.ok) {
        setSelectedKeywords([]);
        fetchKeywords();
      }
    } catch (error) {
      console.error("Error in bulk action:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportKeywords = async () => {
    try {
      const response = await fetch("/api/admin/sentiment-keywords/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          action: "export_keywords",
          data: {
            filters: { type: typeFilter, active: activeFilter }
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'sentiment_keywords.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting keywords:", error);
    }
  };

  const reseedAllKeywords = async () => {
    try {
      setBulkActionLoading(true);
      const response = await fetch("/api/admin/sentiment-keywords/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          action: "reseed_all_keywords"
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        fetchKeywords(); // Refresh the list
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error reseeding keywords:", error);
      alert("❌ Lỗi khi reseed keywords");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'strong_negative':
        return <AlertTriangle className="h-4 w-4 text-red-700" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      positive: { color: 'bg-green-100 text-green-800', label: 'Tích cực' },
      negative: { color: 'bg-red-100 text-red-800', label: 'Tiêu cực' },
      strong_negative: { color: 'bg-red-200 text-red-900', label: 'Rất tiêu cực' }
    };
    
    const { color, label } = config[type as keyof typeof config] || { color: 'bg-gray-100 text-gray-800', label: type };
    
    return <Badge className={color}>{label}</Badge>;
  };

  const filteredKeywords = keywords.filter(keyword =>
    keyword.keyword.toLowerCase().includes(searchQuery.toLowerCase())
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
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🔤</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý từ khóa Sentiment</h1>
          </div>
          <p className="text-gray-600">Quản lý từ khóa tích cực và tiêu cực cho hệ thống phân tích sentiment AI</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total_active}</div>
                  <div className="text-xs text-gray-600">Tổng keywords</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
                  <div className="text-xs text-gray-600">Tích cực</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
                  <div className="text-xs text-gray-600">Tiêu cực</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-700">{stats.strong_negative}</div>
                  <div className="text-xs text-gray-600">Rất tiêu cực</div>
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
                    placeholder="Tìm kiếm keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="positive">Tích cực</SelectItem>
                    <SelectItem value="negative">Tiêu cực</SelectItem>
                    <SelectItem value="strong_negative">Rất tiêu cực</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Vô hiệu</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={fetchKeywords} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm keyword
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Thêm keyword mới</DialogTitle>
                      <DialogDescription>
                        Thêm từ khóa để cải thiện độ chính xác của sentiment analysis
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Keyword</Label>
                        <Input
                          value={newKeyword.keyword}
                          onChange={(e) => setNewKeyword(prev => ({ ...prev, keyword: e.target.value }))}
                          placeholder="Nhập từ khóa..."
                        />
                      </div>
                      <div>
                        <Label>Loại</Label>
                        <Select
                          value={newKeyword.type}
                          onValueChange={(value: any) => setNewKeyword(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="positive">Tích cực</SelectItem>
                            <SelectItem value="negative">Tiêu cực</SelectItem>
                            <SelectItem value="strong_negative">Rất tiêu cực</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Trọng số (0.1 - 2.0)</Label>
                        <Input
                          type="number"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={newKeyword.weight}
                          onChange={(e) => setNewKeyword(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label>Danh mục</Label>
                        <Select
                          value={newKeyword.categoryId?.toString() || ""}
                          onValueChange={(value) => setNewKeyword(prev => ({ ...prev, categoryId: value ? parseInt(value) : undefined }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addKeyword}>Thêm keyword</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={bulkActionLoading}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Seed Keywords Lại
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>🔄 Seed Keywords Lại</AlertDialogTitle>
                      <AlertDialogDescription>
                        ⚠️ CẢNH BÁO: Điều này sẽ XÓA TẤT CẢ keywords hiện tại và seed lại từ đầu với bộ dữ liệu mặc định (~242 keywords). Hành động này không thể hoàn tác!
                        <br/><br/>
                        <strong>Chỉ nên dùng khi muốn reset hoàn toàn hệ thống keywords về trạng thái mặc định.</strong>
                        <br/><br/>
                        📊 Sẽ seed:
                        <br/>• 88 từ khóa tích cực
                        <br/>• 86 từ khóa tiêu cực  
                        <br/>• 68 từ khóa rất tiêu cực
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={bulkActionLoading}>Hủy</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={reseedAllKeywords}
                        disabled={bulkActionLoading}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {bulkActionLoading ? "Đang reseed..." : "Xóa và Seed Lại"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button onClick={exportKeywords} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedKeywords.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600">
                    {selectedKeywords.length} đã chọn
                  </span>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Kích hoạt
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kích hoạt keywords</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn kích hoạt {selectedKeywords.length} keywords đã chọn?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => bulkAction('bulk_activate')}>
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <EyeOff className="h-4 w-4 mr-1" />
                        Vô hiệu
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Vô hiệu hóa keywords</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn vô hiệu hóa {selectedKeywords.length} keywords đã chọn?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => bulkAction('bulk_deactivate')}>
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xóa keywords</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn xóa {selectedKeywords.length} keywords đã chọn? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => bulkAction('bulk_delete')}>
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Keywords List */}
        <Card>
          <CardHeader>
            <CardTitle>Keywords ({filteredKeywords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Đang tải...</p>
              </div>
            ) : filteredKeywords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Không có keywords nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredKeywords.map((keyword) => (
                  <div key={keyword.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedKeywords.includes(keyword.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedKeywords([...selectedKeywords, keyword.id]);
                          } else {
                            setSelectedKeywords(selectedKeywords.filter(id => id !== keyword.id));
                          }
                        }}
                      />
                      
                      <div className="flex items-center gap-2">
                        {getTypeIcon(keyword.type)}
                        <span className="font-medium">{keyword.keyword}</span>
                        {getTypeBadge(keyword.type)}
                      </div>
                      
                      <Badge variant="secondary">Weight: {keyword.weight}</Badge>
                      
                      {keyword.categoryName && (
                        <Badge 
                          className="text-xs"
                          style={{ backgroundColor: keyword.categoryColor + '20', color: keyword.categoryColor }}
                        >
                          {keyword.categoryName}
                        </Badge>
                      )}
                      
                      {!keyword.isActive && (
                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                          Vô hiệu
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setEditingKeyword(keyword)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa keyword</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa keyword "{keyword.keyword}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteKeyword(keyword.id)}>
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        {editingKeyword && (
          <Dialog open={!!editingKeyword} onOpenChange={() => setEditingKeyword(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa keyword</DialogTitle>
                <DialogDescription>
                  Cập nhật thông tin keyword
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Keyword</Label>
                  <Input
                    value={editingKeyword.keyword}
                    onChange={(e) => setEditingKeyword(prev => ({ ...prev!, keyword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Loại</Label>
                  <Select
                    value={editingKeyword.type}
                    onValueChange={(value: any) => setEditingKeyword(prev => ({ ...prev!, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Tích cực</SelectItem>
                      <SelectItem value="negative">Tiêu cực</SelectItem>
                      <SelectItem value="strong_negative">Rất tiêu cực</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trọng số</Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={editingKeyword.weight}
                    onChange={(e) => setEditingKeyword(prev => ({ ...prev!, weight: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editingKeyword.isActive}
                    onChange={(e) => setEditingKeyword(prev => ({ ...prev!, isActive: e.target.checked }))}
                  />
                  <Label htmlFor="active">Hoạt động</Label>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => updateKeyword(editingKeyword.id, {
                    keyword: editingKeyword.keyword,
                    type: editingKeyword.type,
                    weight: editingKeyword.weight,
                    isActive: editingKeyword.isActive
                  })}
                >
                  Cập nhật
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
