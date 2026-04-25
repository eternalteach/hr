import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { verifySession, COOKIE_NAME } from "@/lib/session";
import {
  isAttachmentOwnerType,
  listAttachments,
  saveAttachment,
  MAX_FILE_BYTES,
} from "@/lib/attachments/storage";
import { queryOne } from "@/db/helpers";
import type { AttachmentOwnerType } from "@/lib/types";

function parseOwnerType(raw: string | null): AttachmentOwnerType {
  if (!raw || !isAttachmentOwnerType(raw)) {
    throw new ApiError(400, "잘못된 owner_type");
  }
  return raw;
}

function parseOwnerId(raw: string | null): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 owner_id");
  return id;
}

/** owner가 실제로 존재하는지 검증 — 고아 첨부 방지 */
async function assertOwnerExists(ownerType: AttachmentOwnerType, ownerId: number) {
  const db = await getDb();
  if (ownerType === "board_post") {
    const row = await queryOne(db, "SELECT id FROM board_posts WHERE id = ?", [ownerId]);
    if (!row) throw new ApiError(404, "대상 게시글을 찾을 수 없습니다", "POST_NOT_FOUND");
  }
}

export const GET = withApiHandler(async (request: NextRequest) => {
  const url = new URL(request.url);
  const ownerType = parseOwnerType(url.searchParams.get("owner_type"));
  const ownerId = parseOwnerId(url.searchParams.get("owner_id"));
  const db = await getDb();
  return NextResponse.json(await listAttachments(db, ownerType, ownerId));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const form = await request.formData();
  const ownerType = parseOwnerType(form.get("owner_type") as string | null);
  const ownerId = parseOwnerId(form.get("owner_id") as string | null);

  await assertOwnerExists(ownerType, ownerId);

  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) throw new ApiError(400, "업로드할 파일이 없습니다", "NO_FILE");

  for (const f of files) {
    if (f.size === 0) throw new ApiError(400, `빈 파일: ${f.name}`);
    if (f.size > MAX_FILE_BYTES) {
      throw new ApiError(400, `파일이 너무 큽니다 (${f.name}) — 최대 ${MAX_FILE_BYTES / (1024 * 1024)}MB`, "FILE_TOO_LARGE");
    }
  }

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const uploadedBy = session?.sub ?? null;

  const db = await getDb();

  const saved = [];
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    saved.push(await saveAttachment(db, ownerType, ownerId, {
      name: f.name,
      type: f.type,
      bytes: buf,
    }, uploadedBy));
  }

  return NextResponse.json(saved, { status: 201 });
});
