import JSZip from 'jszip'
import { nomeArquivo } from './midias'
import type { Midia } from './tipos'

export async function baixar(midias: Midia[], progresso: (texto: string) => void) {
  if (!midias.length) return
  if (midias.length === 1) {
    await chrome.downloads.download({ url: midias[0].url, filename: 'Instagram Media Studio/' + nomeArquivo(midias[0], 0), conflictAction: 'uniquify' })
    progresso('Download solicitado.')
    return
  }
  const zip = new JSZip()
  let falhas = 0
  let bytes = 0
  for (const [indice, midia] of midias.entries()) {
    progresso('Preparando ' + (indice + 1) + ' de ' + midias.length + ' mídias…')
    try {
      const resposta = await fetch(midia.url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(30000) })
      if (!resposta.ok) throw new Error('Mídia indisponível')
      const mime = resposta.headers.get('content-type') || ''
      if (!mime.startsWith(midia.tipo === 'video' ? 'video/' : 'image/')) throw new Error('Formato inesperado')
      if (Number(resposta.headers.get('content-length')) + bytes > 250 * 1024 * 1024) throw new Error('Limite de tamanho')
      const arquivo = await resposta.blob()
      if (bytes + arquivo.size > 250 * 1024 * 1024) throw new Error('Limite de tamanho')
      bytes += arquivo.size
      zip.file(nomeArquivo(midia, indice, mime), arquivo)
    } catch {
      falhas++
    }
  }
  if (falhas === midias.length) throw new Error('Nenhuma mídia disponível. Abra as publicações novamente.')
  progresso('Compactando mídias…')
  const arquivo = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  const url = URL.createObjectURL(arquivo)
  try {
    await chrome.downloads.download({ url, filename: 'Instagram Media Studio/midias-' + Date.now() + '.zip', conflictAction: 'uniquify' })
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }
  progresso(falhas ? 'ZIP solicitado. ' + falhas + ' mídia(s) indisponíveis ou acima do limite.' : 'Download do ZIP solicitado.')
}
