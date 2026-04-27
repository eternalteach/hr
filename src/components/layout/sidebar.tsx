"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CheckSquare, Calendar, Users, FileText,
  ClipboardList, ListTree, BookOpen, NotebookPen, Settings, LogOut,
  Shield, Star, User, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import type { MemberRole } from "@/lib/types";

const icons = { LayoutDashboard, CheckSquare, Calendar, Users, FileText, ClipboardList, ListTree, BookOpen, NotebookPen, Settings };

const NAV_ITEMS = [
  { href: "/",              labelKey: "nav.dashboard",     icon: "LayoutDashboard" as const },
  { href: "/calendar",      labelKey: "nav.calendar",      icon: "Calendar"        as const },
  { href: "/sow",           labelKey: "nav.sow",           icon: "FileText"        as const },
  { href: "/brd",           labelKey: "nav.brd",           icon: "ClipboardList"   as const },
  { href: "/tasks",         labelKey: "nav.tasks",         icon: "CheckSquare"     as const },
  { href: "/members",       labelKey: "nav.members",       icon: "Users"           as const },
  { href: "/codes",         labelKey: "nav.codes",         icon: "ListTree"        as const },
  { href: "/glossary",      labelKey: "nav.glossary",      icon: "BookOpen"        as const },
  { href: "/meeting-notes", labelKey: "nav.meeting_notes", icon: "NotebookPen"     as const },
  { href: "/settings",      labelKey: "nav.settings",      icon: "Settings"        as const },
];

const ROLE_KEYS: Record<MemberRole, string> = {
  admin: "role.admin",
  leader: "role.leader",
  member: "role.member",
};

const ROLE_ICONS: Record<MemberRole, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  leader: <Star className="w-3 h-3" />,
  member: <User className="w-3 h-3" />,
};

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const t = useT();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("taskflow.sidebarCollapsed");
    if (saved === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(true);
    }
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("taskflow.sidebarCollapsed", String(newValue));
  };

  // 서버 사이드 렌더링 시 너비 깜빡임 방지 (초기 로딩 시에는 기본 너비 유지)
  const sidebarWidth = !mounted ? "w-56" : isCollapsed ? "w-20" : "w-56";

  return (
    <aside className={cn(
      "border-r border-gray-200 bg-gray-50/50 flex flex-col shrink-0 transition-all duration-300 relative",
      sidebarWidth
    )}>
      <div className={cn(
        "p-5 border-b border-gray-200 flex items-center justify-between",
        isCollapsed && "px-0 justify-center"
      )}>
        <h1 className={cn(
          "text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2",
          isCollapsed && "hidden"
        )}>
          <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-white" />
          </span>
          TaskFlow
        </h1>
        {isCollapsed && (
          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className={cn(
            "p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors",
            isCollapsed ? "absolute -right-3 top-6 bg-white border border-gray-200 shadow-sm z-10" : ""
          )}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className={cn("flex-1 p-3 space-y-1", isCollapsed && "px-2")}>
        {NAV_ITEMS.map(item => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? t(item.labelKey) : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              {!isCollapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-gray-200", isCollapsed && "px-2")}>
        {currentUser && (
          <div className={cn("flex items-center gap-3 px-1 py-1", isCollapsed && "flex-col gap-2 px-0")}>
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
              {currentUser.name[0]}
            </div>
            {!isCollapsed ? (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                  <button
                    onClick={logout}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title={t("auth.logout")}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-0.5">
                  {ROLE_ICONS[currentUser.role]}
                  {t(ROLE_KEYS[currentUser.role])}
                </p>
              </div>
            ) : (
              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title={t("auth.logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
