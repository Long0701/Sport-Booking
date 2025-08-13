// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { getStore, type Store } from "@netlify/blobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV !== "production";

function createBlobStore(): Store {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: "file-uploads", siteID, token });
  }
  return getStore("file-uploads");
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size must be < 5MB" }, { status: 400 });
    }

    const safeName = (file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${Date.now()}_${randomUUID()}_${safeName}`;

    if (isDev) {
      // DEV: lưu local
      const uploadsDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      const bytes = new Uint8Array(await file.arrayBuffer()); // ✅ KHÔNG dùng Buffer
      await writeFile(join(uploadsDir, key), bytes);

      return NextResponse.json({
        success: true,
        key,
        imageUrl: `/api/upload/${key}`,
        message: "Uploaded (dev → local folder)",
      });
    }

    // PROD: Netlify Blobs
    const store = createBlobStore();
    await store.set(key, file, {
      metadata: { contentType: file.type, originalName: safeName },
    });

    return NextResponse.json({
      success: true,
      key,
      imageUrl: `/api/upload/${key}`,
      message: "Uploaded (prod → Netlify Blobs)",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
