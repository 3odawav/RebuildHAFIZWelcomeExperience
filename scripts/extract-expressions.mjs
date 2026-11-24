#!/usr/bin/env node
/**
 * Official HAFIZ 18-Expression Character Sheet Extractor & Normalizer
 *
 * Extracts all 18 approved expressions from the official transparent Character Sheet,
 * strips outer reference frames and bottom caption bars, aligns head/collar proportions
 * onto uniform transparent 384x384 PNGs, and outputs to:
 *   - assets/expressions/
 *   - native/HAFIZ.App/Assets/Expressions/
 *   - public/assets/expressions/
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const SHEET_PATH = 'public/assets/aistudio/Grayscale_Character_Expression_Reference_Sheet_445c7d92.png'
const OUTPUT_DIRS = [
  'assets/expressions',
  'native/HAFIZ.App/Assets/Expressions',
  'public/assets/expressions',
]

export const EXPRESSION_DEFINITIONS = [
  // Row 0
  { index: 0, row: 0, col: 0, id: 'neutral', nameEn: 'Neutral', nameAr: 'طبيعي / هادي', category: 'idle', viseme: 'sil' },
  { index: 1, row: 0, col: 1, id: 'soft_smile', nameEn: 'Soft Smile', nameAr: 'ابتسامة هادية', category: 'mood', viseme: null },
  { index: 2, row: 0, col: 2, id: 'big_smile', nameEn: 'Big Smile', nameAr: 'ابتسامة كبيرة', category: 'mood', viseme: null },
  { index: 3, row: 0, col: 3, id: 'laughing', nameEn: 'Laughing', nameAr: 'بيضحك ومبسوط', category: 'mood', viseme: null },
  { index: 4, row: 0, col: 4, id: 'talking_closed', nameEn: 'Talking — Closed Mouth', nameAr: 'نطق — فم مغلق', category: 'viseme', viseme: 'MBP' },
  { index: 5, row: 0, col: 5, id: 'talking_slightly_open', nameEn: 'Talking — Slightly Open', nameAr: 'نطق — فتحة خفيفة', category: 'viseme', viseme: 'FV' },
  // Row 1
  { index: 6, row: 1, col: 0, id: 'talking_wide_open', nameEn: 'Talking — Wide Open', nameAr: 'نطق — فتحة واسعة', category: 'viseme', viseme: 'AA' },
  { index: 7, row: 1, col: 1, id: 'talking_o', nameEn: 'Talking — O-Shape', nameAr: 'نطق — شكل O', category: 'viseme', viseme: 'OH' },
  { index: 8, row: 1, col: 2, id: 'talking_e', nameEn: 'Talking — E-Shape', nameAr: 'نطق — شكل E', category: 'viseme', viseme: 'EE' },
  { index: 9, row: 1, col: 3, id: 'talking_u', nameEn: 'Talking — U-Shape', nameAr: 'نطق — شكل U', category: 'viseme', viseme: 'OO' },
  { index: 10, row: 1, col: 4, id: 'smirk', nameEn: 'Smirk', nameAr: 'ابتسامة جانبية واثقة', category: 'mood', viseme: null },
  { index: 11, row: 1, col: 5, id: 'angry', nameEn: 'Angry', nameAr: 'غاضب', category: 'mood', viseme: null },
  // Row 2
  { index: 12, row: 2, col: 0, id: 'serious', nameEn: 'Serious / Determined', nameAr: 'جاد ومركّز', category: 'mood', viseme: null },
  { index: 13, row: 2, col: 1, id: 'surprised', nameEn: 'Surprised', nameAr: 'متفاجئ', category: 'mood', viseme: null },
  { index: 14, row: 2, col: 2, id: 'sad', nameEn: 'Sad', nameAr: 'حزين', category: 'mood', viseme: null },
  { index: 15, row: 2, col: 3, id: 'confused', nameEn: 'Confused / Skeptical', nameAr: 'مستغرب / بيفكر', category: 'thinking', viseme: null },
  { index: 16, row: 2, col: 4, id: 'shouting', nameEn: 'Shouting', nameAr: 'حماسي / بينادي', category: 'mood', viseme: null },
  { index: 17, row: 2, col: 5, id: 'wink', nameEn: 'Wink', nameAr: 'غمزة ودودة', category: 'mood', viseme: null },
]

// Exact cell bounds measured on the 1672x941 official Character Sheet
const COLS = [
  [14, 294],
  [303, 574],
  [583, 845],
  [854, 1117],
  [1126, 1381],
  [1387, 1657],
]

// Row vertical spans strictly from hair crown to just above each black caption bar
const ROWS = [
  [68, 321],
  [368, 593],
  [646, 874],
]

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  CRC_TABLE[n] = c >>> 0
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function decodePng(filePath) {
  const buf = fs.readFileSync(filePath)
  let pos = 8
  let w = 0
  let h = 0
  let ct = 6
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0)
      h = data.readUInt32BE(4)
      ct = data[9]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const bpp = ct === 6 ? 4 : 3
  const stride = w * bpp
  const out = Buffer.alloc(w * h * 4)
  const prev = Buffer.alloc(stride)
  const cur = Buffer.alloc(stride)
  const paeth = (a, b, c) => {
    const p = a + b - c
    const pa = Math.abs(p - a)
    const pb = Math.abs(p - b)
    const pc = Math.abs(p - c)
    return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
  }
  let offset = 0
  for (let y = 0; y < h; y++) {
    const f = raw[offset++]
    for (let i = 0; i < stride; i++) {
      const x = raw[offset++]
      const a = i >= bpp ? cur[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      cur[i] = (
        f === 0 ? x
          : f === 1 ? x + a
            : f === 2 ? x + b
              : f === 3 ? x + ((a + b) >> 1)
                : x + paeth(a, b, c)
      ) & 255
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      const s = x * bpp
      out[o] = cur[s]
      out[o + 1] = cur[s + 1]
      out[o + 2] = cur[s + 2]
      out[o + 3] = bpp === 4 ? cur[s + 3] : 255
    }
    cur.copy(prev)
  }
  return { w, h, data: out }
}

function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = w * 4
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0 // filter None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const compressed = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Extracts a single cell, strips outer frame border lines (top rounded edge + left/right lines)
 * while keeping HAFIZ's full hair, ears, face, beard, and leather collar intact.
 */
