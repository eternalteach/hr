import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("node:fs", () => ({
  default: {
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => Buffer.from("file content")),
    unlinkSync: vi.fn(),
    rmSync: vi.fn(),
  },
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import {
  listAttachments,
  getAttachment,
  saveAttachment,
  deleteAttachment,
  deleteAllForOwner,
  isAttachmentOwnerType,
  readAttachmentBytes,
} from "./storage";
import fs from "node:fs";

beforeEach(async () => {
  _db = await createTestDb();
  vi.clearAllMocks();
});

describe("isAttachmentOwnerType", () => {
  it("board_post는 유효한 owner type이다", () => {
    expect(isAttachmentOwnerType("board_post")).toBe(true);
  });

  it("알 수 없는 type은 false를 반환한다", () => {
    expect(isAttachmentOwnerType("task")).toBe(false);
    expect(isAttachmentOwnerType("")).toBe(false);
    expect(isAttachmentOwnerType("invalid")).toBe(false);
  });
});

describe("listAttachments", () => {
  it("owner의 첨부파일 목록을 반환한다", () => {
    _db.run(
      "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 1, 'test.pdf', 'db/uploads/board_post/1/1__test.pdf', 1024)"
    );
    _db.run(
      "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 1, 'doc.docx', 'db/uploads/board_post/1/2__doc.docx', 2048)"
    );
    _db.run(
      "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 2, 'other.txt', 'db/uploads/board_post/2/3__other.txt', 512)"
    );
    const list = listAttachments(_db, "board_post", 1);
    expect(list).toHaveLength(2);
    expect(list[0].filename).toBe("test.pdf");
    expect(list[1].filename).toBe("doc.docx");
  });

  it("첨부파일이 없으면 빈 배열을 반환한다", () => {
    const list = listAttachments(_db, "board_post", 999);
    expect(list).toEqual([]);
  });
});

describe("getAttachment", () => {
  it("ID로 첨부파일을 조회한다", () => {
    _db.run(
      "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes, mime_type) VALUES ('board_post', 1, 'file.pdf', 'some/path', 500, 'application/pdf')"
    );
    const att = getAttachment(_db, 1);
    expect(att).not.toBeNull();
    expect(att!.filename).toBe("file.pdf");
    expect(att!.mime_type).toBe("application/pdf");
  });

  it("존재하지 않으면 null을 반환한다", () => {
    const att = getAttachment(_db, 999);
    expect(att).toBeNull();
  });
});

describe("saveAttachment", () => {
  it("파일을 저장하고 메타데이터를 반환한다", () => {
    const att = saveAttachment(
      _db,
      "board_post",
      1,
      { name: "test.pdf", type: "application/pdf", bytes: Buffer.from("pdf content") },
      null
    );
    expect(att.filename).toBe("test.pdf");
    expect(att.owner_type).toBe("board_post");
    expect(att.owner_id).toBe(1);
    expect(vi.mocked(fs.mkdirSync)).toHaveBeenCalled();
    expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalled();
  });

  it("파일명에서 경로 분리자를 제거한다", () => {
    const att = saveAttachment(
      _db,
      "board_post",
      1,
      { name: "../../../etc/passwd", type: "text/plain", bytes: Buffer.from("data") },
      1
    );
    expect(att.filename).not.toContain("..");
    expect(att.filename).not.toContain("/");
  });

  it("빈 파일명은 file로 대체한다", () => {
    const att = saveAttachment(
      _db,
      "board_post",
      1,
      { name: "", type: "text/plain", bytes: Buffer.from("data") },
      null
    );
    expect(att.filename).toBe("file");
  });

  it("200자 초과 파일명은 잘린다", () => {
    const longName = "a".repeat(250) + ".txt";
    const att = saveAttachment(
      _db,
      "board_post",
      1,
      { name: longName, type: "text/plain", bytes: Buffer.from("data") },
      null
    );
    expect(att.filename.length).toBeLessThanOrEqual(200);
  });

  it("uploaded_by를 저장한다", () => {
    const att = saveAttachment(
      _db,
      "board_post",
      1,
      { name: "doc.pdf", type: "application/pdf", bytes: Buffer.from("data") },
      42
    );
    expect(att.uploaded_by).toBe(42);
  });
});

describe("readAttachmentBytes", () => {
  it("첨부파일 바이트를 읽어온다", () => {
    const att = {
      id: 1,
      owner_type: "board_post" as const,
      owner_id: 1,
      filename: "test.pdf",
      storage_path: "db/uploads/board_post/1/1__test.pdf",
      mime_type: "application/pdf",
      size_bytes: 100,
      uploaded_by: null,
      uploaded_at: "2026-04-24",
    };
    const bytes = readAttachmentBytes(att);
    expect(Buffer.isBuffer(bytes)).toBe(true);
    expect(vi.mocked(fs.readFileSync)).toHaveBeenCalled();
  });
});

describe("deleteAttachment", () => {
  it("첨부파일을 삭제한다", () => {
    _db.run(
      "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 1, 'del.pdf', 'some/path', 100)"
    );
    deleteAttachment(_db, 1);
    const row = _db.exec("SELECT * FROM attachments WHERE id = 1");
    expect(row[0]?.values?.length ?? 0).toBe(0);
    expect(vi.mocked(fs.unlinkSync)).toHaveBeenCalled();
  });

  it("존재하지 않는 파일 삭제는 무시한다", () => {
    expect(() => deleteAttachment(_db, 999)).not.toThrow();
  });

  it("디스크 파일이 없어도 예외를 던지지 않는다", () => {
    vi.mocked(fs.unlinkSync).mockImplementationOnce(() => { throw new Error("ENOENT"); });
    _db.run(
      "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 1, 'missing.pdf', 'no/such/path', 100)"
    );
    expect(() => deleteAttachment(_db, 1)).not.toThrow();
  });
});

describe("deleteAllForOwner", () => {
  it("owner의 모든 첨부파일을 삭제한다", () => {
    _db.run("INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 5, 'a.pdf', 'p1', 100)");
    _db.run("INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 5, 'b.pdf', 'p2', 200)");
    deleteAllForOwner(_db, "board_post", 5);
    const rows = _db.exec("SELECT * FROM attachments WHERE owner_id = 5");
    expect(rows[0]?.values?.length ?? 0).toBe(0);
    expect(vi.mocked(fs.rmSync)).toHaveBeenCalled();
  });

  it("디렉터리 삭제 실패는 무시한다", () => {
    vi.mocked(fs.rmSync).mockImplementationOnce(() => { throw new Error("EBUSY"); });
    expect(() => deleteAllForOwner(_db, "board_post", 999)).not.toThrow();
  });
});
