import { execFileSync, spawn } from 'node:child_process'
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { relative, resolve, sep } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const timeout = 60_000
const sourceDirectories = ['src', 'server', 'api', 'scripts']
const requiredRootFiles = ['vite.config.js', 'eslint.config.js']
const testFilePattern = /\.(?:test|spec)\.(?:js|jsx)$/
const forbiddenMarkers = [
  ['@ts', '-nocheck'].join(''),
  ['@ts', '-ignore'].join(''),
  ['@ts', '-expect-error'].join(''),
  ['eslint', '-disable'].join(''),
]

class ScopeMismatch extends Error {}

function toPosix(path) {
  return path.split(sep).join('/')
}

function projectRelative(path) {
  return toPosix(relative(projectRoot, path))
}

function isWithin(path, parent) {
  return path === parent || path.startsWith(`${parent}${sep}`)
}

function isCanonicalSourceFile(name) {
  return name.endsWith('.js') || name.endsWith('.jsx')
}

function isUnsupportedJavaScriptLikeFile(name) {
  return /\.(?:[cm]?js|[cm]?ts|tsx|jsx)$/i.test(name) && !isCanonicalSourceFile(name)
}

function isUnassignedRootExecutableFile(name) {
  return isUnsupportedJavaScriptLikeFile(name)
    || (name.endsWith('.js') && !requiredRootFiles.includes(name))
}

function isCanonicalTestFile(name) {
  return /\.(?:test|spec)\.(?:js|jsx)$/.test(name)
}

function forbiddenMarkerIn(content) {
  return forbiddenMarkers.find((candidate) => content.includes(candidate))
}

function entryKind(entry) {
  if (entry.isSymbolicLink()) return 'symlink'
  if (entry.isDirectory()) return 'directory'
  if (entry.isFile()) return 'file'
  return 'other'
}

function terminateChildTree(child, signal) {
  if (!child.pid) return
  if (process.platform === 'win32') {
    try {
      const force = signal === 'SIGKILL' ? ['/F'] : []
      execFileSync('taskkill', ['/pid', String(child.pid), '/T', ...force], { stdio: 'ignore', windowsHide: true })
      return
    } catch {
      if (signal === 'SIGKILL') child.kill(signal)
      return
    }
  }
  try { process.kill(-child.pid, signal) } catch { child.kill(signal) }
}

function walkDirectory(relativeDirectory, files) {
  const absoluteDirectory = resolve(projectRoot, relativeDirectory)

  for (const entry of lstatSync(absoluteDirectory).isDirectory()
    ? readdirSync(absoluteDirectory, { withFileTypes: true })
    : []) {
    const absolutePath = resolve(absoluteDirectory, entry.name)
    const relativePath = projectRelative(absolutePath)

    if (entryKind(entry) === 'symlink') {
      throw new ScopeMismatch(`Link simbólico não é permitido no escopo: ${relativePath}`)
    }
    if (entryKind(entry) === 'directory') {
      walkDirectory(relativePath, files)
      continue
    }
    if (entryKind(entry) !== 'file') {
      throw new ScopeMismatch(`Entrada sem contexto atribuído: ${relativePath}`)
    }
    if (isUnsupportedJavaScriptLikeFile(entry.name)) {
      throw new ScopeMismatch(`Extensão não canônica no escopo: ${relativePath}`)
    }
    if (!isCanonicalSourceFile(entry.name)) {
      continue
    }
    if (!isCanonicalTestFile(entry.name) && /\.(?:test|spec)\./i.test(entry.name)) {
      throw new ScopeMismatch(`Teste não canônico: ${relativePath}`)
    }
    files.push(relativePath)
  }
}

function assertRequiredDirectory(directory) {
  const absoluteDirectory = resolve(projectRoot, directory)
  if (!existsSync(absoluteDirectory)) {
    throw new ScopeMismatch(`Diretório obrigatório ausente: ${directory}`)
  }
  const stats = lstatSync(absoluteDirectory)
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new ScopeMismatch(`Diretório obrigatório inválido: ${directory}`)
  }
}

function isScopedRootEntry(name) {
  return name.endsWith('.jsx')
    || isUnassignedRootExecutableFile(name)
    || requiredRootFiles.includes(name)
}

