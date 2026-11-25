import { describe, expect, it } from 'vitest'
import { normalizar, reunir, nomeArquivo, extensaoPermitida, urlValida, LIMITE_GALERIA } from './midias'

const exemplo = { url: 'https://scontent.cdninstagram.com/a/foto.jpg?token=1', miniatura: '', tipo: 'imagem', origem: 'Posts', largura: 300, altura: 400 }

describe('Galeria de mídias', () => {
  it.each(['https://cdninstagram.com.exemplo.com/a.jpg', 'javascript:alert(1)', 'http://cdninstagram.com/a.jpg', 'https://usuario:senha@cdninstagram.com/a.jpg', 'https://cdninstagram.com:444/a.jpg', 'data:image/png;base64,abc'])('rejeita endereço inválido %s', url => {
    expect(normalizar({ ...exemplo, url })).toBeNull()
  })
  it('remove fragmentos sem modificar a consulta assinada', () => {
    expect(urlValida(exemplo.url + '#fragmento')).toBe(exemplo.url)
  })
  it('remove duplicatas e preserva maior resolução', () => {
    const melhor = { ...exemplo, url: exemplo.url.replace('token=1','token=2'), largura: 900, altura: 1000 }
    const lista = reunir([], [exemplo, melhor, exemplo])
    expect(lista).toHaveLength(1)
    expect(lista[0].url).toBe(melhor.url)
  })
  it('preserva miniatura e categoria de uma mídia conhecida', () => {
    const video = { ...exemplo, tipo: 'video', origem: 'Reels', url: exemplo.url.replace('.jpg','.mp4'), miniatura: exemplo.url }
    const lista = reunir([], [video, { ...video, origem: 'Posts', miniatura: '' }])
    expect(lista[0].origem).toBe('Reels')
    expect(lista[0].miniatura).toBe(exemplo.url)
  })
  it('não duplica a miniatura de um vídeo como imagem independente', () => {
    expect(reunir([], [exemplo, { ...exemplo, tipo: 'video', url: exemplo.url.replace('.jpg','.mp4'), miniatura: exemplo.url }])).toHaveLength(1)
  })
  it('rejeita categorias desconhecidas e dimensões inválidas', () => {
    expect(normalizar({ ...exemplo, origem: 'Outro' })).toBeNull()
    expect(normalizar({ ...exemplo, largura: Infinity, altura: -1 })?.largura).toBe(0)
  })
  it('limita a galeria e a quantidade por mensagem', () => {
    let lista = reunir([], Array.from({ length: 151 }, (_, i) => ({ ...exemplo, url: 'https://cdninstagram.com/a/' + i + '.jpg' })))
    expect(lista).toHaveLength(150)
    for (let lote = 1; lote <= 67; lote++) lista = reunir(lista, Array.from({ length: 150 }, (_, i) => ({ ...exemplo, url: 'https://cdninstagram.com/a/' + (lote * 150 + i) + '.jpg' })))
    expect(lista).toHaveLength(LIMITE_GALERIA)
  })
  it('gera nome de arquivo com MIME real', () => {
    expect(nomeArquivo(normalizar(exemplo)!, 0, 'image/webp')).toBe('posts-0001.webp')
    expect(extensaoPermitida('image/svg+xml', 'imagem')).toBeUndefined()
    expect(extensaoPermitida('image/jpeg', 'video')).toBeUndefined()
    expect(extensaoPermitida('video/webm; charset=binary', 'video')).toBe('webm')
  })
})
