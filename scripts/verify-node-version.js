import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { validateNodeVersion } from './check-node-version.js'

const cases = [
  ['24.20.0', true],
  ['24.20.1', true],
  ['24.21.0', true],
  ['24.19.1', false],
  ['23.11.0', false],
  ['25.0.0', false],
  ['24.20.0-rc.1', false],
]

for (const [version, expected] of cases) {
  const actual = validateNodeVersion(version)
  console.log(`${version}: ${actual ? 'aceito' : 'rejeitado'} (esperado: ${expected ? 'aceito' : 'rejeitado'})`)

  if (actual !== expected) {
    process.exitCode = 1
    break
  }
}

if (!process.exitCode) {
  const entrypoint = fileURLToPath(new URL('./check-node-version.js', import.meta.url))
  const result = spawnSync(process.execPath, [entrypoint], { encoding: 'utf8' })
  const runtime = process.versions.node

  if (result.status !== 0 || result.stderr || !result.stdout.includes(runtime)) {
    console.error('O entrypoint do preflight não produziu a prova positiva esperada.')
    process.exitCode = 1
  }
}
