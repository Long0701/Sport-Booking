"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import viLocale from "@fullcalendar/core/locales/vi";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

import "./styles.css";

type BookedByDate = Record<string, string[]>; // { "YYYY-MM-DD": ["08:00","09:30", ...] }

type CourtEvent = {
  id: string;
  start: string;
  end: string;
  display: "background";
  classNames: string[];
  extendedProps: { status: "booked" | "past" };
};

export type AvailabilityCalendarProps = {
  courtId: string;
  openTime?: string;   // "06:00:00"
  closeTime?: string;  // "22:00:00"
  slotMinutes?: number; // default 30
  // callback khi user chọn khoảng
  onSelect?: (payload: { start: Date; end: Date }) => void;
  // optional: hiển thị spinner/notice khi loading
  onLoadingChange?: (loading: boolean) => void;
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function toRange(dateStr: string, hhmm: string, durationMin = 60) {
  const [h, m] = hhmm.split(":").map(Number);
  const start = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return { start, end };
}

async function fetchAvailabilityRange(
  courtId: string,
  startDate: string,
  endDate: string
): Promise<BookedByDate> {
  const q = new URLSearchParams({ courtId, startDate, endDate });
  const res = await fetch(`/api/courts/availability?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Availability ${res.status}: ${txt || res.statusText}`);
  }
  const data = await res.json();
  if (!data?.success) throw new Error(data?.error || "Fetch availability failed");
  return data.data as BookedByDate;
}

export default function AvailabilityCalendar({
  courtId,
  openTime = "06:00:00",
  closeTime = "22:00:00",
  slotMinutes = 60,
  onSelect,
  onLoadingChange,
}: AvailabilityCalendarProps) {
  // range được set bởi datesSet; khởi tạo null để **không fetch** trước khi FC ready
  const [visibleStart, setVisibleStart] = useState<Date | null>(null);
  const [visibleEnd, setVisibleEnd] = useState<Date | null>(null);
  const [bookedByDate, setBookedByDate] = useState<BookedByDate>({});
  const [loading, setLoading] = useState(false);

  // ghi nhớ lần fetch gần nhất để **chặn gọi trùng**
  const lastRangeRef = useRef<{ courtId: string; start: string; end: string } | null>(null);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // chỉ set state khi range thực sự thay đổi (tránh re-render dư)
  const onDatesSet = useCallback((arg: any) => {
    const nextStart: Date = arg.start;
    const nextEndInclusive = new Date(arg.end.getTime() - 24 * 60 * 60 * 1000); // arg.end exclusive

    setVisibleStart((prev) => (prev?.getTime() !== nextStart.getTime() ? nextStart : prev));
    setVisibleEnd((prev) =>
      prev?.getTime() !== nextEndInclusive.getTime() ? nextEndInclusive : prev
    );
  }, []);

  // fetch availability đúng 1 lần / range
  useEffect(() => {
    if (!courtId || !visibleStart || !visibleEnd) return;

    const start = ymd(visibleStart);
    const end = ymd(visibleEnd);

    const sameAsLast =
      lastRangeRef.current &&
      lastRangeRef.current.courtId === courtId &&
      lastRangeRef.current.start === start &&
      lastRangeRef.current.end === end;

    if (sameAsLast) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const grouped = await fetchAvailabilityRange(courtId, start, end);
        if (!cancelled) {
          setBookedByDate(grouped);
          lastRangeRef.current = { courtId, start, end };
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courtId, visibleStart, visibleEnd]);

  // check overlap khi user select
  const isRangeAvailable = useCallback(
    (start: Date, end: Date) => {
      const dateStr = ymd(start);
      const daySlots = bookedByDate[dateStr] || [];
      const ranges = daySlots.map((s) => {
        if (s.includes("|")) {
          const [a, b] = s.split("|");
          const st = new Date(`${dateStr}T${a}:00`);
          const en = new Date(`${dateStr}T${b}:00`);
          return { start: st, end: en };
        } else {
          // fallback legacy: 60'
          const st = new Date(`${dateStr}T${s}:00`);
          const en = new Date(st.getTime() + 60 * 60 * 1000);
          return { start: st, end: en };
        }
      });
      return !ranges.some((r) => !(end <= r.start || start >= r.end));
    },
    [bookedByDate]
  );

  const onSelectSlot = useCallback(
    (arg: any) => {
      const { start, end } = arg;
      const now = new Date();
      if (start < now) return;
      if (!isRangeAvailable(start, end)) return;
      onSelect?.({ start, end });
    },
    [isRangeAvailable, onSelect]
  );

  // render background events
  const bookedEvents = useMemo(() => {
    const events: CourtEvent[] = [];
    const now = new Date();
    
    // Tạo events cho slots đã đặt
    Object.entries(bookedByDate).forEach(([dateStr, slots]) => {
      slots.forEach((s, idx) => {
        let st: Date, en: Date;
        if (s.includes("|")) {
          const [a, b] = s.split("|");
          st = new Date(`${dateStr}T${a}:00`);
          en = new Date(`${dateStr}T${b}:00`);
        } else {
          st = new Date(`${dateStr}T${s}:00`);
          en = new Date(st.getTime() + 60 * 60 * 1000);
        }
        
        // Xác định class dựa trên thời gian
        const isPast = en <= now;
        const className = isPast ? "booking-past" : "booking-busy";
        const status = isPast ? "past" : "booked";
        
        events.push({
          id: `booked-${dateStr}-${idx}`,
          start: st.toISOString(),
          end: en.toISOString(),
          display: "background",
          classNames: [className],
          extendedProps: { status },
        });
      });
    });

    // Tạo background xám cho tất cả slot quá thời gian
    if (visibleStart && visibleEnd) {
      for (let d = new Date(visibleStart); d <= visibleEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = ymd(d);
        const dayStart = new Date(`${dateStr}T${openTime}`);
        const dayEnd = new Date(`${dateStr}T${closeTime}`);
        
        // Nếu ngày này có phần quá thời gian hiện tại
        if (dayStart < now && dayEnd > dayStart) {
          const pastEnd = now < dayEnd ? now : dayEnd;
          
          events.push({
            id: `past-background-${dateStr}`,
            start: dayStart.toISOString(),
            end: pastEnd.toISOString(),
            display: "background",
            classNames: ["slot-past"],
            extendedProps: { status: "past" },
          });
        }
      }
    }
    
    return events;
  }, [bookedByDate, visibleStart, visibleEnd, openTime, closeTime, slotMinutes]);

  return (
    <div className="[&_.fc]:text-sm [&_.fc-toolbar-title]:text-base">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        locales={[viLocale]}
        locale="vi"
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek",
        }}
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        slotDuration={{ minutes: slotMinutes }}
        slotMinTime={openTime}
        slotMaxTime={closeTime}
        scrollTime="17:00:00"
        allDaySlot={false}
        unselectAuto={false}   
        selectable
        selectMirror
        nowIndicator
        stickyHeaderDates
        selectOverlap={false}
        eventOverlap={false}
        datesSet={onDatesSet} // <-- chỉ khi FC set range mới fetch
        selectAllow={(s) => s.start >= new Date() && isRangeAvailable(s.start, s.end)}
        events={bookedEvents}
        eventContent={() => ({ domNodes: [] })} // background only
        select={onSelectSlot}
        height="auto"
        expandRows
      />
    </div>
  );
}
