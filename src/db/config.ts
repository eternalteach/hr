import fs from "fs";
import path from "path";

export type DbType = "sqlite" | "postgres";

export interface DbConfig {
  type: DbType;
  url?: string; // PostgreSQL 연결 문자열
}

const CONFIG_PATH = path.join(process.cwd(), "db", "config.json");

/** 현재 DB 설정을 반환. 우선순위: 환경변수 > config.json > 기본값(sqlite) */
export function getDbConfig(): DbConfig {
  // 환경변수 우선
  if (process.env.DB_TYPE === "postgres") {
    return { type: "postgres", url: process.env.DATABASE_URL };
  }
  if (process.env.DB_TYPE === "sqlite") {
    return { type: "sqlite" };
  }
  // DATABASE_URL만 있으면 postgres로 간주
  if (process.env.DATABASE_URL) {
    return { type: "postgres", url: process.env.DATABASE_URL };
  }

  // config.json
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(raw) as DbConfig;
    } catch {
      // 파싱 실패 시 기본값
    }
  }

  return { type: "sqlite" };
}

/** DB 설정을 config.json에 저장 (첫 설치 setup 시 호출) */
export function setDbConfig(config: DbConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/** DB가 이미 구성되어 있는지 확인 */
export function isDbConfigured(): boolean {
  if (process.env.DB_TYPE || process.env.DATABASE_URL) return true;
  return fs.existsSync(CONFIG_PATH);
}
