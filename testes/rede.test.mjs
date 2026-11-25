import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const contextoCodigo = await readFile(new URL('../public/contexto.js', import.meta.url), 'utf8')
const codigo = await readFile(new URL('../public/rede.js', import.meta.url), 'utf8')
const foto = 'https://scontent.cdninstagram.com/foto.jpg'
const video = 'https://scontent.cdninstagram.com/video.mp4'
const consulta = 'https://www.instagram.com/graphql/query'

function preparar(dados, pagina = 'https://www.instagram.com/stories/exemplo/123/', dadosPagina = []) {
  const eventos = new Map()
  const emitidos = []
  const chamadas = []
  const scripts = dadosPagina.map(item => ({ textContent: JSON.stringify(item) }))
  const documento = {
    querySelectorAll() { return scripts },
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
  return { janela, emitidos, chamadas, reler: () => documento.dispatchEvent(new Evento('ims-reler-dados', {})), navegar: href => { contexto.location.href = href }, ativar: ativo => documento.dispatchEvent(new Evento('ims-controle-captura', { detail: ativo })) }
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
  const dados = { product_type: 'story', media_type: 1, image_versions2: { candidates: [{ url: foto + '?q=1', width: 100, height: 100 }, { url: foto + '?q=2', width: 900, height: 900 }] }, user: { username: 'exemplo', senha: 'exemplo' } }
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

test('aceita carregamento iniciado no perfil ao abrir os Stories desse mesmo perfil', async () => {
  const ambiente = preparar({ reels_media: [{ user: { username: 'exemplo' }, items: [{ media_type: 1, image_versions2: { candidates: [{ url: foto }] } }] }] }, 'https://www.instagram.com/exemplo/')
  ambiente.ativar(true)
  const resposta = ambiente.janela.fetch(consulta)
  ambiente.navegar('https://www.instagram.com/stories/exemplo/123/')
  await resposta
  await aguardar()
  assert.equal(capturas(ambiente).length, 1)
})

test('descarta resposta ao navegar para Stories de outro perfil', async () => {
  const ambiente = preparar({ reels_media: [{ user: { username: 'exemplo' }, items: [{ media_type: 1, image_versions2: { candidates: [{ url: foto }] } }] }] })
  ambiente.ativar(true)
  const resposta = ambiente.janela.fetch(consulta)
  ambiente.navegar('https://www.instagram.com/stories/outro/123/')
  await resposta
  await aguardar()
  assert.equal(capturas(ambiente).length, 0)
})


test('reconhece vídeo GraphQL por video_url e preserva a miniatura', async () => {
  const ambiente = preparar({ data: { shortcode_media: { shortcode: 'ABC', __typename: 'GraphVideo', is_video: true, video_url: video, display_url: foto, dimensions: { width: 720, height: 1280 } } } }, 'https://www.instagram.com/reel/ABC/')
  ambiente.ativar(true)
  await ambiente.janela.fetch(consulta)
  await aguardar()
  const lista = capturas(ambiente)
  assert.equal(lista.length, 1)
  assert.equal(lista[0].tipo, 'video')
  assert.equal(lista[0].url, video)
  assert.equal(lista[0].miniatura, foto)
})

test('reconhece carrossel GraphQL com imagem e vídeo', async () => {
  const ambiente = preparar({ shortcode: 'ABC', __typename: 'GraphSidecar', edge_sidecar_to_children: { edges: [{ node: { __typename: 'GraphImage', display_url: foto } }, { node: { __typename: 'GraphVideo', video_url: video, display_url: foto + '?capa' } }] } }, 'https://www.instagram.com/p/ABC/')
  ambiente.ativar(true)
  await ambiente.janela.fetch(consulta)
  await aguardar()
  assert.deepEqual(capturas(ambiente).map(m => m.tipo), ['imagem','video'])
})

test('não apresenta a capa de um vídeo segmentado como vídeo completo', async () => {
  const ambiente = preparar({ shortcode: 'ABC', __typename: 'GraphVideo', is_video: true, video_url: video + '?bytestart=0&byteend=100', display_url: foto }, 'https://www.instagram.com/reel/ABC/')
  ambiente.ativar(true)
  await ambiente.janela.fetch(consulta)
  await aguardar()
  assert.equal(capturas(ambiente).length, 0)
})

test('captura somente a foto de perfil correspondente ao contexto aberto', async () => {
  const ambiente = preparar({ data: { user: { username: 'exemplo', profile_pic_url: foto, profile_pic_url_hd: foto + '?hd' }, outro: { username: 'outro', profile_pic_url_hd: foto + '?outro' } } }, 'https://www.instagram.com/exemplo/')
  ambiente.ativar(true)
  await ambiente.janela.fetch('https://www.instagram.com/api/v1/users/web_profile_info/?username=exemplo')
  await aguardar()
  const lista = capturas(ambiente)
  assert.equal(lista.length, 1)
  assert.equal(lista[0].origem, 'Perfil')
  assert.equal(lista[0].url, foto + '?hd')
})


test('aceita vídeo de publicação aberta durante resposta iniciada no perfil', async () => {
  const ambiente = preparar({ items: [{ shortcode: 'ABC', __typename: 'GraphVideo', video_url: video }, { shortcode: 'XYZ', __typename: 'GraphVideo', video_url: video + '?outra' }] }, 'https://www.instagram.com/exemplo/')
  ambiente.ativar(true)
  const resposta = ambiente.janela.fetch(consulta)
  ambiente.navegar('https://www.instagram.com/p/ABC/')
  await resposta
  await aguardar()
  assert.deepEqual(capturas(ambiente).map(m => m.url), [video])
})


test('reconhece metadados HD já presentes na página sem novas requisições', () => {
  const ambiente = preparar({}, 'https://www.instagram.com/exemplo/', [{ data: { user: { username: 'exemplo', profile_pic_url: foto, hd_profile_pic_url_info: { url: foto + '?hd', width: 1080, height: 1080 } } } }])
  ambiente.ativar(true)
  ambiente.reler()
  ambiente.reler()
  const lista = capturas(ambiente)
  assert.equal(lista.length, 1)
  assert.equal(lista[0].url, foto + '?hd')
  assert.equal(lista[0].largura, 1080)
  assert.equal(lista[0].qualidadePerfil, 2)
  assert.equal(ambiente.chamadas.length, 0)
})

test('não inventa dimensões de foto de perfil HD', () => {
  const ambiente = preparar({}, 'https://www.instagram.com/exemplo/', [{ user: { username: 'exemplo', profile_pic_url_hd: foto } }])
  ambiente.ativar(true)
  ambiente.reler()
  assert.equal(capturas(ambiente)[0].largura, 0)
  assert.equal(capturas(ambiente)[0].qualidadePerfil, 2)
})

test('encontra vídeo completo nos metadados iniciais da publicação', () => {
  const ambiente = preparar({}, 'https://www.instagram.com/reel/ABC/', [{ require: [['Componente', [], { data: { media: { shortcode: 'ABC', media_type: 2, video: { video_url: video }, image_versions2: { candidates: [{ url: foto }] } } } }]] }])
  ambiente.ativar(true)
  ambiente.reler()
  const lista = capturas(ambiente)
  assert.equal(lista.length, 1)
  assert.equal(lista[0].url, video)
  assert.equal(lista[0].tipo, 'video')
  assert.equal(ambiente.chamadas.length, 0)
})

test('reconhece o Story atual pelo identificador quando a resposta não contém autor', async () => {
  const ambiente = preparar({ items: [{ pk: '123', media_type: 2, video_url: video }, { pk: '456', media_type: 2, video_url: video + '?outro' }] })
  ambiente.ativar(true)
  await ambiente.janela.fetch('https://www.instagram.com/api/graphql')
  await aguardar()
  assert.deepEqual(capturas(ambiente).map(m => m.url), [video])
})
