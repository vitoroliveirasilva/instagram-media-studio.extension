import { parse } from '@babel/parser'
import postcss from 'postcss'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export async function arquivosCodigo(diretorio) {
  const arquivos = []
  for (const item of await readdir(diretorio, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', 'coverage', 'artifacts'].includes(item.name)) continue
    const arquivo = path.join(diretorio, item.name)
    if (item.isDirectory()) arquivos.push(...await arquivosCodigo(arquivo))
    else if (/\.(?:[cm]?js|tsx?|css|html)$/.test(item.name)) arquivos.push(arquivo)
  }
  return arquivos.sort()
}

export function comentarios(codigo, arquivo) {
  if (arquivo.endsWith('.css')) {
    const encontrados = []
    postcss.parse(codigo).walkComments(item => encontrados.push({ start: item.source.start.offset, end: item.source.end.offset, value: item.text }))
    return encontrados
  }
  if (arquivo.endsWith('.html')) return [...codigo.matchAll(/<!--[\s\S]*?-->/g)].map(item => ({ start: item.index, end: item.index + item[0].length, value: item[0] }))
  const plugins = []
  if (/\.tsx?$/.test(arquivo)) plugins.push('typescript')
  if (arquivo.endsWith('.tsx')) plugins.push('jsx')
  return parse(codigo, { sourceType: 'unambiguous', plugins }).comments
}

export function removerComentarios(codigo, encontrados) {
  for (const item of [...encontrados].reverse()) codigo = codigo.slice(0, item.start) + codigo.slice(item.start, item.end).replace(/[^\r\n]/g, ' ') + codigo.slice(item.end)
  return codigo.split('\n').map(linha => linha.trimEnd()).join('\n')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const corrigir = process.argv.includes('--corrigir')
  let quantidade = 0
  const arquivos = await arquivosCodigo('.')
  for (const arquivo of arquivos) {
    const codigo = await readFile(arquivo, 'utf8')
    const encontrados = comentarios(codigo, arquivo)
    quantidade += encontrados.length
    if (encontrados.length && corrigir) await writeFile(arquivo, removerComentarios(codigo, encontrados))
    else if (encontrados.length) console.error(arquivo + ': ' + encontrados.length + ' comentário(s)')
  }
  console.log(arquivos.length + ' arquivos de código analisados; ' + quantidade + ' comentário(s)' + (corrigir ? ' removido(s).' : '.'))
  if (quantidade && !corrigir) process.exitCode = 1
}
