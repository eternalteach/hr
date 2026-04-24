import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/test/helpers";
import { queryAll, queryOne, insertAndGetId, withTransaction } from "./helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let db: SqlJsDatabase;

beforeEach(async () => {
  db = await createTestDb();
});

describe("queryAll", () => {
  it("빈 테이블이면 빈 배열을 반환한다", () => {
    const rows = queryAll(db, "SELECT * FROM tags");
    expect(rows).toEqual([]);
  });

  it("행이 있으면 객체 배열로 반환한다", () => {
    db.run("INSERT INTO tags (name, color) VALUES (?, ?)", ["기획", "#ff0000"]);
    db.run("INSERT INTO tags (name, color) VALUES (?, ?)", ["개발", "#00ff00"]);
    const rows = queryAll(db, "SELECT * FROM tags ORDER BY id");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "기획", color: "#ff0000" });
    expect(rows[1]).toMatchObject({ name: "개발", color: "#00ff00" });
  });

  it("파라미터 바인딩으로 필터링한다", () => {
    db.run("INSERT INTO tags (name, color) VALUES (?, ?)", ["기획", "#ff0000"]);
    db.run("INSERT INTO tags (name, color) VALUES (?, ?)", ["개발", "#00ff00"]);
    const rows = queryAll(db, "SELECT * FROM tags WHERE name = ?", ["기획"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "기획" });
  });

  it("결과가 없으면 빈 배열을 반환한다", () => {
    const rows = queryAll(db, "SELECT * FROM tags WHERE name = ?", ["없음"]);
    expect(rows).toEqual([]);
  });
});

describe("queryOne", () => {
  it("행이 없으면 null을 반환한다", () => {
    const row = queryOne(db, "SELECT * FROM tags WHERE id = ?", [999]);
    expect(row).toBeNull();
  });

  it("행이 있으면 첫 번째 행 객체를 반환한다", () => {
    db.run("INSERT INTO tags (name, color) VALUES (?, ?)", ["기획", "#ff0000"]);
    const row = queryOne(db, "SELECT * FROM tags WHERE name = ?", ["기획"]);
    expect(row).not.toBeNull();
    expect(row).toMatchObject({ name: "기획", color: "#ff0000" });
  });

  it("여러 행이 있어도 첫 번째만 반환한다", () => {
    db.run("INSERT INTO tags (name, color) VALUES (?, ?)", ["A", "#000"]);
    db.run("INSERT INTO tags (name, color) VALUES (?, ?)", ["B", "#fff"]);
    const row = queryOne(db, "SELECT * FROM tags ORDER BY id");
    expect(row).toMatchObject({ name: "A" });
  });
});

describe("insertAndGetId", () => {
  it("INSERT 후 생성된 rowid를 반환한다", () => {
    const id = insertAndGetId(
      db,
      "INSERT INTO tags (name, color) VALUES (?, ?)",
      ["새태그", "#abcdef"]
    );
    expect(typeof id).toBe("number");
    expect(id).toBeGreaterThan(0);
    const row = queryOne(db, "SELECT * FROM tags WHERE id = ?", [id]);
    expect(row).toMatchObject({ name: "새태그" });
  });

  it("연속 INSERT 시 ID가 증가한다", () => {
    const id1 = insertAndGetId(db, "INSERT INTO tags (name) VALUES (?)", ["태그1"]);
    const id2 = insertAndGetId(db, "INSERT INTO tags (name) VALUES (?)", ["태그2"]);
    expect(id2).toBeGreaterThan(id1);
  });
});

describe("withTransaction", () => {
  it("성공 시 변경 사항이 커밋된다", () => {
    withTransaction(db, () => {
      db.run("INSERT INTO tags (name) VALUES (?)", ["트랜잭션태그"]);
    });
    const row = queryOne(db, "SELECT * FROM tags WHERE name = ?", ["트랜잭션태그"]);
    expect(row).not.toBeNull();
  });

  it("fn 내부에서 throw 시 ROLLBACK된다", () => {
    expect(() => {
      withTransaction(db, () => {
        db.run("INSERT INTO tags (name) VALUES (?)", ["롤백태그"]);
        throw new Error("강제 에러");
      });
    }).toThrow("강제 에러");

    const row = queryOne(db, "SELECT * FROM tags WHERE name = ?", ["롤백태그"]);
    expect(row).toBeNull();
  });

  it("반환값을 전달한다", () => {
    const result = withTransaction(db, () => {
      insertAndGetId(db, "INSERT INTO tags (name) VALUES (?)", ["결과태그"]);
      return 42;
    });
    expect(result).toBe(42);
  });
});
