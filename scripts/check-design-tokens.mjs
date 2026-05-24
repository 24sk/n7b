#!/usr/bin/env node
/*
  デザイントークン違反検出スクリプト
  対象: app/**\/*.{vue,css,scss,ts}
  ルール:
    - hex 色リテラル (#xxx / #xxxxxx / #xxxxxxxx) は許可リスト以外は禁止
    - 純黒 #000 / #000000 は明示的に禁止 (neutral-900 を使うこと)
    - 色トークンの定義ファイル (app/assets/css/main.css) は除外
*/
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'

const ROOT = resolve(import.meta.dirname, '..')
const SCAN_DIRS = ['app']
const EXEMPT_FILES = new Set([
  'app/assets/css/main.css',
])

// デザインガイドラインで定義されている許可色
const ALLOWED_HEX = new Set([
  '#F0F8F9',
  '#D4EBEE',
  '#2E96A3',
  '#1A7A87',
  '#15616D',
  '#0F4A4A',
  '#F5C842',
  '#FAFBFB',
  '#F0F2F2',
  '#C9D1D1',
  '#7A8585',
  '#3D4747',
  '#1A1F1F',
  '#3FA66D',
  '#E89F3B',
  '#D85A4D',
  '#E85A4F',
  '#A8801A',
  '#E8D4F0',
  '#6B3A8A',
  '#D4E8DC',
  '#2D6B4A',
  '#FFFFFF',
  '#FFF',
].map(c => c.toUpperCase()))

const FORBIDDEN_HEX = new Set(['#000', '#000000'])

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.'))
        continue
      walk(full, out)
    }
    else if (/\.(?:vue|css|scss|ts)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const targets = SCAN_DIRS
  .map(d => join(ROOT, d))
  .filter((d) => {
    try {
      return statSync(d).isDirectory()
    }
    catch {
      return false
    }
  })
  .flatMap(d => walk(d))

let total = 0
for (const file of targets) {
  const rel = relative(ROOT, file)
  if (EXEMPT_FILES.has(rel))
    continue
  const source = readFileSync(file, 'utf8')
  const lines = source.split('\n')

  const violations = []
  lines.forEach((line, i) => {
    // コメント行はスキップ (簡易)
    if (/^\s*(?:\/\/|\*|<!--)/.test(line))
      return
    const matches = line.matchAll(/#[0-9a-f]{3,8}\b/gi)
    for (const m of matches) {
      const hex = m[0].toUpperCase()
      if (FORBIDDEN_HEX.has(hex)) {
        violations.push({ line: i + 1, hex, reason: '純黒は禁止。neutral-900 (#1A1F1F) を使用してください' })
      }
      else if (!ALLOWED_HEX.has(hex)) {
        violations.push({ line: i + 1, hex, reason: 'デザインガイドラインに未定義の色。assets/css/main.css のトークンを使用してください' })
      }
    }
  })

  if (violations.length) {
    console.error(`\n✖ ${rel}`)
    for (const v of violations) {
      console.error(`  L${v.line}: ${v.hex} — ${v.reason}`)
    }
    total += violations.length
  }
}

if (total > 0) {
  console.error(`\n${total} 件のデザイントークン違反が見つかりました`)
  process.exit(1)
}
console.log('✓ Design token check passed')
