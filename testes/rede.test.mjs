import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const contextoCodigo = await readFile(new URL('../public/contexto.js', import.meta.url), 'utf8')
const codigo = await readFile(new URL('../public/rede.js', import.meta.url), 'utf8')
const foto = 'https://scontent.cdninstagram.com/foto.jpg'
const video = 'https://scontent.cdninstagram.com/video.mp4'
const consulta = 'https://www.instagram.com/graphql/query'

function preparar(dados, pagina = 'https://www.instagram.com/stories/exemplo/123/') {
  const eventos = new Map()
  const emitidos = []
  const chamadas = []
  const documento = {
    addEventListener(nome, funcao) { eventos.set(nome, funcao) },
    dispatchEvent(evento) { emitidos.push(evento); eventos.get(evento.type)?.(evento) }
  }
  class Evento {
    constructor(type, opcoes) { this.type = type; this.detail = opcoes.detail }
  }
  class Requisicao {
    open() {}
    send() {}
  }
  const janela = { fetch: async (...args) => { chamadas.push(args); return new Response(JSON.stringify(dados), { headers: { 'content-type': 'application/json' } }) } }
  const contexto = { document: documento, window: janela, location: { href: pagina, origin: 'https://www.instagram.com' }, URL, Request, TextDecoder, CustomEvent: Evento, XMLHttpRequest: Requisicao }
  vm.createContext(contexto)
  vm.runInContext(contextoCodigo, contexto)
  vm.runInContext(codigo, contexto)
  return { janela, emitidos, chamadas, navegar: href => { contexto.location.href = href }, ativar: ativo => documento.dispatchEvent(new Evento('ims-controle-captura', { detail: ativo })) }
}

const aguardar = () => new Promise(resolve => setTimeout(resolve, 40))
const capturas = ambiente => ambiente.emitidos.filter(item => item.type === 'ims-midias-carregadas').flatMap(item => JSON.parse(item.detail).midias)

test('não captura quando o painel está fechado', async () => {
  const ambiente = preparar({ user: { username: 'exemplo' }, product_type: 'story', media_type: 1, image_versions2: { candidates: [{ url: foto, width: 900, height: 900 }] } })
  await ambiente.janela.fetch(consulta)
  await aguardar()
  assert.equal(capturas(ambiente).length, 0)
  assert.equal(ambiente.chamadas.length, 1)
})

test('captura maior resolução sem modificar a resposta original', async () => {
  const dados = { user: { username: 'exemplo' }, product_type: 'story', media_type: 1, image_versions2: { candidates: [{ url: foto + '?q=1', width: 100, height: 100 }, { url: foto + '?q=2', width: 900, height: 900 }] }, user: { username: 'exemplo', senha: 'exemplo' } }
  const ambiente = preparar(dados)
  ambiente.ativar(true)
  const resposta = await ambiente.janela.fetch(consulta)
  assert.deepEqual(await resposta.json(), dados)
  await aguardar()
  const [midia] = capturas(ambiente)
  assert.equal(midia.url, foto + '?q=2')
  assert.equal(midia.origem, 'Stories')
  assert.equal(midia.largura, 900)
  assert.equal(Object.hasOwn(midia, 'user'), false)
  assert.equal(ambiente.chamadas.length, 1)
})

test('captura vídeo e miniatura sem duplicar o item', async () => {
  const ambiente = preparar({ user: { username: 'exemplo' }, product_type: 'story', media_type: 2, video_versions: [{ url: video, width: 720, height: 1280 }], image_versions2: { candidates: [{ url: foto, width: 720, height: 1280 }] } })
  ambiente.ativar(true)
  await ambiente.janela.fetch(consulta)
  await aguardar()
  const lista = capturas(ambiente)
  assert.equal(lista.length, 1)
  assert.equal(lista[0].tipo, 'video')
  assert.equal(lista[0].miniatura, foto)
})

test('ignora domínios externos e rotas não relacionadas a mídias', async () => {
  const ambiente = preparar({ user: { username: 'exemplo' }, product_type: 'story', media_type: 1, image_versions2: { candidates: [{ url: 'https://cdninstagram.com.exemplo.com/foto.jpg' }] } })
  ambiente.ativar(true)
  await ambiente.janela.fetch(consulta)
  await ambiente.janela.fetch('https://www.instagram.com/api/v1/accounts/current_user/')
  await aguardar()
  assert.equal(capturas(ambiente).length, 0)
})

test('descarta respostas iniciadas antes de desligar a captura', async () => {
  const ambiente = preparar({ user: { username: 'exemplo' }, product_type: 'story', media_type: 1, image_versions2: { candidates: [{ url: foto, width: 900, height: 900 }] } })
  ambiente.ativar(true)
  const resposta = ambiente.janela.fetch(consulta)
  ambiente.ativar(false)
  await resposta
  await aguardar()
  assert.equal(capturas(ambiente).length, 0)
})


test('isola Stories do perfil aberto e ignora outros perfis pré-carregados', async () => {
  const item = url => ({ media_type: 1, image_versions2: { candidates: [{ url, width: 900, height: 900 }] } })
  const ambiente = preparar({ data: { reels_media: [{ user: { username: 'exemplo' }, items: [item(foto), item(foto + '?segunda')] }, { user: { username: 'outro' }, items: [item(foto + '?outro')] }] } })
  ambiente.ativar(true)
  await ambiente.janela.fetch(consulta)
  await aguardar()
  assert.deepEqual(capturas(ambiente).map(m => m.url), [foto, foto + '?segunda'])
})

test('mantém respostas do mesmo perfil ao avançar o Story', async () => {
  const ambiente = preparar({ product_type: 'story', user: { username: 'exemplo' }, media_type: 1, image_versions2: { candidates: [{ url: foto }] } })
  ambiente.ativar(true)
  const resposta = ambiente.janela.fetch(consulta)
  ambiente.navegar('https://www.instagram.com/stories/exemplo/456/')
  await resposta
  await aguardar()
  assert.equal(capturas(ambiente).length, 1)
})

test('publica todos os lotes sem truncar em 150 itens', async () => {
  const items = Array.from({ length: 231 }, (_, i) => ({ media_type: 1, image_versions2: { candidates: [{ url: 'https://scontent.cdninstagram.com/foto-' + i + '.jpg' }] } }))
  const ambiente = preparar({ reels_media: [{ user: { username: 'exemplo' }, items }] })
  ambiente.ativar(true)
  await ambiente.janela.fetch(consulta)
  await aguardar()
  assert.equal(capturas(ambiente).length, 231)
})

test('isola o carrossel da publicação aberta', async () => {
  const item = url => ({ media_type: 1, image_versions2: { candidates: [{ url }] } })
  const ambiente = preparar({ items: [{ code: 'ABC', carousel_media: [item(foto), item(foto + '?segunda')] }, { code: 'XYZ', ...item(foto + '?outra') }] }, 'https://www.instagram.com/p/ABC/')
  ambiente.ativar(true)
  await ambiente.janela.fetch(consulta)
  await aguardar()
  assert.deepEqual(capturas(ambiente).map(m => m.url), [foto, foto + '?segunda'])
})
