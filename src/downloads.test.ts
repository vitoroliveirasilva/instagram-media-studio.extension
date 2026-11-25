import { describe, expect, it } from 'vitest'
import { lerArquivo } from './downloads'

describe('Leitura de arquivos', () => {
  it('preserva o conteúdo e o tipo', async () => {
    const resposta = new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } })
    const arquivo = await lerArquivo(resposta, 3, new AbortController().signal)
    expect(arquivo.size).toBe(3)
    expect(arquivo.type).toBe('image/png')
    expect(new Uint8Array(await arquivo.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })
  it('bloqueia tamanho anunciado acima do limite', async () => {
    const resposta = new Response('1234', { headers: { 'content-length': '4' } })
    await expect(lerArquivo(resposta, 3, new AbortController().signal)).rejects.toThrow('Limite')
  })
  it('bloqueia tamanho real acima do limite sem cabeçalho', async () => {
    await expect(lerArquivo(new Response('1234'), 3, new AbortController().signal)).rejects.toThrow('Limite')
  })
  it('rejeita arquivo vazio', async () => {
    await expect(lerArquivo(new Response(''), 3, new AbortController().signal)).rejects.toThrow('vazio')
  })
  it('respeita cancelamento', async () => {
    const controle = new AbortController()
    controle.abort()
    await expect(lerArquivo(new Response('123'), 3, controle.signal)).rejects.toThrow()
  })
})
