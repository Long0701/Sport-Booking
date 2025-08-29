"use client";

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
  Car,
  Clock,
  MapPin,
  Phone,
  ShowerHeadIcon as Shower,
  Star,
  Sun,
  Users,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./styles.css";
import AvailabilityCalendar from "@/components/shared/availability-calendar/index";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";

interface Court {
  _id: string;
  name: string;
  type: string;
  address: string;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  amenities: string[];
  phone: string;
  openTime: string; // "06:00:00"
  closeTime: string; // "22:00:00"
  owner: { name: string; phone: string };
  bookedSlots: string[];
}

type CourtEvent = {
  id: string;
  start: string;
  end: string;
  display: "background";
  classNames: string[];
  extendedProps: { status: "booked" };
};

type BookedByDate = Record<string, string[]>; // { "2025-08-18": ["08:00","08:30", ...] }

// ===== Helpers =====
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

// "HH:MM" -> tạo khoảng [start, end) theo 60'
function toRange(dateStr: string, hhmm: string, defaultMin = 60) {
  const [h, m] = hhmm.split(":").map(Number);
  const start = new Date(
    `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
  );
  const end = new Date(start.getTime() + defaultMin * 60 * 1000);
  return { start, end };
}

// Call API theo khoảng ngày (có thể truyền subCourtId)
async function fetchAvailabilityRange(
  courtId: string,
  startDate: string,
  endDate: string
): Promise<BookedByDate> {
  const q = new URLSearchParams({ courtId, startDate, endDate });
  const res = await fetch(`/api/courts/availability?${q.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    // giúp debug nhanh khi 404/500
    const txt = await res.text().catch(() => "");
    throw new Error(`Availability ${res.status}: ${txt || res.statusText}`);
  }
  const data = await res.json();
  if (!data?.success)
    throw new Error(data?.error || "Fetch availability failed");
  return data.data as BookedByDate;
}

export default function CourtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [court, setCourt] = useState<Court | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selStart, setSelStart] = useState<Date | null>(null);
  const [selEnd, setSelEnd] = useState<Date | null>(null);

  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { user } = useAuth();

  // NEW: visible range & availability state

  const [bookedByDate, setBookedByDate] = useState<BookedByDate>({});
  const [availLoading, setAvailLoading] = useState(false);

  // Nhớ khoảng đã fetch lần gần nhất để tránh fetch lặp
  const lastRangeRef = useRef<{
    courtId: string;
    start: string;
    end: string;
    sub?: string;
  } | null>(null);

  // ===== Initial fetches =====
  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courts/${params.id}`);
        const data = await res.json();
        if (data.success) setCourt(data.data);
        else console.error("Court not found");
      } catch (error) {
        console.error("Error fetching court:", error);
      } finally {
        setLoading(false);
      }
    })();

    (async () => {
      try {
        const lat = 10.7769,
          lon = 106.7009;
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        if (data.success) setWeather(data.data);
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    })();

    (async () => {
      try {
        setReviewsLoading(true);
        const res = await fetch(`/api/courts/${params.id}/reviews`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data);
          setTotalReviews(data.pagination.total);
        } else {
          console.error("Error fetching reviews:", data.error);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [params.id]);

  // ===== UI helpers =====
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi miễn phí":
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "chỗ đậu xe":
      case "parking":
        return <Car className="h-4 w-4" />;
      case "vòi sen":
      case "shower":
        return <Shower className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getSportTypeInVietnamese = (type: string) => {
    const sportMap: Record<string, string> = {
      football: "Bóng đá mini",
      badminton: "Cầu lông",
      tennis: "Tennis",
      basketball: "Bóng rổ",
      volleyball: "Bóng chuyền",
      pickleball: "Pickleball",
    };
    return sportMap[type] || type;
  };

  const slotMinTime = court?.openTime || "06:00:00";
  const slotMaxTime = court?.closeTime || "22:00:00";

  const formatTime = (d?: Date | null) =>
    d
      ? `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes()
        ).padStart(2, "0")}:00`
      : "";

  const hoursSelected = useMemo(() => {
    if (!selStart || !selEnd) return 0;
    return (selEnd.getTime() - selStart.getTime()) / 3_600_000;
  }, [selStart, selEnd]);

  const totalPrice = useMemo(() => {
    if (!court) return 0;
    return Math.max(0, hoursSelected) * court.pricePerHour;
  }, [hoursSelected, court]);

  const handleBooking = async () => {
    if (!selStart || !selEnd) return alert("Vui lòng chọn khoảng thời gian");
    const userId = user?.id;
    const d = selStart;
    const selectedDateStr = ymd(d);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          courtId: court?._id,
          date: selectedDateStr,
          startTime: formatTime(selStart),
          endTime: formatTime(selEnd),
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Đặt sân thành công!");
        router.push("/bookings");
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Có lỗi xảy ra khi đặt sân");
    }
  };

  const handleSelect = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setSelStart(start);
      setSelEnd(end);
      setSelectedDate(start);
    },
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy sân</h1>
          <Link href="/search">
            <Button>Quay lại tìm kiếm</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* HERO */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">{court.name}</h1>
                <Badge>{getSportTypeInVietnamese(court.type)}</Badge>
              </div>
              <div className="mt-2 flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="truncate">{court.address}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {court.openTime} - {court.closeTime}
                  </span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{court.phone}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center justify-end gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold">{court.rating}</span>
                <span className="text-gray-600">
                  ({court.reviewCount} đánh giá)
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-green-600">
                {court.pricePerHour.toLocaleString("vi-VN")}đ/giờ
              </div>
            </div>
          </div>

          {!!court.images?.length && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {court.images.map((src, i) => (
                <img
                  key={i}
                  src={
                    src ||
                    "/placeholder.svg?height=200&width=300&query=sports court"
                  }
                  alt={`${court.name} ${i + 1}`}
                  className="w-full aspect-[4/3] object-cover rounded-xl"
                />
              ))}
            </div>
          )}
        </section>

        {/* Tabs */}
        <Tabs defaultValue="booking" className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm sticky top-16 z-10">
            <TabsList className="w-full grid grid-cols-4 rounded-xl">
              <TabsTrigger value="booking">Đặt sân</TabsTrigger>
              <TabsTrigger value="info">Thông tin</TabsTrigger>
              <TabsTrigger value="weather">Thời tiết</TabsTrigger>
              <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            </TabsList>
          </div>

          {/* Booking tab */}
          <TabsContent value="booking">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">Lịch đặt sân</CardTitle>
                  <CardDescription>
                    Chọn khoảng thời gian trống để đặt nhanh
                  </CardDescription>
                </CardHeader>

                {/* Legend + selection summary */}
                <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-500" />{" "}
                      Đã đặt
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-500" />{" "}
                      Quá thời gian
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />{" "}
                      Có thể chọn
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-3">
                    <span className="hidden sm:inline">
                      Bấm/Kéo để chọn khoảng
                    </span>
                    {selStart && selEnd && (
                      <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                        {selectedDate.toLocaleDateString("vi-VN")} —{" "}
                        {formatTime(selStart).slice(0, 5)}–
                        {formatTime(selEnd).slice(0, 5)}
                      </span>
                    )}
                  </div>
                </div>

                <CardContent className="p-3">
                  {availLoading && (
                    <div className="px-1 pb-2 text-xs text-gray-500">
                      Đang tải lịch trống…
                    </div>
                  )}
                  <AvailabilityCalendar
                    courtId={String(court._id)}
                    openTime={slotMinTime}
                    closeTime={slotMaxTime}
                    slotMinutes={60}
                    onSelect={handleSelect}
                    onLoadingChange={setAvailLoading}
                  />
                </CardContent>
              </Card>

              {/* Sidebar */}
              <Card className="h-fit lg:sticky lg:top-20">
                <CardHeader>
                  <CardTitle>Đặt sân</CardTitle>
                  <CardDescription>
                    Chọn khoảng trên lịch → Xác nhận
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border p-4 bg-white">
                    <div className="flex justify-between text-sm">
                      <span>Ngày</span>
                      <span className="font-medium">
                        {selStart ? selStart.toLocaleDateString("vi-VN") : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span>Khung giờ</span>
                      <span className="font-medium">
                        {selStart && selEnd
                          ? `${formatTime(selStart).slice(0, 5)} – ${formatTime(
                              selEnd
                            ).slice(0, 5)}`
                          : "—"}
                      </span>
                    </div>
                    {hoursSelected > 0 && (
                      <>
                        <div className="flex justify-between text-sm mt-2">
                          <span>Số giờ</span>
                          <span className="font-medium">{hoursSelected}</span>
                        </div>
                        <div className="flex justify-between mt-3 pt-3 border-t">
                          <span className="text-sm">Tổng tiền</span>
                          <span className="text-lg font-bold text-green-600">
                            {totalPrice.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleBooking}
                    disabled={!selStart || !selEnd}
                  >
                    Đặt sân ngay
                  </Button>

                  <p className="text-xs text-gray-500">
                    * Chuyển view Ngày/Tuần/Danh sách ở thanh trên lịch.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Mobile CTA */}
            {selStart && selEnd && (
              <div className="fixed bottom-4 inset-x-4 lg:hidden">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 shadow-lg"
                  onClick={handleBooking}
                >
                  {selStart.toLocaleDateString("vi-VN")} •{" "}
                  {formatTime(selStart).slice(0, 5)}–
                  {formatTime(selEnd).slice(0, 5)} •{" "}
                  {totalPrice.toLocaleString("vi-VN")}đ
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Info */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Mô tả</h3>
                  <p className="text-gray-600 leading-7">{court.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Tiện ích</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {court.amenities.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {getAmenityIcon(a)} <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weather */}
          <TabsContent value="weather">
            <Card>
              <CardHeader>
                <CardTitle>Thời tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weather ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">
                        Hiện tại: {weather.current.temp}°C –{" "}
                        {weather.current.condition}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {weather.forecast.map((item: any, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="p-4 text-center">
                            <div className="font-semibold">{item.time}</div>
                            <div className="text-2xl my-2">
                              {item.condition.includes("nắng")
                                ? "☀️"
                                : item.condition.includes("mưa")
                                ? "🌧️"
                                : "☁️"}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.temp}°C
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.condition}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    Đang tải thông tin thời tiết…
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá</CardTitle>
                <CardDescription>Tổng: {totalReviews}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewsLoading ? (
                  <div className="text-center text-gray-500">
                    Đang tải đánh giá…
                  </div>
                ) : reviews.length ? (
                  reviews.map((rv) => (
                    <Card key={rv._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{rv.user.name}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{rv.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">{rv.comment}</p>
                        <span className="text-sm text-gray-500">
                          {new Date(rv.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    Chưa có đánh giá nào
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}


