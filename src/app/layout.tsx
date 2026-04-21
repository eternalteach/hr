import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { SettingsProvider } from "@/lib/settings-context";
import { AuthProvider } from "@/lib/auth-context";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "TaskFlow - 팀 업무 관리",
  description: "팀원 업무 배정, 진행사항 트래킹, 스케줄 관리",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("taskflow_session")?.value;
  const session = token ? await verifySession(token) : null;
  const showShell = !!session && !session.mustChange;

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="font-sans antialiased">
        <SettingsProvider>
          <AuthProvider>
            {showShell ? (
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto bg-white">
                  {children}
                </main>
              </div>
            ) : (
              children
            )}
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
