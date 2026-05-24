#!/usr/bin/env node
/*
  商品画像最適化スクリプト
  入力: assets-raw/products/<slug>/*.{jpg,jpeg,png,webp}
  出力: public/images/products/<slug>/NN.jpg  (1600x1600 cover, mozjpeg q85, EXIF 削除)

  運用フロー:
    1. assets-raw/products/<slug>/ に元画像を配置 (任意のファイル名、Git 管理外)
    2. pnpm images:optimize で public/images/products/<slug>/01.jpg ... を生成
    3. Git にコミットして Vercel にデプロイ
    4. pnpm stripe:seed で Stripe Product の images フィールドに URL を反映
*/
import { mkdir, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const ROOT = resolve(import.meta.dirname, '..')
const SRC_DIR = join(ROOT, 'assets-raw/products')
const DST_DIR = join(ROOT, 'public/images/products')

const TARGET_WIDTH = 1600
const TARGET_HEIGHT = 1600
const JPEG_QUALITY = 85
const IMAGE_EXT = /\.(?:jpe?g|png|webp)$/i

async function exists(path) {
  try {
    await stat(path)
    return true
  }
  catch {
    return false
  }
}

async function listSlugs(dir) {
  if (!(await exists(dir)))
    return []
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort()
}

async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter(e => e.isFile() && IMAGE_EXT.test(e.name))
    .map(e => e.name)
    .sort()
}

async function processSlug(slug) {
  const srcDir = join(SRC_DIR, slug)
  const dstDir = join(DST_DIR, slug)
  const files = await listImages(srcDir)

  if (files.length === 0) {
    console.warn(`  ⚠ ${slug}: 元画像なし (スキップ)`)
    return 0
  }

  await mkdir(dstDir, { recursive: true })

  for (const [i, file] of files.entries()) {
    const out = join(dstDir, `${String(i + 1).padStart(2, '0')}.jpg`)
    await sharp(join(srcDir, file))
      .rotate() // EXIF orientation を反映
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'cover', position: 'attention', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
      .withMetadata({ exif: {} }) // EXIF 削除
      .toFile(out)
    console.log(`  ✓ ${slug}/${String(i + 1).padStart(2, '0')}.jpg  ← ${file}`)
  }
  return files.length
}

const slugs = await listSlugs(SRC_DIR)
if (slugs.length === 0) {
  console.log(`元画像ディレクトリが空です: ${SRC_DIR}`)
  console.log('assets-raw/products/<slug>/ に元画像を配置してから再実行してください')
  process.exit(0)
}

console.log(`商品画像を最適化します (${slugs.length} 商品)`)
let total = 0
for (const slug of slugs) {
  total += await processSlug(slug)
}
console.log(`\n完了: ${total} 枚を出力`)
