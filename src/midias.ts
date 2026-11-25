import type { Midia, Origem } from './tipos'

export const LIMITE_GALERIA = 10000
const origens = new Set<Origem>(['Stories', 'Destaques', 'Posts', 'Reels'])
const extensoes: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }

export function urlValida(valor: unknown): string {
  if (typeof valor !== 'string' || valor.length > 8192) return ''
  try {
    const url = new URL(valor)
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname)) return ''
    url.hash = ''
    return url.href
  } catch {
    return ''
  }
}

function identidade(url: string): string {
  const caminho = new URL(url).pathname
  const arquivo = caminho.split('/').pop() || ''
  return /^\d{8,}(?:_\d+)+_[a-z0-9]+\.[a-z0-9]+$/i.test(arquivo) ? arquivo.toLowerCase() : caminho
}

export function normalizar(valor: unknown): Midia | null {
  if (!valor || typeof valor !== 'object') return null
  const item = valor as Record<string, unknown>
  const url = urlValida(item.url)
  if (!url || (item.tipo !== 'imagem' && item.tipo !== 'video') || !origens.has(item.origem as Origem)) return null
  const numero = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(16384, Math.floor(v)) : 0
  return { id: item.tipo + ':' + identidade(url), url, miniatura: urlValida(item.miniatura), tipo: item.tipo, origem: item.origem as Origem, largura: numero(item.largura), altura: numero(item.altura) }
}

export function reunir(anteriores: Midia[], novas: unknown[]): Midia[] {
  const mapa = new Map(anteriores.map(item => [item.id, item]))
  for (const valor of novas.slice(0, 150)) {
    const item = normalizar(valor)
    if (!item) continue
    const anterior = mapa.get(item.id)
    if (!anterior) mapa.set(item.id, item)
    else if (item.largura * item.altura >= anterior.largura * anterior.altura) {
      mapa.set(item.id, { ...item, miniatura: item.miniatura || anterior.miniatura, origem: item.origem === 'Posts' ? anterior.origem : item.origem })
    }
  }
  const lista = [...mapa.values()]
  const miniaturas = new Set(lista.filter(item => item.tipo === 'video' && item.miniatura).map(item => identidade(item.miniatura)))
  return lista.filter(item => item.tipo !== 'imagem' || !miniaturas.has(identidade(item.url))).slice(-LIMITE_GALERIA)
}

export function extensaoPermitida(mime: string, tipo: Midia['tipo']): string | undefined {
  const formato = mime.split(';')[0].trim().toLowerCase()
  return formato.startsWith(tipo === 'video' ? 'video/' : 'image/') ? extensoes[formato] : undefined
}

export function nomeArquivo(midia: Midia, indice: number, mime = ''): string {
  const caminho = new URL(midia.url).pathname.toLowerCase()
  const conhecida = caminho.match(/\.(jpg|jpeg|png|webp|avif|gif|mp4|webm|mov)$/)?.[1]
  const extensao = extensaoPermitida(mime, midia.tipo) || conhecida || (midia.tipo === 'video' ? 'mp4' : 'jpg')
  return midia.origem.toLowerCase() + '-' + String(indice + 1).padStart(4, '0') + '.' + extensao
}
