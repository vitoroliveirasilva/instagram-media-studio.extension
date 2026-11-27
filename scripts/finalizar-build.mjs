import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile, readdir, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { arquivosCodigo, comentarios, removerComentarios } from './comentarios.mjs'

const pacote = JSON.parse(await readFile('package.json', 'utf8'))
const manifesto = JSON.parse(await readFile('dist/manifest.json', 'utf8'))
assert.equal(manifesto.version, pacote.version)
assert.equal(manifesto.manifest_version, 3)
for (const arquivo of [manifesto.side_panel.default_path, manifesto.background.service_worker, ...manifesto.content_scripts.flatMap(item => item.js)]) await readFile(path.join('dist', arquivo))
const avisos = ['Instagram Media Studio — licenças de terceiros\n\nOs avisos abaixo acompanham as dependências distribuídas.']
const visitados = new Set()
async function incluir(nome, origem) {
  const resolver = createRequire(origem)
  const caminho = resolver.resolve(nome + '/package.json')
  if (visitados.has(caminho)) return
  visitados.add(caminho)
  const dados = JSON.parse(await readFile(caminho, 'utf8'))
  const pasta = path.dirname(caminho)
  const licencas = (await readdir(pasta)).filter(item => /^(license|licence|copying|notice)(\.|$)/i.test(item))
  avisos.push(dados.name + '@' + dados.version + '\nLicença declarada: ' + dados.license)
  if (!licencas.length) {
    const leiame = await readFile(path.join(pasta, 'README.md'), 'utf8')
    const trecho = leiame.match(/^#{1,3} Licen[sc]e\s*$/im)
    assert.ok(trecho, 'Licença ausente: ' + nome)
    avisos.push(leiame.slice(trecho.index))
  }
  for (const arquivo of licencas.sort()) avisos.push(arquivo + '\n' + await readFile(path.join(pasta, arquivo), 'utf8'))
  for (const dependencia of Object.keys(dados.dependencies || {}).sort()) await incluir(dependencia, caminho)
}
for (const nome of Object.keys(pacote.dependencies).sort()) await incluir(nome, path.resolve('package.json'))
for (const arquivo of await arquivosCodigo('dist')) {
  const codigo = await readFile(arquivo, 'utf8')
  const encontrados = comentarios(codigo, arquivo)
  for (const item of encontrados) if (/license|copyright|@preserve|tailwind/i.test(item.value)) avisos.push('Aviso incorporado em ' + path.relative('dist', arquivo) + '\n' + item.value.trim())
  if (encontrados.length) await writeFile(arquivo, removerComentarios(codigo, encontrados))
  assert.equal(comentarios(await readFile(arquivo, 'utf8'), arquivo).length, 0, arquivo)
}
await copyFile('LICENSE', 'dist/LICENSE')
await writeFile('dist/THIRD-PARTY-LICENSES.txt', avisos.join('\n\n' + '='.repeat(72) + '\n\n') + '\n')
console.log('Build validado: versão ' + pacote.version + ', código sem comentários e licenças preservadas.')
