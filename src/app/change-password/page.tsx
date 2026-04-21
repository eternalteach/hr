"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Eye, EyeOff, KeyRound } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => setIsFirstLogin(data.must_change_password === 1));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setError("새 비밀번호가 일치하지 않습니다");
      return;
    }
    if (newPw.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw || undefined, newPassword: newPw }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "비밀번호 변경에 실패했습니다");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm mx-4">
        {/* 로고 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">비밀번호 변경</h2>
          </div>
          {isFirstLogin && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
              최초 로그인입니다. 새 비밀번호를 설정해주세요.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {!isFirstLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="8자 이상"
                  autoFocus
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPw && newPw !== confirmPw && (
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
              disabled={loading || !newPw || !confirmPw}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "변경 중…" : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
