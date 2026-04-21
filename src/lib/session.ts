/** Edge runtime + Node.js 양쪽에서 동작하는 HMAC-SHA256 세션 토큰 */

const SECRET = process.env.SESSION_SECRET ?? "taskflow-dev-secret-change-in-production";
const COOKIE_NAME = "taskflow_session";
const EXPIRES_SEC = 7 * 86400; // 7일

export interface SessionPayload {
  sub: number;
  role: string;
  mustChange: boolean;
  exp: number;
}

export { COOKIE_NAME };

// ---------- 내부 유틸 ----------

function encode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function decode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function importKey(): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// ---------- 공개 API ----------

export async function signSession(
  payload: Omit<SessionPayload, "exp">
): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + EXPIRES_SEC,
  };
  const data = new TextEncoder().encode(JSON.stringify(full));
  const key = await importKey();
  const sigAB = await globalThis.crypto.subtle.sign("HMAC", key, data);
  const sig = new Uint8Array(sigAB);
  return `${encode(data)}.${encode(sig)}`;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const dataU8  = decode(token.slice(0, dot));
    const sigU8   = decode(token.slice(dot + 1));
    const key = await importKey();
    // crypto.subtle.verify requires ArrayBuffer — copy to avoid SharedArrayBuffer issues
    const dataAB = dataU8.buffer.slice(dataU8.byteOffset, dataU8.byteOffset + dataU8.byteLength) as ArrayBuffer;
    const sigAB  = sigU8.buffer.slice(sigU8.byteOffset, sigU8.byteOffset + sigU8.byteLength) as ArrayBuffer;
    const ok = await globalThis.crypto.subtle.verify("HMAC", key, sigAB, dataAB);
    if (!ok) return null;
    const payload: SessionPayload = JSON.parse(new TextDecoder().decode(dataU8));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
