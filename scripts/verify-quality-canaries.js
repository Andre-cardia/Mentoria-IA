import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { closeSync, existsSync, fstatSync, fsyncSync, ftruncateSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const timeout = 60_000
const sourceDirectories = ['src', 'server', 'api', 'scripts']
const requiredRootFiles = ['vite.config.js', 'eslint.config.js']
const canaryDirectories = new Map()
const createdFiles = new Map()
const activeCommands = new Set()
const forbiddenMarkers = [
  ['@ts', '-nocheck'].join(''),
  ['@ts', '-ignore'].join(''),
  ['@ts', '-expect-error'].join(''),
  ['eslint', '-disable'].join(''),
]

class CanaryFailure extends Error {}

function toPosix(path) { return path.split(sep).join('/') }
function projectRelative(path) { return toPosix(relative(projectRoot, path)) }
function hashBytes(bytes) { return createHash('sha256').update(bytes).digest('hex') }
function hasErrorCode(error, code) { return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code) }
function isCanaryPath(path) { return [...canaryDirectories.keys()].some((directory) => path === directory || path.startsWith(`${directory}/`)) }
function requiresImmediateExit(cleanupAlreadyStarted) { return cleanupAlreadyStarted }

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

function assertSafeSourceDirectory(directory) {
  const absolutePath = resolve(projectRoot, directory)
  if (!existsSync(absolutePath)) throw new CanaryFailure(`Diretório obrigatório ausente: ${directory}`)
  const stats = lstatSync(absolutePath)
  if (stats.isSymbolicLink() || !stats.isDirectory()) throw new CanaryFailure(`Diretório obrigatório inválido: ${directory}`)
}

function fingerprintRootJsx(records) {
  for (const entry of readdirSync(projectRoot, { withFileTypes: true })) {
    if (!entry.name.endsWith('.jsx')) continue
    if (entry.isSymbolicLink() || !entry.isFile()) throw new CanaryFailure(`Entrada JSX inválida na raiz: ${entry.name}`)
    const absolutePath = resolve(projectRoot, entry.name)
    const stats = lstatSync(absolutePath)
    records.set(entry.name, `${stats.mode}:${hashBytes(readFileSync(absolutePath))}`)
  }
}

function fingerprintDirectory(directory, records) {
  for (const entry of readdirSync(resolve(projectRoot, directory), { withFileTypes: true })) {
    const absolutePath = resolve(projectRoot, directory, entry.name)
    const path = projectRelative(absolutePath)
    if (isCanaryPath(path)) continue
    if (entry.isSymbolicLink()) throw new CanaryFailure(`Link simbólico dentro do escopo não é aceito: ${path}`)
    if (entry.isDirectory()) {
      fingerprintDirectory(path, records)
    } else if (entry.isFile() && (path.endsWith('.js') || path.endsWith('.jsx'))) {
      const stats = lstatSync(absolutePath)
      records.set(path, `${stats.mode}:${hashBytes(readFileSync(absolutePath))}`)
    }
  }
}

function fingerprintScope() {
  const records = new Map()
  for (const directory of sourceDirectories) {
    assertSafeSourceDirectory(directory)
    fingerprintDirectory(directory, records)
  }
  fingerprintRootJsx(records)
  for (const path of requiredRootFiles) {
    const absolutePath = resolve(projectRoot, path)
    const stats = lstatSync(absolutePath)
    if (stats.isSymbolicLink() || !stats.isFile()) throw new CanaryFailure(`Arquivo obrigatório ausente: ${path}`)
    records.set(path, `${stats.mode}:${hashBytes(readFileSync(absolutePath))}`)
  }
  return records
}

function assertSameFingerprint(before, after) {
  const paths = new Set([...before.keys(), ...after.keys()])
  const changed = [...paths].filter((path) => before.get(path) !== after.get(path)).sort()
  if (changed.length) throw new CanaryFailure(`Mudança concorrente detectada no escopo: ${changed.join(', ')}`)
}