function enumerateInventory() {
  const files = []
  for (const directory of sourceDirectories) {
    assertRequiredDirectory(directory)
    walkDirectory(directory, files)
  }

  for (const rootEntry of readdirSync(projectRoot, { withFileTypes: true })) {
    if (rootEntry.isSymbolicLink()) {
      if (isScopedRootEntry(rootEntry.name)) {
        throw new ScopeMismatch(`Link simbólico não é permitido no escopo: ${rootEntry.name}`)
      }
      continue
    }
    if (!rootEntry.isFile()) {
      if (isScopedRootEntry(rootEntry.name)) {
        throw new ScopeMismatch(`Entrada sem contexto atribuído na raiz: ${rootEntry.name}`)
      }
      continue
    }
    if (isUnassignedRootExecutableFile(rootEntry.name)) {
      throw new ScopeMismatch(`Extensão executável sem contrato na raiz: ${rootEntry.name}`)
    }
    if (rootEntry.name.endsWith('.jsx')) {
      files.push(rootEntry.name)
    }
  }

  for (const rootFile of requiredRootFiles) {
    const absolutePath = resolve(projectRoot, rootFile)
    if (!existsSync(absolutePath) || !lstatSync(absolutePath).isFile()) {
      throw new ScopeMismatch(`Arquivo obrigatório ausente: ${rootFile}`)
    }
    files.push(rootFile)
  }

  const sorted = files.sort()
  if (new Set(sorted).size !== sorted.length) {
    throw new ScopeMismatch('Inventário contém caminhos duplicados.')
  }
  return sorted
}

function runNodeCli(label, executable, args, timeoutMilliseconds = timeout) {
  return new Promise((resolveCommand, rejectCommand) => {
    const usesCurrentNode = executable === process.execPath
    const child = spawn(usesCurrentNode ? executable : process.execPath, usesCurrentNode ? args : [resolve(projectRoot, executable), ...args], {
      cwd: projectRoot,
      detached: process.platform !== 'win32',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let settled = false
    let forceTimer
    const settle = (callback, value) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutTimer)
      clearTimeout(forceTimer)
      clearTimeout(survivalTimer)
      callback(value)
    }
    const terminateGroup = (signal) => {
      terminateChildTree(child, signal)
    }
    const timeoutTimer = setTimeout(() => {
      timedOut = true
      terminateGroup('SIGTERM')
      forceTimer = setTimeout(() => terminateGroup('SIGKILL'), 2_000)
    }, timeoutMilliseconds)
    const survivalTimer = setTimeout(() => {
      if (timedOut) settle(rejectCommand, new Error(`${label} excedeu o timeout de 60 s. Um processo não encerrou após SIGKILL.`))
    }, timeoutMilliseconds + 7_000)
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', (error) => settle(rejectCommand, new Error(`${label} não pôde ser executado: ${error.message}`)))
    child.on('close', (status, signal) => {
      if (timedOut) {
        if (child.pid && process.platform !== 'win32') {
          try {
            process.kill(-child.pid, 0)
            settle(rejectCommand, new Error(`${label} excedeu o timeout de 60 s. Um descendente sobreviveu ao encerramento.`))
            return
          } catch {
            // O grupo foi encerrado por completo.
          }
        }
        settle(rejectCommand, new Error(`${label} excedeu o timeout de 60 s.`))
        return
      }
      if (signal) {
        settle(rejectCommand, new Error(`${label} terminou por sinal ${signal}.`))
        return
      }
      settle(resolveCommand, { status, stdout, stderr })
    })
  })
}

function assertSameSet(label, expected, actual) {
  const expectedSet = new Set(expected)
  const actualSet = new Set(actual)
  const missing = expected.filter((path) => !actualSet.has(path))
  const unexpected = actual.filter((path) => !expectedSet.has(path))

  if (missing.length || unexpected.length || actual.length !== actualSet.size) {
    throw new ScopeMismatch([
      `${label}: conjuntos divergentes.`,
      missing.length ? `Ausentes: ${missing.join(', ')}` : '',
      unexpected.length ? `Inesperados: ${unexpected.join(', ')}` : '',
      actual.length !== actualSet.size ? 'Duplicidade detectada.' : '',
    ].filter(Boolean).join('\n'))
  }
}

