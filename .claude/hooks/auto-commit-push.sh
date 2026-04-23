#!/usr/bin/env bash
# Stop hook: 변경사항이 있으면 자동 커밋 + push.
# 어떤 실패도 Claude의 응답을 막지 않도록 항상 exit 0.

set +e
cd "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || exit 0

# 추적된 변경 + 새 파일까지 모두 본 뒤, 정말로 커밋할 게 없으면 조용히 종료.
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0
fi

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

git add -A >/dev/null 2>&1

git -c user.name="xyrho" -c user.email="eternalteach@wooriman.co.kr" \
  commit -m "chore: auto-commit ${TS}" >/dev/null 2>&1

git push origin main >/dev/null 2>&1

exit 0
