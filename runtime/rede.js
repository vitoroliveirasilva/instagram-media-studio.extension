(() => {
  const { extrair, selecionar } = globalThis.IMSExtrator
  const identificar = globalThis.IMSContexto.identificar
  const cache = new Map(), tentativas = new Map(), scriptsLidos = new WeakMap()
  const invalidas = new Map(), idsPerfil = new Map()
  let observadorPerfil
  const buscarOriginal = window.fetch
  let ativo = false, ciclo = 0, paginaAtual = '', hidratarTimer
  function bloqueada(url) {
    const inicio = invalidas.get(url)
    if (!inicio) return false
    if (Date.now() - inicio > 120000) { invalidas.delete(url); return false }
    return true
  }
  function limparPerfil(alvo) {
    for (const [chave, r] of cache) if (r.perfil && r.usuario === alvo) cache.delete(chave)
  }
  function emitir() {
    if (!ativo) return
    const midias = selecionar([...cache.values()].filter(r => !r.perfil || !bloqueada(r.url)), location.href)
    for (let i = 0; i < midias.length; i += 100) document.dispatchEvent(new CustomEvent('ims-midias-carregadas', { detail: JSON.stringify({ contexto: identificar(location.href).chave, midias: midias.slice(i, i + 100) }) }))
  }
  function guardar(dados, referencia) {
    try {
      if (referencia?.tipo === 'perfil') {
        const usuario = dados?.data?.user || dados?.user
        if (usuario && typeof usuario === 'object' && !usuario.username) {
          dados = dados.data?.user ? { ...dados, data: { ...dados.data, user: { ...usuario, username: referencia.alvo } } } : { ...dados, user: { ...usuario, username: referencia.alvo } }
        }
      }
      const dono = dados?.data?.user || dados?.user
      if (typeof dono?.username === 'string' && /^\d+$/.test(String(dono.pk || dono.id || ''))) idsPerfil.set(dono.username.toLowerCase(), String(dono.pk || dono.id))
      for (const r of extrair(dados)) {
        if (r.perfil && /^\d+$/.test(r.id)) idsPerfil.set(r.usuario, r.id)
        if (r.perfil && bloqueada(r.url)) continue
        if (!r.codigo && referencia?.tipo === 'publicacao' && r.id === codigoParaId(referencia.alvo)) r.codigo = referencia.alvo
        const chave = [r.perfil ? 'perfil' : r.tipo, r.usuario, r.codigo, r.id, r.destaque, new URL(r.url).pathname].join(':')
        const anterior = cache.get(chave)
        if (!anterior || (r.qualidadePerfil || 0) > (anterior.qualidadePerfil || 0) || ((r.qualidadePerfil || 0) === (anterior.qualidadePerfil || 0) && r.largura * r.altura >= anterior.largura * anterior.altura)) cache.set(chave, r)
      }
      while (idsPerfil.size > 200) idsPerfil.delete(idsPerfil.keys().next().value)
      while (cache.size > 1500) cache.delete(cache.keys().next().value)
      emitir()
    } catch {}
  }
  function processar(texto, referencia) {
    if (typeof texto !== 'string' || texto.length > 12000000) return
    texto = texto.replace(/^\s*(?:for\s*\(;;\);|\)\]\}',?\s*)/, '')
    try { guardar(JSON.parse(texto), referencia); return } catch {}
    for (const linha of texto.split('\n').slice(0, 200)) {
      try { guardar(JSON.parse(linha.replace(/^\s*for\s*\(;;\);/, '')), referencia) } catch {}
    }
  }
  function rotaValida(valor) {
    try {
      const u = new URL(valor, location.href)
      return u.origin === location.origin && /^\/(graphql\/query|api\/graphql|api\/v1\/(feed|clips|media|stories|highlights|users))(\/|$)/.test(u.pathname)
    } catch { return false }
  }
  async function lerResposta(resposta, referencia) {
    const leitor = resposta.body?.getReader()
    if (!leitor) return
    let bytes = 0, texto = ''
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { value, done } = await leitor.read()
        if (done) { processar(texto + decoder.decode(), referencia); return }
        bytes += value.byteLength
        if (bytes > 12000000) return
        texto += decoder.decode(value, { stream: true })
      }
    } finally { void leitor.cancel().catch(() => {}); leitor.releaseLock() }
  }
  window.fetch = function (...args) {
    const observar = rotaValida(args[0] instanceof Request ? args[0].url : args[0])
    const promessa = Reflect.apply(buscarOriginal, this, args)
    if (observar) promessa.then(r => {
      if (r.ok && Number(r.headers.get('content-length')) <= 12000000) void lerResposta(r.clone()).catch(() => {})
    }).catch(() => {})
    return promessa
  }
  const abrirOriginal = XMLHttpRequest.prototype.open, enviarOriginal = XMLHttpRequest.prototype.send
  const rotas = new WeakMap()
  XMLHttpRequest.prototype.open = function (metodo, url, ...args) {
    rotas.set(this, url)
    return Reflect.apply(abrirOriginal, this, [metodo, url, ...args])
  }
  XMLHttpRequest.prototype.send = function (...args) {
    if (rotaValida(rotas.get(this))) this.addEventListener('load', () => {
      if (this.status < 200 || this.status >= 300) return
      try {
        if (this.responseType === 'json') guardar(this.response)
        else if (!this.responseType || this.responseType === 'text') processar(this.responseText)
      } catch {}
    }, { once: true })
    return Reflect.apply(enviarOriginal, this, args)
  }
  function hidratar(forcar = false) {
    if (!ativo) return
    for (const script of document.querySelectorAll('script[type="application/json"], script[data-sjs]')) {
      const texto = script.textContent
      if (!texto || scriptsLidos.get(script) === texto) continue
      scriptsLidos.set(script, texto)
      processar(texto)
    }
    const lidos = new WeakSet()
    function lerProps(props) {
      if (!props || typeof props !== 'object' || lidos.has(props)) return
      lidos.add(props); guardar(props)
    }
    const elementos = document.querySelectorAll('main video, main article, [role="dialog"] video, main header img, main img, [role="main"] img, main a[href*="/reel/"]')
    for (const el of [...elementos].slice(0, 25)) {
      let no = el
      for (let nivel = 0; no && nivel < 5; nivel++, no = no.parentElement) {
        for (const chave of Object.keys(no).filter(k => k.startsWith('__reactProps$'))) lerProps(no[chave])
        const chave = Object.keys(no).find(k => k.startsWith('__reactFiber$'))
        let fiber = chave && no[chave]
        for (let i = 0; fiber && i < 8; i++, fiber = fiber.return) if (fiber.memoizedProps) lerProps(fiber.memoizedProps)
      }
    }
    emitir()
    void recuperar(forcar)
  }
  function codigoParaId(codigo) {
    const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    let id = 0n
    for (const letra of codigo) {
      const indice = alfabeto.indexOf(letra)
      if (indice < 0) return ''
      id = id * 64n + BigInt(indice)
    }
    return id.toString()
  }
  async function recuperar(forcar = false) {
    const c = identificar(location.href)
    const chave = c.chave
    if (!ativo || !['perfil', 'publicacao'].includes(c.tipo)) return
    if (!forcar && tentativas.has(chave) && Date.now() - tentativas.get(chave) < 30000) return
    const atuais = selecionar([...cache.values()], location.href).filter(r => !r.perfil || !bloqueada(r.url))
    if (!forcar && (c.tipo === 'publicacao' ? atuais.some(r => r.tipo === 'video') : atuais.some(r => r.perfil && r.qualidadePerfil === 2))) return
    tentativas.set(chave, Date.now())
    while (tentativas.size > 200) tentativas.delete(tentativas.keys().next().value)
    const opcoes = () => ({ credentials: 'same-origin', headers: { 'X-IG-App-ID': '936619743392459', 'X-Requested-With': 'XMLHttpRequest' }, signal: AbortSignal.timeout(10000) })
    const temHd = () => selecionar([...cache.values()], location.href).some(r => r.perfil && r.qualidadePerfil === 2 && !bloqueada(r.url))
    async function buscarHd(id) {
      if (!ativo || identificar(location.href).chave !== chave || !/^\d+$/.test(id || '')) return
      try {
        const hd = await Reflect.apply(buscarOriginal, window, ['/api/v1/users/' + id + '/info/', opcoes()])
        if (hd.ok) await lerResposta(hd, c)
      } catch {}
    }
    try {
      const anterior = c.tipo === 'perfil' ? idsPerfil.get(c.alvo) : ''
      if (anterior) { await buscarHd(anterior); if (temHd()) return }
      if (!ativo || identificar(location.href).chave !== chave) return
      const caminho = c.tipo === 'perfil' ? '/api/v1/users/web_profile_info/?username=' + encodeURIComponent(c.alvo) : '/api/v1/media/' + codigoParaId(c.alvo) + '/info/'
      const resposta = await Reflect.apply(buscarOriginal, window, [caminho, opcoes()])
      if (resposta.ok) await lerResposta(resposta, c)
      if (c.tipo === 'perfil' && !temHd()) {
        const id = idsPerfil.get(c.alvo)
        if (id && id !== anterior) await buscarHd(id)
      }
    } catch {}
  }
  function agendarPerfil() {
    if (!ativo || identificar(location.href).tipo !== 'perfil' || hidratarTimer) return
    hidratarTimer = setTimeout(() => { hidratarTimer = undefined; hidratar() }, 700)
  }
  document.addEventListener('ims-recuperar-perfil', evento => {
    if (!ativo || typeof evento.detail !== 'string' || evento.detail.length > 10000) return
    try {
      const dados = JSON.parse(evento.detail), c = identificar(location.href)
      if (c.tipo !== 'perfil' || dados.contexto !== c.chave) return
      const url = globalThis.IMSPerfil.endereco(dados.url)
      if (url) invalidas.set(url, Date.now())
      while (invalidas.size > 50) invalidas.delete(invalidas.keys().next().value)
      limparPerfil(c.alvo)
      tentativas.delete(c.chave)
      hidratar(true)
    } catch {}
  })
  document.addEventListener('ims-controle-captura', evento => {
    ativo = evento.detail === true
    clearInterval(ciclo)
    observadorPerfil?.disconnect()
    clearTimeout(hidratarTimer)
    hidratarTimer = undefined
    if (ativo) {
      paginaAtual = location.href
      hidratar()
      observadorPerfil = new MutationObserver(agendarPerfil)
      observadorPerfil.observe(document.documentElement, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['src','srcset','alt'] })
      ciclo = setInterval(() => {
        if (paginaAtual !== location.href) { paginaAtual = location.href; hidratar() }
      }, 300)
    }
  })
  document.addEventListener('ims-atualizar-captura', () => {
    if (!ativo) return
    const c = identificar(location.href)
    if (c.tipo === 'perfil') { invalidas.clear(); limparPerfil(c.alvo) }
    tentativas.delete(c.chave)
    hidratar(true)
  })
  document.addEventListener('loadedmetadata', () => {
    if (!ativo || hidratarTimer) return
    hidratarTimer = setTimeout(() => { hidratarTimer = undefined; hidratar(); }, 300)
  }, true)
})()
