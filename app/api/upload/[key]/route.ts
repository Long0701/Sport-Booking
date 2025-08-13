// app/api/upload/[key]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import { join } from "path";
import { getStore } from "@netlify/blobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV !== "production";

// Đoán content-type theo phần mở rộng (đủ dùng cho ảnh)
function getContentTypeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png":  return "image/png";
    case "webp": return "image/webp";
    case "gif":  return "image/gif";
    case "svg":  return "image/svg+xml";
    case "avif": return "image/avif";
    case "bmp":  return "image/bmp";
    case "tif":
    case "tiff": return "image/tiff";
    case "ico":  return "image/x-icon";
    case "heic": return "image/heic";
    case "heif": return "image/heif";
    default:     return "application/octet-stream";
  }
}

// Cho phép cấu hình thủ công khi chạy local giả lập prod
function createBlobStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NEXT_NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: "file-uploads", siteID, token });
  }
  return getStore("file-uploads");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } }
) {
  const { key } = params;

  if (isDev) {
    // ===== DEV: đọc file từ public/uploads và trả về ArrayBuffer =====
    const fullPath = join(process.cwd(), "public", "uploads", key);
    try {
      await stat(fullPath); // throw nếu không tồn tại
      const nodeBuf = await readFile(fullPath); // Node Buffer

      // Cắt đúng phần ArrayBuffer (tránh dùng .buffer trực tiếp)
      const ab = nodeBuf.buffer.slice(
        nodeBuf.byteOffset,
        nodeBuf.byteOffset + nodeBuf.byteLength
      ) as ArrayBuffer;

      const contentType = getContentTypeFromKey(key);

      return new NextResponse(ab, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  // ===== PROD: stream từ Netlify Blobs (đã là ArrayBuffer) =====
  const store = createBlobStore();
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data, metadata } = result; // data: ArrayBuffer
  const contentType =
    (metadata as Record<string, unknown>)?.contentType as string | undefined
    ?? "application/octet-stream";

  return new NextResponse(data as ArrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
