import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import {
  deleteAttachment,
  getAttachment,
  readAttachmentBytes,
} from "@/lib/attachments/storage";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID");
  return id;
}

export const GET = withApiHandler(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  const db = await getDb();
  const att = await getAttachment(db, id);
  if (!att) throw new ApiError(404, "첨부파일을 찾을 수 없습니다");

  const bytes = readAttachmentBytes(att);
  // Node Buffer는 NextResponse BodyInit과 직접 호환되지 않고, Buffer.buffer 가 SharedArrayBuffer
  // 일 가능성을 TS가 배제하지 못해 Blob에 직접 못 넣는다. 새 ArrayBuffer로 복사한 뒤 감싼다.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab]);
  // RFC 5987 — 비ASCII 파일명은 filename* 로 인코딩
  const encoded = encodeURIComponent(att.filename);
  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": att.mime_type || "application/octet-stream",
      "Content-Length": String(att.size_bytes),
      "Content-Disposition": `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, max-age=0",
    },
  });
});

export const DELETE = withApiHandler(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  const db = await getDb();
  if (!await getAttachment(db, id)) throw new ApiError(404, "첨부파일을 찾을 수 없습니다");
  await deleteAttachment(db, id);
  return NextResponse.json({ ok: true });
});
