import type { Midia, Origem } from './tipos'

export function urlValida(valor: unknown): string {
  if (typeof valor !== 'string' || valor.length > 8192) return ''
  try {
    const url = new URL(valor)
    return url.protocol === 'https:' && !url.username && !url.password && (/(^|\.)cdninstagram\.com$/.test(url.hostname) || /(^|\.)fbcdn\.net$/.test(url.hostname)) ? url.href : ''
  } catch {
    return ''
  }
}

export function normalizar(valor: unknown): Midia | null {
  if (!valor || typeof valor !== 'object') return null
  const item = valor as Record<string, unknown>
  const url = urlValida(item.url)
  if (!url || (item.tipo !== 'imagem' && item.tipo !== 'video') || !['Stories','Destaques','Posts','Reels'].includes(String(item.origem))) return null
  const caminho = new URL(url).pathname
  const numero = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0
  return { id: item.tipo + ':' + caminho, url, miniatura: urlValida(item.miniatura), tipo: item.tipo, origem: item.origem as Origem, largura: numero(item.largura), altura: numero(item.altura) }
}

export function reunir(anteriores: Midia[], novas: unknown[]): Midia[] {
  const mapa = new Map(anteriores.map(item => [item.id, item]))
  for (const valor of novas) {
    const item = normalizar(valor)
    if (!item) continue
    const anterior = mapa.get(item.id)
    if (!anterior || item.largura * item.altura >= anterior.largura * anterior.altura) mapa.set(item.id, item)
  }
  return [...mapa.values()].slice(-1000)
}

export function nomeArquivo(midia: Midia, indice: number, mime = ''): string {
  const caminho = new URL(midia.url).pathname.toLowerCase()
  const extensao = midia.tipo === 'video' ? 'mp4' : mime.includes('webp') || caminho.endsWith('.webp') ? 'webp' : mime.includes('png') || caminho.endsWith('.png') ? 'png' : mime.includes('avif') || caminho.endsWith('.avif') ? 'avif' : 'jpg'
  return midia.origem.toLowerCase() + '-' + String(indice + 1).padStart(4, '0') + '.' + extensao
}
