import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'

const pacote = JSON.parse(await readFile('package.json', 'utf8'))
const manifesto = JSON.parse(await readFile('dist/manifest.json', 'utf8'))
assert.equal(manifesto.version, pacote.version)
const saida = process.argv[2] || 'artifacts'
await mkdir(saida, { recursive: true })
const zip = new JSZip()
async function incluir(diretorio, prefixo = '') {
  for (const item of (await readdir(diretorio, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const nome = prefixo + item.name
    const arquivo = path.join(diretorio, item.name)
    if (item.isDirectory()) await incluir(arquivo, nome + '/')
    else zip.file(nome, await readFile(arquivo), { date: new Date('2000-01-01T00:00:00Z'), createFolders: false })
  }
}
await incluir('dist')
zip.file('LEIA-ME.md', await readFile('docs/instalacao.md'), { date: new Date('2000-01-01T00:00:00Z') })
const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
const validado = await JSZip.loadAsync(bytes, { checkCRC32: true })
assert.equal(JSON.parse(await validado.file('manifest.json').async('string')).version, pacote.version)
for (const arquivo of ['LICENSE', 'THIRD-PARTY-LICENSES.txt', 'index.html', ...manifesto.content_scripts.flatMap(item => item.js), manifesto.background.service_worker]) assert.ok(validado.file(arquivo), arquivo)
const nome = 'instagram-media-studio-v' + pacote.version + '.zip'
const sha256 = createHash('sha256').update(bytes).digest('hex')
await writeFile(path.join(saida, nome), bytes)
await writeFile(path.join(saida, nome + '.sha256'), sha256 + '  ' + nome + '\n')
console.log(JSON.stringify({ arquivo: path.resolve(saida, nome), bytes: bytes.length, sha256 }))
