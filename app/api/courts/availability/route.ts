import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

function isYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courtIdRaw = searchParams.get("courtId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!courtIdRaw || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Thiếu courtId hoặc startDate/endDate" },
        { status: 400 }
      );
    }
    if (!isYYYYMMDD(startDate) || !isYYYYMMDD(endDate)) {
      return NextResponse.json(
        { success: false, error: "Định dạng ngày phải là YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const courtId = Number(courtIdRaw);
    if (!Number.isInteger(courtId)) {
      return NextResponse.json(
        { success: false, error: "courtId phải là số nguyên" },
        { status: 400 }
      );
    }
    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: "endDate phải >= startDate" },
        { status: 400 }
      );
    }

    // Verify court
    const court = await query(
      "SELECT id FROM courts WHERE id = $1 AND is_active = true",
      [courtId]
    );
    if (!Array.isArray(court) || court.length === 0) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy sân" },
        { status: 404 }
      );
    }

    // Lấy booking theo khoảng ngày (INCLUSIVE).
    // NOTE: đổi tên cột nếu DB của bạn dùng camelCase (startTime/endTime).
    const rows = await query(
      `
      SELECT
        to_char(booking_date::date, 'YYYY-MM-DD') AS day,
        to_char(start_time, 'HH24:MI')            AS start_hhmm,
        to_char(end_time,   'HH24:MI')            AS end_hhmm
      FROM bookings
      WHERE court_id = $1
        AND booking_date::date >= $2::date
        AND booking_date::date <= $3::date
        AND status IN ('pending','confirmed')
      ORDER BY booking_date, start_time
      `,
      [courtId, startDate, endDate]
    );

    // Group dạng: { "2025-08-18": ["06:00|07:00", "09:00|10:00"] }
    const grouped: Record<string, string[]> = {};
    for (const r of rows as Array<{ day: string; start_hhmm: string; end_hhmm: string }>) {
      if (!grouped[r.day]) grouped[r.day] = [];
      grouped[r.day].push(`${r.start_hhmm}|${r.end_hhmm}`);
    }

    return NextResponse.json({ success: true, data: grouped });
  } catch (err) {
    console.error("Error availability:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi server" },
      { status: 500 }
    );
  }
}
