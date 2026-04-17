import { getDb } from "@/db";
import { queryAll } from "@/db/helpers";
import { withApiHandler } from "@/lib/api-handler";
import { NextResponse } from "next/server";

export const GET = withApiHandler(async () => {
  const db = await getDb();
  return NextResponse.json(queryAll(db, "SELECT * FROM tags ORDER BY id"));
});
