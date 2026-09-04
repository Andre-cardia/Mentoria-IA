import { pathToFileURL } from 'node:url'

const SUPPORTED_NODE_RANGE = '>=24.20.0 <25'
const STABLE_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

export function validateNodeVersion(version) {
  const match = STABLE_VERSION_PATTERN.exec(version)

  if (!match) {
    return false
  }

  const major = Number(match[1])
  const minor = Number(match[2])

  return major === 24 && minor >= 20
}

function runPreflight(version = process.versions.node) {
  if (validateNodeVersion(version)) {
    console.log(`Node.js ${version} aceito (${SUPPORTED_NODE_RANGE}).`)
    return 0
  }

  console.error(`Node.js ${version} rejeitado; requerido ${SUPPORTED_NODE_RANGE}.`)
  return 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runPreflight()
}
