import { getDb, saveDb } from "@/db";
import { withTransaction } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const body = await request.json();

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new ApiError(400, "items 배열이 필요합니다");
  }

  withTransaction(db, () => {
    (body.items as { id: number; position: number }[]).forEach(({ id, position }) => {
      db.run("UPDATE tasks SET position = ? WHERE id = ?", [position, id]);
    });
  });
  saveDb();

  return NextResponse.json({ ok: true });
});
