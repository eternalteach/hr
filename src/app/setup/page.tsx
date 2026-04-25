"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Eye, EyeOff, Database, Server } from "lucide-react";

type Step = "loading" | "db" | "admin";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");

  // Admin form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // DB form
  const [dbType, setDbType] = useState<"sqlite" | "postgres">("sqlite");
  const [dbUrl, setDbUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/setup/status")
      .then(r => r.json())
      .then(data => {
        if (!data.needsSetup) {
          router.replace("/login");
        } else {
          setStep(data.step === "db" ? "db" : "admin");
        }
      });
  }, [router]);

  const handleDbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/db-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: dbType, url: dbType === "postgres" ? dbUrl : undefined }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "DB 설정에 실패했습니다");
      return;
    }

    setStep("admin");
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "계정 생성에 실패했습니다");
      return;
    }

    router.push("/login");
  };

  if (step === "loading") return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <p className="text-sm text-gray-500 mt-1">초기 설정</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === "db" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === "db" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
            데이터베이스
          </div>
          <div className="w-8 h-px bg-gray-200" />
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === "admin" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === "admin" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
            관리자 계정
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {step === "db" && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">데이터베이스 선택</h2>
              <p className="text-sm text-gray-500 mb-5">
                데이터를 저장할 방식을 선택해주세요.
              </p>

              <form onSubmit={handleDbSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setDbType("sqlite"); setError(null); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                      dbType === "sqlite"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Database className={`w-6 h-6 ${dbType === "sqlite" ? "text-blue-600" : "text-gray-400"}`} />
                    <div className="text-center">
                      <div className={`text-sm font-medium ${dbType === "sqlite" ? "text-blue-700" : "text-gray-700"}`}>로컬 SQLite</div>
                      <div className="text-xs text-gray-400 mt-0.5">파일 기반, 별도 설정 불필요</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDbType("postgres"); setError(null); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                      dbType === "postgres"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Server className={`w-6 h-6 ${dbType === "postgres" ? "text-blue-600" : "text-gray-400"}`} />
                    <div className="text-center">
                      <div className={`text-sm font-medium ${dbType === "postgres" ? "text-blue-700" : "text-gray-700"}`}>PostgreSQL</div>
                      <div className="text-xs text-gray-400 mt-0.5">외부 DB 서버 연결</div>
                    </div>
                  </button>
                </div>

                {dbType === "postgres" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연결 문자열 *
                    </label>
                    <input
                      type="text"
                      value={dbUrl}
                      onChange={e => setDbUrl(e.target.value)}
                      placeholder="postgresql://user:password@host:5432/dbname"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      SSL 사용 시: <code className="bg-gray-100 px-1 rounded">?sslmode=require</code> 추가
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || (dbType === "postgres" && !dbUrl.trim())}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "연결 확인 중…" : "다음"}
                </button>
              </form>
            </>
          )}

          {step === "admin" && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">관리자 계정 생성</h2>
              <p className="text-sm text-gray-500 mb-5">
                서비스를 시작하려면 첫 번째 관리자 계정을 만들어주세요.
              </p>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 * (8자 이상)</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="비밀번호"
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인 *</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="비밀번호 재입력"
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPw && password !== confirmPw && (
                    <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !name || !email || !password || !confirmPw}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "생성 중…" : "관리자 계정 생성"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
