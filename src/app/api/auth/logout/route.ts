import { COOKIE_NAME } from "@/lib/session";
import { withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApiHandler(async (_req: NextRequest) => {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
});
