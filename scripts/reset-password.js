#!/usr/bin/env node
// Usage: node scripts/reset-password.js <email> <new-password>
// Resets a member's password directly in the SQLite DB (no server required).

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Usage: node scripts/reset-password.js <email> <new-password>");
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error("Error: 비밀번호는 8자 이상이어야 합니다");
  process.exit(1);
}

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "..", "db", "tasks.db");

if (!fs.existsSync(DB_PATH)) {
  console.error(`Error: DB 파일을 찾을 수 없습니다: ${DB_PATH}`);
  console.error("서버를 한 번 기동해 DB를 초기화하세요.");
  process.exit(1);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();

  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  const result = db.exec("SELECT id, name, role FROM members WHERE email = ?", [email]);
  if (!result[0]?.values?.length) {
    console.error(`Error: '${email}' 이메일을 가진 팀원을 찾을 수 없습니다`);
    db.close();
    process.exit(1);
  }

  const [id, name, role] = result[0].values[0];
  const hash = hashPassword(newPassword);

  db.run(
    "UPDATE members SET password_hash = ?, must_change_password = 0 WHERE id = ?",
    [hash, id]
  );

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`완료: ${name} (${email}, ${role}) 의 비밀번호가 재설정되었습니다.`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
