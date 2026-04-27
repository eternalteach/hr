"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus, X, AlertTriangle, Search } from "lucide-react";
import { BoardTable } from "./BoardTable";
import { BoardFormModal } from "./BoardFormModal";
import { BoardDetailModal } from "./BoardDetailModal";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useT } from "@/lib/i18n";
import type { Post, Lob } from "@/lib/types";
import type { BoardConfig } from "@/lib/boards/config";

interface Props {
  config: BoardConfig;
}

const ALL_KEY = "__all__";
const NONE_KEY = "__none__";

export function BoardPage({ config }: Props) {
  const { isReadOnly } = useAuth();
  const { language } = useLanguage();
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("id");
  const isEn = language === "en";

  const [allRows, setAllRows] = useState<Post[]>([]);
  const [lobs, setLobs] = useState<Lob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLob, setActiveLob] = useState<string>(ALL_KEY);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Post | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [viewTarget, setViewTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/board/${config.type}`).then(r => r.json()) as Promise<Post[]>,
      fetch("/api/lob").then(r => r.json()) as Promise<Lob[]>,
    ]).then(([posts, l]) => {
      setAllRows(posts);
      setLobs(l.filter(x => x.is_active === "Y"));
      setLoading(false);
    });
  }, [config.type]);

  // /meeting-notes?id=N 같은 딥링크로 진입하면 해당 게시글 상세를 자동으로 연다
  useEffect(() => {
    if (!deepLinkId || !allRows.length) return;
    const id = Number(deepLinkId);
    if (!Number.isInteger(id) || id <= 0) return;
    const target = allRows.find(r => r.id === id);
    if (target) setViewTarget(target);
    router.replace(pathname);
  }, [deepLinkId, allRows, router, pathname]);

  const rows = useMemo(() => {
    const byLob = activeLob === ALL_KEY
      ? allRows
      : activeLob === NONE_KEY
        ? allRows.filter(r => !r.lob)
        : allRows.filter(r => r.lob === activeLob);
    const q = search.trim().toLowerCase();
    if (!q) return byLob;
    return byLob.filter(r =>
      (r.title_local ?? "").toLowerCase().includes(q) ||
      (r.title_en ?? "").toLowerCase().includes(q) ||
      (r.content_local ?? "").toLowerCase().includes(q) ||
      (r.content_en ?? "").toLowerCase().includes(q)
    );
  }, [allRows, activeLob, search]);

  const countByLob = (code: string) => allRows.filter(r => r.lob === code).length;
  const noneCount = allRows.filter(r => !r.lob).length;

  const handleSaved = (saved: Post) => {
    setAllRows(prev => prev.some(r => r.id === saved.id)
      ? prev.map(r => r.id === saved.id ? saved : r)
      : [saved, ...prev]
    );
    setViewTarget(prev => (prev && prev.id === saved.id ? saved : prev));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/board/${config.type}/${deleteTarget.id}`, { method: "DELETE" });
    setAllRows(prev => prev.filter(r => r.id !== deleteTarget.id));
    setViewTarget(prev => (prev && prev.id === deleteTarget.id ? null : prev));
    setDeleteTarget(null);
    setDeleting(false);
  };

  const defaultLobForCreate =
    activeLob === ALL_KEY || activeLob === NONE_KEY ? null : activeLob;

  const deleteLabel = (p: Post) =>
    config.deleteSubject ? config.deleteSubject(p) : p.title_local;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t(config.pageTitleKey)}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("common.count", { n: rows.length })} · {t(config.pageDescriptionKey)}</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => setEditTarget(null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />{t(config.addButtonLabelKey)}
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        <LobTab
          active={activeLob === ALL_KEY}
          onClick={() => setActiveLob(ALL_KEY)}
          label={t("common.all")}
          count={allRows.length}
        />
        {lobs.map(l => (
          <LobTab
            key={l.code}
            active={activeLob === l.code}
            onClick={() => setActiveLob(l.code)}
            label={(isEn ? l.title_en : l.title_local) || l.code}
            count={countByLob(l.code)}
          />
        ))}
        {noneCount > 0 && (
          <LobTab
            active={activeLob === NONE_KEY}
            onClick={() => setActiveLob(NONE_KEY)}
            label={t("board.no_lob")}
            count={noneCount}
          />
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t(config.searchPlaceholderKey)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">{t("common.loading")}</div>
      ) : (
        <BoardTable
          config={config}
          rows={rows}
          lobs={lobs}
          showLobColumn={activeLob === ALL_KEY}
          onOpen={setViewTarget}
          onEdit={isReadOnly ? undefined : setEditTarget}
          onDelete={isReadOnly ? undefined : setDeleteTarget}
        />
      )}

      {viewTarget && (
        <BoardDetailModal
          config={config}
          post={viewTarget}
          lobs={lobs}
          canEdit={!isReadOnly}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
          onDelete={() => { setDeleteTarget(viewTarget); setViewTarget(null); }}
          onClose={() => setViewTarget(null)}
        />
      )}

      {!isReadOnly && editTarget !== undefined && (
        <BoardFormModal
          config={config}
          post={editTarget}
          defaultLob={defaultLobForCreate}
          lobs={lobs}
          onClose={() => setEditTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{t(config.deleteTitleKey)}</h2>
              <button onClick={() => setDeleteTarget(null)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p><span className="font-semibold">{deleteLabel(deleteTarget)}</span>{t("common.delete_suffix")}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">{t("action.cancel")}</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                  {deleting ? t("common.deleting") : t("action.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LobTab({ active, onClick, label, count }: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      <span className="ml-1.5 text-xs text-gray-400">({count})</span>
    </button>
  );
}