function makeCanaryDirectory(parent) {
  assertSafeSourceDirectory(parent)
  const nonce = `${process.pid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  const path = `${parent}/.quality-gate-canary-${nonce}`
  const absolutePath = resolve(projectRoot, path)
  if (existsSync(absolutePath)) throw new CanaryFailure(`Colisão no caminho reservado: ${path}`)
  try {
    mkdirSync(absolutePath, { mode: 0o700 })
  } catch (error) {
    if (hasErrorCode(error, 'EEXIST')) throw new CanaryFailure(`Colisão no caminho reservado: ${path}`)
    throw error
  }
  const identity = lstatSync(absolutePath)
  canaryDirectories.set(path, { dev: identity.dev, ino: identity.ino })
  return path
}

function createCanaryFile(directory, filename) {
  const path = `${directory}/${filename}`
  const fd = openSync(resolve(projectRoot, path), 'wx', 0o600)
  const identity = fstatSync(fd)
  createdFiles.set(path, { fd, dev: identity.dev, ino: identity.ino, contentHash: hashBytes(Buffer.alloc(0)) })
  return path
}

function writeCanary(path, content) {
  const record = createdFiles.get(path)
  if (!record) throw new CanaryFailure(`Arquivo não criado por este processo: ${path}`)
  const absolutePath = resolve(projectRoot, path)
  const identity = lstatSync(absolutePath)
  if (identity.dev !== record.dev || identity.ino !== record.ino) throw new CanaryFailure(`Identidade do canário mudou; arquivo concorrente preservado: ${path}`)
  const bytes = Buffer.from(content, 'utf8')
  ftruncateSync(record.fd, 0)
  let offset = 0
  while (offset < bytes.length) {
    const written = writeSync(record.fd, bytes, offset, bytes.length - offset, offset)
    if (!written) throw new CanaryFailure(`Gravação parcial do canário: ${path}`)
    offset += written
  }
  fsyncSync(record.fd)
  record.contentHash = hashBytes(bytes)
}

function removeCanaryFile(path) {
  const record = createdFiles.get(path)
  if (!record) return
  const absolutePath = resolve(projectRoot, path)
  try {
    if (!existsSync(absolutePath)) throw new CanaryFailure(`Canário desapareceu durante a prova: ${path}`)
    const identity = lstatSync(absolutePath)
    if (identity.dev !== record.dev || identity.ino !== record.ino || hashBytes(readFileSync(absolutePath)) !== record.contentHash) {
      throw new CanaryFailure(`Identidade ou conteúdo do canário mudou; arquivo concorrente preservado: ${path}`)
    }
    closeSync(record.fd)
    unlinkSync(absolutePath)
    createdFiles.delete(path)
  } catch (error) {
    try { closeSync(record.fd) } catch { /* descritor já fechado */ }
    throw error
  }
}

function removeCanaryDirectories() {
  const errors = []
  for (const [path, record] of canaryDirectories) {
    const absolutePath = resolve(projectRoot, path)
    try {
      if (!existsSync(absolutePath)) throw new CanaryFailure(`Diretório-canário desapareceu: ${path}`)
      const identity = lstatSync(absolutePath)
      if (identity.dev !== record.dev || identity.ino !== record.ino) throw new CanaryFailure(`Identidade do diretório-canário mudou; preservado: ${path}`)
      if (readdirSync(absolutePath).length) throw new CanaryFailure(`Diretório-canário contém entrada desconhecida; preservado: ${path}`)
      rmdirSync(absolutePath)
      canaryDirectories.delete(path)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }
  if (errors.length) throw new CanaryFailure(errors.join('\n'))
}

function cleanup() {
  const errors = []
  for (const path of [...createdFiles.keys()]) {
    try { removeCanaryFile(path) } catch (error) { errors.push(error instanceof Error ? error.message : String(error)) }
  }
  try { removeCanaryDirectories() } catch (error) { errors.push(error instanceof Error ? error.message : String(error)) }
  if (errors.length) throw new CanaryFailure(errors.join('\n'))
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}

async function terminateActiveCommands() {
  const commands = [...activeCommands]
  for (const command of commands) command.terminate('SIGTERM')
  await Promise.race([Promise.allSettled(commands.map((command) => command.finished)), delay(2_000)])
  const survivors = [...activeCommands]
  for (const command of survivors) command.terminate('SIGKILL')
  await Promise.race([Promise.allSettled(survivors.map((command) => command.finished)), delay(5_000)])
  if (activeCommands.size) throw new CanaryFailure('Subprocesso de gate não encerrou após SIGKILL.')
}

function runCommand(label, command, args) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, { cwd: projectRoot, detached: process.platform !== 'win32', env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let settled = false
    let forceTimer
    let activeCommand
    const settle = (callback, value) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutTimer)
      clearTimeout(forceTimer)
      clearTimeout(survivalTimer)
      activeCommands.delete(activeCommand)
      activeCommand.resolveFinished()
      callback(value)
    }
    const terminateGroup = (signal) => {
      terminateChildTree(child, signal)
    }
    let resolveFinished
    activeCommand = {
      terminate: terminateGroup,
      finished: new Promise((resolveFinishedCommand) => { resolveFinished = resolveFinishedCommand }),
      resolveFinished,
    }
    activeCommands.add(activeCommand)
    const timeoutTimer = setTimeout(() => {
      timedOut = true
      terminateGroup('SIGTERM')
      forceTimer = setTimeout(() => terminateGroup('SIGKILL'), 2_000)
    }, timeout)
    const survivalTimer = setTimeout(() => {
      if (timedOut) settle(rejectCommand, new CanaryFailure(`${label} excedeu o timeout de 60 s. Um processo não encerrou após SIGKILL.`))
    }, timeout + 7_000)
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', (error) => settle(rejectCommand, new CanaryFailure(`${label} não pôde ser executado: ${error.message}`)))
    child.on('close', (status, signal) => {
      if (timedOut) {
        if (child.pid && process.platform !== 'win32') {
          try {
            process.kill(-child.pid, 0)
            settle(rejectCommand, new CanaryFailure(`${label} excedeu o timeout de 60 s. Um descendente sobreviveu ao encerramento.`))
            return
          } catch {
            // O grupo foi encerrado por completo.
          }
        }
        settle(rejectCommand, new CanaryFailure(`${label} excedeu o timeout de 60 s.`))
      } else {
        settle(resolveCommand, { status, signal, stdout, stderr })
      }
    })
  })
}

async function runStableCommand(label, command, args) {
  const before = fingerprintScope()
  try {
    return await runCommand(label, command, args)
  } finally {
    assertSameFingerprint(before, fingerprintScope())
  }
}

function outputOf(result) { return `${result.stdout}\n${result.stderr}` }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

async function expectTypeFailure(label, path, configPath) {
  const result = await runStableCommand(label, process.execPath, [resolve(projectRoot, 'node_modules/typescript/bin/tsc'), '-p', configPath, '--pretty', 'false'])
  if (result.status === 0 || result.signal) throw new CanaryFailure(`${label} deveria falhar pelo diagnóstico esperado.`)
  const diagnostics = outputOf(result).split(/\r?\n/).filter(Boolean)
  const expected = new RegExp(`^${escapeRegex(path)}\\(1,\\d+\\): error TS2322:`)
  if (diagnostics.length !== 1 || !expected.test(diagnostics[0])) throw new CanaryFailure(`${label} não produziu somente TS2322 em ${path}:1.\n${outputOf(result)}`)
}

async function expectLintFailure(label, path, ruleId) {
  const result = await runStableCommand(label, process.execPath, [resolve(projectRoot, 'node_modules/eslint/bin/eslint.js'), path, '--format', 'json', '--max-warnings', '0'])
  if (result.status === 0 || result.signal) throw new CanaryFailure(`${label} deveria falhar pelo diagnóstico esperado.`)
  let report
  try { report = JSON.parse(result.stdout) } catch { throw new CanaryFailure(`${label} não retornou JSON do ESLint.\n${outputOf(result)}`) }
  const expectedPath = resolve(projectRoot, path)
  if (report.length !== 1 || report[0].filePath !== expectedPath || report[0].messages.length !== 1) throw new CanaryFailure(`${label} produziu diagnóstico fora do arquivo esperado.\n${result.stdout}`)
  const [message] = report[0].messages
  if (message.fatal || message.ruleId !== ruleId || message.line !== 1) throw new CanaryFailure(`${label} não produziu somente ${ruleId} na linha 1.\n${result.stdout}`)
}

async function expectPass(label, command, args) {
  const result = await runStableCommand(label, command, args)
  if (result.status !== 0 || result.signal) throw new CanaryFailure(`${label} deveria passar.\n${outputOf(result)}`)
}

async function expectScopeFailure(label, path, marker) {
  const result = await runStableCommand(label, process.execPath, [resolve(projectRoot, 'scripts/check-quality-scope.js')])
  const expected = `Supressão proibida em ${path}: ${marker}`
  if (result.status !== 1 || result.signal || result.stderr.trim() !== expected) {
    throw new CanaryFailure(`${label} não falhou somente pela supressão esperada.\n${outputOf(result)}`)
  }
}

async function typeCase(label, directory, filename, configPath) {
  const path = createCanaryFile(directory, filename)
  try {
    writeCanary(path, '/** @type {string} */ const qualityGateValue = 1\n')
    await expectTypeFailure(label, path, configPath)
    writeCanary(path, "/** @type {string} */ const qualityGateValue = '1'\n")
    await expectPass(`${label} corrigido`, process.execPath, [resolve(projectRoot, 'node_modules/typescript/bin/tsc'), '-p', configPath, '--pretty', 'false'])
  } finally { removeCanaryFile(path) }
}

async function lintCase(label, directory, filename, invalidContent, ruleId, validContent) {
  const path = createCanaryFile(directory, filename)
  try {
    writeCanary(path, invalidContent)
    await expectLintFailure(label, path, ruleId)
    writeCanary(path, validContent)
    await expectPass(`${label} corrigido`, process.execPath, [resolve(projectRoot, 'node_modules/eslint/bin/eslint.js'), path, '--format', 'json', '--max-warnings', '0'])
  } finally { removeCanaryFile(path) }
}

async function suppressionCase(label, directory, filename, marker) {
  const path = createCanaryFile(directory, filename)
  try {
    writeCanary(path, `// ${marker}\nexport const qualityGateSuppressionCanary = true\n`)
    await expectScopeFailure(label, path, marker)
  } finally { removeCanaryFile(path) }
}

