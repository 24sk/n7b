#!/usr/bin/env node
/*
  BEM 違反検出スクリプト
  対象: app/**\/*.vue の <style lang="scss"> ブロック内のセレクタ
  ルール: クラス名は ^[a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?$ を満たすこと
  SCSS の入れ子 (&__elem, &--mod) は親クラスと結合して検証する
  Tailwind ユーティリティは <template> の class 属性で使われるためここでは検査しない
*/
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'

const ROOT = resolve(import.meta.dirname, '..')
const SCAN_DIRS = ['app']

const VALID_BLOCK = /^[a-z][\w-]*$/

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.'))
        continue
      walk(full, out)
    }
    else if (entry.endsWith('.vue') || entry.endsWith('.scss')) {
      out.push(full)
    }
  }
  return out
}

function extractScssBlocks(source, file) {
  if (file.endsWith('.scss'))
    return [source]
  const blocks = []
  const re = /<style[^>]*lang=["']s?css["'][^>]*>([\s\S]*?)<\/style>/gi
  for (const m of source.matchAll(re)) {
    // lang="scss" or lang="sass" のみ対象 (lang 指定なし = CSS は対象外)
    if (/lang=["']scss["']/i.test(m[0]))
      blocks.push(m[1])
  }
  return blocks
}

function extractSelectors(scss) {
  // コメントを除去
  const cleaned = scss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')

  const violations = []
  const stack = [] // 親セレクタのクラス名スタック

  // 行単位で簡易パース
  const lines = cleaned.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line)
      continue

    // ブロック終了
    if (line === '}') {
      stack.pop()
      continue
    }

    // セレクタ + { を持つ行
    const selMatch = line.match(/^([^{};]+)\{$/)
    if (!selMatch)
      continue
    const selector = selMatch[1].trim()

    // & を含む場合は親と結合
    if (selector.startsWith('&')) {
      const parent = stack[stack.length - 1] ?? ''
      const combined = parent + selector.slice(1)
      validateSelector(combined, i + 1, violations)
      stack.push(combined)
    }
    else {
      // 複合セレクタ (`.a .b` や `.a, .b` 等) は class トークンごとに検査
      const tokens = selector.split(/[\s,>+~]+/).filter(Boolean)
      for (const t of tokens) {
        if (t.startsWith('.')) {
          validateSelector(t, i + 1, violations)
        }
      }
      // 入れ子継承用にトップ要素を積む (簡易)
      stack.push(tokens[0] ?? '')
    }
  }

  return violations
}

function validateSelector(sel, line, violations) {
  // .my-block, .my-block__elem, .my-block--mod, .my-block__elem--mod のみ許容
  if (!sel.startsWith('.'))
    return
  const name = sel.slice(1).split(/[:.[]/)[0] // 擬似クラス・属性などを除去
  if (!name)
    return
  if (!VALID_BLOCK.test(name)) {
    violations.push({ line, selector: sel, name })
  }
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

let totalViolations = 0
for (const file of targets) {
  const source = readFileSync(file, 'utf8')
  const blocks = extractScssBlocks(source, file)
  if (!blocks.length)
    continue

  const fileViolations = []
  for (const block of blocks) {
    fileViolations.push(...extractSelectors(block))
  }

  if (fileViolations.length) {
    console.error(`\n✖ ${relative(ROOT, file)}`)
    for (const v of fileViolations) {
      console.error(`  L${v.line}: "${v.selector}" は BEM 命名規則に違反しています (block, block__element, block--modifier のみ許容)`)
    }
    totalViolations += fileViolations.length
  }
}

if (totalViolations > 0) {
  console.error(`\n${totalViolations} 件の BEM 違反が見つかりました`)
  process.exit(1)
}
console.log('✓ BEM check passed')
