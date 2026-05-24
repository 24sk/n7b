#!/usr/bin/env bash
# Claude Code PostToolUse(Edit|Write|MultiEdit) hook
# - 編集対象ファイルに対し ESLint --fix を実行
# - app/ 配下の編集時は BEM / デザイントークンチェッカーを実行
# 違反検知時は exit 2 で Claude に修正を促す
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJECT_DIR"

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty' 2>/dev/null || echo "")

if [[ -z "$FILE" ]]; then
  exit 0
fi

# 相対パス化
REL_FILE="${FILE#$PROJECT_DIR/}"

# 依存未インストール時はスキップ
if [[ ! -d node_modules ]]; then
  echo "[hook] node_modules 未インストールのためチェックをスキップしました" >&2
  exit 0
fi

EXIT_CODE=0
MESSAGES=()

# 1. ESLint --fix (該当拡張子のみ)
case "$REL_FILE" in
  *.vue|*.ts|*.js|*.mjs|*.cjs|*.tsx|*.jsx)
    if ! ESLINT_OUT=$(pnpm exec eslint --fix --cache "$REL_FILE" 2>&1); then
      MESSAGES+=("ESLint エラー (修正不可):\n$ESLINT_OUT")
      EXIT_CODE=2
    fi
    ;;
esac

# 2. app/ 配下なら BEM / デザイントークンチェック
case "$REL_FILE" in
  app/*|*/app/*)
    if ! BEM_OUT=$(node scripts/check-bem.mjs 2>&1); then
      MESSAGES+=("BEM 違反:\n$BEM_OUT")
      EXIT_CODE=2
    fi
    if ! TOKEN_OUT=$(node scripts/check-design-tokens.mjs 2>&1); then
      MESSAGES+=("デザイントークン違反:\n$TOKEN_OUT")
      EXIT_CODE=2
    fi
    ;;
esac

if [[ $EXIT_CODE -ne 0 ]]; then
  for msg in "${MESSAGES[@]}"; do
    printf '%b\n' "$msg" >&2
  done
fi

exit $EXIT_CODE