async function runCanaries() {
  const before = fingerprintScope()
  const browserDirectory = makeCanaryDirectory('src')
  const nodeDirectory = makeCanaryDirectory('scripts')
  await typeCase('TypeScript browser', browserDirectory, 'type.jsx', 'jsconfig.browser.json')
  await typeCase('TypeScript Node', nodeDirectory, 'type.js', 'jsconfig.node.json')
  await lintCase('ESLint identificador Node', nodeDirectory, 'identifier.js', 'qualityGateIdentifierThatDoesNotExist\n', 'no-undef', 'const qualityGateIdentifierThatDoesNotExist = 1; console.log(qualityGateIdentifierThatDoesNotExist)\n')
  await lintCase('ESLint process no browser', browserDirectory, 'process.jsx', 'console.log(process.version)\n', 'no-undef', 'console.log(globalThis.location.href)\n')
  await lintCase('ESLint window no Node', nodeDirectory, 'window.js', 'console.log(window.location)\n', 'no-undef', 'console.log(globalThis.process.version)\n')
  await lintCase('ESLint require no Node ESM', nodeDirectory, 'require.js', "const path = require('node:path'); export default path\n", 'no-undef', "import path from 'node:path'; export default path\n")
  await lintCase('ESLint Hook condicional', browserDirectory, 'hook.jsx', "import { useState } from 'react'; export function CanaryComponent({ enabled }) { if (enabled) { useState(0) } return null }\n", 'react-hooks/rules-of-hooks', "import { useState } from 'react'; export function CanaryComponent({ enabled }) { useState(0); if (!enabled) return null; return <div /> }\n")
  await lintCase('ESLint React Refresh', browserDirectory, 'refresh.jsx', 'export function CanaryComponent() { return <div /> } export function helper() { return 1 }\n', 'react-refresh/only-export-components', 'export function CanaryComponent() { return <div /> } function helper() { return 1 } void helper\n')
  await lintCase('ESLint Vitest sem import', browserDirectory, 'implicit.test.jsx', "describe('canary', () => {})\n", 'no-undef', "import { describe } from 'vitest'; describe('canary', () => {})\n")
  for (const [index, marker] of forbiddenMarkers.entries()) {
    await suppressionCase(`Supressão proibida ${index + 1}`, browserDirectory, `suppression-${index}.jsx`, marker)
  }
  cleanup()
  assertSameFingerprint(before, fingerprintScope())
  await expectPass('npm run lint', 'npm', ['run', 'lint'])
  await expectPass('npm run typecheck', 'npm', ['run', 'typecheck'])
}

