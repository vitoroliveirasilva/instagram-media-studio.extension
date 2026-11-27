import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'

const [entrada, saida] = process.argv.slice(2)
if (!entrada || !saida) throw new Error('Uso: node scripts/empacotar-visual.mjs BASE_0.4.0.zip NOVO_0.6.1.zip')
if (path.resolve(entrada) === path.resolve(saida)) throw new Error('A saída deve ser diferente do pacote original.')
const bytes = await readFile(entrada)
assert.equal(createHash('sha256').update(bytes).digest('hex'), 'e986ff5dc6d14520877fff3e82ec1b523f6b5b558a19ba7c9629d352d2fc26fd', 'O pacote de entrada deve ser a versão 0.4.0 aprovada.')
const base = await JSZip.loadAsync(bytes)
const zip = await JSZip.loadAsync(bytes)
const manifesto = JSON.parse(await base.file('manifest.json').async('string'))
assert.equal(manifesto.version, '0.4.0')
for (const nome of Object.keys(zip.files)) if (nome.startsWith('assets/')) zip.remove(nome)
for (const nome of await readdir('dist/assets')) zip.file('assets/' + nome, await readFile(path.join('dist/assets', nome)))
zip.file('index.html', await readFile('dist/index.html'))
for (const nome of await readdir('runtime')) zip.file(nome, await readFile(path.join('runtime', nome)))
const corrigido = JSON.parse(await readFile('runtime/manifest.json', 'utf8'))
assert.equal(corrigido.version, '0.6.1')
manifesto.content_scripts = corrigido.content_scripts
manifesto.version = '0.6.1'
zip.file('manifest.json', JSON.stringify(manifesto, null, 2) + '\n')
zip.file('LEIA-ME.md', await readFile('docs/visual.md', 'utf8'))
const resultado = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
const final = await JSZip.loadAsync(resultado, { checkCRC32: true })
for (const nome of await readdir('runtime')) assert.deepEqual(await final.file(nome).async('nodebuffer'), await readFile(path.join('runtime', nome)), 'Runtime divergente: ' + nome)
for (const nome of ['contexto.js','servico.js']) assert.deepEqual(await final.file(nome).async('nodebuffer'), await base.file(nome).async('nodebuffer'))
await writeFile(saida, resultado)
console.log(JSON.stringify({ arquivo: path.resolve(saida), bytes: resultado.length, sha256: createHash('sha256').update(resultado).digest('hex') }))
