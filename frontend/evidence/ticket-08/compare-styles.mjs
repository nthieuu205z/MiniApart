import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { deflateSync, inflateSync } from 'node:zlib'
import { createServer } from 'vite'

const scriptPath = fileURLToPath(import.meta.url)
const evidenceDir = dirname(scriptPath)
const repoRoot = resolve(evidenceDir, '../../..')
const frontendRoot = join(repoRoot, 'frontend')
const chromePath = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const fixtureConfigPath = join(evidenceDir, 'fixture-config.json')
const renderedComponentFiles = [
  'frontend/evidence/ticket-08/fixture.tsx',
  'frontend/src/App.tsx',
  'frontend/src/DanhMucToaNha.tsx',
  'frontend/src/DanhMucPhong.tsx',
  'frontend/src/GhiChiSo.tsx',
  'frontend/src/HoaDon.tsx',
  'frontend/src/QuanLyTaiKhoan.tsx',
]

const fixtureConfig = JSON.parse(readFileSync(fixtureConfigPath, 'utf8'))

export const SCREEN_CASES = fixtureConfig.screens
export const VIEWPORTS = fixtureConfig.viewports

export function buildEvidencePlan(viewports = VIEWPORTS, screens = SCREEN_CASES) {
  return viewports.flatMap((viewport) => screens.map((screen) => ({
    viewport,
    screen,
    imageStem: `${viewport.id}-${screen.id}`,
  })))
}

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

export function assertRenderedApp(screen, evidence) {
  assert(evidence.ready, `real App render did not become ready for ${screen.id}`)
  assert(!evidence.invalid, `runtime App render is invalid for ${screen.id}: ${evidence.invalid}`)
  assert(evidence.renderer === 'App', `runtime document for ${screen.id} was not rendered through App`)
  assert(evidence.screen === screen.id, `runtime document reports the wrong screen for ${screen.id}`)
  assert(evidence.surfacePresent, `runtime App output is missing ${screen.testId}`)
  assert(evidence.settledTextPresent, `runtime App output for ${screen.id} did not pass the settled textContent check: ${screen.readyText}`)
  assert(evidence.route === screen.route && evidence.locationPathname === screen.route, `runtime App output reports the wrong route for ${screen.id}`)
  assert(evidence.apiRequests === 'deterministic-mock' && evidence.unexpectedRequestCount === 0, `runtime App output for ${screen.id} did not use only the deterministic API fixture`)
  assert(evidence.prefersLightColorScheme === true, `runtime App output for ${screen.id} was not rendered under the required light color scheme`)
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

export function assertAppearancePreserved(comparison) {
  assert(
    comparison.differingPixels === 0,
    `${comparison.differingPixels} rendered pixel${comparison.differingPixels === 1 ? '' : 's'} differ; Ticket 08 requires pixel identity`,
  )
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

function buildChromeArguments(profilePath) {
  return [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-sync',
    '--metrics-recording-only',
    '--no-pings',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--run-all-compositor-stages-before-draw',
    '--force-device-scale-factor=1',
    '--force-light-mode',
    '--force-prefers-reduced-motion',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1',
    `--user-data-dir=${profilePath}`,
    '--remote-debugging-port=0',
    'about:blank',
  ]
}

class CdpClient {
  constructor(webSocketUrl) {
    this.nextId = 1
    this.pending = new Map()
    this.socket = new WebSocket(webSocketUrl)
  }

  async connect() {
    await new Promise((resolvePromise, rejectPromise) => {
      this.socket.addEventListener('open', resolvePromise, { once: true })
      this.socket.addEventListener('error', rejectPromise, { once: true })
    })
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (!message.id) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
  }

  send(method, params = {}) {
    const id = this.nextId
    this.nextId += 1
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.socket.close()
  }
}

async function launchChrome(temporaryDirectory, viewport) {
  const profilePath = join(temporaryDirectory, `chrome-profile-${viewport.id}`)
  const chromeProcess = spawn(chromePath, buildChromeArguments(profilePath), {
    cwd: frontendRoot,
    detached: true,
    stdio: 'ignore',
  })
  const portFile = join(profilePath, 'DevToolsActivePort')
  const deadline = Date.now() + 15000
  while (!existsSync(portFile) && Date.now() < deadline) {
    if (chromeProcess.exitCode !== null) throw new Error('Chrome exited before opening its debugging port')
    await sleep(50)
  }
  assert(existsSync(portFile), 'Chrome did not open its debugging port within 15 seconds')
  const [port] = readFileSync(portFile, 'utf8').trim().split('\n')
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())
  const page = targets.find((target) => target.type === 'page')
  assert(page?.webSocketDebuggerUrl, 'Chrome did not expose a page target')
  const client = new CdpClient(page.webSocketDebuggerUrl)
  await client.connect()
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: false,
  })
  await client.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  })
  return {
    client,
    close: async () => {
      try {
        await client.send('Browser.close')
      } catch {
        try {
          process.kill(-chromeProcess.pid, 'SIGTERM')
        } catch (error) {
          if (error.code !== 'ESRCH') throw error
        }
      } finally {
        client.close()
      }
    },
  }
}

