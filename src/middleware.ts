import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/session";

/** 인증 없이 접근 가능한 경로 */
const PUBLIC = new Set(["/login", "/api/auth/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일 / 내부 Next.js 경로 통과
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // API 라우트 — /api/auth/* 만 공개, 나머지는 통과 (API 자체 인증은 추후)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // 토큰 없음 → /login으로
  if (!token) {
    if (PUBLIC.has(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifySession(token);

  // 유효하지 않은 토큰
  if (!session) {
    if (PUBLIC.has(pathname)) return NextResponse.next();
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // 비밀번호 변경 필요 → /change-password로
  if (session.mustChange && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  // 비밀번호 변경 완료 상태인데 /change-password 접근 → 홈으로
  if (!session.mustChange && pathname === "/change-password") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 이미 로그인 상태인데 /login 접근 → 홈으로
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
