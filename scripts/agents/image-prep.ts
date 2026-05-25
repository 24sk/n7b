/*
  Agent 1: 画像準備エージェント

  - inbox の HEIC/JPEG/PNG/WebP を 1024px の JPEG バッファに統一
  - メモリ上で Buffer[] として返し、slug 確定後にファイル書き出しを行う構造にする
*/
import type { Buffer } from 'node:buffer'
import { existsSync, mkdirSync, readdirSync, rmdirSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

export const IMAGE_EXT = /\.(?:jpe?g|png|webp|heic|heif)$/i
export const MAX_IMAGES_FOR_AI = 4
const NORMALIZED_SIZE = 1024

export interface PreparedImage {
  /** inbox 上の元ファイル名 (拡張子付き) */
  originalName: string
  /** 1024px 正規化済み JPEG */
  buffer: Buffer
}

export function listInboxImages(inboxDir: string): string[] {
  return readdirSync(inboxDir)
    .filter(f => !f.startsWith('.') && IMAGE_EXT.test(f))
    .sort()
}

/**
 * inbox の画像を 1024px JPEG バッファに正規化する。
 * - rotate() で EXIF Orientation を反映
 * - fit: 'inside' で短辺を揃えつつ拡大はしない (Claude への入力用)
 */
export async function prepareImages(inboxDir: string, files: string[]): Promise<PreparedImage[]> {
  return Promise.all(files.map(async (f) => {
    const buf = await sharp(join(inboxDir, f))
      .rotate()
      .resize(NORMALIZED_SIZE, NORMALIZED_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer()
    return { originalName: f, buffer: buf } satisfies PreparedImage
  }))
}

/**
 * slug 確定後に最終的な物理ファイルを書き出す。
 * - 一時的な assets-raw/products/<slug>/<元名>.jpg として保存
 * - optimize-product-images.mjs の入力になる
 * - inbox を空にしたら inbox ディレクトリも削除する
 */
export function commitToAssetsRaw(
  prepared: PreparedImage[],
  productsSrcDir: string,
  slug: string,
  inboxDir: string,
): string {
  const targetDir = join(productsSrcDir, slug)
  mkdirSync(targetDir, { recursive: true })

  for (const p of prepared) {
    const ext = extname(p.originalName).toLowerCase()
    const dst = join(targetDir, `${basename(p.originalName, ext)}.jpg`)
    writeFileSync(dst, p.buffer)
  }

  // inbox 側を空にする (確定バッファに置き換わったため元画像は不要)
  for (const f of readdirSync(inboxDir)) {
    if (!f.startsWith('.') && IMAGE_EXT.test(f)) {
      const path = join(inboxDir, f)
      if (existsSync(path)) {
        try {
          unlinkSync(path)
        }
        catch { /* noop */ }
      }
    }
  }

  try {
    rmdirSync(inboxDir)
  }
  catch { /* noop */ }

  return targetDir
}
