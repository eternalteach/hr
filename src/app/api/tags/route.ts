import { getDb } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  const result = db.exec("SELECT * FROM tags ORDER BY id");
  if (!result.length) return NextResponse.json([]);
  const cols = result[0].columns;
  const tags = result[0].values.map(row => {
    const t: Record<string, unknown> = {};
    cols.forEach((col, i) => { t[col] = row[i]; });
    return t;
  });
  return NextResponse.json(tags);
}
