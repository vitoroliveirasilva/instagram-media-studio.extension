import { describe, expect, it } from 'vitest'
import { normalizar, reunir, nomeArquivo } from './midias'

const exemplo = { url: 'https://scontent.cdninstagram.com/a/foto.jpg?token=1', miniatura: '', tipo: 'imagem', origem: 'Posts', largura: 300, altura: 400 }

describe('Galeria de mídias', () => {
  it('rejeita URLs externas e protocolos inseguros', () => {
    expect(normalizar({ ...exemplo, url: 'https://cdninstagram.com.exemplo.com/a.jpg' })).toBeNull()
    expect(normalizar({ ...exemplo, url: 'javascript:alert(1)' })).toBeNull()
  })
  it('remove duplicatas com parâmetros diferentes e prioriza resolução', () => {
    const lista = reunir([], [exemplo, { ...exemplo, url: exemplo.url.replace('1','2'), largura: 900, altura: 1000 }])
    expect(lista).toHaveLength(1)
    expect(lista[0].largura).toBe(900)
  })
  it('gera nomes em português e preserva extensões conhecidas', () => {
    expect(nomeArquivo(normalizar({ ...exemplo, url: 'https://scontent.cdninstagram.com/foto.webp' })!, 0)).toBe('posts-0001.webp')
  })
})
