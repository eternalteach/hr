"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CheckSquare, Calendar, Users, FileText,
  ClipboardList, ListTree, Settings, LogOut, KeyRound,
  Shield, Star, User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { MemberRole } from "@/lib/types";

const icons = { LayoutDashboard, CheckSquare, Calendar, Users, FileText, ClipboardList, ListTree };

const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: "LayoutDashboard" as const },
  { href: "/calendar", label: "캘린더", icon: "Calendar" as const },
  { href: "/sow", label: "SOW 관리", icon: "FileText" as const },
  { href: "/brd", label: "BRD 관리", icon: "ClipboardList" as const },
  { href: "/tasks", label: "업무 관리", icon: "CheckSquare" as const },
  { href: "/members", label: "팀원 관리", icon: "Users" as const },
  { href: "/codes", label: "공통코드 관리", icon: "ListTree" as const },
];

const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "관리자",
  leader: "리더",
  member: "팀원",
};

const ROLE_ICONS: Record<MemberRole, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  leader: <Star className="w-3 h-3" />,
  member: <User className="w-3 h-3" />,
};

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  return (
    <aside className="w-56 border-r border-gray-200 bg-gray-50/50 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-white" />
          </span>
          TaskFlow
        </h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* 현재 사용자 */}
        {currentUser && (
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
              {currentUser.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-0.5">
                {ROLE_ICONS[currentUser.role]}
                {ROLE_LABELS[currentUser.role]}
              </p>
            </div>
          </div>
        )}

        {/* 시스템 환경설정 */}
        <Link
          href="/settings"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          시스템 환경설정
        </Link>

        {/* 비밀번호 변경 */}
        <Link
          href="/change-password"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5" />
          비밀번호 변경
        </Link>

        {/* 로그아웃 */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
