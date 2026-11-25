import JSZip from 'jszip'
import { extensaoPermitida, nomeArquivo, urlValida } from './midias'
import type { Midia } from './tipos'

const LIMITE_BYTES = 250 * 1024 * 1024
const PASTA = 'Instagram Media Studio/'

export async function lerArquivo(resposta: Response, limite: number, sinal: AbortSignal): Promise<Blob> {
  if (!resposta.body || limite <= 0) throw new Error('Limite de tamanho atingido.')
  if (Number(resposta.headers.get('content-length')) > limite) {
    await resposta.body.cancel()
    throw new Error('Limite de tamanho atingido.')
  }
  const leitor = resposta.body.getReader()
  const partes: ArrayBuffer[] = []
  let total = 0
  try {
    for (;;) {
      sinal.throwIfAborted()
      const { value, done } = await leitor.read()
      if (done) break
      total += value.byteLength
      if (total > limite) throw new Error('Limite de tamanho atingido.')
      const parte = new Uint8Array(value.byteLength)
      parte.set(value)
      partes.push(parte.buffer)
    }
    sinal.throwIfAborted()
    if (!total) throw new Error('Arquivo vazio.')
    return new Blob(partes, { type: resposta.headers.get('content-type') || '' })
  } finally {
    await leitor.cancel().catch(() => {})
    leitor.releaseLock()
  }
}

async function obter(midia: Midia, limite: number, sinal: AbortSignal) {
  const url = urlValida(midia.url)
  if (!url) throw new Error('Endereço de mídia inválido.')
  const prazo = AbortSignal.any([sinal, AbortSignal.timeout(60000)])
  const resposta = await fetch(url, { credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: prazo, cache: 'no-store' })
  const mime = resposta.headers.get('content-type') || ''
  if (!resposta.ok || !extensaoPermitida(mime, midia.tipo)) {
    await resposta.body?.cancel().catch(() => {})
    throw new Error('Mídia indisponível ou formato não suportado.')
  }
  return { arquivo: await lerArquivo(resposta, limite, prazo), mime }
}

async function salvar(arquivo: Blob, nome: string, sinal: AbortSignal) {
  sinal.throwIfAborted()
  const url = URL.createObjectURL(arquivo)
  let id: number | undefined
  let liberado = false
  let prazo: ReturnType<typeof setTimeout> | undefined
  const liberar = () => {
    if (liberado) return
    liberado = true
    clearTimeout(prazo)
    chrome.downloads.onChanged.removeListener(alteracao)
    URL.revokeObjectURL(url)
  }
  const alteracao = (evento: chrome.downloads.DownloadDelta) => {
    if (evento.id === id && (evento.state?.current === 'complete' || evento.state?.current === 'interrupted')) liberar()
  }
  chrome.downloads.onChanged.addListener(alteracao)
  try {
    id = await chrome.downloads.download({ url, filename: PASTA + nome, conflictAction: 'uniquify' })
    const [registro] = await chrome.downloads.search({ id }).catch(() => [])
    if (registro && registro.state !== 'in_progress') liberar()
    if (!liberado) prazo = setTimeout(liberar, 15 * 60 * 1000)
  } catch (erro) {
    liberar()
    throw erro
  }
}

export async function baixar(midias: Midia[], progresso: (texto: string) => void, sinal: AbortSignal) {
  if (!midias.length) return
  sinal.throwIfAborted()
  if (midias.length === 1) {
    progresso('Preparando mídia…')
    const { arquivo, mime } = await obter(midias[0], LIMITE_BYTES, sinal)
    await salvar(arquivo, nomeArquivo(midias[0], 0, mime), sinal)
    progresso('Download solicitado ao navegador.')
    return
  }
  const zip = new JSZip()
  let falhas = 0
  let bytes = 0
  for (const [indice, midia] of midias.entries()) {
    sinal.throwIfAborted()
    progresso('Preparando ' + (indice + 1) + ' de ' + midias.length + ' mídias…')
    try {
      const { arquivo, mime } = await obter(midia, LIMITE_BYTES - bytes, sinal)
      bytes += arquivo.size
      zip.file(nomeArquivo(midia, indice, mime), arquivo)
    } catch {
      sinal.throwIfAborted()
      falhas++
    }
  }
  if (falhas === midias.length) throw new Error('Nenhuma mídia disponível. Abra as publicações novamente.')
  progresso('Preparando ZIP…')
  const arquivo = await zip.generateAsync({ type: 'blob', compression: 'STORE' }, () => sinal.throwIfAborted())
  await salvar(arquivo, 'midias-' + Date.now() + '.zip', sinal)
  progresso(falhas ? 'ZIP solicitado. ' + falhas + ' mídia(s) indisponíveis ou acima do limite.' : 'Download do ZIP solicitado.')
}