function assertNoSuppressions(inventory) {
  for (const path of inventory) {
    const content = readFileSync(resolve(projectRoot, path), 'utf8')
    const marker = forbiddenMarkerIn(content)
    if (marker) {
      throw new ScopeMismatch(`Supressão proibida em ${path}: ${marker}`)
    }
  }
}

async function eslintFiles() {
  const result = await runNodeCli('ESLint', 'node_modules/eslint/bin/eslint.js', ['.', '--format', 'json'])
  if (![0, 1].includes(result.status)) {
    throw new Error(`ESLint retornou exit ${result.status}; esperado 0 ou 1.\n${result.stderr}`)
  }

  let report
  try {
    report = JSON.parse(result.stdout)
  } catch (error) {
    throw new Error(`Saída JSON inválida do ESLint: ${error.message}`, { cause: error })
  }
  return report.filter((entry) => !entry.ignored).map((entry) => projectRelative(entry.filePath)).sort()
}

async function typescriptFiles(configPath) {
  const result = await runNodeCli('TypeScript', 'node_modules/typescript/bin/tsc', ['-p', configPath, '--listFilesOnly'])
  if (result.status !== 0) {
    throw new Error(`TypeScript (${configPath}) retornou exit ${result.status}.\n${result.stderr || result.stdout}`)
  }
  const nodeModules = realpathSync(resolve(projectRoot, 'node_modules'))
  const typeScriptLib = realpathSync(resolve(projectRoot, 'node_modules/typescript/lib'))
  const ownFiles = []
  for (const listedPath of result.stdout.split(/\r?\n/).filter(Boolean)) {
    const resolvedPath = realpathSync(resolve(listedPath))
    if (isWithin(resolvedPath, nodeModules) || isWithin(resolvedPath, typeScriptLib)) continue
    if (!isWithin(resolvedPath, projectRoot)) {
      throw new Error(`TypeScript listou caminho externo sem contrato: ${resolvedPath}`)
    }
    ownFiles.push(projectRelative(resolvedPath))
  }
  return ownFiles.sort()
}

function contextFor(path) {
  if (path.startsWith('src/') || (!path.includes('/') && path.endsWith('.jsx'))) {
    return 'browser'
  }
  return 'node'
}

function printInventory(inventory) {
  const browser = inventory.filter((path) => contextFor(path) === 'browser')
  const node = inventory.filter((path) => contextFor(path) === 'node')
  console.log(`Inventário próprio: ${inventory.length} arquivo(s).`)
  console.log(`Browser/React: ${browser.length}; Node/API/configuração: ${node.length}.`)
  inventory.forEach((path) => console.log(path))
  return { browser, node }
}

