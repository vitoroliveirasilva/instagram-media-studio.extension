import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const codigos = await Promise.all(['contexto.js','perfil.js','extrator.js','rede.js'].map(n => readFile(new URL('../runtime/' + n, import.meta.url), 'utf8')))
const cdn = 'https://scontent.cdninstagram.com/'
class Documento extends EventTarget {
  scripts = []
  documentElement = {}
  querySelectorAll(seletor) { return seletor.startsWith('script') ? this.scripts : [] }
}
class Evento extends Event { constructor(tipo, { detail } = {}) { super(tipo); this.detail = detail } }
function preparar(responder, pagina = 'https://www.instagram.com/alice/') {
  const documento = new Documento(), chamadas = [], midias = []
  const contexto = vm.createContext({
    URL, Request, Response, TextDecoder, AbortSignal, CustomEvent: Evento,
    document: documento, location: new URL(pagina), console,
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    XMLHttpRequest: class { open() {} send() {} addEventListener() {} },
    MutationObserver: class { observe() {} disconnect() {} }
  })
  contexto.window = contexto
  contexto.fetch = async (...args) => { chamadas.push(args); return responder(...args) }
  for (const codigo of codigos) vm.runInContext(codigo, contexto)
  documento.addEventListener('ims-midias-carregadas', e => midias.push(...JSON.parse(e.detail).midias))
  return { contexto, documento, chamadas, midias,
    iniciar() { documento.dispatchEvent(new Evento('ims-controle-captura', { detail: true })) },
    parar() { documento.dispatchEvent(new Evento('ims-controle-captura', { detail: false })) },
    falhar(url) { documento.dispatchEvent(new Evento('ims-recuperar-perfil', { detail: JSON.stringify({ contexto: 'perfil:alice', url }) })) }
  }
}
const json = v => new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json' } })
const aguardar = () => new Promise(r => setTimeout(r, 60))

test('runtime aceita foto HD em uri e prioriza a declaração HD sem inventar dimensões', () => {
  const a = preparar(() => json({}))
  const registros = a.contexto.IMSExtrator.extrair({ username: 'alice', id: '42', profile_pic_url: { uri: cdn + 'pequena.jpg', width: 150, height: 150 }, profile_pic_url_hd: { uri: cdn + 'hd.jpg' } })
  const [foto] = a.contexto.IMSExtrator.selecionar(registros, a.contexto.location.href)
  assert.equal(foto.url, cdn + 'hd.jpg')
  assert.equal(foto.qualidadePerfil, 2)
  assert.equal(foto.largura, 0)
  assert.equal(foto.altura, 0)
})
test('runtime não aceita foto HD externa nem credenciais em URL', () => {
  const a = preparar(() => json({}))
  const p = a.contexto.IMSPerfil
  assert.equal(p.endereco({ uri: 'https://cdninstagram.com.evil.com/foto.jpg' }), '')
  assert.equal(p.endereco('https://user:pass@scontent.cdninstagram.com/a.jpg'), '')
  assert.equal(p.endereco(cdn + 'a.jpg?x=1&amp;y=2'), cdn + 'a.jpg?x=1&y=2')
})
test('runtime ignora estruturas de endereço cíclicas', () => {
  const a = preparar(() => json({})), v = {}
  v.url = v
  assert.equal(a.contexto.IMSPerfil.endereco(v), '')
})
test('runtime recupera foto HD por id conhecido mesmo quando web_profile_info está indisponível', async () => {
  const a = preparar(url => url.includes('/42/info') ? json({ user: { pk: '42', profile_pic_url_hd: { uri: cdn + 'nova.jpg', width: 1080, height: 1080 } } }) : new Response('', { status: 403 }))
  a.documento.scripts = [{ textContent: JSON.stringify({ user: { username: 'alice', id: '42', profile_pic_url_hd: cdn + 'expirada.jpg' } }) }]
  a.iniciar()
  a.falhar(cdn + 'expirada.jpg')
  await aguardar()
  assert.ok(a.chamadas.some(([url]) => url === '/api/v1/users/42/info/'))
  assert.equal(a.midias.at(-1).url, cdn + 'nova.jpg')
  assert.equal(a.midias.at(-1).qualidadePerfil, 2)
  a.parar()
})
test('runtime descarta endereço que falhou ao reprocessar metadados antigos', async () => {
  const a = preparar(() => new Response('', { status: 403 }))
  const dados = { username: 'alice', id: '42', profile_pic_url_hd: cdn + 'expirada.jpg', profile_pic_url: cdn + 'alternativa.jpg' }
  a.documento.scripts = [{ textContent: JSON.stringify(dados) }]
  a.iniciar()
  const inicio = a.midias.length
  a.falhar(cdn + 'expirada.jpg')
  await a.contexto.fetch('/api/graphql')
  await aguardar()
  assert.ok(a.midias.slice(inicio).every(m => m.url !== cdn + 'expirada.jpg'))
  a.parar()
})
test('runtime relê um script JSON preenchido depois da abertura do painel', async () => {
  const a = preparar(() => new Response('', { status: 403 }))
  const script = { textContent: '' }
  a.documento.scripts = [script]
  a.iniciar()
  script.textContent = JSON.stringify({ username: 'alice', id: '42', profile_picture: { uri: cdn + 'tardia.jpg', width: 320, height: 320 } })
  a.documento.dispatchEvent(new Evento('ims-atualizar-captura'))
  await aguardar()
  assert.ok(a.midias.some(m => m.url === cdn + 'tardia.jpg'))
  a.parar()
})
test('runtime continua extraindo Reels, Stories e destaques com os mesmos arquivos diretos', () => {
  const a = preparar(() => json({}))
  const m = { media_type: 2, video_versions: [{ url: cdn + 'v.mp4', width: 1080, height: 1920 }], image_versions2: { candidates: [{ url: cdn + 'c.jpg' }] } }
  for (const [dados, pagina, origem] of [
    [{ ...m, code: 'ABC', product_type: 'clips' }, 'https://www.instagram.com/reel/ABC/', 'Reels'],
    [{ reels_media: [{ user: { username: 'alice' }, items: [{ ...m, id: '123' }] }] }, 'https://www.instagram.com/stories/alice/123/', 'Stories'],
    [{ reels: { 'highlight:555': { items: [m] } } }, 'https://www.instagram.com/stories/highlights/555/', 'Destaques']
  ]) {
    const [r] = a.contexto.IMSExtrator.selecionar(a.contexto.IMSExtrator.extrair(dados), pagina)
    assert.equal(r.url, cdn + 'v.mp4')
    assert.equal(r.origem, origem)
  }
})
test('runtime preserva o contexto e não publica foto de outro perfil', async () => {
  const a = preparar(() => json({ user: { username: 'bob', id: '99', profile_pic_url_hd: cdn + 'bob.jpg' } }))
  a.iniciar()
  await aguardar()
  assert.ok(a.midias.every(m => m.usuario !== 'bob'))
  assert.equal(a.midias.length, 0)
  a.parar()
})

