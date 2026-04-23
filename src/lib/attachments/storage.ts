/**
 * 범용 첨부파일 저장 모듈.
 *
 * - 메타데이터: SQLite `attachments` 테이블
 * - 바이너리: `db/uploads/<owner_type>/<owner_id>/<id>__<safe_name>`
 *   (`/db/`는 .gitignore — 런타임 데이터로 취급)
 *
 * 새 도메인에 적용하는 방법:
 *   1. types.ts `AttachmentOwnerType`에 리터럴 추가
 *   2. owner 삭제 라우트에서 `deleteAllForOwner(type, id)` 호출 — 고아 파일 방지
 *   3. UI에선 `<AttachmentList ownerType="..." ownerId={id} canEdit={...} />`
 */

import fs from "fs";
import path from "path";
import type { Database as SqlJsDatabase } from "sql.js";
import { queryAll, queryOne, insertAndGetId } from "@/db/helpers";
import { saveDb } from "@/db";
import type { Attachment, AttachmentOwnerType } from "@/lib/types";

/** 1파일 최대 20MB — 회의 자료/PDF 등 일반 문서 기준 */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

const VALID_OWNER_TYPES: ReadonlySet<AttachmentOwnerType> = new Set(["board_post"]);

export function isAttachmentOwnerType(v: string): v is AttachmentOwnerType {
  return VALID_OWNER_TYPES.has(v as AttachmentOwnerType);
}

const UPLOAD_ROOT = path.join(process.cwd(), "db", "uploads");

/** 파일명에서 경로 분리자/제어문자 제거 + 길이 제한. 빈 문자열이면 "file"로 대체. */
function sanitizeFilename(raw: string): string {
  // path traversal/제어 문자 제거
  const base = path.basename(raw).replace(/[\x00-\x1f<>:"/\\|?*]/g, "_").trim();
  if (!base) return "file";
  if (base.length > 200) {
    const ext = path.extname(base).slice(0, 20);
    return base.slice(0, 200 - ext.length) + ext;
  }
  return base;
}

function ownerDir(ownerType: AttachmentOwnerType, ownerId: number): string {
  return path.join(UPLOAD_ROOT, ownerType, String(ownerId));
}

function rowToAttachment(row: Record<string, unknown>): Attachment {
  return {
    id: row.id as number,
    owner_type: row.owner_type as AttachmentOwnerType,
    owner_id: row.owner_id as number,
    filename: row.filename as string,
    storage_path: row.storage_path as string,
    mime_type: (row.mime_type as string | null) ?? null,
    size_bytes: row.size_bytes as number,
    uploaded_by: (row.uploaded_by as number | null) ?? null,
    uploaded_at: row.uploaded_at as string,
  };
}

export function listAttachments(
  db: SqlJsDatabase,
  ownerType: AttachmentOwnerType,
  ownerId: number,
): Attachment[] {
  const rows = queryAll(
    db,
    "SELECT * FROM attachments WHERE owner_type = ? AND owner_id = ? ORDER BY id ASC",
    [ownerType, ownerId],
  );
  return rows.map(rowToAttachment);
}

export function getAttachment(db: SqlJsDatabase, id: number): Attachment | null {
  const row = queryOne(db, "SELECT * FROM attachments WHERE id = ?", [id]);
  return row ? rowToAttachment(row) : null;
}

/**
 * 파일을 디스크에 쓰고 메타를 INSERT. 디스크 쓰기는 INSERT 후에 수행하므로
 * 파일명에 자동 증가 id를 prefix로 붙여 충돌을 차단한다.
 * DB 저장(saveDb)은 호출자가 책임지지 않고 여기서 처리 — 첨부는 단발 작업.
 */
export function saveAttachment(
  db: SqlJsDatabase,
  ownerType: AttachmentOwnerType,
  ownerId: number,
  file: { name: string; type: string; bytes: Buffer },
  uploadedBy: number | null,
): Attachment {
  const safe = sanitizeFilename(file.name);

  const dir = ownerDir(ownerType, ownerId);
  fs.mkdirSync(dir, { recursive: true });

  // 임시로 size만 들고 INSERT → 진짜 파일명에 id를 붙여 저장 → storage_path UPDATE
  const id = insertAndGetId(
    db,
    `INSERT INTO attachments
       (owner_type, owner_id, filename, storage_path, mime_type, size_bytes, uploaded_by, uploaded_at)
     VALUES (?, ?, ?, '', ?, ?, ?, ?)`,
    [
      ownerType,
      ownerId,
      safe,
      file.type || null,
      file.bytes.length,
      uploadedBy,
      new Date().toISOString(),
    ],
  );

  const storedName = `${id}__${safe}`;
  const fullPath = path.join(dir, storedName);
  // storage_path는 프로젝트 루트 기준 상대 — 이식성 확보
  const relPath = path.relative(process.cwd(), fullPath).split(path.sep).join("/");

  fs.writeFileSync(fullPath, file.bytes);

  db.run("UPDATE attachments SET storage_path = ? WHERE id = ?", [relPath, id]);
  saveDb();

  return getAttachment(db, id)!;
}

export function readAttachmentBytes(att: Attachment): Buffer {
  const abs = path.join(process.cwd(), att.storage_path);
  return fs.readFileSync(abs);
}

/** 1건 삭제 — DB 행 + 디스크 파일 모두. 파일 부재는 무시. */
export function deleteAttachment(db: SqlJsDatabase, id: number): void {
  const att = getAttachment(db, id);
  if (!att) return;
  const abs = path.join(process.cwd(), att.storage_path);
  try {
    fs.unlinkSync(abs);
  } catch {
    // 이미 없으면 통과
  }
  db.run("DELETE FROM attachments WHERE id = ?", [id]);
  saveDb();
}

/** owner의 모든 첨부 + 디렉터리째 삭제. owner 삭제 라우트에서 호출. */
export function deleteAllForOwner(
  db: SqlJsDatabase,
  ownerType: AttachmentOwnerType,
  ownerId: number,
): void {
  db.run("DELETE FROM attachments WHERE owner_type = ? AND owner_id = ?", [ownerType, ownerId]);
  const dir = ownerDir(ownerType, ownerId);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // 디렉터리 없거나 잠겨있으면 통과 — DB 행만 정리되어도 무방
  }
}
