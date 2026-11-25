(() => {
  let ativo = false
  let geracao = 0
  const eventoControle = 'ims-controle-captura'
  const eventoMidias = 'ims-midias-carregadas'

  document.addEventListener(eventoControle, evento => {
    ativo = evento.detail === true
    geracao += 1
  })

  function urlValida(valor) {
    try {
      const url = new URL(valor)
      return url.protocol === 'https:' && !url.username && !url.password && (/(^|\.)cdninstagram\.com$/.test(url.hostname) || /(^|\.)fbcdn\.net$/.test(url.hostname))
    } catch {
      return false
    }
  }

  function rotaValida(valor) {
    try {
      const url = new URL(valor, location.href)
      return url.origin === location.origin && /^\/(graphql\/query|api\/v1\/(feed|clips|media|stories|highlights))(\/|$)/.test(url.pathname)
    } catch {
      return false
    }
  }

  function melhor(lista) {
    if (!Array.isArray(lista)) return null
    return lista.filter(item => item && urlValida(item.url)).sort((a, b) => (Number(b.width) || 0) * (Number(b.height) || 0) - (Number(a.width) || 0) * (Number(a.height) || 0))[0] || null
  }

  function extrair(dados, pagina) {
    const resultado = []
    const visitados = new WeakSet()
    const origemPagina = pagina.includes('/stories/highlights/') ? 'Destaques' : pagina.includes('/stories/') ? 'Stories' : /\/reels?\//.test(pagina) ? 'Reels' : 'Posts'
    const pilha = [{ item: dados, origem: origemPagina }]
    let total = 0
    while (pilha.length && total++ < 20000 && resultado.length < 150) {
      const { item, origem } = pilha.pop()
      if (!item || typeof item !== 'object' || visitados.has(item)) continue
      visitados.add(item)
      if (Array.isArray(item)) {
        for (const filho of item) pilha.push({ item: filho, origem })
        continue
      }
      const imagem = melhor(item.image_versions2?.candidates)
      const video = melhor(item.video_versions)
      const midia = video || imagem
      const categoria = item.product_type === 'clips' ? 'Reels' : item.product_type === 'story' ? (origemPagina === 'Destaques' ? 'Destaques' : 'Stories') : origem
      if (midia && !Array.isArray(item.carousel_media) && (item.media_type === 1 || item.media_type === 2 || item.__typename?.includes?.('Media'))) {
        if (item.media_type !== 2 || video) resultado.push({ url: midia.url, miniatura: imagem?.url || '', tipo: video ? 'video' : 'imagem', origem: categoria, largura: Number(midia.width) || 0, altura: Number(midia.height) || 0 })
      }
      for (const [chave, filho] of Object.entries(item)) {
        if (['image_versions2','video_versions','user','owner','caption','comments','profile_pic_url'].includes(chave)) continue
        const proxima = /highlight/i.test(chave) ? 'Destaques' : /stories|reel_media/i.test(chave) ? (origemPagina === 'Destaques' ? 'Destaques' : 'Stories') : categoria
        if (filho && typeof filho === 'object') pilha.push({ item: filho, origem: proxima })
      }
    }
    if (resultado.length) document.dispatchEvent(new CustomEvent(eventoMidias, { detail: JSON.stringify({ pagina, midias: resultado }) }))
  }

  function processar(texto, pagina, versao) {
    if (!ativo || versao !== geracao || location.href !== pagina || typeof texto !== 'string' || texto.length > 5000000) return
    try {
      extrair(JSON.parse(texto.replace(/^for \(;;\);/, '')), pagina)
    } catch {}
  }

  const buscarOriginal = window.fetch
  window.fetch = function (...args) {
    const pagina = location.href
    const versao = geracao
    const observar = ativo && rotaValida(args[0] instanceof Request ? args[0].url : args[0])
    const resposta = Reflect.apply(buscarOriginal, this, args)
    if (observar) resposta.then(retorno => {
      if (!ativo || versao !== geracao || !retorno.ok || !retorno.headers.get('content-type')?.includes('json') || Number(retorno.headers.get('content-length')) > 5000000) return
      retorno.clone().text().then(texto => processar(texto, pagina, versao)).catch(() => {})
    }).catch(() => {})
    return resposta
  }

  const abrirOriginal = XMLHttpRequest.prototype.open
  const enviarOriginal = XMLHttpRequest.prototype.send
  const rotas = new WeakMap()
  XMLHttpRequest.prototype.open = function (metodo, url, ...args) {
    rotas.set(this, url)
    return Reflect.apply(abrirOriginal, this, [metodo, url, ...args])
  }
  XMLHttpRequest.prototype.send = function (...args) {
    if (ativo && rotaValida(rotas.get(this))) {
      const pagina = location.href
      const versao = geracao
      this.addEventListener('load', () => {
        if (!ativo || versao !== geracao || pagina !== location.href || this.status < 200 || this.status >= 300) return
        try {
          if (this.responseType === 'json') extrair(this.response, pagina)
          else if (!this.responseType || this.responseType === 'text') processar(this.responseText, pagina, versao)
        } catch {}
      }, { once: true })
    }
    return Reflect.apply(enviarOriginal, this, args)
  }
})()
