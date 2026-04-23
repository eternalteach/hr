"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Upload, Trash2, Download, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Attachment, AttachmentOwnerType } from "@/lib/types";

interface Props {
  ownerType: AttachmentOwnerType;
  ownerId: number;
  canEdit?: boolean;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ ownerType, ownerId, canEdit }: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/attachments?owner_type=${ownerType}&owner_id=${ownerId}`)
      .then(r => r.json() as Promise<Attachment[]>)
      .then(rows => { if (alive) { setItems(rows); setLoading(false); } });
    return () => { alive = false; };
  }, [ownerType, ownerId]);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true); setError(null);
    const fd = new FormData();
    fd.append("owner_type", ownerType);
    fd.append("owner_id", String(ownerId));
    list.forEach(f => fd.append("file", f));
    const res = await fetch("/api/attachments", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      setError(((await res.json()) as { error: string }).error);
      return;
    }
    const added = await res.json() as Attachment[];
    setItems(prev => [...prev, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = async (id: number) => {
    if (!confirm("이 첨부파일을 삭제할까요? 되돌릴 수 없습니다.")) return;
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(((await res.json()) as { error: string }).error);
      return;
    }
    setItems(prev => prev.filter(a => a.id !== id));
  };

  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Paperclip className="w-3.5 h-3.5" />
        첨부파일
        <span className="text-gray-400 normal-case font-normal">
          ({loading ? "…" : items.length})
        </span>
      </h3>

      {canEdit && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
          }}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 mb-3 text-sm text-center transition-colors",
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50",
            uploading && "opacity-60 pointer-events-none"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => e.target.files && upload(e.target.files)}
          />
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Upload className="w-4 h-4" />
            <span>{uploading ? "업로드 중…" : "파일을 끌어다 놓거나"}</span>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="text-blue-600 hover:underline font-medium"
            >
              선택
            </button>
            <span className="text-gray-400">— 여러 파일 가능, 1건당 최대 20MB</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs text-red-500 hover:underline">닫기</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">로딩 중…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">등록된 첨부파일이 없습니다.</p>
      ) : (
        <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {items.map(att => (
            <li key={att.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <a
                href={`/api/attachments/${att.id}`}
                className="font-medium text-gray-800 hover:text-blue-600 hover:underline truncate"
                title={att.filename}
              >
                {att.filename}
              </a>
              <span className="text-xs text-gray-400 tabular-nums shrink-0">{formatBytes(att.size_bytes)}</span>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <a
                  href={`/api/attachments/${att.id}`}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                  title="다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                {canEdit && (
                  <button
                    onClick={() => remove(att.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