async function render(chrome, serverUrl, screen, variant, outputPath) {
  const url = `${serverUrl}/evidence/ticket-08/fixture.html?screen=${encodeURIComponent(screen.id)}&variant=${variant}`
  await chrome.client.send('Page.navigate', { url })
  const deadline = Date.now() + 15000
  let state = { ready: false, invalid: null }
  while (!state.ready && !state.invalid && Date.now() < deadline) {
    const evaluation = await chrome.client.send('Runtime.evaluate', {
      expression: `({ ready: document.documentElement.dataset.ticket08Ready === 'true' && document.documentElement.dataset.ticket08Screen === ${JSON.stringify(screen.id)}, invalid: document.documentElement.dataset.ticket08Invalid ?? null })`,
      returnByValue: true,
    })
    state = evaluation.result.value
    if (!state.ready && !state.invalid) await sleep(25)
  }
  assert(!state.invalid, `runtime App render is invalid for ${screen.id}: ${state.invalid}`)
  assert(state.ready, `real App render did not become ready for ${screen.id} within 15 seconds`)
  const evidenceEvaluation = await chrome.client.send('Runtime.evaluate', {
    expression: `({
      ready: document.documentElement.dataset.ticket08Ready === 'true',
      renderer: document.documentElement.dataset.ticket08Renderer ?? null,
      screen: document.documentElement.dataset.ticket08Screen ?? null,
      route: document.documentElement.dataset.ticket08Route ?? null,
      locationPathname: window.location.pathname,
      apiRequests: document.documentElement.dataset.ticket08ApiRequests ?? null,
      unexpectedRequestCount: Number(document.documentElement.dataset.ticket08UnexpectedRequestCount ?? NaN),
      prefersLightColorScheme: window.matchMedia('(prefers-color-scheme: light)').matches,
      surfacePresent: Boolean(document.querySelector(${JSON.stringify(`[data-testid="${screen.testId}"]`)})),
      settledTextPresent: (document.body.textContent ?? '').includes(${JSON.stringify(screen.readyText)}),
      invalid: document.documentElement.dataset.ticket08Invalid ?? null,
    })`,
    returnByValue: true,
  })
  assertRenderedApp(screen, evidenceEvaluation.result.value)
  if (process.env.TICKET08_DEBUG_SCREEN === screen.id) {
    const styleEvaluation = await chrome.client.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('h1,h2,h3,h4,p,dt,dd,.eyebrow,.field,.status-message')).map((element, index) => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return { index, tag: element.tagName, className: element.className, text: (element.textContent || '').trim().slice(0, 80), rect: [rect.x, rect.y, rect.width, rect.height], color: style.color, margin: [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft], font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing], padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft], border: [style.borderTopWidth, style.borderTopColor], background: style.backgroundColor, display: style.display, gap: style.gap } })`,
      returnByValue: true,
    })
    console.log(`STYLE_DEBUG ${screen.id} ${variant} ${JSON.stringify(styleEvaluation.result.value)}`)
  }
  const screenshot = await chrome.client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'))
  return decodePng(readFileSync(outputPath))
}

function ticketStylesPlugin(stylesByVariant) {
  return {
    name: 'ticket-08-stylesheet-evidence',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/__ticket08_styles.css')) return next()
        const variant = new URL(request.url, 'http://ticket08.local').searchParams.get('variant')
        const styles = stylesByVariant[variant]
        if (typeof styles !== 'string') {
          response.statusCode = 400
          response.end('unknown ticket stylesheet variant')
          return
        }
        response.setHeader('Content-Type', 'text/css; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(styles)
      })
    },
  }
}

async function startFixtureServer(stylesByVariant) {
  const server = await createServer({
    root: frontendRoot,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0 },
    plugins: [ticketStylesPlugin(stylesByVariant)],
  })
  await server.listen()
  const address = server.httpServer?.address()
  assert(address && typeof address !== 'string', 'Vite evidence server did not expose a local port')
  return { server, url: `http://127.0.0.1:${address.port}` }
}