async function runCanarySelfTests() {
  const normalDirectory = makeCanaryDirectory('src')
  cleanup()
  if (existsSync(resolve(projectRoot, normalDirectory))) {
    throw new CanaryFailure('Auto-teste de cleanup normal preservou diretório próprio.')
  }

  const unknownDirectory = makeCanaryDirectory('scripts')
  const unknownPath = `${unknownDirectory}/entrada-desconhecida`
  const unknownFd = openSync(resolve(projectRoot, unknownPath), 'wx', 0o600)
  closeSync(unknownFd)
  try {
    cleanup()
    throw new CanaryFailure('Auto-teste de entrada desconhecida não falhou.')
  } catch (error) {
    if (!existsSync(resolve(projectRoot, unknownDirectory))) throw error
  }
  unlinkSync(resolve(projectRoot, unknownPath))
  cleanup()
  if (existsSync(resolve(projectRoot, unknownDirectory))) {
    throw new CanaryFailure('Auto-teste de cleanup desconhecido falhou.')
  }
  await verifySecondSignalPreservesCanary()
}

async function verifySecondSignalPreservesCanary() {
  const result = await runCommand('Auto-teste do segundo sinal', process.execPath, [resolve(projectRoot, 'scripts/verify-quality-canaries.js'), '--signal-self-test'])
  const record = /^CANARY_SIGNAL_SELF_TEST=(.+):(\d+):(\d+)$/m.exec(result.stdout)
  if (result.status !== 1 || result.signal || !record || !result.stderr.includes('Segundo sinal SIGTERM durante a limpeza')) {
    throw new CanaryFailure(`Auto-teste do segundo sinal não preservou o diagnóstico esperado.\n${outputOf(result)}`)
  }
  const [, path, expectedDev, expectedIno] = record
  const absolutePath = resolve(projectRoot, path)
  try {
    if (!existsSync(absolutePath)) throw new CanaryFailure('Auto-teste do segundo sinal removeu o diretório-canário.')
    const identity = lstatSync(absolutePath)
    if (String(identity.dev) !== expectedDev || String(identity.ino) !== expectedIno || readdirSync(absolutePath).length) {
      throw new CanaryFailure('Auto-teste do segundo sinal não preservou a identidade do diretório-canário.')
    }
    rmdirSync(absolutePath)
  } catch (error) {
    throw error instanceof CanaryFailure ? error : new CanaryFailure(error instanceof Error ? error.message : String(error))
  }
}