async function runSelfTests() {
  const directory = mkdtempSync(resolve(tmpdir(), 'mentoria-quality-scope-'))
  try {
    const fragmented = ['eslint', '-dis', '_able'].join('')
    writeFileSync(resolve(directory, 'fixture.js'), fragmented)
    if (forbiddenMarkerIn(fragmented) || !isCanonicalSourceFile('fixture.jsx') || isCanonicalSourceFile('fixture.JS')) {
      throw new Error('Auto-teste de extensões canônicas falhou.')
    }
    for (const marker of forbiddenMarkers) {
      const permittedFragment = `${marker.slice(0, -1)}_${marker.at(-1)}`
      if (forbiddenMarkerIn(permittedFragment) || forbiddenMarkerIn(marker) !== marker) {
        throw new Error(`Auto-teste de supressão falhou: ${marker}`)
      }
    }
    if (!isUnsupportedJavaScriptLikeFile('fixture.MJS') || !isUnsupportedJavaScriptLikeFile('fixture.TSX') || !isUnsupportedJavaScriptLikeFile('fixture.JSX') || isUnsupportedJavaScriptLikeFile('fixture.js')) {
      throw new Error('Auto-teste de extensões proibidas falhou.')
    }
    if (!isUnassignedRootExecutableFile('fixture.mts') || !isUnassignedRootExecutableFile('fixture.CTS') || !isUnassignedRootExecutableFile('fixture.js') || isUnassignedRootExecutableFile('vite.config.js')) {
      throw new Error('Auto-teste de executáveis na raiz falhou.')
    }
    if (!lstatSync(resolve(directory, 'fixture.js')).isFile() || lstatSync(resolve(directory, 'fixture.js')).isSymbolicLink()) {
      throw new Error('Auto-teste de arquivo regular falhou.')
    }
    const regular = { isSymbolicLink: () => false, isDirectory: () => false, isFile: () => true }
    const link = { isSymbolicLink: () => true, isDirectory: () => false, isFile: () => false }
    const fifo = { isSymbolicLink: () => false, isDirectory: () => false, isFile: () => false }
    if (entryKind(regular) !== 'file' || entryKind(link) !== 'symlink' || entryKind(fifo) !== 'other') {
      throw new Error('Auto-teste de tipos de entrada falhou.')
    }
    if (!isScopedRootEntry('fixture.jsx') || isScopedRootEntry('fixture.md')) {
      throw new Error('Auto-teste de entrada da raiz falhou.')
    }
    const normal = await runNodeCli('Auto-teste normal', process.execPath, ['-e', 'process.exit(0)'], 500)
    if (normal.status !== 0) throw new Error('Auto-teste de subprocesso normal falhou.')
    try {
      await runNodeCli('Auto-teste timeout', process.execPath, ['-e', 'setInterval(() => {}, 1_000)'], 25)
      throw new Error('Auto-teste de timeout não falhou.')
    } catch (error) {
      if (!String(error.message).includes('timeout')) throw error
    }
    const canarySelfTest = await runNodeCli('Auto-teste de limpeza dos canários', 'scripts/verify-quality-canaries.js', ['--self-test'], 5_000)
    if (canarySelfTest.status !== 0) {
      throw new Error(`Auto-teste de limpeza dos canários falhou.\n${canarySelfTest.stderr || canarySelfTest.stdout}`)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

function listedTestFiles(output, project, inventory) {
  const files = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => projectRelative(resolve(projectRoot, line)))
  if (files.some((path) => !inventory.includes(path) || !testFilePattern.test(path))) {
    throw new ScopeMismatch(`Vitest ${project} listou caminho não reconhecido.`)
  }
  return files
}

async function verifyTestScope(inventory) {
  const browser = await runNodeCli('Vitest browser', 'node_modules/vitest/vitest.mjs', ['list', '--project', 'browser', '--filesOnly', '--no-color'])
  const node = await runNodeCli('Vitest node', 'node_modules/vitest/vitest.mjs', ['list', '--project', 'node', '--filesOnly', '--no-color'])
  if (browser.status !== 0 || node.status !== 0) {
    throw new ScopeMismatch('A configuração de test.projects ainda não foi materializada pela Story 13.4.')
  }
  const tests = inventory.filter((path) => testFilePattern.test(path)).sort()
  const browserFiles = listedTestFiles(browser.stdout, 'browser', inventory)
  const nodeFiles = listedTestFiles(node.stdout, 'node', inventory)
  const discovered = [...browserFiles, ...nodeFiles].sort()
  if (!tests.length || discovered.length !== tests.length || new Set(discovered).size !== discovered.length || discovered.some((path, index) => path !== tests[index])) {
    throw new ScopeMismatch('Nenhum teste de primeira parte foi encontrado.')
  }
}

async function verifyQualityScope() {
  await runSelfTests()
  const inventory = enumerateInventory()
  const contexts = printInventory(inventory)
  assertNoSuppressions(inventory)
  assertSameSet('Filesystem x ESLint', inventory, await eslintFiles())
  const browserFiles = await typescriptFiles('jsconfig.browser.json')
  const nodeFiles = await typescriptFiles('jsconfig.node.json')
  assertSameSet('Projeto TypeScript browser', contexts.browser, browserFiles)
  assertSameSet('Projeto TypeScript Node', contexts.node, nodeFiles)
  assertSameSet('Filesystem x união TypeScript', inventory, [...browserFiles, ...nodeFiles].sort())
  if (process.argv.includes('--tests')) await verifyTestScope(inventory)
  console.log('Escopo de qualidade válido: filesystem, ESLint e TypeScript são idênticos e disjuntos.')
}

try {
  await verifyQualityScope()
} catch (error) {
  console.error(error.message)
  process.exitCode = error instanceof ScopeMismatch ? 1 : 2
}
