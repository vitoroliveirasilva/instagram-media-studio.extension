import { afterEach, describe, expect, it, vi } from 'vitest'
import { baixar, nomeDownload, planejarDownloads } from './downloads'
import type { Midia } from './tipos'

const reel: Midia = { id: 'video:reel', url: 'https://scontent.cdninstagram.com/reel.mp4', miniatura: 'https://scontent.cdninstagram.com/capa.jpg?assinatura=1', tipo: 'video', origem: 'Reels', largura: 1080, altura: 1920 }
const foto: Midia = { ...reel, id: 'imagem:post', url: 'https://scontent.cdninstagram.com/foto.jpg', miniatura: '', tipo: 'imagem', origem: 'Posts' }
afterEach(() => vi.unstubAllGlobals())
describe('Downloads de vídeo e capa', () => {
  it('preserva o vídeo como opção padrão', () => {
    const plano = planejarDownloads([reel])
    expect(plano.arquivos).toHaveLength(1)
    expect(plano.arquivos[0].midia.url).toBe(reel.url)
    expect(plano.capasAusentes).toBe(0)
  })
  it('capa usa a imagem assinada sem incluir o arquivo de vídeo', () => {
    const plano = planejarDownloads([reel], 'capa')
    expect(plano.arquivos).toHaveLength(1)
    expect(plano.arquivos[0].midia.url).toBe(reel.miniatura)
    expect(plano.arquivos[0].midia.tipo).toBe('imagem')
    expect(plano.arquivos[0].midia.largura).toBe(0)
    expect(reel.tipo).toBe('video')
  })
  it('associa vídeo e capa pelo mesmo número e respeita o MIME real', () => {
    const plano = planejarDownloads([reel], 'ambos')
    expect(plano.arquivos.map(alvo => nomeDownload(alvo, alvo.capa ? 'image/webp' : 'video/mp4'))).toEqual(['reels-0001.mp4', 'reels-0001-capa.webp'])
  })
  it('conserva imagens e agrupa cada capa com seu vídeo em lotes', () => {
    const outro = { ...reel, id: 'video:outro', url: 'https://scontent.cdninstagram.com/outro.mp4', miniatura: 'https://scontent.cdninstagram.com/outra.jpg' }
    const plano = planejarDownloads([reel, foto, outro], 'ambos')
    expect(plano.arquivos.map(alvo => nomeDownload(alvo, alvo.midia.tipo === 'video' ? 'video/mp4' : 'image/jpeg'))).toEqual(['reels-0001.mp4', 'reels-0001-capa.jpg', 'posts-0002.jpg', 'reels-0003.mp4', 'reels-0003-capa.jpg'])
  })
  it('somente capas não altera o download de fotos e perfis', () => {
    const perfil = { ...foto, origem: 'Perfil' as const }
    expect(planejarDownloads([foto, perfil], 'capa').arquivos.map(alvo => alvo.midia)).toEqual([foto, perfil])
  })
  it.each(['', 'blob:https://www.instagram.com/123', 'https://cdninstagram.com.evil.com/capa.jpg', 'javascript:alert(1)'])('rejeita uma capa indisponível ou inválida: %s', miniatura => {
    const plano = planejarDownloads([{ ...reel, miniatura }], 'capa')
    expect(plano.arquivos).toHaveLength(0)
    expect(plano.capasAusentes).toBe(1)
  })
  it('em ambos, mantém o vídeo e informa que a capa está ausente', () => {
    const plano = planejarDownloads([{ ...reel, miniatura: '' }], 'ambos')
    expect(plano.arquivos).toHaveLength(1)
    expect(plano.arquivos[0].midia.url).toBe(reel.url)
    expect(plano.capasAusentes).toBe(1)
  })
  it('capa indisponível não inicia uma requisição de vídeo', async () => {
    const buscar = vi.fn()
    vi.stubGlobal('fetch', buscar)
    await expect(baixar([{ ...reel, miniatura: '' }], () => {}, new AbortController().signal, 'capa')).rejects.toThrow('Nenhuma capa')
    expect(buscar).not.toHaveBeenCalled()
  })
  it('baixar só a capa requisita somente a imagem e entrega seu nome correspondente', async () => {
    const buscar = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } }))
    const salvar = vi.fn().mockResolvedValue(1)
    vi.stubGlobal('fetch', buscar)
    vi.stubGlobal('chrome', { downloads: { onChanged: { addListener: vi.fn(), removeListener: vi.fn() }, download: salvar, search: vi.fn().mockResolvedValue([{ state: 'complete' }]) } })
    await baixar([reel], () => {}, new AbortController().signal, 'capa')
    expect(buscar).toHaveBeenCalledTimes(1)
    expect(buscar.mock.calls[0][0]).toBe(reel.miniatura)
    expect(salvar.mock.calls[0][0].filename).toBe('Instagram Media Studio/reels-0001-capa.jpg')
  })
})

