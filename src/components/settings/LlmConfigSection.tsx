"use client";

import { useState, useEffect, useCallback } from "react";
import { Cpu, Plus, Edit2, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LlmConfig } from "@/lib/types";

export function LlmConfigSection() {
  const t = useT();
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null);

  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/llm");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (err) {
      console.error("Failed to load LLM configs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleAdd = () => {
    setEditingConfig(null);
    setIsModalOpen(true);
  };

  const handleEdit = (config: LlmConfig) => {
    setEditingConfig(config);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("llm.delete_confirm"))) return;

    try {
      const res = await fetch(`/api/settings/llm/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadConfigs();
      }
    } catch (err) {
      console.error("Failed to delete LLM config", err);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const res = await fetch(`/api/settings/llm/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_default: "Y" }),
      });
      if (res.ok) {
        loadConfigs();
      }
    } catch (err) {
      console.error("Failed to set default LLM config", err);
    }
  };

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">{t("settings.llm_config")}</h2>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
          {t("action.add")}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {t("settings.llm_config_desc")}
      </p>

      {loading ? (
        <div className="py-4 text-center text-xs text-gray-400">{t("common.loading")}</div>
      ) : configs.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-lg">
          <p className="text-xs text-gray-400">{t("llm.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                config.is_default === "Y"
                  ? "border-blue-200 bg-blue-50/30"
                  : "border-gray-100 bg-gray-50/30 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSetDefault(config.id)}
                  title={t("llm.isDefault")}
                  className={`shrink-0 transition-colors ${
                    config.is_default === "Y" ? "text-blue-500" : "text-gray-300 hover:text-gray-400"
                  }`}
                >
                  {config.is_default === "Y" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{config.name}</p>
                    <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[10px] font-bold text-gray-600 uppercase">
                      {config.provider}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {config.model || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(config)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <LlmConfigModal
          config={editingConfig}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            loadConfigs();
          }}
        />
      )}
    </section>
  );
}

interface ModalProps {
  config: LlmConfig | null;
  onClose: () => void;
  onSaved: () => void;
}

function LlmConfigModal({ config, onClose, onSaved }: ModalProps) {
  const t = useT();
  const [name, setName] = useState(config?.name || "");
  const [provider, setProvider] = useState(config?.provider || "openai");
  const [baseUrl, setBaseUrl] = useState(config?.base_url || "");
  const [apiKey, setApiKey] = useState(config?.api_key || "");
  const [model, setModel] = useState(config?.model || "");
  const [isDefault, setIsDefault] = useState(config?.is_default === "Y");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      name,
      provider,
      base_url: baseUrl || null,
      api_key: apiKey,
      model: model || null,
      is_default: isDefault ? "Y" : "N",
    };

    try {
      const url = config ? `/api/settings/llm/${config.id}` : "/api/settings/llm";
      const method = config ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSaved();
      }
    } catch (err) {
      console.error("Failed to save LLM config", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {config ? t("llm.edit") : t("llm.add")}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("llm.name")} <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="OpenAI Pro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t("llm.provider")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="azure">Azure</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t("llm.model")}
                </label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="gpt-4o"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("llm.apiKey")} <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("llm.baseUrl")}
              </label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-[11px]"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
                {t("llm.isDefault")}
              </span>
            </label>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t("action.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || !name || !apiKey}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? t("common.saving") : t("action.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
