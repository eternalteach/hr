import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "TaskFlow - 팀 업무 관리",
  description: "팀원 업무 배정, 진행사항 트래킹, 스케줄 관리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <AuthProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto bg-white">
                {children}
              </main>
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