function extractCell(sheet, x0, x1, y0, y1) {
  // Trim outer 7px left/right frame stroke so vertical borders are cleanly removed
  const cropX0 = x0 + 7
  const cropX1 = x1 - 7
  const cw = cropX1 - cropX0 + 1
  const ch = y1 - y0 + 1
  const buf = Buffer.alloc(cw * ch * 4)

  for (let y = 0; y < ch; y++) {
    const sy = y0 + y
    for (let x = 0; x < cw; x++) {
      const sx = cropX0 + x
      const so = (sy * sheet.w + sx) * 4
      const doff = (y * cw + x) * 4
      buf[doff] = sheet.data[so]
      buf[doff + 1] = sheet.data[so + 1]
      buf[doff + 2] = sheet.data[so + 2]
      buf[doff + 3] = sheet.data[so + 3]
    }
  }

  // Clear residual outer 6px left/right frame stroke in upper 70% (above jacket shoulders)
  const shoulderY = Math.floor(ch * 0.70)
  for (let y = 0; y < shoulderY; y++) {
    for (let x = 0; x < 6; x++) {
      buf[(y * cw + x) * 4 + 3] = 0
      buf[(y * cw + (cw - 1 - x)) * 4 + 3] = 0
    }
  }

  // Surgically erase ONLY the thin horizontal top card-frame stroke (vertical thickness <= 9px including AA halo)
  // in the top 18% band. HAFIZ's hair mass extends continuously downward (>60px vertical thickness), so it is untouched.
  const topBandMax = Math.floor(ch * 0.18)
  const toErase = new Uint8Array(cw * topBandMax)
  for (let y = 0; y < topBandMax; y++) {
    for (let x = 0; x < cw; x++) {
      if (buf[(y * cw + x) * 4 + 3] <= 8) continue
      let yTop = y
      while (yTop > 0 && buf[((yTop - 1) * cw + x) * 4 + 3] > 8) yTop--
      let yBot = y
      while (yBot < ch - 1 && buf[((yBot + 1) * cw + x) * 4 + 3] > 8) yBot++
      const vThick = yBot - yTop + 1
      if (vThick <= 9) {
        toErase[y * cw + x] = 1
      }
    }
  }
  for (let y = 0; y < topBandMax; y++) {
    for (let x = 0; x < cw; x++) {
      if (toErase[y * cw + x]) {
        const o = (y * cw + x) * 4
        buf[o] = 0
        buf[o + 1] = 0
        buf[o + 2] = 0
        buf[o + 3] = 0
      }
    }
  }

  // Connected-component labeling seeded from HAFIZ's face & collar removes any detached border/caption specks
  const visited = new Uint8Array(cw * ch)
  const queue = new Int32Array(cw * ch)
  let head = 0
  let tail = 0

  // Seed flood-fill from HAFIZ's face center (cw/2, ch*0.48) and collar center (cw/2, ch*0.85)
  const seeds = [
    [Math.floor(cw * 0.5), Math.floor(ch * 0.48)],
    [Math.floor(cw * 0.5), Math.floor(ch * 0.86)],
    [Math.floor(cw * 0.5), Math.floor(ch * 0.22)],
  ]
  for (const [sx, sy] of seeds) {
    for (let dy = -12; dy <= 12; dy++) {
      for (let dx = -12; dx <= 12; dx++) {
        const nx = sx + dx
        const ny = sy + dy
        if (nx >= 0 && nx < cw && ny >= 0 && ny < ch) {
          const idx = ny * cw + nx
          if (!visited[idx] && buf[idx * 4 + 3] > 10) {
            visited[idx] = 1
            queue[tail++] = idx
          }
        }
      }
    }
  }

  while (head < tail) {
    const idx = queue[head++]
    const x = idx % cw
    const y = (idx - x) / cw
    const neighbors = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
      [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= cw || ny < 0 || ny >= ch) continue
      const nIdx = ny * cw + nx
      if (!visited[nIdx] && buf[nIdx * 4 + 3] > 8) {
        visited[nIdx] = 1
        queue[tail++] = nIdx
      }
    }
  }

  // Zero out any disconnected border artifact pixels
  for (let i = 0; i < cw * ch; i++) {
    if (!visited[i]) {
      buf[i * 4] = 0
      buf[i * 4 + 1] = 0
      buf[i * 4 + 2] = 0
      buf[i * 4 + 3] = 0
    }
  }

  // Softly taper bottom 8px of the leather jacket edge into transparency for seamless floating presentation
  const fadeRows = 8
  for (let y = ch - fadeRows; y < ch; y++) {
    const factor = (ch - 1 - y) / fadeRows
    for (let x = 0; x < cw; x++) {
      const o = (y * cw + x) * 4
      buf[o + 3] = Math.round(buf[o + 3] * factor)
    }
  }

  // Measure tight opaque bounding box for consistent alignment
  let minX = cw, maxX = 0, minY = ch, maxY = 0
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (buf[(y * cw + x) * 4 + 3] > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  return { w: cw, h: ch, data: buf, bounds: { minX, maxX, minY, maxY } }
}

