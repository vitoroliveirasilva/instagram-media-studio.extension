import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const manifesto = JSON.parse(readFileSync('runtime/manifest.json', 'utf8'))
assert.equal(manifesto.manifest_version, 3)
for (const arquivo of [manifesto.background.service_worker, ...manifesto.content_scripts.flatMap(item => item.js)]) assert.ok(existsSync('runtime/' + arquivo), arquivo)
for (const arquivo of readdirSync('runtime').filter(nome => nome.endsWith('.js'))) {
  const resultado = spawnSync(process.execPath, ['--check', 'runtime/' + arquivo], { stdio: 'inherit' })
  assert.equal(resultado.status, 0, arquivo)
}
console.log('Runtime do pacote validado.')
