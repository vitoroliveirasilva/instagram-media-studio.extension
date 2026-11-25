(() => {
  const portas = new Set()
  let observador
  let temporizador
  let ultimaColeta = 0
  const enviados = new Map()
  const eventoControle = 'ims-controle-captura'
  const eventoMidias = 'ims-midias-carregadas'
  const identificar = globalThis.IMSContexto.identificar
  let contexto
  let intervalo
  let ultimaRota = ''
  let aguardarAte = 0
  const ignorados = new Set()

  function identidade(midia) {
    const caminho = new URL(midia.url).pathname
    const arquivo = caminho.split('/').pop() || ''
    if (midia.origem === 'Perfil') return 'imagem:perfil'
    return midia.tipo + ':' + (/^\d{8,}(?:_\d+)+_[a-z0-9]+\.[a-z0-9]+$/i.test(arquivo) ? arquivo.toLowerCase() : caminho)
  }

  function sincronizar() {
    const atual = identificar(location.href)
    if (contexto?.chave === atual.chave) return false
    contexto = atual
    enviados.clear()
    ignorados.clear()
    aguardarAte = performance.now() + 350
    for (const porta of portas) {
      try { porta.postMessage({ acao: 'contexto', contexto }) } catch {}
    }
    return true
  }

  function validarUrl(valor) {
    try {
      const url = new URL(valor)
      return url.protocol === 'https:' && !url.username && !url.password && !url.port && (/(^|\.)cdninstagram\.com$/.test(url.hostname) || /(^|\.)fbcdn\.net$/.test(url.hostname)) ? url.href : ''
    } catch {
      return ''
    }
  }

  function origem(elemento) {
    if (location.pathname.startsWith('/stories/highlights/')) return 'Destaques'
    if (location.pathname.startsWith('/stories/')) return 'Stories'
    if (/^\/reels?(\/|$)/.test(location.pathname) || elemento.closest('a[href*="/reel/"]') || elemento.closest('article')?.querySelector('a[href*="/reel/"]')) return 'Reels'
    return 'Posts'
  }

  function visivel(elemento) {
    const caixa = elemento.getBoundingClientRect()
    const estilo = getComputedStyle(elemento)
    return caixa.width >= 100 && caixa.height >= 100 && caixa.bottom > 0 && caixa.right > 0 && caixa.top < innerHeight && caixa.left < innerWidth && estilo.visibility !== 'hidden' && estilo.display !== 'none'
  }

  function publicar(midias) {
    if (!portas.size || !Array.isArray(midias)) return
    sincronizar()
    const validas = midias.slice(0, 150).flatMap(midia => {
      const url = validarUrl(midia?.url)
      if (!url || !['imagem','video'].includes(midia.tipo) || !['Stories','Destaques','Posts','Reels','Perfil'].includes(midia.origem)) return []
      return [{ url, miniatura: validarUrl(midia.miniatura), tipo: midia.tipo, origem: midia.origem, largura: Math.max(0, Number(midia.largura) || 0), altura: Math.max(0, Number(midia.altura) || 0), qualidadePerfil: midia.origem === 'Perfil' ? Math.max(0, Math.min(2, Number(midia.qualidadePerfil) || 0)) : 0 }]
    })
    const novas = validas.filter(midia => {
      const chave = identidade(midia)
      if (ignorados.has(chave)) return false
      const qualidade = midia.largura * midia.altura + ':' + midia.miniatura + ':' + midia.origem + ':' + midia.url + ':' + midia.qualidadePerfil
      if (enviados.get(chave) === qualidade) return false
      enviados.set(chave, qualidade)
      if (enviados.size > 2500) enviados.delete(enviados.keys().next().value)
      return true
    })
    if (!novas.length) return
    for (const porta of portas) {
      try { porta.postMessage({ contexto: contexto.chave, midias: novas }) } catch {}
    }
  }

  function imagemDireta(elemento) {
    const candidatos = elemento.srcset ? elemento.srcset.split(',').map(item => item.trim().split(/\s+/)).filter(item => validarUrl(item[0])).sort((a,b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0)) : []
    return validarUrl(candidatos[0]?.[0] || elemento.currentSrc || elemento.src)
  }

  function videoDireto(elemento) {
    for (const valor of [elemento.currentSrc, elemento.src, ...Array.from(elemento.querySelectorAll('source'), fonte => fonte.src)]) {
      const url = validarUrl(valor)
      if (!url) continue
      const endereco = new URL(url)
      if (/\.(m3u8|mpd|m4s|ts)$/i.test(endereco.pathname) || endereco.searchParams.has('bytestart') || endereco.searchParams.has('byteend')) continue
      return url
    }
    return ''
  }

  function coletarPerfil() {
    if (contexto.tipo !== 'perfil') return
    const cabecalho = document.querySelector('main header') || document.querySelector('main [role="banner"]')
    const raiz = cabecalho || document.querySelector('main')
    if (!raiz) return
    const imagens = [...raiz.querySelectorAll('img')].filter(img => {
      const alt = (img.alt || '').toLowerCase()
      const nomes = alt.match(/[a-z0-9_.]+/g) || []
      return imagemDireta(img) && /profile picture|foto (de|do) perfil|imagem (de|do) perfil/i.test(alt) && nomes.includes(contexto.alvo)
    })
    const foto = imagens[0]
    if (!foto) return
    const url = imagemDireta(foto)
    const atual = validarUrl(foto.currentSrc || foto.src)
    const descritor = foto.srcset?.split(',').map(item => item.trim().split(/\s+/)).find(item => validarUrl(item[0]) === url)?.[1]
    const largura = url === atual ? foto.naturalWidth : /^\d+w$/.test(descritor || '') ? parseInt(descritor, 10) : 0
    const altura = url === atual ? foto.naturalHeight : largura && foto.naturalWidth ? Math.round(largura * foto.naturalHeight / foto.naturalWidth) : 0
    publicar([{ url, miniatura: url, tipo: 'imagem', origem: 'Perfil', largura, altura, qualidadePerfil: 0 }])
  }

  function coletar() {
    if (!portas.size) return
    sincronizar()
    ultimaColeta = performance.now()
    if (ultimaColeta < aguardarAte) { agendar(); return }
    document.dispatchEvent(new CustomEvent('ims-reler-dados'))
    coletarPerfil()
    const midias = []
    const historia = contexto.tipo === 'stories' || contexto.tipo === 'destaque'
    let elementos
    if (historia) elementos = document.querySelectorAll('img, video')
    else if (contexto.tipo === 'publicacao') {
      const raiz = document.querySelector('[role="dialog"] article') || document.querySelector('[role="dialog"]') || document.querySelector('main article') || document.querySelector('main')
      elementos = raiz?.querySelectorAll('img, video') || []
    } else if (contexto.tipo === 'perfil') elementos = document.querySelectorAll('main a[href*="/p/"] img, main a[href*="/reel/"] img, main a[href*="/p/"] video, main a[href*="/reel/"] video')
    else elementos = document.querySelectorAll('main article img, main article video')
    if (historia) {
      const centro = innerWidth / 2
      elementos = [...elementos].filter(elemento => {
        const caixa = elemento.getBoundingClientRect()
        return caixa.left <= centro && caixa.right >= centro && caixa.height >= Math.min(240, innerHeight * .4) && caixa.width >= Math.min(140, innerWidth * .2)
      })
    }
    const lista = [...elementos]
    const videos = lista.filter(elemento => elemento instanceof HTMLVideoElement && visivel(elemento))
    const capas = new Set(videos.map(elemento => validarUrl(elemento.poster)).filter(Boolean))
    if (videos.length && !videos.some(elemento => videoDireto(elemento))) {
      for (const porta of portas) {
        try { porta.postMessage({ acao: 'video-sem-url', contexto: contexto.chave }) } catch {}
      }
    }
    for (const elemento of lista) {
      if (midias.length >= 100) publicar(midias.splice(0))
      if (!visivel(elemento)) continue
      if (elemento instanceof HTMLImageElement && (elemento.closest('header, nav, [role="navigation"]') || elemento.closest('button')?.getBoundingClientRect().width < 100)) continue
      const video = elemento instanceof HTMLVideoElement
      const largura = video ? elemento.videoWidth : elemento.naturalWidth
      const altura = video ? elemento.videoHeight : elemento.naturalHeight
      if (!video && (largura < 240 || altura < 240)) continue
      const url = video ? videoDireto(elemento) : imagemDireta(elemento)
      if (!url || (!video && capas.has(url))) continue
      midias.push({ url, miniatura: video ? elemento.poster : url, tipo: video ? 'video' : 'imagem', origem: origem(elemento), largura, altura })
    }
    publicar(midias)
  }

  function agendar() {
    if (temporizador !== undefined) return
    temporizador = setTimeout(() => { temporizador = undefined; coletar() }, Math.max(100, 250 - (performance.now() - ultimaColeta)))
  }

  document.addEventListener(eventoMidias, evento => {
    if (!portas.size || typeof evento.detail !== 'string' || evento.detail.length > 500000) return
    try {
      const dados = JSON.parse(evento.detail)
      sincronizar()
      if (dados.contexto === contexto.chave) publicar(dados.midias)
    } catch {}
  })

  function iniciar() {
    sincronizar()
    document.dispatchEvent(new CustomEvent(eventoControle, { detail: true }))
    ultimaRota = location.href
    intervalo = setInterval(() => {
      if (ultimaRota !== location.href) { ultimaRota = location.href; sincronizar(); agendar() }
    }, 200)
    observador = new MutationObserver(agendar)
    observador.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src','srcset','poster'] })
    window.addEventListener('scroll', agendar, true)
    document.addEventListener('load', agendar, true)
    document.addEventListener('loadedmetadata', agendar, true)
    document.addEventListener('play', agendar, true)
    coletar()
  }

  function parar() {
    document.dispatchEvent(new CustomEvent(eventoControle, { detail: false }))
    observador?.disconnect()
    clearTimeout(temporizador)
    clearInterval(intervalo)
    temporizador = undefined
    contexto = undefined
    enviados.clear()
    ignorados.clear()
    window.removeEventListener('scroll', agendar, true)
    document.removeEventListener('load', agendar, true)
    document.removeEventListener('loadedmetadata', agendar, true)
    document.removeEventListener('play', agendar, true)
  }

  chrome.runtime.onConnect.addListener(porta => {
    if (porta.name !== 'ims-painel' || porta.sender?.id !== chrome.runtime.id) return
    portas.add(porta)
    porta.onDisconnect.addListener(() => {
      portas.delete(porta)
      if (!portas.size) parar()
    })
    porta.onMessage.addListener(mensagem => {
      if (mensagem?.acao === 'atualizar') { ignorados.clear(); enviados.clear(); coletar() }
      if (mensagem?.acao === 'limpar' && mensagem.contexto === contexto?.chave) {
        for (const chave of enviados.keys()) ignorados.add(chave)
        if (Array.isArray(mensagem.ids)) for (const id of mensagem.ids.slice(0, 10000)) if (typeof id === 'string' && id.length <= 8192) ignorados.add(id)
        while (ignorados.size > 20000) ignorados.delete(ignorados.values().next().value)
        enviados.clear()
        document.dispatchEvent(new CustomEvent(eventoControle, { detail: true }))
        porta.postMessage({ acao: 'limpo', contexto: contexto.chave })
      }
    })
    porta.postMessage({ acao: 'pronto' })
    if (portas.size === 1) iniciar()
    else { porta.postMessage({ acao: 'contexto', contexto }); enviados.clear(); coletar() }
  })
})()