async function runSignalSelfTest() {
  const directory = makeCanaryDirectory('scripts')
  const identity = lstatSync(resolve(projectRoot, directory))
  console.log(`CANARY_SIGNAL_SELF_TEST=${directory}:${identity.dev}:${identity.ino}`)
  const pending = new Promise(() => {})
  activeCommands.add({ terminate: () => {}, finished: pending })
  process.kill(process.pid, 'SIGTERM')
  setTimeout(() => process.kill(process.pid, 'SIGTERM'), 25)
  await pending
}

let cleanupStarted = false
async function exitForSignal(signal, exitCode) {
  if (requiresImmediateExit(cleanupStarted)) {
    console.error(`Segundo sinal ${signal} durante a limpeza; diretórios-canário preservados.`)
    process.exit(1)
  }
  cleanupStarted = true
  try {
    await terminateActiveCommands()
    cleanup()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
  console.error(`Canários interrompidos por ${signal}.`)
  process.exit(exitCode)
}

process.on('SIGINT', () => { void exitForSignal('SIGINT', 130) })
process.on('SIGTERM', () => { void exitForSignal('SIGTERM', 143) })

if (process.argv.includes('--signal-self-test')) {
  await runSignalSelfTest()
} else if (process.argv.includes('--self-test')) {
  try {
    await runCanarySelfTests()
    console.log('Auto-testes dos canários concluídos.')
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
} else {
  try {
    await runCanaries()
    console.log('Canários de qualidade concluídos; escopo restaurado e estável.')
  } catch (error) {
  let primaryError = error
  try { cleanup() } catch (cleanupError) {
    const primary = primaryError instanceof Error ? primaryError.message : String(primaryError)
    const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
    primaryError = new CanaryFailure(`${primary}\nFalha de limpeza: ${cleanupMessage}`)
  }
  console.error(primaryError instanceof Error ? primaryError.message : String(primaryError))
  process.exitCode = 1
  }
}
