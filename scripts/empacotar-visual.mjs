import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'

const [entrada, saida] = process.argv.slice(2)
if (!entrada || !saida) throw new Error('Uso: node scripts/empacotar-visual.mjs BASE_0.4.0.zip NOVO_0.4.1.zip')
if (path.resolve(entrada) === path.resolve(saida)) throw new Error('A saída deve ser diferente do pacote original.')

const bytes = await readFile(entrada)
assert.equal(createHash('sha256').update(bytes).digest('hex'), 'e986ff5dc6d14520877fff3e82ec1b523f6b5b558a19ba7c9629d352d2fc26fd', 'O pacote de entrada deve ser a versão 0.4.0 aprovada.')
const zip = await JSZip.loadAsync(bytes)
const manifesto = JSON.parse(await zip.file('manifest.json').async('string'))
assert.equal(manifesto.version, '0.4.0')
const estilos = (await readdir('dist/assets')).filter(nome => nome.endsWith('.css'))
assert.equal(estilos.length, 1, 'Execute npm run build antes de empacotar.')
const css = await readFile(path.join('dist/assets', estilos[0]))
let painel = await zip.file('assets/index-DQfuHrkK.js').async('string')
const alteracoes = [
  ['vt.jsx("h1",{children:"Instagram Media Studio"})', 'vt.jsxs("div",{className:"marca-texto",children:[vt.jsx("span",{className:"assinatura",children:"INSTAGRAM"}),vt.jsx("h1",{children:"Media Studio"})]})'],
  ['vt.jsx("h2",{children:"Galeria de mídias"})', 'vt.jsxs("h2",{children:["Sua galeria ",vt.jsx("span",{className:"contador",children:at.length})]})'],
  ['className:"cartao "+(dt?"marcado":""),children:', 'className:"cartao "+(dt?"marcado":""),"data-origem":q.origem,children:']
]
for (const [antes, depois] of alteracoes) {
  assert.equal(painel.split(antes).length - 1, 1, 'O painel não corresponde à base aprovada.')
  painel = painel.replace(antes, depois)
}
zip.file('assets/index-DQfuHrkK.js', painel)
zip.file('assets/studio.css', css)
zip.remove('assets/index-BNRJfkI2.css')
const html = await zip.file('index.html').async('string')
assert.ok(html.includes('./assets/index-BNRJfkI2.css'))
zip.file('index.html', html.replace('./assets/index-BNRJfkI2.css', './assets/studio.css'))
manifesto.version = '0.4.1'
zip.file('manifest.json', JSON.stringify(manifesto, null, 2) + '\n')
zip.file('LEIA-ME.md', await readFile('docs/visual.md', 'utf8'))
const resultado = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
const final = await JSZip.loadAsync(resultado, { checkCRC32: true })
for (const nome of ['captura.js', 'contexto.js', 'extrator.js', 'rede.js', 'servico.js']) {
  assert.deepEqual(await final.file(nome).async('nodebuffer'), await zip.file(nome).async('nodebuffer'))
}
await writeFile(saida, resultado)
console.log(JSON.stringify({ arquivo: path.resolve(saida), bytes: resultado.length, sha256: createHash('sha256').update(resultado).digest('hex') }))

