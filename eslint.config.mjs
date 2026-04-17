import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // 프로젝트 규칙 — AGENTS.md 참조
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // db.exec(`... ${x} ...`) / db.run(`... ${x} ...`) — SQL 인젝션
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(exec|run)$/] > TemplateLiteral[expressions.length>0]:first-child",
          message:
            "SQL에 템플릿 리터럴로 값을 주입하지 말 것. `?` 파라미터 바인딩을 사용하세요. (AGENTS.md §1)",
        },
        {
          // "SELECT ... WHERE ... = '" + x + "..."  — 문자열 연결로 SQL 조립
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(exec|run)$/] > BinaryExpression[operator='+']:first-child",
          message:
            "SQL 문자열 연결 금지. `?` 파라미터 바인딩을 사용하세요. (AGENTS.md §1)",
        },
      ],
    },
  },
  {
    // 테스트 파일은 위 규칙에서 제외 (의도적 취약 코드로 테스트할 수 있도록)
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
]);

export default eslintConfig;
