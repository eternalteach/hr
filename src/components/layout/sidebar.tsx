"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CheckSquare, Calendar, Users } from "lucide-react";

const icons = { LayoutDashboard, CheckSquare, Calendar, Users };

const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: "LayoutDashboard" as const },
  { href: "/tasks", label: "업무 관리", icon: "CheckSquare" as const },
  { href: "/calendar", label: "캘린더", icon: "Calendar" as const },
  { href: "/members", label: "팀원 관리", icon: "Users" as const },
];

export function Sidebar() {
  const pathname = usePathname();

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

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            김
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">김민수</p>
            <p className="text-xs text-gray-500">관리자</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