async function assertRealComponentModuleGraph(server) {
  const entry = await server.moduleGraph.getModuleByUrl('/evidence/ticket-08/fixture.tsx')
  assert(entry, 'Vite did not load the real-component fixture entry')
  const visited = new Set()
  const sourcePaths = new Set()
  const pending = [entry]
  while (pending.length > 0) {
    const module = pending.pop()
    if (!module || visited.has(module)) continue
    visited.add(module)
    if (module.file) sourcePaths.add(relative(repoRoot, module.file))
    pending.push(...module.importedModules)
  }
  for (const sourcePath of renderedComponentFiles) {
    assert(sourcePaths.has(sourcePath), `Vite runtime module graph did not include ${sourcePath}`)
  }
  return renderedComponentFiles.map((sourcePath) => ({
    path: sourcePath,
    sha256: sha256(readFileSync(join(repoRoot, sourcePath))),
  }))
}

async function run() {
  mkdirSync(evidenceDir, { recursive: true })
  const beforeStyles = readBaselineStyles()
  const afterStyles = readFileSync(join(repoRoot, 'frontend/src/styles.css'), 'utf8')
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'ticket-08-visual-'))
  const comparisonPath = join(evidenceDir, 'comparison.json')
  let fixtureServer
  let chrome

  writeFileSync(comparisonPath, `${JSON.stringify({ ticket: '08', comparisonCompleted: false, status: 'comparison did not complete' }, null, 2)}\n`)

  try {
    fixtureServer = await startFixtureServer({ before: beforeStyles, after: afterStyles })
    const viewports = {}
    let differingPixels = 0
    let totalPixels = 0
    let totalAbsDelta = 0
    let maxChannelDelta = 0

    for (const viewport of VIEWPORTS) {
      chrome = await launchChrome(temporaryDirectory, viewport)
      const viewportScreens = {}
      let viewportDifferingPixels = 0
      let viewportTotalPixels = 0
      let viewportTotalAbsDelta = 0
      let viewportMaxChannelDelta = 0

      try {
        for (const { screen, imageStem } of buildEvidencePlan([viewport])) {
          const beforePath = join(evidenceDir, `before-${imageStem}.png`)
          const afterPath = join(evidenceDir, `after-${imageStem}.png`)
          const diffPath = join(evidenceDir, `diff-${imageStem}.png`)
          const beforeRenderPath = join(temporaryDirectory, `before-${imageStem}.png`)
          const afterRenderPath = join(temporaryDirectory, `after-${imageStem}.png`)
          const repeatRenderPath = join(temporaryDirectory, `repeat-${imageStem}.png`)
          const before = await render(chrome, fixtureServer.url, screen, 'before', beforeRenderPath)
          const after = await render(chrome, fixtureServer.url, screen, 'after', afterRenderPath)
          const repeat = await render(chrome, fixtureServer.url, screen, 'after', repeatRenderPath)
          const stability = compareRgba(after, repeat)
          assert(stability.differingPixels === 0, `Chrome rasterization was not deterministic for ${imageStem}: ${stability.differingPixels} pixels changed on an identical rerender`)
          const comparison = compareRgba(before, after)
          writeFileSync(beforePath, readFileSync(beforeRenderPath))
          writeFileSync(afterPath, readFileSync(afterRenderPath))
          writeFileSync(diffPath, encodePng(createDiff(before, after)))

          viewportDifferingPixels += comparison.differingPixels
          viewportTotalPixels += comparison.totalPixels
          viewportTotalAbsDelta += comparison.totalAbsDelta
          viewportMaxChannelDelta = Math.max(viewportMaxChannelDelta, comparison.maxChannelDelta)
          viewportScreens[screen.id] = {
            route: screen.route,
            renderedThrough: 'App',
            runtimeTestId: screen.testId,
            deterministicApiData: true,
            runtimeChecksPassed: { before: true, after: true },
            stability,
            images: {
              before: relative(repoRoot, beforePath),
              after: relative(repoRoot, afterPath),
              diff: relative(repoRoot, diffPath),
            },
            comparison,
            pixelIdentity: comparison.differingPixels === 0,
          }
        }
      } finally {
        await chrome.close()
        chrome = undefined
      }

      const viewportComparison = {
        totalPixels: viewportTotalPixels,
        differingPixels: viewportDifferingPixels,
        maxChannelDelta: viewportMaxChannelDelta,
        totalAbsDelta: viewportTotalAbsDelta,
      }
      differingPixels += viewportComparison.differingPixels
      totalPixels += viewportComparison.totalPixels
      totalAbsDelta += viewportComparison.totalAbsDelta
      maxChannelDelta = Math.max(maxChannelDelta, viewportComparison.maxChannelDelta)
      viewports[viewport.id] = {
        viewport,
        screens: viewportScreens,
        comparison: viewportComparison,
        appearancePreserved: viewportComparison.differingPixels === 0,
        pixelIdentity: viewportComparison.differingPixels === 0,
      }
    }

    const renderedComponentSources = await assertRealComponentModuleGraph(fixtureServer.server)
    const comparison = { totalPixels, differingPixels, maxChannelDelta, totalAbsDelta }

    const result = {
      ticket: '08',
      comparisonCompleted: true,
      baselineStyles: 'git show 61067a0:frontend/src/styles.css',
      baselineStylesSha256: sha256(beforeStyles),
      finalStyles: 'frontend/src/styles.css from the current worktree',
      finalStylesSha256: sha256(afterStyles),
      fixture: {
        html: 'frontend/evidence/ticket-08/fixture.html',
        entry: 'frontend/evidence/ticket-08/fixture.tsx',
        config: 'frontend/evidence/ticket-08/fixture-config.json',
        renderer: 'App',
        deterministicApiData: true,
      },
      renderedComponentSources,
      browser: execFileSync(chromePath, ['--version'], { encoding: 'utf8' }).trim(),
      networkPolicy: 'Fixture assets and API mocks are local; Chrome rejects non-local hostname resolution.',
      viewports: VIEWPORTS,
      stabilityRequirement: { differingPixels: 0, rationale: 'Each current-styles render is repeated and must be pixel-identical before its baseline/current result is recorded.' },
      viewportResults: viewports,
      comparison,
      appearancePreservedAtTestedViewport: differingPixels === 0,
      pixelIdentity: differingPixels === 0,
    }
    writeFileSync(comparisonPath, `${JSON.stringify(result, null, 2)}\n`)

    console.log(`baseline: ${result.baselineStyles}`)
    console.log(`candidate: ${result.finalStyles}`)
    console.log(`fixture: ${result.fixture.entry} rendering App with deterministic API data`)
    console.log(`viewports: ${VIEWPORTS.map(({ width, height }) => `${width}x${height}`).join(', ')}`)
    for (const [viewportId, viewportResult] of Object.entries(viewports)) {
      console.log(`${viewportId}: ${viewportResult.comparison.differingPixels}/${viewportResult.comparison.totalPixels} pixels differ`)
      for (const [screenId, screenResult] of Object.entries(viewportResult.screens)) {
        console.log(`${viewportId}/${screenId}: ${screenResult.comparison.differingPixels}/${screenResult.comparison.totalPixels} pixels differ; deterministic rerender ${screenResult.stability.differingPixels} pixels differ`)
      }
    }
    console.log(`comparison: ${relative(repoRoot, comparisonPath)}`)
    console.log(`aggregate: ${comparison.differingPixels}/${comparison.totalPixels} pixels differ; max channel delta ${comparison.maxChannelDelta}; total absolute delta ${comparison.totalAbsDelta}`)
    console.log(`pixel identity: ${result.pixelIdentity}`)
    assertAppearancePreserved(comparison)
  } finally {
    await chrome?.close()
    await fixtureServer?.server.close()
    rmSync(temporaryDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.stack : error)
    process.exitCode = 1
  })
}
