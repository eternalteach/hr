import { getDb, saveDb } from "@/db";
import { queryAll, queryOne, insertAndGetId, withTransaction } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignee = searchParams.get("assignee");
  const lob = searchParams.get("lob");
  const sowId = searchParams.get("sow_id");
  const brdId = searchParams.get("brd_id");
  const titleLike = searchParams.get("title");

  let query = `
    SELECT t.*,
      b.brd_id as brd_code, b.sow_id as brd_sow_id, b.lob as brd_lob,
      b.title_local as brd_title_local, b.title_en as brd_title_en,
      (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count,
      (SELECT GROUP_CONCAT(ta.member_id) FROM task_assignees ta WHERE ta.task_id = t.id) as assignee_ids
    FROM tasks t
    LEFT JOIN brd b ON t.brd_id = b.id
    WHERE t.deleted_at IS NULL
  `;
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (status) { conditions.push("t.status = ?"); bindings.push(status); }
  if (priority) { conditions.push("t.priority = ?"); bindings.push(priority); }
  if (assignee) {
    const assigneeId = Number(assignee);
    if (Number.isFinite(assigneeId)) {
      conditions.push("t.id IN (SELECT task_id FROM task_assignees WHERE member_id = ?)");
      bindings.push(assigneeId);
    }
  }
  if (lob) { conditions.push("b.lob = ?"); bindings.push(lob); }
  if (sowId) { conditions.push("b.sow_id = ?"); bindings.push(sowId); }
  if (brdId) {
    const bid = Number(brdId);
    if (Number.isFinite(bid)) { conditions.push("t.brd_id = ?"); bindings.push(bid); }
  }
  if (titleLike) { conditions.push("t.title LIKE ?"); bindings.push(`%${titleLike}%`); }
  if (conditions.length) query += " AND " + conditions.join(" AND ");
  query += " ORDER BY t.position ASC, t.id ASC";

  const tasks = queryAll(db, query, bindings);
  if (!tasks.length) return NextResponse.json([]);

  // 한 번에 끌어와 메모리에서 조인 (N+1 회피)
  const members = queryAll(db, "SELECT * FROM members");
  const membersById: Record<number, Record<string, unknown>> = {};
  members.forEach(m => { membersById[m.id as number] = m; });

  const taskTagsRows = queryAll(
    db,
    "SELECT tt.task_id, tt.tag_id, t.name, t.color FROM task_tags tt JOIN tags t ON tt.tag_id = t.id"
  );
  const tagsByTaskId: Record<number, Array<Record<string, unknown>>> = {};
  taskTagsRows.forEach(t => {
    const tid = t.task_id as number;
    (tagsByTaskId[tid] ??= []).push(t);
  });

  const assigneeRows = queryAll(db, "SELECT * FROM task_assignees");
  const assigneesByTaskId: Record<number, Array<Record<string, unknown>>> = {};
  assigneeRows.forEach(a => {
    const tid = a.task_id as number;
    (assigneesByTaskId[tid] ??= []).push({ ...a, member: membersById[a.member_id as number] });
  });

  const enriched = tasks.map(t => ({
    ...t,
    assignees: assigneesByTaskId[t.id as number] || [],
    tags: tagsByTaskId[t.id as number] || [],
  }));

  return NextResponse.json(enriched);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const body = await request.json();
  const { title, description, priority, due_date, assignee_ids, tag_ids, created_by, brd_id } = body;

  if (!title) throw new ApiError(400, "제목은 필수입니다", "TITLE_REQUIRED");

  const now = new Date().toISOString();
  const authorId = Number(created_by) || 1;
  const brdIdNum = brd_id ? Number(brd_id) : null;

  // 트랜잭션 — tasks + 담당자 + 태그 + 로그 + 스케줄 전부 원자적으로
  const taskId = withTransaction(db, () => {
    const newId = insertAndGetId(
      db,
      `INSERT INTO tasks (title, description, priority, due_date, brd_id, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, priority || "medium", due_date || null, brdIdNum, authorId, now, now]
    );

    if (assignee_ids?.length) {
      assignee_ids.forEach((mid: number) => {
        db.run("INSERT INTO task_assignees (task_id, member_id) VALUES (?, ?)", [newId, mid]);
      });
    }

    if (tag_ids?.length) {
      tag_ids.forEach((tid: number) => {
        db.run("INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)", [newId, tid]);
      });
    }

    db.run(
      "INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (?, ?, 'created', ?)",
      [newId, authorId, JSON.stringify({ title })]
    );

    // 마감일 → 캘린더 자동 연동
    if (due_date) {
      db.run(
        "INSERT INTO schedules (title, type, start_at, task_id, created_by) VALUES (?, 'deadline', ?, ?, ?)",
        [`마감: ${title}`, due_date, newId, authorId]
      );
    }

    return newId;
  });

  saveDb();

  const task = queryOne(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
  return NextResponse.json(task, { status: 201 });
});
