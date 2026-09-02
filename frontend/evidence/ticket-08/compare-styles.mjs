import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { deflateSync, inflateSync } from 'node:zlib'

const scriptPath = fileURLToPath(import.meta.url)
const evidenceDir = dirname(scriptPath)
const repoRoot = resolve(evidenceDir, '../../..')
const fixturePath = join(evidenceDir, 'fixture.html')
const chromePath = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewport = { width: 1440, height: 3000, deviceScaleFactor: 1 }
const tokenFiles = ['borders.css', 'colors.css', 'fonts.css', 'motion.css', 'spacing.css', 'typography.css']

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function readBaselineStyles() {
  return execFileSync('git', ['show', '61067a0:frontend/src/styles.css'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

function readTokenStyles() {
  const fontDirectory = pathToFileURL(join(repoRoot, 'frontend/src/assets/fonts')).href.replace(/\/$/, '')
  return tokenFiles
    .map((fileName) => readFileSync(join(repoRoot, 'frontend/src/tokens', fileName), 'utf8'))
    .join('\n')
    .replaceAll("url('../assets/fonts/", `url('${fontDirectory}/`)
}

function createFixture(styles) {
  const fixture = readFileSync(fixturePath, 'utf8')
  const requiredHooks = [
    'data-testid="building-catalog"',
    'data-testid="room-catalog"',
    'data-testid="meter-screen"',
    'data-testid="invoice-detail"',
    'data-testid="account-management"',
    'class="eyebrow"',
    'class="status-message"',
    'class="field"',
    'class="ma-no-print"',
    'class="sr-only"',
  ]

  for (const hook of requiredHooks) assert(fixture.includes(hook), `fixture is missing required hook: ${hook}`)

  return fixture.replace('__TOKENS__', readTokenStyles()).replace('__STYLES__', styles)
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuffer, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([length, crcInput, crc])
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function encodePng({ width, height, pixels }) {
  const rowSize = width * 4
  const scanlines = Buffer.alloc((rowSize + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const scanlineOffset = y * (rowSize + 1)
    scanlines[scanlineOffset] = 0
    Buffer.from(pixels.buffer, pixels.byteOffset + y * rowSize, rowSize).copy(scanlines, scanlineOffset + 1)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  header[10] = 0
  header[11] = 0
  header[12] = 0

  return Buffer.concat([
    pngSignature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const aboveDistance = Math.abs(estimate - above)
  const upperLeftDistance = Math.abs(estimate - upperLeft)
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left
  if (aboveDistance <= upperLeftDistance) return above
  return upperLeft
}

function decodePng(value) {
  const png = Buffer.isBuffer(value) ? value : Buffer.from(value)
  assert(png.subarray(0, 8).equals(pngSignature), 'unsupported PNG signature')

  let offset = 8
  let width
  let height
  let bitDepth
  let colorType
  let interlaceMethod
  const idatChunks = []

  while (offset < png.length) {
    assert(offset + 12 <= png.length, 'truncated PNG chunk')
    const length = png.readUInt32BE(offset)
    const type = png.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    assert(dataEnd + 4 <= png.length, `truncated PNG ${type} chunk`)
    const data = png.subarray(dataStart, dataEnd)

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlaceMethod = data[12]
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }

    offset = dataEnd + 4
  }

  assert(width && height && bitDepth === 8 && interlaceMethod === 0, 'only non-interlaced 8-bit PNGs are supported')
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType]
  assert(channels, `unsupported PNG color type: ${colorType}`)

  const bytesPerPixel = channels
  const rowSize = width * bytesPerPixel
  const raw = inflateSync(Buffer.concat(idatChunks))
  const pixels = new Uint8Array(width * height * 4)
  let rawOffset = 0
  let previousRow = new Uint8Array(rowSize)

  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawOffset]
    rawOffset += 1
    const encodedRow = raw.subarray(rawOffset, rawOffset + rowSize)
    rawOffset += rowSize
    const row = new Uint8Array(rowSize)

    for (let x = 0; x < rowSize; x += 1) {
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0
      const above = previousRow[x] ?? 0
      const upperLeft = x >= bytesPerPixel ? previousRow[x - bytesPerPixel] : 0
      const encoded = encodedRow[x]
      if (filter === 0) row[x] = encoded
      else if (filter === 1) row[x] = (encoded + left) & 0xff
      else if (filter === 2) row[x] = (encoded + above) & 0xff
      else if (filter === 3) row[x] = (encoded + Math.floor((left + above) / 2)) & 0xff
      else if (filter === 4) row[x] = (encoded + paethPredictor(left, above, upperLeft)) & 0xff
      else throw new Error(`unsupported PNG filter: ${filter}`)
    }

    for (let x = 0; x < width; x += 1) {
      const sourceOffset = x * channels
      const targetOffset = (y * width + x) * 4
      if (colorType === 6) {
        pixels.set(row.subarray(sourceOffset, sourceOffset + 4), targetOffset)
      } else if (colorType === 2) {
        pixels.set(row.subarray(sourceOffset, sourceOffset + 3), targetOffset)
        pixels[targetOffset + 3] = 255
      } else if (colorType === 4) {
        pixels[targetOffset] = row[sourceOffset]
        pixels[targetOffset + 1] = row[sourceOffset]
        pixels[targetOffset + 2] = row[sourceOffset]
        pixels[targetOffset + 3] = row[sourceOffset + 1]
      } else {
        pixels[targetOffset] = row[sourceOffset]
        pixels[targetOffset + 1] = row[sourceOffset]
        pixels[targetOffset + 2] = row[sourceOffset]
        pixels[targetOffset + 3] = 255
      }
    }

    previousRow = row
  }

  return { width, height, pixels }
}

export function compareRgba(before, after) {
  assert(before.width === after.width && before.height === after.height, 'rendered images have different dimensions')
  assert(before.pixels.length === after.pixels.length, 'rendered images have different pixel buffers')

  let differingPixels = 0
  let maxChannelDelta = 0
  let totalAbsDelta = 0
  for (let offset = 0; offset < before.pixels.length; offset += 4) {
    let pixelDiffers = false
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(before.pixels[offset + channel] - after.pixels[offset + channel])
      if (delta > 0) pixelDiffers = true
      maxChannelDelta = Math.max(maxChannelDelta, delta)
      totalAbsDelta += delta
    }
    if (pixelDiffers) differingPixels += 1
  }

  return {
    width: before.width,
    height: before.height,
    totalPixels: before.width * before.height,
    differingPixels,
    maxChannelDelta,
    totalAbsDelta,
  }
}

function createDiff(before, after) {
  const pixels = new Uint8Array(before.pixels.length)
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const delta = Math.max(
      Math.abs(before.pixels[offset] - after.pixels[offset]),
      Math.abs(before.pixels[offset + 1] - after.pixels[offset + 1]),
      Math.abs(before.pixels[offset + 2] - after.pixels[offset + 2]),
      Math.abs(before.pixels[offset + 3] - after.pixels[offset + 3]),
    )
    if (delta === 0) {
      pixels[offset] = 255
      pixels[offset + 1] = 255
      pixels[offset + 2] = 255
      pixels[offset + 3] = 0
    } else {
      pixels[offset] = 255
      pixels[offset + 1] = Math.max(0, 255 - delta * 8)
      pixels[offset + 2] = Math.max(0, 255 - delta * 8)
      pixels[offset + 3] = 255
    }
  }
  return { width: before.width, height: before.height, pixels }
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
}

async function stopChrome(chromeProcess) {
  if (chromeProcess.exitCode !== null) return

  await new Promise((resolvePromise) => {
    let forcedTermination
    const finish = () => {
      clearTimeout(forcedTermination)
      resolvePromise()
    }
    chromeProcess.once('exit', finish)
    try {
      process.kill(-chromeProcess.pid, 'SIGTERM')
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
      finish()
      return
    }
    forcedTermination = setTimeout(() => {
      try {
        process.kill(-chromeProcess.pid, 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') throw error
      }
    }, 1000)
  })
}

async function render(styles, label, temporaryDirectory, outputPath) {
  const htmlPath = join(temporaryDirectory, `${label}.html`)
  writeFileSync(htmlPath, createFixture(styles))

  const chromeArguments = [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--run-all-compositor-stages-before-draw',
    '--force-device-scale-factor=1',
    '--force-light-mode',
    '--virtual-time-budget=3000',
    `--window-size=${viewport.width},${viewport.height}`,
    `--user-data-dir=${join(temporaryDirectory, `${label}-profile`)}`,
    `--screenshot=${outputPath}`,
    pathToFileURL(htmlPath).href,
  ]

  const chromeProcess = spawn(chromePath, chromeArguments, {
    cwd: repoRoot,
    detached: true,
    stdio: 'ignore',
  })

  let previousSize = -1
  let stableSamples = 0
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    if (existsSync(outputPath)) {
      const currentSize = statSync(outputPath).size
      if (currentSize > 0 && currentSize === previousSize) stableSamples += 1
      else stableSamples = 0
      previousSize = currentSize
      if (stableSamples >= 2) break
    }
    if (chromeProcess.exitCode !== null && !existsSync(outputPath)) {
      throw new Error(`Chrome exited before writing ${outputPath}`)
    }
    await sleep(100)
  }

  try {
    assert(existsSync(outputPath) && statSync(outputPath).size > 0, `Chrome did not write ${outputPath} within 30 seconds`)
  } finally {
    await stopChrome(chromeProcess)
  }
  return decodePng(readFileSync(outputPath))
}

async function run() {
  mkdirSync(evidenceDir, { recursive: true })
  const beforeStyles = readBaselineStyles()
  const afterStyles = readFileSync(join(repoRoot, 'frontend/src/styles.css'), 'utf8')
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'ticket-08-visual-'))
  const beforePath = join(evidenceDir, 'before.png')
  const afterPath = join(evidenceDir, 'after.png')
  const diffPath = join(evidenceDir, 'diff.png')
  const comparisonPath = join(evidenceDir, 'comparison.json')

  try {
    const beforeRenderPath = join(temporaryDirectory, 'before.png')
    const afterRenderPath = join(temporaryDirectory, 'after.png')
    const before = await render(beforeStyles, 'before', temporaryDirectory, beforeRenderPath)
    const after = await render(afterStyles, 'after', temporaryDirectory, afterRenderPath)
    writeFileSync(beforePath, readFileSync(beforeRenderPath))
    writeFileSync(afterPath, readFileSync(afterRenderPath))
    const comparison = compareRgba(before, after)
    writeFileSync(diffPath, encodePng(createDiff(before, after)))

    const result = {
      ticket: '08',
      baselineStyles: 'git show 61067a0:frontend/src/styles.css',
      baselineStylesSha256: sha256(beforeStyles),
      finalStyles: 'frontend/src/styles.css from the current worktree',
      finalStylesSha256: sha256(afterStyles),
      fixture: 'frontend/evidence/ticket-08/fixture.html',
      viewport,
      images: {
        before: 'frontend/evidence/ticket-08/before.png',
        after: 'frontend/evidence/ticket-08/after.png',
        diff: 'frontend/evidence/ticket-08/diff.png',
      },
      comparison,
      pixelIdentity: comparison.differingPixels === 0,
    }
    writeFileSync(comparisonPath, `${JSON.stringify(result, null, 2)}\n`)

    console.log(`baseline: ${result.baselineStyles}`)
    console.log(`candidate: ${result.finalStyles}`)
    console.log(`fixture: ${result.fixture}`)
    console.log(`viewport: ${viewport.width}x${viewport.height} @${viewport.deviceScaleFactor}x`)
    console.log(`before: ${relative(repoRoot, beforePath)}`)
    console.log(`after: ${relative(repoRoot, afterPath)}`)
    console.log(`diff: ${relative(repoRoot, diffPath)}`)
    console.log(`comparison: ${relative(repoRoot, comparisonPath)}`)
    console.log(`pixels: ${comparison.differingPixels}/${comparison.totalPixels} differ; max channel delta ${comparison.maxChannelDelta}; total absolute delta ${comparison.totalAbsDelta}`)
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.stack : error)
    process.exitCode = 1
  })
}
