import { getDb } from "@/db";
import { queryAll } from "@/db/helpers";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  return NextResponse.json(queryAll(db, "SELECT * FROM tags ORDER BY id"));
}