/**
 * Bilinearly scales & aligns an extracted portrait onto a uniform 384x384 transparent canvas.
 */
function normalizeToSquare(cell, outSize = 384) {
  const { minX, maxX, minY, maxY } = cell.bounds
  const bw = Math.max(1, maxX - minX + 1)
  const bh = Math.max(1, maxY - minY + 1)

  // Fit portrait cleanly with consistent top margin (5%) and bottom alignment (98%)
  const targetH = outSize * 0.92
  const targetW = outSize * 0.90
  const scale = Math.min(targetH / bh, targetW / bw)
  const drawW = bw * scale
  const drawH = bh * scale
  const dstX0 = (outSize - drawW) / 2
  const dstY0 = outSize * 0.97 - drawH

  const out = Buffer.alloc(outSize * outSize * 4)

  for (let dy = 0; dy < outSize; dy++) {
    const syF = (dy - dstY0) / scale + minY
    if (syF < 0 || syF >= cell.h - 1) continue
    const sy0 = Math.floor(syF)
    const fy = syF - sy0
    const sy1 = Math.min(cell.h - 1, sy0 + 1)

    for (let dx = 0; dx < outSize; dx++) {
      const sxF = (dx - dstX0) / scale + minX
      if (sxF < 0 || sxF >= cell.w - 1) continue
      const sx0 = Math.floor(sxF)
      const fx = sxF - sx0
      const sx1 = Math.min(cell.w - 1, sx0 + 1)

      const o00 = (sy0 * cell.w + sx0) * 4
      const o10 = (sy0 * cell.w + sx1) * 4
      const o01 = (sy1 * cell.w + sx0) * 4
      const o11 = (sy1 * cell.w + sx1) * 4

      const w00 = (1 - fx) * (1 - fy)
      const w10 = fx * (1 - fy)
      const w01 = (1 - fx) * fy
      const w11 = fx * fy

      // Premultiplied alpha bilinear interpolation prevents dark fringes on transparent edges
      const a00 = cell.data[o00 + 3] / 255
      const a10 = cell.data[o10 + 3] / 255
      const a01 = cell.data[o01 + 3] / 255
      const a11 = cell.data[o11 + 3] / 255

      const a = w00 * a00 + w10 * a10 + w01 * a01 + w11 * a11
      if (a <= 0.002) continue

      const r = (w00 * cell.data[o00] * a00 + w10 * cell.data[o10] * a10 + w01 * cell.data[o01] * a01 + w11 * cell.data[o11] * a11) / a
      const g = (w00 * cell.data[o00 + 1] * a00 + w10 * cell.data[o10 + 1] * a10 + w01 * cell.data[o01 + 1] * a01 + w11 * cell.data[o11 + 1] * a11) / a
      const b = (w00 * cell.data[o00 + 2] * a00 + w10 * cell.data[o10 + 2] * a10 + w01 * cell.data[o01 + 2] * a01 + w11 * cell.data[o11 + 2] * a11) / a

      const dst = (dy * outSize + dx) * 4
      out[dst] = Math.max(0, Math.min(255, Math.round(r)))
      out[dst + 1] = Math.max(0, Math.min(255, Math.round(g)))
      out[dst + 2] = Math.max(0, Math.min(255, Math.round(b)))
      out[dst + 3] = Math.max(0, Math.min(255, Math.round(a * 255)))
    }
  }

  return { w: outSize, h: outSize, data: out }
}

function main() {
  if (!fs.existsSync(SHEET_PATH)) {
    console.error(`Official Character Sheet not found at ${SHEET_PATH}`)
    process.exit(1)
  }

  for (const dir of OUTPUT_DIRS) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const sheet = decodePng(SHEET_PATH)
  console.log(`Decoded official Character Sheet: ${sheet.w}x${sheet.h}`)

  // Build dark-navy QA contact sheet (6x3 of 192px tiles = 1152x576) to visually verify transparency
  const tile = 192
  const proofW = tile * 6
  const proofH = tile * 3
  const proof = Buffer.alloc(proofW * proofH * 4)
  for (let i = 0; i < proofW * proofH; i++) {
    proof[i * 4] = 8
    proof[i * 4 + 1] = 19
    proof[i * 4 + 2] = 35
    proof[i * 4 + 3] = 255
  }

  const manifestEntries = []

  for (const def of EXPRESSION_DEFINITIONS) {
    const [x0, x1] = COLS[def.col]
    const [y0, y1] = ROWS[def.row]
    const cell = extractCell(sheet, x0, x1, y0, y1)
    const normalized = normalizeToSquare(cell, 384)
    const pngBytes = encodePng(normalized.w, normalized.h, normalized.data)

    const filename = `${def.id}.png`
    for (const dir of OUTPUT_DIRS) {
      fs.writeFileSync(path.join(dir, filename), pngBytes)
    }

    // Downsample 2x into dark-background QA proof sheet
    for (let y = 0; y < tile; y++) {
      for (let x = 0; x < tile; x++) {
        const src = ((y * 2) * 384 + (x * 2)) * 4
        const dst = ((def.row * tile + y) * proofW + (def.col * tile + x)) * 4
        const a = normalized.data[src + 3] / 255
        proof[dst] = Math.round(normalized.data[src] * a + proof[dst] * (1 - a))
        proof[dst + 1] = Math.round(normalized.data[src + 1] * a + proof[dst + 1] * (1 - a))
        proof[dst + 2] = Math.round(normalized.data[src + 2] * a + proof[dst + 2] * (1 - a))
        proof[dst + 3] = 255
      }
    }

    manifestEntries.push({
      index: def.index,
      id: def.id,
      nameEn: def.nameEn,
      nameAr: def.nameAr,
      category: def.category,
      viseme: def.viseme,
      file: filename,
      width: normalized.w,
      height: normalized.h,
      transparent: true,
    })
  }

  const manifest = {
    sourceSheet: SHEET_PATH,
    expressionCount: manifestEntries.length,
    resolution: { width: 384, height: 384 },
    format: 'PNG-RGBA-Transparent',
    expressions: manifestEntries,
  }

  for (const dir of OUTPUT_DIRS) {
    fs.writeFileSync(path.join(dir, 'expressions.manifest.json'), JSON.stringify(manifest, null, 2))
  }

  fs.mkdirSync('.playwright-cli', { recursive: true })
  fs.writeFileSync('.playwright-cli/extracted-18-proof.png', encodePng(proofW, proofH, proof))
  console.log(`Extracted and normalized ${manifestEntries.length} transparent HAFIZ expressions cleanly.`)
}

main()
